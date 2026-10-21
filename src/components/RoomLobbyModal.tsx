/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OnlineRoom, UserAccount, ChatMessage } from '../types/multiplayer';
import { sound } from '../services/sound';
import { AVATARS_CATALOG } from '../data/pens';

interface RoomLobbyModalProps {
  room: OnlineRoom | null;
  currentUser: UserAccount | null;
  isOpen: boolean;
  onToggleReady: (isReady: boolean) => void;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onSendChat: (text: string) => void;
  chatMessages: ChatMessage[];
  onInviteFriend: () => void;
}

export const RoomLobbyModal: React.FC<RoomLobbyModalProps> = ({
  room,
  currentUser,
  isOpen,
  onToggleReady,
  onStartMatch,
  onLeaveRoom,
  onSendChat,
  chatMessages,
  onInviteFriend,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !room) return null;

  const myParticipant = room.participants.find(p => p.userId === currentUser?.id);
  const isHost = myParticipant?.isHost ?? false;
  const isReady = myParticipant?.isReady ?? false;
  const isFull = room.participants.length === room.capacity;
  const allReady = room.participants.every(p => p.isReady || p.isHost);

  const handleCopyCode = () => {
    sound.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(room.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black text-white font-heading tracking-tight">
                {room.name}
              </h2>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
                {room.capacity === 3 ? '3-Player FFA' : '2-Player Duel'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Occupancy: {room.participants.length}/{room.capacity} Players
            </div>
          </div>

          {/* Room Code Badge with Copy button */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/40 hover:border-amber-400 transition-colors"
            title="Click to copy room code"
          >
            <span className="text-[10px] text-slate-400 font-bold uppercase">CODE</span>
            <span className="text-sm font-mono font-black text-amber-300 tracking-wider">
              {room.id}
            </span>
            <span className="text-xs">{copiedCode ? '✓' : '📋'}</span>
          </button>
        </div>

        {/* Player Slots Grid (2 or 3 distinct slots) */}
        <div className="py-4">
          <div className={`grid ${room.capacity === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5`}>
            {Array.from({ length: room.capacity }).map((_, idx) => {
              const participant = room.participants[idx];
              const teamLabels = ['Player 1 (Blue)', 'Player 2 (Orange)', 'Player 3 (Green)'];
              const teamBg = [
                'border-sky-500/40 bg-sky-950/20',
                'border-orange-500/40 bg-orange-950/20',
                'border-emerald-500/40 bg-emerald-950/20',
              ];

              if (participant) {
                const avatar = AVATARS_CATALOG.find(a => a.id === participant.avatarId) || AVATARS_CATALOG[0];
                return (
                  <div
                    key={participant.userId}
                    className={`p-3 rounded-2xl border ${teamBg[idx]} flex flex-col items-center text-center relative shadow-sm`}
                  >
                    {/* Host Crown */}
                    {participant.isHost && (
                      <span className="absolute top-2 left-2 text-xs" title="Room Host">
                        👑
                      </span>
                    )}

                    {/* Ready Badge */}
                    <span
                      className={`absolute top-2 right-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                        participant.isReady || participant.isHost
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {participant.isHost ? 'Host' : participant.isReady ? 'Ready' : 'Waiting'}
                    </span>

                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl my-2 shadow">
                      {avatar.icon}
                    </div>

                    <span className="text-xs font-bold text-white truncate w-full">
                      {participant.displayName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      @{participant.username}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1">
                      {teamLabels[idx]}
                    </span>
                  </div>
                );
              }

              // Empty Slot
              return (
                <div
                  key={`empty_${idx}`}
                  className="p-3 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center text-center min-h-[140px]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 text-lg mb-2">
                    ⏳
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Empty Slot {idx + 1}
                  </span>
                  <button
                    onClick={onInviteFriend}
                    className="mt-2 text-[10px] font-bold text-amber-400 hover:text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
                  >
                    + Invite Friend
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* In-Lobby Chat Box */}
        <div className="flex-1 min-h-[120px] max-h-[180px] bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col mb-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Lobby Chat
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {chatMessages.length === 0 ? (
              <span className="text-slate-600 italic block mt-2 text-center text-[11px]">
                Say hello to your fellow desk fighters!
              </span>
            ) : (
              chatMessages.map(msg => (
                <div key={msg.id} className="leading-tight">
                  <span className="font-bold text-amber-300">{msg.displayName}: </span>
                  <span className="text-slate-200">{msg.text}</span>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendChat} className="flex gap-2 mt-2 pt-2 border-t border-slate-900">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value.slice(0, 60))}
              placeholder="Send quick message..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              Send
            </button>
          </form>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              onLeaveRoom();
            }}
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-colors"
          >
            Leave Room
          </button>

          {!isHost && (
            <button
              onClick={() => {
                sound.playClick();
                onToggleReady(!isReady);
              }}
              className={`flex-1 py-3 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-b-3 ${
                isReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-600'
              }`}
            >
              {isReady ? '✓ You Are Ready' : 'Ready Up'}
            </button>
          )}

          {isHost && (
            <button
              disabled={!isFull || !allReady}
              onClick={() => {
                sound.playClick();
                onStartMatch();
              }}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg transition-all border-b-3 border-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!isFull
                ? `Waiting for ${room.capacity - room.participants.length} more...`
                : !allReady
                ? 'Waiting for all ready...'
                : 'START MATCH NOW →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
