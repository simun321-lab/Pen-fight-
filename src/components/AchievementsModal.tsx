/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserAccount } from '../types/multiplayer';
import { ACHIEVEMENTS_CATALOG } from '../data/achievements';
import { sound } from '../services/sound';

interface AchievementsModalProps {
  currentUser: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'bn';
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  const unlocked = currentUser?.unlockedAchievements || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
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
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-2xl border border-amber-500/30">
            🏅
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight">
              Classroom Achievements
            </h2>
            <p className="text-xs text-slate-400">
              Unlocked: {unlocked.length} of {ACHIEVEMENTS_CATALOG.length}
            </p>
          </div>
        </div>

        {/* Achievements List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {ACHIEVEMENTS_CATALOG.map(item => {
            const isEarned = unlocked.includes(item.id);
            const title = language === 'bn' ? item.titleBn : item.title;
            const desc = language === 'bn' ? item.descriptionBn : item.description;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                  isEarned
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                    : 'bg-slate-950/60 border-slate-850 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shrink-0 ${
                    isEarned
                      ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-600 grayscale'
                  }`}
                >
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-bold text-white truncate">
                      {title}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-300 shrink-0">
                      +{item.xpReward} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
