'use client';

import React, { useState, useEffect } from 'react';
import { X, LogIn, Hash, Film, Heart, ArrowRight, RefreshCw, Users } from 'lucide-react';
import { RoomInfo } from '@/types/nexora';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (roomId: string, password?: string) => void;
}

export function JoinRoomModal({ isOpen, onClose, onJoin }: JoinRoomModalProps) {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/signaling/rooms');
      const data = await res.json();
      if (data.rooms) {
        setAvailableRooms(data.rooms);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch('/api/signaling/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (active && data.rooms) {
          setAvailableRooms(data.rooms);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = roomId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (!cleanId) return;
    onJoin(cleanId, password || undefined);
    onClose();
  };

  const handleSelectRoom = (room: RoomInfo) => {
    onJoin(room.id);
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
            <h2 className="text-lg font-bold text-[#FAF7F2]">Entrar em uma Sessão</h2>
            <p className="text-xs text-[#A8A29E]">Insira o código da sala de cinema</p>
          </div>
        </div>

        {/* Enter by Code Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-[#D6D3CD] mb-1.5">
              Código da Sessão
            </label>
            <div className="flex items-center rounded-xl bg-[#170B14] border border-[#2B1425] focus-within:border-rose-600 px-3.5 py-2.5 text-xs">
              <Hash className="w-4 h-4 text-rose-400 mr-2 shrink-0" />
              <input
                type="text"
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Ex: geral, nossa-sessao, cinema-vip"
                className="bg-transparent border-none focus:outline-none text-white font-mono flex-1 placeholder-zinc-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D6D3CD] mb-1.5">
              Senha (Se a sala for protegida)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe em branco se for aberta"
              className="w-full bg-[#170B14] border border-[#2B1425] focus:border-rose-600 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#BE123C] to-[#E11D48] hover:from-[#A81035] hover:to-[#CD1B41] text-white font-semibold text-xs shadow-lg shadow-rose-950/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Conectar à Sessão</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Available Rooms List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Sessões Ativas
            </span>
            <button
              type="button"
              onClick={fetchRooms}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {availableRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleSelectRoom(room)}
                className="p-2.5 rounded-xl bg-[#140810] hover:bg-[#1E0C18] border border-[#25101E] hover:border-rose-600 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#200D1A] flex items-center justify-center text-rose-400 shrink-0">
                    <Film className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[#FAF7F2] group-hover:text-rose-300 truncate">
                      {room.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">#{room.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-rose-400" /> {room.maxParticipants} max
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-rose-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
