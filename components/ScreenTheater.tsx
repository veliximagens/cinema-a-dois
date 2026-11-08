'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Play,
  Film,
  Heart,
  Sparkles,
  StopCircle,
  Eye,
  Sliders,
} from 'lucide-react';
import { Participant, RealtimeStats, ScreenQualityConfig } from '@/types/nexora';

interface ScreenTheaterProps {
  screenStream: MediaStream | null;
  presenter: Participant | null;
  isLocalPresenter: boolean;
  stats: RealtimeStats;
  screenConfig: ScreenQualityConfig;
  onStartScreenShare: (config: ScreenQualityConfig) => void;
  onStopScreenShare: () => void;
  webcamStreams: Map<string, MediaStream>;
  participants: Participant[];
}

export function ScreenTheater({
  screenStream,
  presenter,
  isLocalPresenter,
  stats,
  screenConfig,
  onStartScreenShare,
  onStopScreenShare,
  webcamStreams,
  participants,
}: ScreenTheaterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'1080p60' | '1080p30' | '720p60'>('1080p60');
  const [withSystemAudio, setWithSystemAudio] = useState(true);

  // Bind screen stream to the video tag
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (screenStream) {
      video.srcObject = screenStream;
      video.play().catch((err) => {
        console.warn('Video auto-play prevented:', err);
      });
    } else {
      video.srcObject = null;
    }
  }, [screenStream]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn(err));
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
    }
  };

  const handleLaunchShare = () => {
    let resolution: ScreenQualityConfig['resolution'] = '1080p';
    let frameRate: ScreenQualityConfig['frameRate'] = 60;

    if (selectedPreset === '1080p30') {
      resolution = '1080p';
      frameRate = 30;
    } else if (selectedPreset === '720p60') {
      resolution = '720p';
      frameRate = 60;
    }

    onStartScreenShare({
      resolution,
      frameRate,
      withAudio: withSystemAudio,
    });
  };

  const hasActiveStream = Boolean(screenStream);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-[#050306] relative flex items-center justify-center overflow-hidden p-2 sm:p-4 select-none"
    >
      {/* Subtle warm cinema ambiance illumination */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-[#BE123C]/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full bg-[#881337]/10 blur-[140px]" />
      </div>

      {hasActiveStream ? (
        /* ACTIVE SCREEN SHARE: CINEMATIC THEATER VIEW */
        <div className="relative w-full h-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-black border border-[#210E1B] shadow-2xl group">
          {/* Main Film Video Screen */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocalPresenter || isAudioMuted}
            className="w-full h-full object-contain bg-black"
          />

          {/* Minimalist Top HUD (Fades out when mouse is idle) */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {/* Presenter info */}
            <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-xs shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[#FAF7F2] font-medium">
                {isLocalPresenter ? 'Você está transmitindo' : `Filme compartilhado por ${presenter?.name || 'seu par'}`}
              </span>
            </div>

            {/* Quality pill */}
            <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-xs text-zinc-300 font-mono">
              <span className="text-rose-400 font-semibold">{stats.resolution || '1080p'}</span>
              <span className="text-zinc-600">|</span>
              <span>{stats.fps || 60} FPS</span>
            </div>
          </div>

          {/* Minimalist Bottom Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="pointer-events-auto flex items-center gap-2">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                Cinema a Dois
              </span>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              {/* Audio toggle for spectators */}
              {!isLocalPresenter && (
                <button
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className={`p-2.5 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                    isAudioMuted
                      ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                      : 'bg-black/80 border-white/10 text-zinc-200 hover:text-white'
                  }`}
                  title={isAudioMuted ? 'Ativar Áudio do Filme' : 'Mutar Áudio do Filme'}
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              {/* Stop stream button if local presenter */}
              {isLocalPresenter && (
                <button
                  onClick={onStopScreenShare}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#BE123C] to-[#E11D48] hover:from-[#A81035] hover:to-[#CD1B41] text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition-all cursor-pointer active:scale-95"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Parar Transmissão</span>
                </button>
              )}

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-black/80 hover:bg-zinc-900 backdrop-blur-md border border-white/10 text-zinc-200 hover:text-white transition-all cursor-pointer"
                title={isFullscreen ? 'Sair da Tela Cheia' : 'Assistir em Tela Cheia'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Floating participant webcams in corner */}
          {webcamStreams.size > 0 && (
            <div className="absolute top-14 right-4 flex flex-col gap-2 pointer-events-auto max-h-[70%] overflow-y-auto">
              {Array.from(webcamStreams.entries()).map(([peerId, stream]) => {
                const user = participants.find((p) => p.id === peerId);
                return (
                  <FloatingCinemaCam
                    key={peerId}
                    stream={stream}
                    participant={user}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ELEGANT EMPTY STATE: CINEMATIC INVITATION TO WATCH TOGETHER */
        <div className="relative z-10 max-w-xl w-full mx-auto p-8 sm:p-10 rounded-3xl bg-[#0D080E]/90 backdrop-blur-xl border border-[#271221] shadow-[0_0_50px_rgba(225,29,72,0.08)] text-center flex flex-col items-center">
          {/* Romantic & Cinema Emblem */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#BE123C] via-[#9F1239] to-[#4C0519] p-[2px] shadow-xl shadow-rose-950/40">
              <div className="w-full h-full bg-[#140810] rounded-[14px] flex items-center justify-center">
                <Film className="w-9 h-9 text-rose-400" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#180A14] border border-rose-800/60 text-rose-400">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </span>
          </div>

          {/* Headline & Warm Welcome */}
          <h2 className="text-2xl sm:text-3xl font-bold text-[#FAF7F2] tracking-tight mb-2 font-sans">
            Cinema a Dois ❤️
          </h2>
          <p className="text-sm text-rose-200/90 font-medium mb-1">
            &ldquo;Prepare a pipoca, escolha o filme e aproveite juntos.&rdquo;
          </p>
          <p className="text-xs text-[#A8A29E] max-w-md mx-auto leading-relaxed mb-6">
            Transmita filmes da Netflix, YouTube, Prime Video ou arquivos locais em alta fidelidade para assistir em sincronia perfeita.
          </p>

          {/* Quality Presets Selector */}
          <div className="w-full bg-[#130710] p-3.5 rounded-2xl border border-[#24111E] mb-6 text-left">
            <div className="flex items-center justify-between text-xs font-semibold text-[#D6D3CD] mb-2 px-1">
              <span>Qualidade do Streaming</span>
              <span className="text-[11px] text-rose-400 font-mono">1080p 60FPS</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPreset('1080p60')}
                className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center ${
                  selectedPreset === '1080p60'
                    ? 'bg-[#29101E] border-rose-600 text-white shadow-sm'
                    : 'bg-[#180A14] border-[#220F1D] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-xs font-semibold text-[#FAF7F2]">1080p 60FPS</span>
                <span className="text-[10px] text-rose-300">Ultra Fluido</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset('1080p30')}
                className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center ${
                  selectedPreset === '1080p30'
                    ? 'bg-[#29101E] border-rose-600 text-white shadow-sm'
                    : 'bg-[#180A14] border-[#220F1D] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-xs font-semibold text-[#FAF7F2]">1080p 30FPS</span>
                <span className="text-[10px] text-zinc-400">Cinematográfico</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset('720p60')}
                className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center ${
                  selectedPreset === '720p60'
                    ? 'bg-[#29101E] border-rose-600 text-white shadow-sm'
                    : 'bg-[#180A14] border-[#220F1D] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-xs font-semibold text-[#FAF7F2]">720p 60FPS</span>
                <span className="text-[10px] text-zinc-400">Econômico</span>
              </button>
            </div>

            {/* System Audio Toggle */}
            <div className="mt-3 pt-2.5 border-t border-[#220E1C] flex items-center justify-between text-xs px-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#D6D3CD]">
                <input
                  type="checkbox"
                  checked={withSystemAudio}
                  onChange={(e) => setWithSystemAudio(e.target.checked)}
                  className="rounded border-[#3E162D] bg-[#1A0A15] text-rose-600 focus:ring-0 cursor-pointer w-4 h-4"
                />
                <span>Transmitir áudio do filme / série</span>
              </label>
              <Volume2 className="w-3.5 h-3.5 text-rose-400" />
            </div>
          </div>

          {/* Big Cinematic Start Button */}
          <button
            onClick={handleLaunchShare}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#BE123C] via-[#E11D48] to-[#BE123C] hover:from-[#9F1239] hover:via-[#D11843] hover:to-[#9F1239] text-white font-semibold text-sm tracking-wide shadow-xl shadow-rose-950/60 hover:shadow-rose-700/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Iniciar Sessão de Cinema</span>
          </button>

          <span className="text-[11px] text-[#A8A29E] mt-3 flex items-center gap-1">
            Escolha a janela do navegador ou monitor onde o filme está sendo reproduzido.
          </span>
        </div>
      )}
    </div>
  );
}

// Floating camera overlay in corner
function FloatingCinemaCam({
  stream,
  participant,
}: {
  stream: MediaStream;
  participant?: Participant;
}) {
  const camVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (camVideoRef.current && stream) {
      camVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-36 h-24 rounded-xl overflow-hidden border border-[#2F1525] bg-[#120710] shadow-xl relative group">
      <video
        ref={camVideoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] text-white font-medium truncate max-w-[90%]">
        {participant?.name || 'Câmera'}
      </div>
    </div>
  );
}
