'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  Video,
  Tv,
  Network,
  User,
  Volume2,
  Check,
  Shield,
  Sparkles,
  Heart,
} from 'lucide-react';
import { IceServerConfig, Participant, ScreenQualityConfig } from '@/types/nexora';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParticipant: Participant;
  onUpdateParticipant: (updated: Partial<Participant>) => void;
  screenConfig: ScreenQualityConfig;
  onUpdateScreenConfig: (config: ScreenQualityConfig) => void;
  customIceServers: IceServerConfig[];
  onUpdateIceServers: (servers: IceServerConfig[]) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  currentParticipant,
  onUpdateParticipant,
  screenConfig,
  onUpdateScreenConfig,
  customIceServers,
  onUpdateIceServers,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'screen' | 'audio' | 'video' | 'network'>('profile');

  // Media Devices
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('');

  // Mic test level
  const [micLevel, setMicLevel] = useState<number>(0);
  const [isTestingMic, setIsTestingMic] = useState(false);

  // Profile
  const [userName, setUserName] = useState(currentParticipant.name);
  const [userColor, setUserColor] = useState(currentParticipant.color);

  // TURN server inputs
  const [turnUrl, setTurnUrl] = useState('');
  const [turnUsername, setTurnUsername] = useState('');
  const [turnCredential, setTurnCredential] = useState('');

  // Enumerate devices when modal opens
  useEffect(() => {
    if (isOpen) {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices
          .enumerateDevices()
          .then((devices) => {
            const aInputs = devices.filter((d) => d.kind === 'audioinput');
            const aOutputs = devices.filter((d) => d.kind === 'audiooutput');
            const vInputs = devices.filter((d) => d.kind === 'videoinput');
            setAudioInputs(aInputs);
            setAudioOutputs(aOutputs);
            setVideoInputs(vInputs);
            if (aInputs[0]) setSelectedAudioInput((prev) => prev || aInputs[0].deviceId);
            if (aOutputs[0]) setSelectedAudioOutput((prev) => prev || aOutputs[0].deviceId);
            if (vInputs[0]) setSelectedVideoInput((prev) => prev || vInputs[0].deviceId);
          })
          .catch((err) => console.warn('Could not enumerate devices:', err));
      }
    }
  }, [isOpen]);

  // Test Mic Audio
  useEffect(() => {
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let interval: NodeJS.Timeout | null = null;

    if (isTestingMic && isOpen) {
      navigator.mediaDevices
        .getUserMedia({
          audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true,
        })
        .then((s) => {
          stream = s;
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtx = new AudioContextClass();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          interval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
          }, 100);
        })
        .catch(() => {
          setIsTestingMic(false);
        });
    }

    return () => {
      setMicLevel(0);
      if (interval) clearInterval(interval);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [isTestingMic, selectedAudioInput, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = userName.trim().substring(0, 2).toUpperCase() || 'CP';
    onUpdateParticipant({
      name: userName.trim() || 'Cineasta',
      avatar: initials,
      color: userColor,
    });
    onClose();
  };

  const handleAddTurn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnUrl) return;
    const newConfig: IceServerConfig = {
      urls: turnUrl,
      username: turnUsername || undefined,
      credential: turnCredential || undefined,
    };
    onUpdateIceServers([...customIceServers, newConfig]);
    setTurnUrl('');
    setTurnUsername('');
    setTurnCredential('');
  };

  const COLOR_PALETTE = [
    '#E11D48', // Velvet Crimson
    '#BE123C', // Deep Rose
    '#9F1239', // Dark Wine
    '#881337', // Black Cherry
    '#FB7185', // Soft Rose
    '#7C2D12', // Warm Amber
    '#4C1D95', // Royal Plum
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0c070c] border border-[#2b1320] shadow-2xl flex flex-col md:flex-row h-[560px] overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
        {/* Left Tabs */}
        <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-[#26111d] bg-[#080408] p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-3 mb-2">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300">
              Configurações
            </span>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#220d19] text-rose-200 border border-rose-900/60 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#160811]'
            }`}
          >
            <User className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Perfil & Identidade</span>
          </button>

          <button
            onClick={() => setActiveTab('screen')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'screen'
                ? 'bg-[#220d19] text-rose-200 border border-rose-900/60 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#160811]'
            }`}
          >
            <Tv className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Transmissão de Vídeo</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-[#220d19] text-rose-200 border border-rose-900/60 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#160811]'
            }`}
          >
            <Mic className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Áudio & Microfone</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-[#220d19] text-rose-200 border border-rose-900/60 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#160811]'
            }`}
          >
            <Video className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Câmera</span>
          </button>

          <button
            onClick={() => setActiveTab('network')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'network'
                ? 'bg-[#220d19] text-rose-200 border border-rose-900/60 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-[#160811]'
            }`}
          >
            <Network className="w-4 h-4 text-stone-400 shrink-0" />
            <span>Rede & STUN/TURN</span>
          </button>
        </div>

        {/* Right Tab Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0c070c]">
          {/* Header */}
          <div className="p-4 border-b border-[#26111d] flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-200 tracking-wider">
              {activeTab === 'profile' && 'Perfil do Participante'}
              {activeTab === 'screen' && 'Qualidade de Transmissão do Cinema (Até 1080p 60FPS)'}
              {activeTab === 'audio' && 'Dispositivos de Áudio e Teste de Voz'}
              {activeTab === 'video' && 'Dispositivos de Câmera'}
              {activeTab === 'network' && 'Conectividade WebRTC P2P (STUN / TURN)'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-[#220e1a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#140912] border border-[#2b1320]">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md border border-white/10"
                    style={{ backgroundColor: userColor }}
                  >
                    {userName.substring(0, 2).toUpperCase() || 'CP'}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-stone-300 mb-1">
                      Seu Nome na Sessão
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Ex: Amor, Meu Bem, Cineasta..."
                      className="w-full bg-[#1b0d18] border border-[#381a2b] focus:border-rose-500 focus:outline-none rounded-xl px-3 py-2 text-xs text-stone-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-2">
                    Cor do seu Avatar
                  </label>
                  <div className="flex items-center gap-2.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setUserColor(c)}
                        className={`w-8 h-8 rounded-xl transition-transform cursor-pointer relative flex items-center justify-center ${
                          userColor === c ? 'scale-110 ring-2 ring-rose-400 shadow-lg' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {userColor === c && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            )}

            {/* SCREEN TAB */}
            {activeTab === 'screen' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#140912] border border-[#2b1320]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 mb-1">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    Transmissão de Cinema em Alta Fidelidade
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    O Cinema a Dois utiliza a API nativa <code className="text-rose-300">getDisplayMedia</code> com WebRTC P2P de ultrabaixa latência para sincronizar filmes, séries e vídeos em alta resolução até 60 frames por segundo em Full HD.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Taxa de Quadros Padrão (FPS)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => onUpdateScreenConfig({ ...screenConfig, frameRate: 60 })}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        screenConfig.frameRate === 60
                          ? 'bg-[#260e1d] border-rose-500 text-white shadow-md'
                          : 'bg-[#150913] border-[#291220] text-stone-400'
                      }`}
                    >
                      <div className="font-semibold text-xs text-rose-200">60 FPS (Cinematográfico Fluido)</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">Ideal para filmes, cenas de ação e animações</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateScreenConfig({ ...screenConfig, frameRate: 30 })}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        screenConfig.frameRate === 30
                          ? 'bg-[#260e1d] border-rose-500 text-white shadow-md'
                          : 'bg-[#150913] border-[#291220] text-stone-400'
                      }`}
                    >
                      <div className="font-semibold text-xs text-rose-200">30 FPS (Padrão de Cinema)</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">Ideal para conexões mais lentas ou séries</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Resolução Desejada
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1080p', '720p', '4k'] as const).map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => onUpdateScreenConfig({ ...screenConfig, resolution: res })}
                        className={`py-2 px-3 rounded-xl border text-center uppercase font-mono font-medium text-xs cursor-pointer ${
                          screenConfig.resolution === res
                            ? 'bg-[#280f1e] border-rose-500 text-rose-100'
                            : 'bg-[#150913] border-[#291220] text-stone-400'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                    <input
                      type="checkbox"
                      checked={screenConfig.withAudio}
                      onChange={(e) => onUpdateScreenConfig({ ...screenConfig, withAudio: e.target.checked })}
                      className="rounded border-[#381a2b] bg-[#1a0c17] text-rose-600 focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <span className="text-xs font-normal">Transmitir áudio do filme/sistema por padrão</span>
                  </label>
                </div>
              </div>
            )}

            {/* AUDIO TAB */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Dispositivo de Entrada (Microfone)
                  </label>
                  <select
                    value={selectedAudioInput}
                    onChange={(e) => setSelectedAudioInput(e.target.value)}
                    className="w-full bg-[#170b14] border border-[#311624] rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none"
                  >
                    {audioInputs.length === 0 && <option value="">Microfone Padrão do Sistema</option>}
                    {audioInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microfone (${d.deviceId.substring(0, 5)})`}
                      </option>
                    ))}
                  </select>
                </div>

                {audioOutputs.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1.5">
                      Dispositivo de Saída (Fones / Caixas de Som)
                    </label>
                    <select
                      value={selectedAudioOutput}
                      onChange={(e) => setSelectedAudioOutput(e.target.value)}
                      className="w-full bg-[#170b14] border border-[#311624] rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none"
                    >
                      {audioOutputs.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Saída de Áudio (${d.deviceId.substring(0, 5)})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Mic Test Gauge */}
                <div className="p-4 rounded-xl bg-[#140912] border border-[#2b1320] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-stone-200">
                      <Volume2 className="w-4 h-4 text-rose-400" />
                      <span>Teste de Sensibilidade do Microfone</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTestingMic(!isTestingMic)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        isTestingMic
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          : 'bg-[#220d19] text-rose-300 border border-rose-900/60 hover:bg-[#2b1121]'
                      }`}
                    >
                      {isTestingMic ? 'Parar Teste' : 'Testar Minha Voz'}
                    </button>
                  </div>

                  {/* Level meter bar */}
                  <div className="w-full h-2.5 rounded-full bg-[#0a0509] overflow-hidden p-0.5 border border-[#26111d]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-rose-400 to-rose-600 transition-all duration-75"
                      style={{ width: `${micLevel}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-400 flex items-center justify-between">
                    <span>Fale normalmente para conferir a resposta do microfone.</span>
                    <span className="font-mono text-rose-300">{micLevel}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* VIDEO TAB */}
            {activeTab === 'video' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Dispositivo de Câmera (Webcam)
                  </label>
                  <select
                    value={selectedVideoInput}
                    onChange={(e) => setSelectedVideoInput(e.target.value)}
                    className="w-full bg-[#170b14] border border-[#311624] rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none"
                  >
                    {videoInputs.length === 0 && <option value="">Câmera Padrão do Sistema</option>}
                    {videoInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Câmera (${d.deviceId.substring(0, 5)})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-[#140912] border border-[#2b1320] text-xs text-stone-400 space-y-1.5">
                  <div className="font-medium text-stone-200">Resolução da Webcam</div>
                  <p>Otimizada para 720p HD com controle suave de taxa de bits WebRTC adaptativo durante a exibição do filme.</p>
                </div>
              </div>
            )}

            {/* NETWORK / STUN / TURN TAB */}
            {activeTab === 'network' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#140912] border border-[#2b1320] text-xs text-stone-400 space-y-1">
                  <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-rose-400" /> Servidores STUN Ativos
                  </div>
                  <p>
                    A plataforma já utiliza os servidores STUN do Google (<code className="text-rose-300 font-mono">stun.l.google.com:19302</code>) por padrão para transposição NAT ponto a ponto direta.
                  </p>
                </div>

                {/* Custom TURN for restricted networks */}
                <form onSubmit={handleAddTurn} className="space-y-3">
                  <div className="font-medium text-xs text-stone-200">
                    Adicionar Servidor TURN (Opcional, para redes restritas)
                  </div>

                  <div>
                    <input
                      type="text"
                      value={turnUrl}
                      onChange={(e) => setTurnUrl(e.target.value)}
                      placeholder="turn:seu-servidor-turn.com:3478"
                      className="w-full bg-[#170b14] border border-[#311624] rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={turnUsername}
                      onChange={(e) => setTurnUsername(e.target.value)}
                      placeholder="Usuário TURN (opcional)"
                      className="bg-[#170b14] border border-[#311624] rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600"
                    />
                    <input
                      type="password"
                      value={turnCredential}
                      onChange={(e) => setTurnCredential(e.target.value)}
                      placeholder="Credencial / Senha (opcional)"
                      className="bg-[#170b14] border border-[#311624] rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!turnUrl}
                    className="py-2 px-3 rounded-xl bg-rose-700 disabled:opacity-40 hover:bg-rose-600 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Adicionar Servidor TURN
                  </button>
                </form>

                {customIceServers.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="text-[11px] font-medium text-stone-400">Servidores Configurados:</div>
                    {customIceServers.map((srv, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-[#140912] text-[11px] font-mono text-rose-300">
                        {Array.isArray(srv.urls) ? srv.urls.join(', ') : srv.urls}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
