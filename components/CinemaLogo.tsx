'use client';

import React from 'react';

interface CinemaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export function CinemaLogo({ className = '', size = 'md', showSubtitle = true }: CinemaLogoProps) {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-8 h-8';
  const titleSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Cinematic Heart + Play Glyph */}
      <div className={`relative ${iconSize} shrink-0 flex items-center justify-center`}>
        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#E11D48] via-[#BE123C] to-[#881337] p-[1.5px] shadow-[0_0_15px_rgba(225,29,72,0.25)] flex items-center justify-center">
          <div className="w-full h-full bg-[#12080E] rounded-[10px] flex items-center justify-center relative overflow-hidden group">
            {/* Delicate Heart Silhouette with Play center */}
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-[#FB7185] transition-transform duration-300 group-hover:scale-110"
              fill="currentColor"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {/* Inset Play Triangle */}
            <div className="absolute inset-0 flex items-center justify-center pl-0.5">
              <svg
                viewBox="0 0 24 24"
                className="w-2.5 h-2.5 text-[#12080E] fill-current"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </div>
        </div>
        {/* Subtle breathing live pulse */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`${titleSize} font-bold tracking-tight text-[#FAF7F2] font-sans`}>
            Cinema a Dois
          </span>
          <span className="text-rose-500 text-xs transition-transform duration-200 hover:scale-125 inline-block">
            ❤️
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] text-[#A8A29E] font-medium tracking-wider uppercase mt-0.5">
            Sessão Particular
          </span>
        )}
      </div>
    </div>
  );
}
