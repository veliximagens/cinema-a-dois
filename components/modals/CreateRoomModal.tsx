'use client';

import React, { useState } from 'react';
import { X, Lock, Globe, Film, Heart, Sparkles, Popcorn } from 'lucide-react';
import { RoomInfo } from '@/types/nexora';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (room: Partial<RoomInfo>) => void;
}

const CINEMA_THEMES = [
  { id: 'classic', label: 'Cinema Clássico', icon: '🎬' },
  { id: 'romantic', label: 'Noite Romântica', icon: '🍷' },
  { id: 'popcorn', label: 'Sessão Pipoca', icon: '🍿' },
  { id: 'stars', label: 'Sob as Estrelas', icon: '✨' },
];

export function CreateRoomModal({ isOpen, onClose, onCreate }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [selectedTheme, setSelectedTheme] = useState('romantic');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = (roomId || name).toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    onCreate({
      id: finalId || 'sessao-' + Math.random().toString(36).substring(2, 7),
      name: name || 'Nossa Sessão de Cinema ❤️',
      isPrivate,
      password: isPrivate && password ? password : undefined,
      maxParticipants,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#0F080F] border border-[#2D1426] p-6 shadow-2xl relative select-none animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-[#1E0E1B] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#BE123C] to-[#E11D48] p-[1.5px]">
            <div className="w-full h-full bg-[#140810] rounded-[14px] flex items-center justify-center text-rose-400">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-[#FAF7F2]">Criar Nova Sessão</h2>
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            </div>
            <p className="text-xs text-[#A8A29E]">Crie uma sala particular de cinema a dois</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#D6D3CD] mb-1.5">
              Nome da Sala
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!roomId) {
                  setRoomId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'));
                }
              }}
              placeholder="Ex: Sessão de Domingo, Noite de Terror..."
              className="w-full bg-[#170B14] border border-[#2B1425] focus:border-rose-600 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500"
            />
          </div>

          {/* Theme selector */}
          <div>
            <label className="block text-xs font-semibold text-[#D6D3CD] mb-1.5">
              Tema da Sessão
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CINEMA_THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setSelectedTheme(th.id)}
                  className={`py-2 px-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                    selectedTheme === th.id
                      ? 'bg-[#26101E] border-rose-600 text-white shadow-sm'
                      : 'bg-[#150A12] border-[#220E1D] text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="text-base">{th.icon}</span>
                  <span className="font-medium">{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D6D3CD] mb-1.5">
              Identificador da Sala
            </label>
            <div className="flex items-center rounded-xl bg-[#170B14] border border-[#2B1425] px-3.5 py-2.5 text-xs">
              <span className="text-zinc-500 font-mono">cinemaadois/#</span>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                placeholder="nossa-sessao"
                className="bg-transparent border-none focus:outline-none text-rose-300 font-mono flex-1 ml-1"
              />
            </div>
          </div>

          {/* Privacy Switch */}
          <div className="p-3.5 rounded-2xl bg-[#140810] border border-[#26101F] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPrivate ? <Lock className="w-4 h-4 text-rose-400" /> : <Globe className="w-4 h-4 text-zinc-400" />}
                <div>
                  <div className="text-xs font-bold text-white">
                    {isPrivate ? 'Sala Privada (Exclusiva para Conidados)' : 'Sala Aberta'}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {isPrivate ? 'Apenas quem possuir o link ou código entra' : 'Visível na lista de salas'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isPrivate ? 'bg-[#BE123C]' : 'bg-[#261220]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    isPrivate ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {isPrivate && (
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Senha de Acesso (Opcional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Deixe em branco para sem senha"
                  className="w-full bg-[#1A0C16] border border-[#2C1426] focus:border-rose-600 focus:outline-none rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            )}
          </div>

          {/* Max Participants (Couples: 2, Friends: 4, Group: 10) */}
          <div>
            <label className="block text-xs font-semibold text-[#D6D3CD] mb-1.5 flex items-center justify-between">
              <span>Limite de Pessoas</span>
              <span className="text-rose-400 font-mono">{maxParticipants} lugares</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 6, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxParticipants(num)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    maxParticipants === num
                      ? 'bg-rose-950/60 border-rose-600 text-white shadow-sm'
                      : 'bg-[#170B14] border-[#2B1425] text-zinc-400 hover:text-white'
                  }`}
                >
                  {num === 2 ? '2 (Casal)' : num}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#BE123C] to-[#E11D48] hover:from-[#A81035] hover:to-[#CD1B41] text-white font-semibold text-xs shadow-lg shadow-rose-950/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Criar Sessão de Cinema</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
