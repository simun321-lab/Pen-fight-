/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LeaderboardEntry, GameSettings } from '../types/game';
import { getTranslation } from '../services/localization';
import { sound } from '../services/sound';
import { AVATARS_CATALOG } from '../data/pens';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  settings,
  isOpen,
  onClose,
}) => {
  const t = getTranslation(settings.language);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xl border border-amber-500/30">
            🏆
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight">
              {t.leaderboard}
            </h2>
            <p className="text-xs text-slate-400">
              Local Classroom Desk Records
            </p>
          </div>
        </div>

        <div className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5 my-3 flex items-center gap-2">
          <span>ℹ️</span>
          <span>Rankings tracked locally on this device. Future update will sync online school records!</span>
        </div>

        {/* Entries List */}
        <div className="space-y-2 mt-2 flex-1 overflow-y-auto pr-1">
          {entries.map((entry, idx) => {
            const avatar = AVATARS_CATALOG.find(a => a.id === entry.avatarId) || AVATARS_CATALOG[0];
            const isTop3 = idx < 3;
            const rankBadges = ['🥇', '🥈', '🥉'];

            return (
              <div
                key={entry.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                  entry.isPlayer
                    ? 'bg-sky-950/40 border-sky-400/80 shadow-md ring-1 ring-sky-400/40'
                    : isTop3
                    ? 'bg-slate-950/80 border-slate-800'
                    : 'bg-slate-900/60 border-slate-850'
                }`}
              >
                {/* Rank & Avatar */}
                <div className="flex items-center gap-3">
                  <div className="w-7 text-center font-black text-sm text-slate-400 tabular-nums">
                    {isTop3 ? rankBadges[idx] : `#${idx + 1}`}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                    {avatar.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm font-bold text-white">
                        {entry.nickname}
                      </span>
                      {entry.isPlayer && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-sky-500/30 text-sky-300 border border-sky-400/40">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {t.level} {entry.level} · Streak {entry.streak} 🔥
                    </span>
                  </div>
                </div>

                {/* Score / Wins */}
                <div className="text-right">
                  <span className="text-sm font-black text-amber-400 tabular-nums block">
                    {entry.wins} {t.wins}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {entry.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
