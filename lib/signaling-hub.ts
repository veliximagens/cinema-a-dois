import { Participant, RoomInfo, ChatMessage, SignalingMessage, RoomInvite } from '@/types/nexora';

interface RoomSession {
  info: RoomInfo;
  participants: Map<string, Participant>;
  messages: ChatMessage[];
  invites: Map<string, RoomInvite>;
  lastActive: number;
}

interface PeerSubscriber {
  peerId: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
}

class SignalingHub {
  private rooms: Map<string, RoomSession> = new Map();
  private subscribers: Map<string, Map<string, PeerSubscriber>> = new Map();

  constructor() {
    // Seed a default open room so users can immediately test without setup
    this.createRoom({
      id: 'geral',
      name: 'Sala Principal ❤️',
      isPrivate: false,
      maxParticipants: 10,
      createdAt: Date.now(),
      createdBy: 'system',
      createdByName: 'Cinema a Dois',
    });
  }

  getRoom(roomId: string): RoomSession | undefined {
    return this.rooms.get(roomId);
  }

  listRooms(): RoomInfo[] {
    return Array.from(this.rooms.values())
      .filter((r) => !r.info.isPrivate || r.info.id === 'geral')
      .map((r) => ({
        ...r.info,
        invites: Array.from(r.invites.values()),
      }));
  }

  createRoom(info: RoomInfo): RoomInfo {
    const existing = this.rooms.get(info.id);
    if (existing) {
      return existing.info;
    }
    const session: RoomSession = {
      info,
      participants: new Map(),
      invites: new Map(),
      messages: [
        {
          id: `sys-${Date.now()}`,
          roomId: info.id,
          senderId: 'system',
          senderName: 'Cinema a Dois ❤️',
          senderAvatar: '❤️',
          senderColor: '#E11D48',
          text: `Bem-vindos à sala "${info.name}". Prepare a pipoca, escolha o filme e aproveite juntos!`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ],
      lastActive: Date.now(),
    };

    // Generate an initial persistent invite for the room
    const initialInvite: RoomInvite = {
      token: `cin_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36).substring(4)}`,
      roomId: info.id,
      createdAt: Date.now(),
      createdBy: info.createdBy,
      createdByName: info.createdByName,
      expiresAt: null, // default: permanent
      maxUses: null,
      usesCount: 0,
      isRevoked: false,
    };
    session.invites.set(initialInvite.token, initialInvite);

    this.rooms.set(info.id, session);
    return {
      ...info,
      invites: [initialInvite],
    };
  }

  // --- INVITE SYSTEM METHODS ---

  createInvite(
    roomId: string,
    createdBy: string,
    createdByName?: string,
    expiresInHours?: number | null,
    maxUses?: number | null
  ): RoomInvite | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const token = `cin_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36).substring(4)}`;
    const expiresAt = expiresInHours && expiresInHours > 0 ? Date.now() + expiresInHours * 3600 * 1000 : null;

    const invite: RoomInvite = {
      token,
      roomId,
      createdAt: Date.now(),
      createdBy,
      createdByName: createdByName || 'Anfitrião',
      expiresAt,
      maxUses: maxUses && maxUses > 0 ? maxUses : null,
      usesCount: 0,
      isRevoked: false,
    };

    room.invites.set(token, invite);
    room.lastActive = Date.now();

    // Broadcast to room that an invite was generated
    this.broadcast(roomId, {
      type: 'invite_created',
      roomId,
      senderId: createdBy,
      payload: { invite },
      timestamp: Date.now(),
    });

    return invite;
  }

