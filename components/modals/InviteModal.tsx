'use client';
import React, { useState, useEffect, useSyncExternalStore } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Film,
  Heart,
  Shield,
  Clock,
  Users,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { RoomInfo, RoomInvite, Participant } from '@/types/nexora';

const emptySubscribe = () => () => {};

function useCurrentTime() {
  return useSyncExternalStore(
    emptySubscribe,
    () => Date.now(),
    () => 0
  );
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomInfo: RoomInfo | null;
  currentParticipant: Participant;
  onEndRoom?: () => void;
  onUpdateMaxParticipants?: (max: number) => void;
}

export function InviteModal({
  isOpen,
  onClose,
  roomInfo,
  currentParticipant,
  onEndRoom,
  onUpdateMaxParticipants,
}: InviteModalProps) {
  const [invites, setInvites] = useState<RoomInvite[]>([]);
  const [selectedInvite, setSelectedInvite] = useState<RoomInvite | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState<number | null>(null); // null = sem expiração
  const [maxUses, setMaxUses] = useState<number | null>(null); // null = ilimitado
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [participantLimit, setParticipantLimit] = useState(roomInfo?.maxParticipants || 10);
  const [confirmEndRoom, setConfirmEndRoom] = useState(false);
  const nowTime = useCurrentTime();

  const isHost = currentParticipant.isHost || (roomInfo && roomInfo.createdBy === currentParticipant.id);

  // Fetch invites when modal opens
  useEffect(() => {
    if (!isOpen || !roomInfo?.id) return;
    let isMounted = true;

    fetch(`/api/signaling/invites?roomId=${encodeURIComponent(roomInfo.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.invites) {
          setInvites(data.invites);
          const active = data.invites.find((i: RoomInvite) => !i.isRevoked);
          setSelectedInvite(active || data.invites[0] || null);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen, roomInfo?.id]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentToken = selectedInvite?.token || (invites.find((i) => !i.isRevoked)?.token ?? '');
  const inviteLink = currentToken
    ? `${currentOrigin}/?room=${roomInfo?.id || 'geral'}&invite=${currentToken}`
    : `${currentOrigin}/?room=${roomInfo?.id || 'geral'}`;

  const handleCopyLink = (tokenToCopy?: string) => {
    const targetToken = tokenToCopy || currentToken;
    const url = targetToken
      ? `${currentOrigin}/?room=${roomInfo?.id || 'geral'}&invite=${targetToken}`
      : `${currentOrigin}/?room=${roomInfo?.id || 'geral'}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedToken(targetToken || 'main');
      setTimeout(() => setCopiedToken(null), 2500);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Cinema a Dois ❤️ — ${roomInfo?.name || 'Sessão Especial'}`,
          text: `Venha assistir a este filme comigo no Cinema a Dois! Prepare a pipoca:`,
          url: inviteLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCreateNewInvite = async () => {
    if (!roomInfo?.id) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/signaling/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomInfo.id,
          createdBy: currentParticipant.id,
          createdByName: currentParticipant.name,
          expiresInHours,
          maxUses,
        }),
      });
      const data = await res.json();
      if (data.invite) {
        setInvites((prev) => [data.invite, ...prev]);
        setSelectedInvite(data.invite);
        setShowAdvanced(false);
      }
    } catch {
      // ignore
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeInvite = async (token: string) => {
    if (!roomInfo?.id) return;
    try {
      const res = await fetch('/api/signaling/invites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomInfo.id,
          token,
          peerId: currentParticipant.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInvites((prev) =>
          prev.map((i) => (i.token === token ? { ...i, isRevoked: true } : i))
        );
        if (selectedInvite?.token === token) {
          const nextActive = invites.find((i) => i.token !== token && !i.isRevoked);
          setSelectedInvite(nextActive || null);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSaveParticipantLimit = async (limit: number) => {
    setParticipantLimit(limit);
    if (onUpdateMaxParticipants) {
      onUpdateMaxParticipants(limit);
    }
    if (roomInfo?.id) {
      await fetch('/api/signaling/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomInfo.id,
          maxParticipants: limit,
          peerId: currentParticipant.id,
        }),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#0c070c] border border-[#2b121e] shadow-2xl relative select-none animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#230f19] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1b0914] border border-[#3b1629] flex items-center justify-center text-rose-400 shadow-inner">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
                Convidar para a Sessão
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold">
                  Cinema a Dois
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Gere e compartilhe links exclusivos de cinema para assistir juntos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-[#200e19] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Room info banner */}
          <div className="p-3 rounded-xl bg-[#140810] border border-[#2b121e] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#220d19] border border-rose-900/40 flex items-center justify-center text-rose-400">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-100">{roomInfo?.name || 'Sessão de Cinema'}</div>
                <div className="text-[10px] text-stone-400 font-mono">Código da Sala: #{roomInfo?.id}</div>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                roomInfo?.isPrivate
                  ? 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                  : 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
              }`}
            >
              {roomInfo?.isPrivate ? 'Privada (Exige Convite)' : 'Aberta'}
            </span>
          </div>

          {/* Active Link Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-stone-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Link de Convite Ativo
              </label>
              {selectedInvite?.expiresAt && nowTime > 0 && (
                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-400" />
                  Expira em:{' '}
                  {Math.max(0, Math.round((selectedInvite.expiresAt - nowTime) / (3600 * 1000)))}h
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-[#140810] border border-[#2b121e] focus:border-rose-600 rounded-xl px-3 py-2 text-xs text-rose-200 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopyLink()}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  copiedToken === (currentToken || 'main')
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-700 hover:bg-rose-600 text-white shadow-md'
                }`}
                title="Copiar Link"
              >
                {copiedToken === (currentToken || 'main') ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-xl bg-[#200e19] border border-[#3b172b] hover:bg-[#2c1223] text-stone-200 hover:text-white transition-colors cursor-pointer"
                title="Compartilhar convite"
              >
                <Share2 className="w-4 h-4 text-rose-300" />
              </button>
            </div>
            {copiedToken && (
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3 h-3" /> Link exclusivo copiado para a área de transferência!
              </p>
            )}
          </div>

          {/* New Custom Invite Creator Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Recolher gerador de convites' : 'Gerar novo convite personalizado'}</span>
            </button>
          </div>

          {showAdvanced && (
            <div className="p-4 rounded-xl bg-[#140810] border border-[#2b121e] space-y-3 animate-in fade-in duration-100">
              <div className="text-xs font-semibold text-stone-200">Personalizar Novo Convite</div>

              {/* Expiration options */}
              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1">
                  Validade do Convite
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '1 hora', hours: 1 },
                    { label: '24 horas', hours: 24 },
                    { label: '7 dias', hours: 168 },
                    { label: 'Sem limite', hours: null },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setExpiresInHours(opt.hours)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-medium cursor-pointer border transition-colors ${
                        expiresInHours === opt.hours
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                          : 'bg-[#1b0914] border-[#2f1423] text-stone-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Usage limit options */}
              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1">
                  Limite de Utilizações
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '1 pessoa', uses: 1 },
                    { label: '2 pessoas', uses: 2 },
                    { label: '5 pessoas', uses: 5 },
                    { label: 'Ilimitado', uses: null },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setMaxUses(opt.uses)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-medium cursor-pointer border transition-colors ${
                        maxUses === opt.uses
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                          : 'bg-[#1b0914] border-[#2f1423] text-stone-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateNewInvite}
                disabled={isGenerating}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? 'Gerando convite...' : 'Gerar e Ativar Convite'}
              </button>
            </div>
          )}

          {/* List of Generated Invites */}
          {invites.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Convites Gerados nesta Sala ({invites.length})
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {invites.map((inv) => (
                  <div
                    key={inv.token}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      inv.isRevoked
                        ? 'bg-[#12070e] border-[#220d18] opacity-50'
                        : selectedInvite?.token === inv.token
                        ? 'bg-[#220c19] border-rose-700/80'
                        : 'bg-[#140810] border-[#2b121e]'
                    }`}
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-rose-300 font-semibold truncate">
                          {inv.token}
                        </span>
                        {inv.isRevoked ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-900 text-stone-400 border border-stone-800">
                            Revogado
                          </span>
                        ) : inv.expiresAt && nowTime > 0 && nowTime > inv.expiresAt ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-900 text-amber-400 border border-stone-800">
                            Expirado
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Ativo
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {inv.maxUses ? `Usos: ${inv.usesCount}/${inv.maxUses}` : `Usos: ${inv.usesCount} (ilimitado)`}
                        {' • '}
                        {inv.expiresAt
                          ? `Válido até: ${new Date(inv.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Sem expiração'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!inv.isRevoked && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(inv.token)}
                            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-[#2e1224] transition-colors cursor-pointer"
                            title="Copiar este link"
                          >
                            {copiedToken === inv.token ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {isHost && (
                            <button
                              type="button"
                              onClick={() => handleRevokeInvite(inv.token)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-[#2e1224] transition-colors cursor-pointer"
                              title="Revogar este convite"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Host Admin Controls */}
          {isHost && (
            <div className="p-3.5 rounded-xl bg-[#140810] border border-[#2b121e] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-200">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Controles do Anfitrião da Sala</span>
              </div>

              {/* Participant limit selector */}
              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1">
                  Limite de Participantes Simultâneos
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[2, 4, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSaveParticipantLimit(num)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-medium cursor-pointer border transition-colors ${
                        participantLimit === num
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                          : 'bg-[#1b0914] border-[#2f1423] text-stone-400 hover:text-white'
                      }`}
                    >
                      {num === 2 ? '2 (Casal ❤️)' : `${num} pessoas`}
                    </button>
                  ))}
                </div>
              </div>

              {/* End room button */}
              {roomInfo?.id !== 'geral' && (
                <div className="pt-1">
                  {!confirmEndRoom ? (
                    <button
                      type="button"
                      onClick={() => setConfirmEndRoom(true)}
                      className="w-full py-2 px-3 rounded-xl bg-[#1c0812] border border-rose-900/60 hover:bg-rose-950/80 text-rose-300 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Encerrar Sala para Todos os Participantes</span>
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-600 text-center space-y-2">
                      <p className="text-xs text-rose-100 font-medium">
                        Tem certeza? Todos os participantes serão desconectados imediatamente.
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmEndRoom(false)}
                          className="px-3 py-1 rounded-lg bg-[#140810] text-xs text-stone-300 hover:text-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onEndRoom) onEndRoom();
                            onClose();
                          }}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow cursor-pointer"
                        >
                          Confirmar Encerramento
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
