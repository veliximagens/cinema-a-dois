'use client';

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Film,
  Crown,
  Volume2,
  Camera,
  Headphones,
  Heart,
  UserX,
} from 'lucide-react';
import { Participant } from '@/types/nexora';

interface ParticipantsSidebarProps {
  participants: Participant[];
  currentUserId: string;
  isHost: boolean;
  onUpdateVolume: (participantId: string, volume: number) => void;
  onKickParticipant: (participantId: string) => void;
  onMuteParticipant: (participantId: string) => void;
}

export function ParticipantsSidebar({
  participants,
  currentUserId,
  isHost,
  onUpdateVolume,
  onKickParticipant,
  onMuteParticipant,
}: ParticipantsSidebarProps) {
  const [selectedUserForVolume, setSelectedUserForVolume] = useState<string | null>(null);

  return (
    <aside className="w-60 border-r border-[#22101B] bg-[#0A060C] flex flex-col h-full select-none shrink-0">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-[#200F1A] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#D6D3CD]">
            Na Sessão
          </span>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#180C15] text-rose-300 border border-[#2D1426]">
          {participants.length} {participants.length === 1 ? 'pessoa' : 'pessoas'}
        </span>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {participants.map((user) => {
          const isMe = user.id === currentUserId;
          const isVolumeOpen = selectedUserForVolume === user.id;

          return (
            <div
              key={user.id}
              className={`group relative rounded-xl p-2 transition-all flex flex-col ${
                isMe
                  ? 'bg-[#180B14] border border-[#301427]'
                  : 'hover:bg-[#150A12] border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Avatar with subtle speaking glow */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md transition-all ${
                        user.isSpeaking
                          ? 'ring-2 ring-rose-500 ring-offset-2 ring-offset-[#0A060C] shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                          : 'ring-1 ring-white/10'
                      }`}
                      style={{ backgroundColor: user.color || '#E11D48' }}
                    >
                      {user.avatar || '❤️'}
                    </div>

                    {/* Live Stream badge icon */}
                    {user.isSharingScreen && (
                      <span
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-rose-600 to-red-600 border border-[#0A060C] flex items-center justify-center text-[9px] text-white shadow-sm"
                        title="Transmitindo Filme"
                      >
                        <Film className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Name and Badges */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-medium truncate ${
                          isMe ? 'text-[#FAF7F2] font-semibold' : 'text-[#D6D3CD]'
                        }`}
                      >
                        {user.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] text-rose-300 bg-[#281122] px-1 py-0.2 rounded font-medium">
                          você
                        </span>
                      )}
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {user.isHost && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-medium">
                          <Crown className="w-2.5 h-2.5" />
                          <span>Anfitrião</span>
                        </span>
                      )}
                      {user.isSharingScreen && (
                        <span className="text-[10px] text-rose-400 font-medium tracking-wide">
                          Transmitindo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side indicators: discrete mic & camera */}
                <div className="flex items-center gap-1 shrink-0">
                  {user.isCamOn && (
                    <span className="p-1 text-rose-300" title="Câmera ligada">
                      <Camera className="w-3.5 h-3.5" />
                    </span>
                  )}

                  {user.isDeafened && (
                    <span className="p-1 text-zinc-500" title="Áudio silenciado">
                      <Headphones className="w-3.5 h-3.5" />
                    </span>
                  )}

                  <span
                    className={`p-1 rounded-md transition-colors ${
                      user.isMuted
                        ? 'text-zinc-500'
                        : user.isSpeaking
                        ? 'text-rose-400 bg-rose-950/40'
                        : 'text-zinc-400'
                    }`}
                    title={user.isMuted ? 'Microfone Mutado' : 'Microfone Ativo'}
                  >
                    {user.isMuted ? (
                      <MicOff className="w-3.5 h-3.5" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </span>

                  {/* Volume slider toggle */}
                  {!isMe && (
                    <button
                      onClick={() =>
                        setSelectedUserForVolume(isVolumeOpen ? null : user.id)
                      }
                      title="Ajustar Volume"
                      className="p-1 text-zinc-500 hover:text-white rounded hover:bg-[#200F1C] transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Volume & Moderation Panel */}
              {!isMe && isVolumeOpen && (
                <div className="mt-2 pt-2 border-t border-[#261221] flex flex-col gap-2 bg-[#120810] p-2 rounded-lg">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-rose-400" /> Volume
                    </span>
                    <span className="text-[#FAF7F2] font-mono">{user.volume ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={user.volume ?? 100}
                    onChange={(e) => onUpdateVolume(user.id, Number(e.target.value))}
                    className="w-full h-1 bg-[#261220] rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />

                  {isHost && (
                    <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-[#261221]">
                      <button
                        onClick={() => onMuteParticipant(user.id)}
                        className="flex-1 py-1 px-2 rounded bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <MicOff className="w-3 h-3" /> Mutar
                      </button>
                      <button
                        onClick={() => onKickParticipant(user.id)}
                        className="py-1 px-2 rounded bg-red-950/40 hover:bg-red-900/50 text-red-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Remover da sala"
                      >
                        <UserX className="w-3 h-3" /> Remover
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Ambient Info */}
      <div className="p-3 border-t border-[#200F1A] bg-[#080409] flex items-center justify-between text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5 text-rose-300 font-medium">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Cinema a Dois
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">P2P Seguro</span>
      </div>
    </aside>
  );
}
