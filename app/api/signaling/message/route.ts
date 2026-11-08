import { NextRequest, NextResponse } from 'next/server';
import { signalingHub } from '@/lib/signaling-hub';
import { SignalingMessage, Participant, ChatMessage } from '@/types/nexora';

export async function POST(req: NextRequest) {
  try {
    const message: SignalingMessage = await req.json();
    const { type, roomId, senderId, targetId, payload } = message;

    if (!roomId || !senderId || !type) {
      return NextResponse.json({ error: 'Invalid message structure' }, { status: 400 });
    }

    switch (type) {
      case 'join': {
        const participant: Participant = payload.participant;
        const currentParticipants = signalingHub.joinParticipant(roomId, participant);
        const currentMessages = signalingHub.getMessages(roomId);
        const room = signalingHub.getRoom(roomId);

        // Notify other peers in this room
        signalingHub.broadcast(
          roomId,
          {
            type: 'participant_joined',
            roomId,
            senderId,
            payload: { participant },
            timestamp: Date.now(),
          },
          senderId
        );

        // Also add a system chat message
        const sysMsg: ChatMessage = {
          id: `join-${Date.now()}-${senderId}`,
          roomId,
          senderId: 'system',
          senderName: 'Cinema a Dois ❤️',
          senderAvatar: '',
          senderColor: '#3B82F6',
          text: `${participant.name} entrou na sala.`,
          timestamp: Date.now(),
          isSystem: true,
        };
        signalingHub.addMessage(roomId, sysMsg);
        signalingHub.broadcast(roomId, {
          type: 'chat',
          roomId,
          senderId: 'system',
          payload: { message: sysMsg },
          timestamp: Date.now(),
        });

        return NextResponse.json({
          success: true,
          participants: currentParticipants,
          messages: currentMessages,
          roomInfo: room?.info,
        });
      }

      case 'leave': {
        const currentParticipants = signalingHub.leaveParticipant(roomId, senderId);
        signalingHub.broadcast(
          roomId,
          {
            type: 'participant_left',
            roomId,
            senderId,
            payload: { peerId: senderId },
            timestamp: Date.now(),
          },
          senderId
        );

        const sysMsg: ChatMessage = {
          id: `leave-${Date.now()}-${senderId}`,
          roomId,
          senderId: 'system',
          senderName: 'Cinema a Dois ❤️',
          senderAvatar: '',
          senderColor: '#6B7280',
          text: `${payload?.name || 'Um participante'} saiu da sala.`,
          timestamp: Date.now(),
          isSystem: true,
        };
        signalingHub.addMessage(roomId, sysMsg);
        signalingHub.broadcast(roomId, {
          type: 'chat',
          roomId,
          senderId: 'system',
          payload: { message: sysMsg },
          timestamp: Date.now(),
        });

        return NextResponse.json({ success: true, participants: currentParticipants });
      }

      case 'offer':
      case 'answer':
      case 'candidate': {
        if (targetId) {
          signalingHub.sendToPeer(roomId, targetId, message);
        } else {
          signalingHub.broadcast(roomId, message, senderId);
        }
        return NextResponse.json({ success: true });
      }

      case 'chat': {
        const chatMsg: ChatMessage = payload.message;
        signalingHub.addMessage(roomId, chatMsg);
        signalingHub.broadcast(roomId, message, senderId);
        return NextResponse.json({ success: true, message: chatMsg });
      }

      case 'state_update': {
        if (payload?.participant) {
          signalingHub.updateParticipant(roomId, payload.participant);
        }
        signalingHub.broadcast(roomId, message, senderId);
        return NextResponse.json({ success: true });
      }

      case 'screen_started': {
        signalingHub.setPresenter(roomId, senderId, payload?.config);
        signalingHub.broadcast(roomId, message, senderId);
        const sysMsg: ChatMessage = {
          id: `screen-${Date.now()}`,
          roomId,
          senderId: 'system',
          senderName: 'Cinema a Dois ❤️',
          senderAvatar: '',
          senderColor: '#EC4899',
          text: `${payload?.presenterName || 'Alguém'} iniciou uma transmissão de tela (${payload?.config?.resolution || '1080p'} @ ${payload?.config?.frameRate || 60}fps).`,
          timestamp: Date.now(),
          isSystem: true,
        };
        signalingHub.addMessage(roomId, sysMsg);
        signalingHub.broadcast(roomId, {
          type: 'chat',
          roomId,
          senderId: 'system',
          payload: { message: sysMsg },
          timestamp: Date.now(),
        });
        return NextResponse.json({ success: true });
      }

      case 'screen_stopped': {
        signalingHub.setPresenter(roomId, undefined);
        signalingHub.broadcast(roomId, message, senderId);
        const sysMsg: ChatMessage = {
          id: `screen-stop-${Date.now()}`,
          roomId,
          senderId: 'system',
          senderName: 'Cinema a Dois ❤️',
          senderAvatar: '',
          senderColor: '#6B7280',
          text: `${payload?.presenterName || 'O apresentador'} encerrou o compartilhamento de tela.`,
          timestamp: Date.now(),
          isSystem: true,
        };
        signalingHub.addMessage(roomId, sysMsg);
        signalingHub.broadcast(roomId, {
          type: 'chat',
          roomId,
          senderId: 'system',
          payload: { message: sysMsg },
          timestamp: Date.now(),
        });
        return NextResponse.json({ success: true });
      }

      case 'room_ended': {
        signalingHub.broadcast(roomId, message, senderId);
        signalingHub.deleteRoom(roomId);
        return NextResponse.json({ success: true });
      }

      case 'kick':
      case 'mute_remote': {
        if (targetId) {
          signalingHub.sendToPeer(roomId, targetId, message);
        }
        return NextResponse.json({ success: true });
      }

      default: {
        signalingHub.broadcast(roomId, message, senderId);
        return NextResponse.json({ success: true });
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error processing message' }, { status: 500 });
  }
}
