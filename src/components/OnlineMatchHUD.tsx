/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OnlineRoom } from '../types/multiplayer';
import { TeamId } from '../types/game';
import { sound } from '../services/sound';

interface OnlineMatchHUDProps {
  room: OnlineRoom;
  myTeam: TeamId;
  currentTurn: TeamId;
  isSimulating: boolean;
  pensCountByTeam: Record<TeamId, number>;
  onSendChat: (text: string, isEmote?: boolean) => void;
  onLeaveMatch: () => void;
  recentEmotes: Array<{ userId: string; text: string; id: string }>;
}

export const OnlineMatchHUD: React.FC<OnlineMatchHUDProps> = ({
  room,
  myTeam,
  currentTurn,
  isSimulating,
  pensCountByTeam,
  onSendChat,
  onLeaveMatch,
  recentEmotes,
}) => {
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(20);
  const [isEmoteDrawerOpen, setIsEmoteDrawerOpen] = useState(false);

  // Turn timer countdown (20s per turn)
  useEffect(() => {
    setTurnTimeLeft(20);
    const interval = setInterval(() => {
      setTurnTimeLeft(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentTurn]);

  const isMyTurn = currentTurn === myTeam && !isSimulating;

  const quickChats = ['Good game! 🤝', 'Nice shot! 🎯', 'Close call! ⚡', 'Unlucky! 😅', 'Well played! 👏'];
  const emotes = ['🔥', '😂', '🎯', '👏', '😱', '👑', '💪', '🏆'];

  const teamColors = {
    player1: 'border-sky-400 text-sky-400 bg-sky-950/40',
    player2: 'border-orange-400 text-orange-400 bg-orange-950/40',
    player3: 'border-emerald-400 text-emerald-400 bg-emerald-950/40',
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 md:p-5 select-none">
      {/* Top Status Bar: 2 or 3 Player Status Clusters */}
      <header className="flex items-center justify-between gap-2 w-full max-w-4xl mx-auto">
        {/* Participants Cards */}
        <div className="flex items-center gap-2">
          {room.participants.map(p => {
            const isTurn = currentTurn === p.team && !isSimulating;
            const remaining = pensCountByTeam[p.team] ?? 0;
            const isMe = p.team === myTeam;

            return (
              <div
                key={p.userId}
                className={`pointer-events-auto flex items-center gap-2 bg-slate-900/95 rounded-2xl px-3 py-2 border shadow-lg transition-all ${
                  isTurn ? 'ring-2 ring-amber-400 border-amber-400' : 'border-slate-800'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 ${
                    teamColors[p.team]
                  }`}
                >
                  {p.team === 'player1' ? 'P1' : p.team === 'player2' ? 'P2' : 'P3'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white max-w-[70px] md:max-w-[100px] truncate">
                      {p.displayName}
                    </span>
                    {isMe && (
                      <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-1 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  {/* Remaining pens dots */}
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i < remaining ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'bg-slate-700 opacity-40'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] font-bold text-slate-400 ml-1">
                      Score: {p.score}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Turn Banner & 20s Timer */}
        <div className="flex flex-col items-center">
          <div
            className={`px-3 py-1 rounded-2xl border text-xs font-extrabold shadow-lg flex items-center gap-2 ${
              isMyTurn
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                : 'bg-slate-900/95 border-slate-750 text-slate-300'
            }`}
          >
            <span>{isSimulating ? 'Simulating...' : isMyTurn ? 'YOUR TURN TO FLICK!' : `${currentTurn.toUpperCase()} AIMING`}</span>
            <span className="font-mono text-[11px] tabular-nums text-amber-400">
              {turnTimeLeft}s
            </span>
          </div>
        </div>

        {/* Emote & Leave Actions */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Emote / Chat Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setIsEmoteDrawerOpen(!isEmoteDrawerOpen);
            }}
            className="w-10 h-10 rounded-2xl bg-slate-900/95 border border-slate-750 hover:border-amber-400 text-amber-300 flex items-center justify-center text-lg shadow-lg active:scale-95 transition-all"
            title="Send Quick Chat or Emote"
          >
            💬
          </button>

          {/* Leave Match Button */}
          <button
            onClick={() => {
              sound.playClick();
              onLeaveMatch();
            }}
            className="w-10 h-10 rounded-2xl bg-slate-900/95 border border-slate-750 hover:border-rose-500 text-slate-400 hover:text-rose-300 flex items-center justify-center text-xs font-bold shadow-lg active:scale-95 transition-all"
            title="Leave Match"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Floating Emote Overlays */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-2 z-30">
        {recentEmotes.map(em => (
          <div
            key={em.id}
            className="px-4 py-2 rounded-2xl bg-slate-900/95 border border-amber-400 text-white font-bold text-sm shadow-2xl animate-in zoom-in-75 duration-200"
          >
            {em.text}
          </div>
        ))}
      </div>

      {/* Emote Drawer (Bottom) */}
      {isEmoteDrawerOpen && (
        <div className="pointer-events-auto w-full max-w-sm mx-auto bg-slate-900 border border-slate-700 rounded-3xl p-3 shadow-2xl mb-2 animate-in slide-in-from-bottom-4 duration-150">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Quick Reaction
          </div>

          {/* Emotes Bar */}
          <div className="flex items-center justify-between gap-1 mb-2">
            {emotes.map(em => (
              <button
                key={em}
                onClick={() => {
                  sound.playClick();
                  onSendChat(em, true);
                  setIsEmoteDrawerOpen(false);
                }}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-base hover:scale-110 active:scale-95 transition-all"
              >
                {em}
              </button>
            ))}
          </div>

          {/* Quick Chat Phrases */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800">
            {quickChats.map(qc => (
              <button
                key={qc}
                onClick={() => {
                  sound.playClick();
                  onSendChat(qc, false);
                  setIsEmoteDrawerOpen(false);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-bold truncate text-left"
              >
                {qc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      <footer className="w-full flex justify-center pb-2">
        {isMyTurn && (
          <div className="px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-400/60 shadow text-[11px] text-amber-300 font-bold tracking-wide flex items-center gap-2">
            <span>💡</span>
            <span>Touch and pull back your pen to flick!</span>
          </div>
        )}
      </footer>
    </div>
  );
};
