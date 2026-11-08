'use client';

import React, { useState } from 'react';
import {
  Lock,
  Globe,
  Share2,
  Settings,
  LayoutGrid,
  Maximize2,
  Users,
  Check,
  Film,
} from 'lucide-react';
import { Participant, RealtimeStats, RoomInfo } from '@/types/nexora';
import { CinemaLogo } from '@/components/CinemaLogo';

interface HeaderProps {
  roomInfo: RoomInfo | null;
  participantCount: number;
  stats: RealtimeStats;
  currentParticipant: Participant;
  viewMode: 'theater' | 'grid';
  onToggleViewMode: () => void;
  onOpenInvite: () => void;
  onOpenSettings: () => void;
  onOpenRoomModal: () => void;
}

export function Header({
  roomInfo,
  participantCount,
  stats,
  currentParticipant,
  viewMode,
  onToggleViewMode,
  onOpenInvite,
  onOpenSettings,
  onOpenRoomModal,
}: HeaderProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleQuickCopy = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/?room=${roomInfo?.id || 'geral'}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <header className="h-14 border-b border-[#24131D] bg-[#0A060C]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 select-none">
      {/* Left: Cinema a Dois Brand & Room Identity */}
      <div className="flex items-center gap-4">
        <div onClick={onOpenRoomModal} className="cursor-pointer">
          <CinemaLogo size="md" showSubtitle={false} />
        </div>

        <div className="h-4 w-[1px] bg-[#2A1622] hidden sm:block" />

        {/* Room Name & Type */}
        <div
          onClick={onOpenRoomModal}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#140A12] border border-[#2D1625] hover:border-[#4D1C3B] transition-colors cursor-pointer group"
          title="Clique para trocar de sala"
        >
          <Film className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-xs font-semibold text-[#FAF7F2] truncate max-w-[160px] sm:max-w-[240px]">
            {roomInfo?.name || 'Sessão de Cinema'}
          </span>
          {roomInfo?.isPrivate ? (
            <span title="Sala Privada" className="flex items-center">
              <Lock className="w-3 h-3 text-amber-400/80 shrink-0" />
            </span>
          ) : (
            <span title="Sala Compartilhada" className="flex items-center">
              <Globe className="w-3 h-3 text-rose-300/80 shrink-0" />
            </span>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Participant Counter */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#140A12] border border-[#2A1523] text-xs text-[#D6D3CD]">
          <Users className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-semibold text-[#FAF7F2]">{participantCount}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-500">{roomInfo?.maxParticipants || 10}</span>
        </div>

        {/* Convidar Pessoas Button */}
        <button
          onClick={onOpenInvite}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#BE123C] to-[#E11D48] hover:from-[#A81035] hover:to-[#CD1B41] text-white text-xs font-semibold shadow-md shadow-rose-950/40 transition-all active:scale-95 cursor-pointer"
          title="Convidar pessoas para a sessão"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Convidar pessoas</span>
          <span className="sm:hidden">Convidar</span>
        </button>

        {/* View Mode Toggle: Cinema Theater vs Grid */}
        <button
          onClick={onToggleViewMode}
          className="p-2 rounded-lg bg-[#140A12] hover:bg-[#200F1C] text-[#D6D3CD] hover:text-white border border-[#2A1523] transition-colors cursor-pointer"
          title={viewMode === 'theater' ? 'Ver Grade de Câmeras' : 'Foco na Tela do Filme'}
        >
          {viewMode === 'theater' ? (
            <LayoutGrid className="w-4 h-4 text-rose-300" />
          ) : (
            <Maximize2 className="w-4 h-4 text-rose-300" />
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-[#140A12] hover:bg-[#200F1C] text-[#D6D3CD] hover:text-white border border-[#2A1523] transition-colors cursor-pointer"
          title="Configurações de Dispositivos e Tela"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Mini Badge */}
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-2 pl-1 cursor-pointer"
          title={`Você: ${currentParticipant.name}`}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-md border border-white/10"
            style={{ backgroundColor: currentParticipant.color }}
          >
            {currentParticipant.avatar}
          </div>
        </div>
      </div>
    </header>
  );
}
