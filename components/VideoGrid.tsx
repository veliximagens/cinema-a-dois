'use client';

import React, { useRef, useEffect } from 'react';
import { Participant } from '@/types/nexora';
import { Mic, MicOff, Film, Crown } from 'lucide-react';

interface VideoGridProps {
  participants: Participant[];
  currentUserId: string;
  webcamStreams: Map<string, MediaStream>;
  screenStream: MediaStream | null;
  presenter: Participant | null;
}

export function VideoGrid({
  participants,
  currentUserId,
  webcamStreams,
  screenStream,
  presenter,
}: VideoGridProps) {
  return (
    <div className="flex-1 bg-[#050306] p-4 overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto h-full auto-rows-fr">
        {/* If screen stream active, show it as a cinema screen tile */}
        {screenStream && (
          <div className="sm:col-span-2 lg:col-span-2 rounded-2xl overflow-hidden border border-[#BE123C]/50 bg-black relative shadow-xl min-h-[240px] flex items-center justify-center">
            <ScreenTileStream stream={screenStream} />
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-xs font-semibold text-rose-300 flex items-center gap-1.5 border border-white/10">
              <Film className="w-3.5 h-3.5 text-rose-400" />
              <span>Filme de {presenter?.name || 'Apresentador'}</span>
            </div>
          </div>
        )}

        {/* Participant camera tiles */}
        {participants.map((user) => {
          const isMe = user.id === currentUserId;
          const stream = webcamStreams.get(user.id);

          return (
            <div
              key={user.id}
              className={`rounded-2xl overflow-hidden border bg-[#120810] relative flex flex-col items-center justify-center min-h-[200px] shadow-lg transition-all ${
                user.isSpeaking
                  ? 'border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                  : 'border-[#24111E]'
              }`}
            >
              {stream && user.isCamOn ? (
                <div className="w-full h-full relative">
                  <ParticipantCameraTile stream={stream} isMuted={isMe} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-xl"
                    style={{ backgroundColor: user.color || '#E11D48' }}
                  >
                    {user.avatar || '❤️'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-[#FAF7F2]">{user.name}</span>
                    {user.isHost && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                </div>
              )}

              {/* Bottom Badge inside tile */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                <div className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-medium text-[#FAF7F2] flex items-center gap-1.5 border border-white/5">
                  <span className="truncate max-w-[120px]">{user.name} {isMe ? '(Você)' : ''}</span>
                </div>
                <div className="p-1 rounded-lg bg-black/80 backdrop-blur-md text-zinc-300">
                  {user.isMuted ? (
                    <MicOff className="w-3.5 h-3.5 text-zinc-500" />
                  ) : (
                    <Mic className={`w-3.5 h-3.5 ${user.isSpeaking ? 'text-rose-400' : 'text-zinc-400'}`} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScreenTileStream({ stream }: { stream: MediaStream }) {
  const vRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (vRef.current && stream) {
      vRef.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={vRef} autoPlay playsInline muted className="w-full h-full object-contain" />;
}

function ParticipantCameraTile({ stream, isMuted }: { stream: MediaStream; isMuted: boolean }) {
  const vRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (vRef.current && stream) {
      vRef.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={vRef} autoPlay playsInline muted={isMuted} className="w-full h-full object-cover" />;
}
