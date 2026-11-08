'use client';

import React, { Suspense, useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChatMessage,
  IceServerConfig,
  Participant,
  RealtimeStats,
  RoomInfo,
  ScreenQualityConfig,
  SignalingMessage,
} from '@/types/nexora';
import {
  DEFAULT_PARTICIPANT,
  subscribeParticipant,
  getLocalParticipantSnapshot,
  saveLocalParticipant,
} from '@/lib/identity';
import { DEFAULT_ICE_SERVERS, CinemaWebRTCClient } from '@/lib/webrtc-client';
import { Header } from '@/components/Header';
import { ParticipantsSidebar } from '@/components/ParticipantsSidebar';
import { ScreenTheater } from '@/components/ScreenTheater';
import { VideoGrid } from '@/components/VideoGrid';
import { RightPanel } from '@/components/RightPanel';
import { ControlBar } from '@/components/ControlBar';
import { CreateRoomModal } from '@/components/modals/CreateRoomModal';
import { JoinRoomModal } from '@/components/modals/JoinRoomModal';
import { InviteModal } from '@/components/modals/InviteModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { RemoteAudioPlayer } from '@/components/RemoteAudioPlayer';
import { RoomEntryGate } from '@/components/RoomEntryGate';
import { Heart, AlertCircle, X } from 'lucide-react';

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function CinemaADoisApp() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isClient = useIsClient();
  const initialRoomId = searchParams.get('room') || 'geral';
  const inviteToken = searchParams.get('invite');

  const [roomId, setRoomId] = useState<string>(initialRoomId);
  const [hasEnteredGate, setHasEnteredGate] = useState<boolean>(!inviteToken);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const currentParticipant = useSyncExternalStore(
    subscribeParticipant,
    getLocalParticipantSnapshot,
    () => DEFAULT_PARTICIPANT
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [webcamStreams, setWebcamStreams] = useState<Map<string, MediaStream>>(new Map());
  const [remoteAudioStreams, setRemoteAudioStreams] = useState<Map<string, MediaStream>>(new Map());
  const [stats, setStats] = useState<RealtimeStats>({
    resolution: '1080p (Standby)',
    fps: 0,
    bitrateKbps: 0,
    packetLoss: 0,
    rttMs: 14,
    codec: 'VP9',
    connectionState: 'idle',
  });
  const [viewMode, setViewMode] = useState<'theater' | 'grid'>('theater');
  const [screenConfig, setScreenConfig] = useState<ScreenQualityConfig>({
    resolution: '1080p',
    frameRate: 60,
    withAudio: true,
  });
  const [customIceServers, setCustomIceServers] = useState<IceServerConfig[]>(DEFAULT_ICE_SERVERS);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // WebRTC Client reference
  const rtcClientRef = useRef<CinemaWebRTCClient | null>(null);

  // Presenter user
  const presenter = participants.find((p) => p.isSharingScreen) || null;
  const isLocalPresenter = currentParticipant.isSharingScreen;

  // Toggle Microphone
  const handleToggleMic = useCallback(async (forceMute?: boolean) => {
    const shouldMute = forceMute !== undefined ? forceMute : !currentParticipant.isMuted;
    if (!rtcClientRef.current) return;

    const res = await rtcClientRef.current.toggleMicrophone(!shouldMute);

    if (!res.success && !shouldMute) {
      setAudioError(res.error || 'Não foi possível acessar o microfone. Verifique as permissões do navegador.');
      const timer = setTimeout(() => setAudioError(null), 6000);
      return () => clearTimeout(timer);
    } else {
      setAudioError(null);
    }

    const actuallyMuted = !res.enabled;
    const updated: Participant = {
      ...currentParticipant,
      isMuted: actuallyMuted,
      isSpeaking: false,
    };
    saveLocalParticipant(updated);

    setParticipants((prev) =>
      prev.map((p) => (p.id === currentParticipant.id ? updated : p))
    );

    rtcClientRef.current.sendSignal('state_update', { participant: updated });
  }, [currentParticipant]);

  // Start Screen Sharing
  const handleStartScreenShare = async (config: ScreenQualityConfig) => {
    if (!rtcClientRef.current) return;
    try {
      const stream = await rtcClientRef.current.startScreenShare(config);
      setScreenStream(stream);

      const updatedParticipant: Participant = {
        ...currentParticipant,
        isSharingScreen: true,
      };
      saveLocalParticipant(updatedParticipant);

      setParticipants((prev) =>
        prev.map((p) => (p.id === currentParticipant.id ? updatedParticipant : p))
      );

      rtcClientRef.current.sendSignal('screen_started', {
        presenterName: currentParticipant.name,
        config,
      });
    } catch (err) {
      console.warn('Screen share canceled or denied:', err);
    }
  };

  // Stop Screen Sharing
  const handleStopScreenShare = () => {
    if (!rtcClientRef.current) return;
    rtcClientRef.current.stopScreenShare();
    setScreenStream(null);

    const updatedParticipant: Participant = {
      ...currentParticipant,
      isSharingScreen: false,
    };
    saveLocalParticipant(updatedParticipant);

    setParticipants((prev) =>
      prev.map((p) => (p.id === currentParticipant.id ? updatedParticipant : p))
    );

    rtcClientRef.current.sendSignal('screen_stopped', {
      presenterName: currentParticipant.name,
    });
  };

  // Handle incoming signaling messages
  const handleIncomingSignal = useCallback(
    (msg: SignalingMessage) => {
      const { type, payload, senderId } = msg;

      switch (type) {
        case 'participant_joined': {
          if (payload?.participant) {
            setParticipants((prev) => {
              if (prev.some((p) => p.id === payload.participant.id)) return prev;
              return [...prev, payload.participant];
            });
          }
          break;
        }

        case 'participant_left': {
          setParticipants((prev) => prev.filter((p) => p.id !== senderId));
          setWebcamStreams((prev) => {
            const next = new Map(prev);
            next.delete(senderId);
            return next;
          });
          break;
        }

        case 'chat': {
          if (payload?.message) {
            setMessages((prev) => [...prev, payload.message]);
          }
          break;
        }

        case 'state_update': {
          if (payload?.participant) {
            setParticipants((prev) =>
              prev.map((p) => (p.id === payload.participant.id ? payload.participant : p))
            );
          }
          break;
        }

        case 'screen_started': {
          setParticipants((prev) =>
            prev.map((p) => (p.id === senderId ? { ...p, isSharingScreen: true } : p))
          );
          break;
        }

        case 'screen_stopped': {
          setParticipants((prev) =>
            prev.map((p) => (p.id === senderId ? { ...p, isSharingScreen: false } : p))
          );
          setScreenStream((curr) => {
            if (curr && !isLocalPresenter) {
              return null;
            }
            return curr;
          });
          break;
        }

        case 'kick': {
          if (msg.targetId === currentParticipant.id) {
            alert('Você foi desconectado da sala pelo administrador.');
            router.push('/?room=geral');
            setRoomId('geral');
          }
          break;
        }

        case 'room_closed': {
          alert(payload?.message || 'A sessão de cinema foi encerrada pelo anfitrião.');
          router.push('/?room=geral');
          setRoomId('geral');
          break;
        }

        case 'mute_remote': {
          if (msg.targetId === currentParticipant.id) {
            handleToggleMic(true);
          }
          break;
        }
      }
    },
    [currentParticipant.id, isLocalPresenter, router, handleToggleMic]
  );

  const handleIncomingSignalRef = useRef(handleIncomingSignal);
  useEffect(() => {
    handleIncomingSignalRef.current = handleIncomingSignal;
  }, [handleIncomingSignal]);

  // Initialize and join room
  useEffect(() => {
    if (!isClient) return;
    let client: CinemaWebRTCClient | null = null;
    let isMounted = true;

    async function initRoom() {
      // 1. Fetch room details
      try {
        const res = await fetch(`/api/signaling/rooms?id=${encodeURIComponent(roomId)}`);
        const data = await res.json();
        if (data.room && isMounted) {
          setRoomInfo(data.room);
        }
      } catch {
        // ignore
      }

      // 2. Initialize WebRTC Client
      client = new CinemaWebRTCClient(
        roomId,
        currentParticipant.id,
        {
          onRemoteStream: (peerId, stream, type) => {
            if (!isMounted) return;
            if (type === 'audio') {
              setRemoteAudioStreams((prev) => {
                const next = new Map(prev);
                next.set(peerId, stream);
                return next;
              });
            } else if (type === 'screen') {
              setScreenStream(stream);
              setParticipants((prev) =>
                prev.map((p) => (p.id === peerId ? { ...p, isSharingScreen: true } : p))
              );
            } else if (type === 'camera') {
              setWebcamStreams((prev) => {
                const next = new Map(prev);
                next.set(peerId, stream);
                return next;
              });
              setParticipants((prev) =>
                prev.map((p) => (p.id === peerId ? { ...p, isCamOn: true } : p))
              );
            }
          },
          onRemoteStreamRemoved: (peerId) => {
            if (!isMounted) return;
            setRemoteAudioStreams((prev) => {
              const next = new Map(prev);
              next.delete(peerId);
              return next;
            });
            setWebcamStreams((prev) => {
              const next = new Map(prev);
              next.delete(peerId);
              return next;
            });
            setParticipants((prev) =>
              prev.map((p) => (p.id === peerId ? { ...p, isSharingScreen: false, isCamOn: false } : p))
            );
            // If the removed stream was the screen share, clear screenStream
            setScreenStream((curr) => {
              return curr;
            });
          },
          onStatsUpdate: (newStats) => {
            if (isMounted) setStats(newStats);
          },
          onSpeakingChange: (speaking) => {
            if (!isMounted) return;
            const updated = { ...currentParticipant, isSpeaking: speaking };
            saveLocalParticipant(updated);
            client?.sendSignal('state_update', { participant: updated });
            setParticipants((prev) =>
              prev.map((p) => (p.id === currentParticipant.id ? { ...p, isSpeaking: speaking } : p))
            );
          },
          onSignalingStateChange: (state) => {
            if (isMounted) {
              setStats((prev) => ({
                ...prev,
                connectionState: state === 'connected' ? 'connected' : 'checking',
              }));
            }
          },
          onSignalReceived: (msg: SignalingMessage) => {
            if (!isMounted) return;
            handleIncomingSignalRef.current(msg);
          },
        },
        customIceServers
      );

      rtcClientRef.current = client;
      client.initSignaling();

      // 3. Register peer in the room
      try {
        const joinRes = await client.sendSignal('join', {
          participant: currentParticipant,
        });
        if (joinRes && joinRes.participants && isMounted) {
          setParticipants(joinRes.participants);
        }
        if (joinRes && joinRes.messages && isMounted) {
          setMessages(joinRes.messages);
        }
        if (joinRes && joinRes.roomInfo && isMounted) {
          setRoomInfo(joinRes.roomInfo);
        }
      } catch (err) {
        console.warn('Error joining room:', err);
      }
    }

    initRoom();

    return () => {
      isMounted = false;
      if (client) {
        client.sendSignal('leave', { name: currentParticipant.name });
        client.destroy();
      }
      rtcClientRef.current = null;
    };
  }, [isClient, roomId, currentParticipant, customIceServers]);

  // Toggle Deafen
  const handleToggleDeafen = () => {
    const shouldDeafen = !currentParticipant.isDeafened;
    const updated: Participant = {
      ...currentParticipant,
      isDeafened: shouldDeafen,
      isMuted: shouldDeafen ? true : currentParticipant.isMuted,
    };
    saveLocalParticipant(updated);

    setParticipants((prev) =>
      prev.map((p) => (p.id === currentParticipant.id ? updated : p))
    );

    rtcClientRef.current?.sendSignal('state_update', { participant: updated });
  };

  // Toggle Camera
  const handleToggleCamera = async () => {
    const shouldCamOn = !currentParticipant.isCamOn;
    if (!rtcClientRef.current) return;

    const stream = await rtcClientRef.current.toggleCamera(shouldCamOn);
    if (shouldCamOn && stream) {
      setWebcamStreams((prev) => {
        const next = new Map(prev);
        next.set(currentParticipant.id, stream);
        return next;
      });
    } else {
      setWebcamStreams((prev) => {
        const next = new Map(prev);
        next.delete(currentParticipant.id);
        return next;
      });
    }

    const updated: Participant = {
      ...currentParticipant,
      isCamOn: shouldCamOn,
    };
    saveLocalParticipant(updated);

    setParticipants((prev) =>
      prev.map((p) => (p.id === currentParticipant.id ? updated : p))
    );

    rtcClientRef.current.sendSignal('state_update', { participant: updated });
  };

  // Send Chat Message
  const handleSendMessage = (text: string) => {
    const msg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      roomId,
      senderId: currentParticipant.id,
      senderName: currentParticipant.name,
      senderAvatar: currentParticipant.avatar,
      senderColor: currentParticipant.color,
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, msg]);
    rtcClientRef.current?.sendSignal('chat', { message: msg });
  };

  // Update participant profile
  const handleUpdateParticipant = (changes: Partial<Participant>) => {
    const updated = { ...currentParticipant, ...changes };
    saveLocalParticipant(updated);
    setParticipants((prev) =>
      prev.map((p) => (p.id === currentParticipant.id ? updated : p))
    );
    rtcClientRef.current?.sendSignal('state_update', { participant: updated });
  };

  // Participant Volume adjustment
  const handleUpdateVolume = (participantId: string, volume: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, volume } : p))
    );
  };

  // Admin Kick Participant
  const handleKickParticipant = (participantId: string) => {
    if (!currentParticipant.isHost) return;
    rtcClientRef.current?.sendSignal('kick', {}, participantId);
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
  };

  // Admin Remote Mute
  const handleRemoteMute = (participantId: string) => {
    if (!currentParticipant.isHost) return;
    rtcClientRef.current?.sendSignal('mute_remote', {}, participantId);
  };

  // Room Creation
  const handleCreateRoom = async (newRoom: Partial<RoomInfo>) => {
    try {
      const res = await fetch('/api/signaling/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRoom,
          createdBy: currentParticipant.id,
          createdByName: currentParticipant.name,
        }),
      });
      const data = await res.json();
      if (data.room) {
        setRoomId(data.room.id);
        router.push(`/?room=${data.room.id}`);
      }
    } catch {
      // ignore
    }
  };

  // Join Room
  const handleJoinRoom = (targetRoomId: string) => {
    setRoomId(targetRoomId);
    router.push(`/?room=${targetRoomId}`);
  };

  // Leave Room
  const handleLeaveRoom = () => {
    if (roomId === 'geral') {
      // If already in lounge, restart clean state
      window.location.reload();
    } else {
      router.push('/?room=geral');
      setRoomId('geral');
    }
  };

  // End Room for all participants
  const handleEndRoom = async () => {
    if (!roomInfo?.id || roomInfo.id === 'geral') return;
    try {
      await fetch('/api/signaling/rooms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomInfo.id,
          peerId: currentParticipant.id,
        }),
      });
      router.push('/?room=geral');
      setRoomId('geral');
    } catch {
      // ignore
    }
  };

  if (!isClient) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#070508] text-stone-200 select-none">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#140810] border border-[#2b121e] flex items-center justify-center shadow-2xl">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500 animate-pulse" />
          </div>
        </div>
        <span className="text-sm font-semibold tracking-wide text-stone-200">Cinema a Dois ❤️</span>
        <span className="text-xs text-stone-400 mt-1">Prepare a pipoca, escolha o filme e aproveite juntos.</span>
      </div>
    );
  }

  // Pre-session Invite Lobby / Gate
  if (!hasEnteredGate && inviteToken) {
    return (
      <RoomEntryGate
        roomId={roomId}
        inviteToken={inviteToken}
        currentParticipant={currentParticipant}
        onJoinSuccess={(configured) => {
          saveLocalParticipant(configured);
          setHasEnteredGate(true);
        }}
        onGoToGeneral={() => {
          router.push('/?room=geral');
          setRoomId('geral');
          setHasEnteredGate(true);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070508] text-stone-100 relative">
      {/* Toast Alert for Microphone / System Audio */}
      {audioError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#1c0a14] border border-rose-800/80 text-rose-200 text-xs shadow-2xl backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{audioError}</span>
          <button
            onClick={() => setAudioError(null)}
            className="p-1 text-rose-400 hover:text-white rounded-md hover:bg-rose-900/50 cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER */}
      <Header
        roomInfo={roomInfo}
        participantCount={participants.length}
        stats={stats}
        currentParticipant={currentParticipant}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === 'theater' ? 'grid' : 'theater')}
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRoomModal={() => setIsJoinOpen(true)}
      />

      {/* 2. BODY SPLIT: LEFT SIDEBAR + CENTRAL SCREEN + RIGHT CHAT/INFO */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Participants Sidebar */}
        <ParticipantsSidebar
          participants={participants}
          currentUserId={currentParticipant.id}
          isHost={currentParticipant.isHost}
          onUpdateVolume={handleUpdateVolume}
          onKickParticipant={handleKickParticipant}
          onMuteParticipant={handleRemoteMute}
        />

        {/* Center Main Stage (Screen Theater or Video Grid) */}
        {viewMode === 'theater' ? (
          <ScreenTheater
            screenStream={screenStream}
            presenter={presenter}
            isLocalPresenter={isLocalPresenter}
            stats={stats}
            screenConfig={screenConfig}
            onStartScreenShare={handleStartScreenShare}
            onStopScreenShare={handleStopScreenShare}
            webcamStreams={webcamStreams}
            participants={participants}
          />
        ) : (
          <VideoGrid
            participants={participants}
            currentUserId={currentParticipant.id}
            webcamStreams={webcamStreams}
            screenStream={screenStream}
            presenter={presenter}
          />
        )}

        {/* Right Panel: Chat & Room Details */}
        <RightPanel
          roomInfo={roomInfo}
          participants={participants}
          messages={messages}
          currentParticipant={currentParticipant}
          onSendMessage={handleSendMessage}
          onKickParticipant={handleKickParticipant}
          onMuteParticipant={handleRemoteMute}
        />
      </div>

      {/* 3. BOTTOM CONTROL DOCK */}
      <ControlBar
        currentParticipant={currentParticipant}
        isSharingScreen={isLocalPresenter}
        onToggleMic={handleToggleMic}
        onToggleDeafen={handleToggleDeafen}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={
          isLocalPresenter ? handleStopScreenShare : () => handleStartScreenShare(screenConfig)
        }
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLeaveRoom={handleLeaveRoom}
        screenConfig={screenConfig}
        onChangeScreenConfig={setScreenConfig}
      />

      {/* REMOTE AUDIO PLAYBACK (Plays voices of other participants) */}
      {Array.from(remoteAudioStreams.entries()).map(([peerId, stream]) => {
        const p = participants.find((item) => item.id === peerId);
        const vol = (p?.volume ?? 100) / 100;
        return (
          <RemoteAudioPlayer
            key={peerId}
            stream={stream}
            volume={vol}
            isDeafened={currentParticipant.isDeafened}
          />
        );
      })}

      {/* MODALS */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoin={handleJoinRoom}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomInfo={roomInfo}
        currentParticipant={currentParticipant}
        onEndRoom={handleEndRoom}
        onUpdateMaxParticipants={(max) => {
          if (roomInfo) {
            setRoomInfo({ ...roomInfo, maxParticipants: max });
          }
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentParticipant={currentParticipant}
        onUpdateParticipant={handleUpdateParticipant}
        screenConfig={screenConfig}
        onUpdateScreenConfig={setScreenConfig}
        customIceServers={customIceServers}
        onUpdateIceServers={setCustomIceServers}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#070508] text-stone-200">
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#140810] border border-[#2b121e] flex items-center justify-center shadow-2xl">
              <Heart className="w-7 h-7 text-rose-500 fill-rose-500 animate-pulse" />
            </div>
          </div>
          <span className="text-sm font-semibold tracking-wide text-stone-200">Cinema a Dois ❤️</span>
          <span className="text-xs text-stone-400 mt-1">Prepare a pipoca, escolha o filme e aproveite juntos.</span>
        </div>
      }
    >
      <CinemaADoisApp />
    </Suspense>
  );
}
