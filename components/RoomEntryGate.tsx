'use client';

import React, { useState, useEffect } from 'react';
import {
  Film,
  Heart,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Shield,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Participant, RoomInfo } from '@/types/nexora';
import { CinemaLogo } from '@/components/CinemaLogo';

interface RoomEntryGateProps {
  roomId: string;
  inviteToken?: string | null;
  currentParticipant: Participant;
  onJoinSuccess: (configuredParticipant: Participant) => void;
  onGoToGeneral: () => void;
}

export function RoomEntryGate({
  roomId,
  inviteToken,
  currentParticipant,
  onJoinSuccess,
  onGoToGeneral,
}: RoomEntryGateProps) {
  const [loading, setLoading] = useState(true);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [accessAllowed, setAccessAllowed] = useState(true);
  const [accessReason, setAccessReason] = useState<string | null>(null);

  // User pre-join preferences
  const [displayName, setDisplayName] = useState(currentParticipant.name || 'Convidado');
  const [selectedColor, setSelectedColor] = useState(currentParticipant.color || '#E11D48');
  const [initialMicOn, setInitialMicOn] = useState(!currentParticipant.isMuted);
  const [initialCamOn, setInitialCamOn] = useState(currentParticipant.isCamOn);

  const COLOR_PALETTE = ['#E11D48', '#BE123C', '#9F1239', '#881337', '#FB7185', '#7C2D12', '#4C1D95'];

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      setLoading(true);
      try {
        // 1. Fetch room details
        const roomRes = await fetch(`/api/signaling/rooms?id=${encodeURIComponent(roomId)}`);
        const roomData = await roomRes.json();

        if (roomRes.status === 404) {
          if (isMounted) {
            setAccessAllowed(false);
            setAccessReason('A sala solicitada não existe ou foi encerrada.');
            setLoading(false);
          }
          return;
        }

        if (roomData.room && isMounted) {
          setRoomInfo(roomData.room);
          setParticipantCount(roomData.participantCount || 0);
        }

        // 2. Validate invite / access permissions
        const accessRes = await fetch('/api/signaling/rooms/access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            peerId: currentParticipant.id,
            token: inviteToken || undefined,
          }),
        });

        const accessData = await accessRes.json();
        if (isMounted) {
          if (!accessData.allowed) {
            setAccessAllowed(false);
            setAccessReason(accessData.reason || 'Acesso não autorizado para esta sala.');
          } else {
            setAccessAllowed(true);
            setAccessReason(null);
          }
        }
      } catch {
        if (isMounted) {
          setAccessAllowed(false);
          setAccessReason('Não foi possível verificar as permissões da sala.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [roomId, inviteToken, currentParticipant.id]);

  const handleEnterRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessAllowed) return;

    const trimmed = displayName.trim() || 'Convidado';
    const initials = trimmed.substring(0, 2).toUpperCase() || 'CP';

    const configured: Participant = {
      ...currentParticipant,
      name: trimmed,
      avatar: initials,
      color: selectedColor,
      isMuted: !initialMicOn,
      isCamOn: initialCamOn,
    };

    onJoinSuccess(configured);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#070508] text-stone-200 select-none">
        <div className="w-14 h-14 rounded-2xl bg-[#140810] border border-[#2b121e] flex items-center justify-center shadow-2xl mb-4">
          <Heart className="w-7 h-7 text-rose-500 fill-rose-500 animate-pulse" />
        </div>
        <span className="text-sm font-semibold tracking-wide text-stone-200">
          Validando convite de cinema...
        </span>
        <span className="text-xs text-stone-400 mt-1">
          Prepare a pipoca, escolha o filme e aproveite juntos.
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#070508] text-stone-100 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-950/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl bg-[#0c070c] border border-[#2b121e] p-6 sm:p-8 shadow-2xl relative select-none z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <CinemaLogo size="lg" showSubtitle={true} />
        </div>

        {/* Access Denied / Invalid Invite State */}
        {!accessAllowed ? (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1b0811] border border-rose-900/60 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-stone-100">Não foi possível entrar na sala</h3>
              <p className="text-xs text-rose-300 leading-relaxed max-w-sm mx-auto">
                {accessReason || 'O link de convite é inválido, expirou ou a sala atingiu o limite de participantes.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#140810] border border-[#2b121e] text-[11px] text-stone-400 text-left space-y-1">
              <div className="font-semibold text-stone-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                Segurança Cinema a Dois
              </div>
              <p>
                Salas privadas são protegidas e exigem autorização ativa do anfitrião para manter as transmissões íntimas e reservadas.
              </p>
            </div>

            <button
              type="button"
              onClick={onGoToGeneral}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Ir para a Sala Principal Aberta</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Valid Invite / Allowed Entry Form */
          <form onSubmit={handleEnterRoom} className="space-y-5">
            {/* Room info card */}
            <div className="p-4 rounded-2xl bg-[#140810] border border-[#2b121e] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-200">
                  <Film className="w-4 h-4 text-rose-400" />
                  <span className="truncate max-w-[200px]">{roomInfo?.name || 'Sessão de Cinema'}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-rose-950/70 text-rose-300 border border-rose-800/40">
                  {roomInfo?.isPrivate ? 'Sala Privada' : 'Sala Compartilhada'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-[#230f19]">
                <span>Anfitrião: <strong className="text-stone-300">{roomInfo?.createdByName || 'Criador'}</strong></span>
                <span className="flex items-center gap-1 font-mono">
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  {participantCount} {participantCount === 1 ? 'presente' : 'presentes'}
                </span>
              </div>
            </div>

            {/* Display name input */}
            <div>
              <label className="block text-xs font-semibold text-stone-200 mb-1.5">
                Como você deseja ser chamado na sessão?
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Amor, Meu Bem, Cineasta..."
                className="w-full bg-[#140810] border border-[#2b121e] focus:border-rose-600 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500"
              />
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-2">
                Cor do seu Perfil
              </label>
              <div className="flex items-center gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-xl transition-transform cursor-pointer flex items-center justify-center ${
                      selectedColor === c ? 'scale-110 ring-2 ring-rose-400 shadow-md' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Pre-join Audio and Video Controls */}
            <div className="p-3.5 rounded-2xl bg-[#140810] border border-[#2b121e] space-y-2.5">
              <div className="text-[11px] font-semibold text-stone-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Configurações Iniciais ao Entrar</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Microphone pre-choice */}
                <button
                  type="button"
                  onClick={() => setInitialMicOn(!initialMicOn)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors ${
                    initialMicOn
                      ? 'bg-rose-950/60 border-rose-600 text-rose-200'
                      : 'bg-[#1a0b15] border-[#311624] text-stone-400'
                  }`}
                >
                  {initialMicOn ? (
                    <Mic className="w-4 h-4 text-rose-400" />
                  ) : (
                    <MicOff className="w-4 h-4 text-stone-500" />
                  )}
                  <span>{initialMicOn ? 'Microfone Ativo' : 'Microfone Mutado'}</span>
                </button>

                {/* Camera pre-choice */}
                <button
                  type="button"
                  onClick={() => setInitialCamOn(!initialCamOn)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors ${
                    initialCamOn
                      ? 'bg-rose-950/60 border-rose-600 text-rose-200'
                      : 'bg-[#1a0b15] border-[#311624] text-stone-400'
                  }`}
                >
                  {initialCamOn ? (
                    <Video className="w-4 h-4 text-rose-400" />
                  ) : (
                    <VideoOff className="w-4 h-4 text-stone-500" />
                  )}
                  <span>{initialCamOn ? 'Câmera Ativa' : 'Câmera Desligada'}</span>
                </button>
              </div>
            </div>

            {/* Join CTA Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-xl shadow-rose-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Entrar na Sessão de Cinema</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