  validateInvite(
    roomId: string,
    token: string
  ): { valid: boolean; reason?: string; invite?: RoomInvite; room?: RoomInfo } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { valid: false, reason: 'A sala informada não existe mais ou foi encerrada.' };
    }

    const invite = room.invites.get(token);
    if (!invite) {
      return { valid: false, reason: 'Código de convite não encontrado ou inválido.', room: room.info };
    }

    if (invite.isRevoked) {
      return { valid: false, reason: 'Este convite foi revogado pelo anfitrião da sala.', invite, room: room.info };
    }

    if (invite.expiresAt && Date.now() > invite.expiresAt) {
      return { valid: false, reason: 'Este convite expirou o período de validade.', invite, room: room.info };
    }

    if (invite.maxUses !== null && invite.usesCount >= invite.maxUses) {
      return {
        valid: false,
        reason: `Este convite atingiu o limite máximo de ${invite.maxUses} ${invite.maxUses === 1 ? 'utilização' : 'utilizações'}.`,
        invite,
        room: room.info,
      };
    }

    if (room.participants.size >= room.info.maxParticipants) {
      return { valid: false, reason: 'A sala atingiu o limite máximo de participantes.', invite, room: room.info };
    }

    return { valid: true, invite, room: room.info };
  }

  useInvite(roomId: string, token: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const invite = room.invites.get(token);
    if (!invite || invite.isRevoked) return false;

    invite.usesCount += 1;
    room.lastActive = Date.now();
    return true;
  }

  revokeInvite(roomId: string, token: string, requesterId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Only room creator or invite creator can revoke
    if (room.info.createdBy !== requesterId && room.info.createdBy !== 'system') {
      const invite = room.invites.get(token);
      if (!invite || invite.createdBy !== requesterId) {
        return false;
      }
    }

    const invite = room.invites.get(token);
    if (!invite) return false;

    invite.isRevoked = true;
    room.lastActive = Date.now();

    // Broadcast invite revoked
    this.broadcast(roomId, {
      type: 'invite_revoked',
      roomId,
      senderId: requesterId,
      payload: { token },
      timestamp: Date.now(),
    });

    return true;
  }

  listInvites(roomId: string): RoomInvite[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.invites.values());
  }

  checkRoomAccess(
    roomId: string,
    peerId: string,
    token?: string
  ): { allowed: boolean; reason?: string; room?: RoomInfo } {
    const room = this.rooms.get(roomId);
    if (!room) {
      // Room does not exist yet (allow if it's 'geral' or new creation)
      return { allowed: true };
    }

    // Capacity limit
    if (room.participants.size >= room.info.maxParticipants && !room.participants.has(peerId)) {
      return { allowed: false, reason: 'A sala atingiu o limite máximo de participantes.' };
    }

    // Public room or already member or creator
    if (!room.info.isPrivate || room.info.createdBy === peerId || room.participants.has(peerId)) {
      return { allowed: true, room: room.info };
    }

    // Private room requires invite token
    if (!token) {
      return {
        allowed: false,
        reason: 'Esta sala é privada. É necessário um link de convite autorizado para entrar.',
        room: room.info,
      };
    }

    const validation = this.validateInvite(roomId, token);
    if (!validation.valid) {
      return { allowed: false, reason: validation.reason, room: room.info };
    }

    return { allowed: true, room: room.info };
  }

  endRoom(roomId: string, requesterId: string): boolean {
    if (roomId === 'geral') return false; // never destroy public lounge
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Broadcast room closed to all participants
    this.broadcast(roomId, {
      type: 'room_closed',
      roomId,
      senderId: requesterId,
      payload: { message: 'A sala foi encerrada pelo anfitrião.' },
      timestamp: Date.now(),
    });

    this.rooms.delete(roomId);
    this.subscribers.delete(roomId);
    return true;
  }

  setRoomMaxParticipants(roomId: string, max: number, requesterId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.info.createdBy !== requesterId && room.info.createdBy !== 'system') return false;

    room.info.maxParticipants = Math.max(2, Math.min(50, max));
    room.lastActive = Date.now();
    return true;
  }

  // --- SUBSCRIBER STREAM METHODS ---

  addSubscriber(
    roomId: string,
    peerId: string,
    controller: ReadableStreamDefaultController<Uint8Array>
  ) {
    if (!this.subscribers.has(roomId)) {
      this.subscribers.set(roomId, new Map());
    }
    const roomSubs = this.subscribers.get(roomId)!;
    roomSubs.set(peerId, {
      peerId,
      controller,
      encoder: new TextEncoder(),
    });
  }

  removeSubscriber(roomId: string, peerId: string) {
    const roomSubs = this.subscribers.get(roomId);
    if (roomSubs) {
      roomSubs.delete(peerId);
      if (roomSubs.size === 0) {
        this.subscribers.delete(roomId);
      }
    }
  }

  sendToPeer(roomId: string, targetPeerId: string, message: SignalingMessage) {
    const roomSubs = this.subscribers.get(roomId);
    if (!roomSubs) return false;

    const sub = roomSubs.get(targetPeerId);
    if (!sub) return false;

    try {
      const data = `data: ${JSON.stringify(message)}\n\n`;
      sub.controller.enqueue(sub.encoder.encode(data));
      return true;
    } catch {
      roomSubs.delete(targetPeerId);
      return false;
    }
  }

  broadcast(roomId: string, message: SignalingMessage, excludePeerId?: string) {
    const roomSubs = this.subscribers.get(roomId);
    if (!roomSubs) return;

    const deadPeers: string[] = [];
    const data = `data: ${JSON.stringify(message)}\n\n`;

    roomSubs.forEach((sub, peerId) => {
      if (excludePeerId && peerId === excludePeerId) return;
      try {
        sub.controller.enqueue(sub.encoder.encode(data));
      } catch {
        deadPeers.push(peerId);
      }
    });

    deadPeers.forEach((p) => roomSubs.delete(p));
  }

  // Participant presence in room
  joinParticipant(roomId: string, participant: Participant): Participant[] {
    let room = this.rooms.get(roomId);
    if (!room) {
      this.createRoom({
        id: roomId,
        name: `Sala #${roomId}`,
        isPrivate: false,
        maxParticipants: 20,
        createdAt: Date.now(),
        createdBy: participant.id,
        createdByName: participant.name,
      });
      room = this.rooms.get(roomId)!;
    }

    room.participants.set(participant.id, participant);
    room.lastActive = Date.now();

    return Array.from(room.participants.values());
  }

  leaveParticipant(roomId: string, peerId: string): Participant[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    room.participants.delete(peerId);
    if (room.info.presenterId === peerId) {
      room.info.presenterId = undefined;
    }

    return Array.from(room.participants.values());
  }

  updateParticipant(roomId: string, participant: Participant) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.participants.set(participant.id, participant);
    room.lastActive = Date.now();
  }

  addMessage(roomId: string, message: ChatMessage) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.messages.push(message);
    if (room.messages.length > 200) {
      room.messages.shift();
    }
    room.lastActive = Date.now();
  }

  getMessages(roomId: string): ChatMessage[] {
    const room = this.rooms.get(roomId);
    return room ? room.messages : [];
  }

  setPresenter(roomId: string, presenterId: string | undefined, config?: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.info.presenterId = presenterId;
    if (config) {
      room.info.screenConfig = config;
    }
  }

  deleteRoom(roomId: string) {
    if (roomId === 'geral') return; // protect default lounge
    this.rooms.delete(roomId);
    this.subscribers.delete(roomId);
  }
}

declare global {
  var __cinemaSignalingHub: SignalingHub | undefined;
}

export const signalingHub = globalThis.__cinemaSignalingHub || new SignalingHub();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__cinemaSignalingHub = signalingHub;
}
