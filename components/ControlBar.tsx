'use client';

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Video,
  VideoOff,
  Film,
  Settings,
  PhoneOff,
  ChevronUp,
} from 'lucide-react';
import { Participant, ScreenQualityConfig } from '@/types/nexora';

interface ControlBarProps {
  currentParticipant: Participant;
  isSharingScreen: boolean;
  onToggleMic: () => void;
  onToggleDeafen: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
  screenConfig: ScreenQualityConfig;
  onChangeScreenConfig: (config: ScreenQualityConfig) => void;
}

export function ControlBar({
  currentParticipant,
  isSharingScreen,
  onToggleMic,
  onToggleDeafen,
  onToggleCamera,
  onToggleScreenShare,
  onOpenSettings,
  onLeaveRoom,
  screenConfig,
  onChangeScreenConfig,
}: ControlBarProps) {
  const [showScreenMenu, setShowScreenMenu] = useState(false);

  return (
    <div className="h-16 border-t border-[#22101B] bg-[#0A060C]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 select-none">
      {/* User Status Card (Bottom Left) */}
      <div
        onClick={onOpenSettings}
        className="flex items-center gap-3 p-1 rounded-xl hover:bg-[#150A12] transition-colors cursor-pointer group min-w-[130px] max-w-[200px]"
      >
        <div className="relative">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md transition-transform group-hover:scale-105 ${
              currentParticipant.isSpeaking ? 'ring-2 ring-rose-500' : ''
            }`}
            style={{ backgroundColor: currentParticipant.color || '#E11D48' }}
          >
            {currentParticipant.avatar || '❤️'}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A060C] ${
              currentParticipant.isMuted
                ? 'bg-zinc-600'
                : currentParticipant.isSpeaking
                ? 'bg-rose-500'
                : 'bg-emerald-500'
            }`}
          />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-[#FAF7F2] truncate group-hover:text-rose-300 transition-colors">
            {currentParticipant.name}
          </span>
          <span className="text-[10px] text-zinc-400 truncate">
            {currentParticipant.isSharingScreen
              ? 'Transmitindo'
              : currentParticipant.isMuted
              ? 'Microfone Mudo'
              : 'Conectado'}
          </span>
        </div>
      </div>

      {/* Main Actions: Microphone, Audio, Camera, Share Screen */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Microphone Button (With real track.enabled feedback) */}
        <button
          onClick={onToggleMic}
          className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
            currentParticipant.isMuted
              ? 'bg-[#180A14] border border-[#2D1426] text-zinc-500 hover:text-white hover:bg-[#200D1B]'
              : currentParticipant.isSpeaking
              ? 'bg-rose-950/60 border border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(225,29,72,0.3)]'
              : 'bg-[#220F1C] border border-[#3A182F] text-rose-200 hover:text-white hover:bg-[#2C1427]'
          }`}
          title={currentParticipant.isMuted ? 'Ativar Microfone' : 'Mutar Microfone'}
        >
          {currentParticipant.isMuted ? <MicOff className="w-5 h-5 text-zinc-400" /> : <Mic className="w-5 h-5 text-rose-300" />}
        </button>

        {/* Audio / Deafen Button */}
        <button
          onClick={onToggleDeafen}
          className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
            currentParticipant.isDeafened
              ? 'bg-[#180A14] border border-[#2D1426] text-zinc-500 hover:text-white hover:bg-[#200D1B]'
              : 'bg-[#180C16] border border-[#2B1425] text-zinc-300 hover:text-white hover:bg-[#220E1E]'
          }`}
          title={currentParticipant.isDeafened ? 'Reativar Áudio da Sessão' : 'Silenciar Áudio da Sessão'}
        >
          <Headphones className="w-5 h-5" />
        </button>

        {/* Camera Button */}
        <button
          onClick={onToggleCamera}
          className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
            currentParticipant.isCamOn
              ? 'bg-rose-950/50 border border-rose-500 text-rose-300 shadow-sm'
              : 'bg-[#180C16] border border-[#2B1425] text-zinc-300 hover:text-white hover:bg-[#220E1E]'
          }`}
          title={currentParticipant.isCamOn ? 'Desligar Câmera' : 'Ligar Câmera'}
        >
          {currentParticipant.isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share Button (Highlighted for Film Streaming) */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={onToggleScreenShare}
              className={`px-4 py-3 rounded-2xl font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md ${
                isSharingScreen
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-rose-950/60 ring-2 ring-rose-500/40'
                  : 'bg-gradient-to-r from-[#BE123C] to-[#E11D48] hover:from-[#A81035] hover:to-[#CD1B41] text-white shadow-rose-950/40 hover:shadow-rose-900/20'
              }`}
              title={isSharingScreen ? 'Parar Compartilhamento de Tela' : 'Transmitir Filme ou Janela'}
            >
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isSharingScreen ? 'Parar Filme' : 'Transmitir Filme'}
              </span>
            </button>

            <button
              onClick={() => setShowScreenMenu(!showScreenMenu)}
              className="p-3 ml-1 rounded-2xl bg-[#180C16] hover:bg-[#220E1E] border border-[#2B1425] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Ajustar Qualidade do Vídeo"
            >
              <ChevronUp className={`w-4 h-4 transition-transform ${showScreenMenu ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Quality Picker Dropdown */}
          {showScreenMenu && (
            <div className="absolute bottom-16 right-0 w-64 p-3 rounded-2xl bg-[#120810] border border-[#2E1527] shadow-2xl z-50 text-xs">
              <div className="font-semibold text-[#FAF7F2] mb-2 flex items-center justify-between">
                <span>Qualidade da Transmissão</span>
                <span className="text-[10px] text-rose-400 font-mono">Full HD</span>
              </div>

              <div className="space-y-1 mb-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onChangeScreenConfig({ ...screenConfig, resolution: '1080p', frameRate: 60 });
                    setShowScreenMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl border flex items-center justify-between cursor-pointer ${
                    screenConfig.resolution === '1080p' && screenConfig.frameRate === 60
                      ? 'bg-rose-950/50 border-rose-600 text-white'
                      : 'border-transparent text-zinc-400 hover:bg-[#1A0B17]'
                  }`}
                >
                  <span className="font-medium text-[#FAF7F2]">1080p @ 60 FPS</span>
                  <span className="text-[10px] text-rose-400">Ultra Fluido</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChangeScreenConfig({ ...screenConfig, resolution: '1080p', frameRate: 30 });
                    setShowScreenMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl border flex items-center justify-between cursor-pointer ${
                    screenConfig.resolution === '1080p' && screenConfig.frameRate === 30
                      ? 'bg-rose-950/50 border-rose-600 text-white'
                      : 'border-transparent text-zinc-400 hover:bg-[#1A0B17]'
                  }`}
                >
                  <span className="font-medium text-[#FAF7F2]">1080p @ 30 FPS</span>
                  <span className="text-[10px] text-zinc-400">Cinematográfico</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChangeScreenConfig({ ...screenConfig, resolution: '720p', frameRate: 60 });
                    setShowScreenMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl border flex items-center justify-between cursor-pointer ${
                    screenConfig.resolution === '720p' && screenConfig.frameRate === 60
                      ? 'bg-rose-950/50 border-rose-600 text-white'
                      : 'border-transparent text-zinc-400 hover:bg-[#1A0B17]'
                  }`}
                >
                  <span className="font-medium text-[#FAF7F2]">720p @ 60 FPS</span>
                  <span className="text-[10px] text-zinc-400">Econômico</span>
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[#D6D3CD] pt-2 border-t border-[#230F1F]">
                <input
                  type="checkbox"
                  checked={screenConfig.withAudio}
                  onChange={(e) => onChangeScreenConfig({ ...screenConfig, withAudio: e.target.checked })}
                  className="rounded border-[#3E162D] bg-[#1A0A15] text-rose-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-[11px]">Transmitir áudio do filme</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Settings & Leave Session (Deep Velvet Red) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="p-3 rounded-2xl bg-[#180C16] border border-[#2B1425] text-zinc-400 hover:text-white hover:bg-[#220E1E] transition-colors cursor-pointer hidden sm:flex"
          title="Configurações de Dispositivos"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Leave Session Button */}
        <button
          onClick={onLeaveRoom}
          className="px-4 py-3 rounded-2xl bg-[#881337] hover:bg-[#9F1239] text-[#FAF7F2] font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-all cursor-pointer active:scale-95"
          title="Encerrar ou Sair da Sessão"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">Sair da Sessão</span>
        </button>
      </div>
    </div>
  );
}
