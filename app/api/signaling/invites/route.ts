import { NextRequest, NextResponse } from 'next/server';
import { signalingHub } from '@/lib/signaling-hub';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, createdBy, createdByName, expiresInHours, maxUses } = body;

    if (!roomId || !createdBy) {
      return NextResponse.json({ error: 'roomId e createdBy são obrigatórios' }, { status: 400 });
    }

    const invite = signalingHub.createInvite(
      roomId,
      createdBy,
      createdByName,
      expiresInHours !== undefined ? Number(expiresInHours) : null,
      maxUses !== undefined ? Number(maxUses) : null
    );

    if (!invite) {
      return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, invite });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao gerar convite' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const token = searchParams.get('token');

  if (!roomId) {
    return NextResponse.json({ error: 'roomId é obrigatório' }, { status: 400 });
  }

  // If token is provided, validate it
  if (token) {
    const validation = signalingHub.validateInvite(roomId, token);
    return NextResponse.json(validation);
  }

  // Otherwise return list of invites
  const invites = signalingHub.listInvites(roomId);
  return NextResponse.json({ invites });
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, token, peerId } = body;

    if (!roomId || !token || !peerId) {
      return NextResponse.json({ error: 'Dados incompletos para revogação' }, { status: 400 });
    }

    const success = signalingHub.revokeInvite(roomId, token, peerId);
    if (!success) {
      return NextResponse.json(
        { error: 'Não foi possível revogar o convite. Verifique se você é o criador da sala.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, message: 'Convite revogado com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao revogar convite' }, { status: 500 });
  }
}
