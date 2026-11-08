'use client';

import React, { useEffect, useRef } from 'react';

interface RemoteAudioPlayerProps {
  stream: MediaStream;
  volume: number; // 0.0 to 1.0 (or higher)
  isDeafened?: boolean;
}

export function RemoteAudioPlayer({ stream, volume, isDeafened }: RemoteAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !stream) return;

    el.srcObject = stream;
    el.volume = isDeafened ? 0 : Math.max(0, Math.min(1, volume));

    const playPromise = el.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay may require user gesture on some browsers
        console.warn('Audio autoplay notice:', err?.name);
      });
    }

    return () => {
      el.srcObject = null;
    };
  }, [stream, volume, isDeafened]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      className="hidden"
      aria-hidden="true"
    />
  );
}
