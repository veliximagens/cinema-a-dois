import { NextRequest, NextResponse } from 'next/server';
import { signalingHub } from '@/lib/signaling-hub';
import { RoomInfo } from '@/types/nexora';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('id');

  if (roomId) {
    const room = signalingHub.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 });
    }
    const safeInfo: RoomInfo = {
      ...room.info,
      password: room.info.password ? 'PROTECTED' : undefined,
      invites: Array.from(room.invites.values()),
    };
    return NextResponse.json({
      room: safeInfo,
      participantCount: room.participants.size,
      hasPassword: !!room.info.password,
    });
  }

  const list = signalingHub.listRooms().map((r) => ({
    ...r,
    password: r.password ? 'PROTECTED' : undefined,
  }));
  return NextResponse.json({ rooms: list });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, isPrivate, password, maxParticipants, createdBy, createdByName } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID e Nome são obrigatórios' }, { status: 400 });
    }

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

    const existing = signalingHub.getRoom(cleanId);
    if (existing && existing.info.createdBy !== createdBy) {
      return NextResponse.json(
        { error: 'Uma sala com esse identificador já existe. Escolha outro código.' },
        { status: 409 }
      );
    }

    const roomInfo: RoomInfo = {
      id: cleanId,
      name: name.trim(),
      isPrivate: Boolean(isPrivate),
      password: password ? String(password) : undefined,
      maxParticipants: Number(maxParticipants) || 20,
      createdAt: Date.now(),
      createdBy: createdBy || 'guest',
      createdByName: createdByName || 'Anônimo',
    };

    const created = signalingHub.createRoom(roomInfo);

    return NextResponse.json({ success: true, room: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar sala' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, peerId } = body;

    if (!roomId || !peerId) {
      return NextResponse.json({ error: 'roomId e peerId são obrigatórios' }, { status: 400 });
    }

    const success = signalingHub.endRoom(roomId, peerId);
    if (!success) {
      return NextResponse.json({ error: 'Não foi possível encerrar a sala.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Sala encerrada com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao encerrar sala' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, maxParticipants, peerId } = body;

    if (!roomId || !peerId || !maxParticipants) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const success = signalingHub.setRoomMaxParticipants(roomId, Number(maxParticipants), peerId);
    if (!success) {
      return NextResponse.json({ error: 'Apenas o anfitrião pode alterar o limite.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, maxParticipants: Number(maxParticipants) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar sala' }, { status: 500 });
  }
}
