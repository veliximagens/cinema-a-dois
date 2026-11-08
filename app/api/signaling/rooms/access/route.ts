import { NextRequest, NextResponse } from 'next/server';
import { signalingHub } from '@/lib/signaling-hub';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, peerId, token } = body;

    if (!roomId || !peerId) {
      return NextResponse.json({ allowed: false, reason: 'Identificadores ausentes' }, { status: 400 });
    }

    const result = signalingHub.checkRoomAccess(roomId, peerId, token);

    // If invite token was supplied and access is allowed, consume a use
    if (result.allowed && token) {
      signalingHub.useInvite(roomId, token);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ allowed: false, reason: error.message || 'Erro ao validar acesso' }, { status: 500 });
  }
}
