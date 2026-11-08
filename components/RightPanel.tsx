'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Info,
  Send,
  Smile,
  Users,
  Film,
  Heart,
  Crown,
} from 'lucide-react';
import { ChatMessage, Participant, RoomInfo } from '@/types/nexora';

interface RightPanelProps {
  roomInfo: RoomInfo | null;
  participants: Participant[];
  messages: ChatMessage[];
  currentParticipant: Participant;
  onSendMessage: (text: string) => void;
  onKickParticipant: (id: string) => void;
  onMuteParticipant: (id: string) => void;
}

const CINEMA_REACTIONS = ['🍿', '❤️', '🎬', '🍷', '✨', '😂', '👏', '💌'];

export function RightPanel({
  roomInfo,
  participants,
  messages,
  currentParticipant,
  onSendMessage,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'room'>('chat');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    onSendMessage(clean);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const addReaction = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <aside className="w-80 border-l border-[#22101B] bg-[#0A060C] flex flex-col h-full select-none shrink-0 z-20">
      {/* Tab Switcher Header */}
      <div className="p-2 border-b border-[#200F1A] flex items-center bg-[#070408]">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-[#1C0D17] text-white border border-[#3A1629] shadow-sm'
              : 'text-[#A8A29E] hover:text-[#FAF7F2] hover:bg-[#120810]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
          <span>Chat da Sessão</span>
          {messages.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-950/70 text-rose-300">
              {messages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('room')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'room'
              ? 'bg-[#1C0D17] text-white border border-[#3A1629] shadow-sm'
              : 'text-[#A8A29E] hover:text-[#FAF7F2] hover:bg-[#120810]'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-rose-400" />
          <span>Informações</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'chat' ? (
        /* CHAT VIEW */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentParticipant.id;

              if (msg.isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="py-1 px-3 rounded-lg bg-[#140810]/70 border border-[#26101F] text-center text-[11px] text-[#A8A29E] my-1 flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                    <span>{msg.text}</span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  {/* Sender avatar */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: msg.senderColor || '#E11D48' }}
                  >
                    {msg.senderAvatar || '❤️'}
                  </div>

                  {/* Message bubble */}
                  <div
                    className={`max-w-[78%] rounded-2xl p-2.5 text-xs shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-r from-[#BE123C] to-[#E11D48] text-white rounded-tr-none'
                        : 'bg-[#160B13] border border-[#2B1324] text-[#FAF7F2] rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                      <span className={`font-semibold ${isMe ? 'text-white' : 'text-rose-300'}`}>
                        {msg.senderName}
                      </span>
                      <span
                        suppressHydrationWarning
                        className={`${isMe ? 'text-rose-100/70' : 'text-zinc-500'}`}
                      >
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="break-words leading-relaxed select-text font-normal">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick reactions bar */}
          {showEmojiPicker && (
            <div className="p-2 border-t border-[#200F1A] bg-[#120810] flex items-center justify-around">
              {CINEMA_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addReaction(emoji)}
                  className="p-1.5 text-lg hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Message Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-2.5 border-t border-[#200F1A] bg-[#070408] flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-[#180C15] rounded-xl transition-colors cursor-pointer"
              title="Reações Rápidas"
            >
              <Smile className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Comente o filme..."
              className="flex-1 bg-[#140811] border border-[#281223] focus:border-rose-600 focus:outline-none rounded-xl px-3 py-2 text-xs text-[#FAF7F2] placeholder-zinc-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-gradient-to-r from-[#BE123C] to-[#E11D48] disabled:opacity-30 disabled:cursor-not-allowed hover:from-[#A81035] hover:to-[#CD1B41] text-white rounded-xl transition-all cursor-pointer shadow-md"
              title="Enviar Mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* ROOM DETAILS TAB */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#130710] border border-[#271221] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                Sobre a Sessão
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40 font-medium">
                Cinema a Dois
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-[#D6D3CD]">
              <div className="flex justify-between py-1 border-b border-[#220E1C]">
                <span className="text-zinc-500">Nome:</span>
                <span className="text-white font-medium truncate max-w-[150px]">
                  {roomInfo?.name || 'Sessão Cinema'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#220E1C]">
                <span className="text-zinc-500">Código da Sala:</span>
                <span className="text-rose-400 font-mono font-bold">{roomInfo?.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#220E1C]">
                <span className="text-zinc-500">Acesso:</span>
                <span className="text-rose-300">
                  {roomInfo?.isPrivate ? 'Privada (Exclusiva)' : 'Aberta'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Criado por:</span>
                <span className="text-white">{roomInfo?.createdByName || 'Anfitrião'}</span>
              </div>
            </div>
          </div>

          {/* Participants list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Assistindo Juntos ({participants.length})
              </span>
            </div>

            <div className="space-y-1.5">
              {participants.map((user) => (
                <div
                  key={user.id}
                  className="p-2 rounded-xl bg-[#130710] border border-[#220E1C] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: user.color || '#E11D48' }}
                    >
                      {user.avatar || '❤️'}
                    </div>
                    <span className="text-xs font-medium text-[#FAF7F2] truncate">{user.name}</span>
                    {user.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>

                  <span className="text-[10px] text-zinc-500">
                    {user.id === currentParticipant.id ? 'Você' : 'Conectado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
