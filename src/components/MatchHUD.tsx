/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TeamId, MatchConfig, GameSettings } from '../types/game';
import { getTranslation } from '../services/localization';
import { sound } from '../services/sound';

interface MatchHUDProps {
  config: MatchConfig;
  settings: GameSettings;
  currentTurn: TeamId;
  isAiTurn: boolean;
  isSimulating: boolean;
  scoreP1: number;
  scoreP2: number;
  remainingP1: number;
  remainingP2: number;
  onPause: () => void;
}

export const MatchHUD: React.FC<MatchHUDProps> = ({
  config,
  settings,
  currentTurn,
  isAiTurn,
  isSimulating,
  scoreP1,
  scoreP2,
  remainingP1,
  remainingP2,
  onPause,
}) => {
  const t = getTranslation(settings.language);

  // Determine turn label
  let turnText = '';
  let turnColor = '';
  if (isSimulating) {
    turnText = '...';
    turnColor = 'text-amber-300';
  } else if (config.mode === 'vs-ai') {
    if (currentTurn === 'player1') {
      turnText = t.yourTurn;
      turnColor = 'text-sky-400';
    } else {
      turnText = t.aiThinking;
      turnColor = 'text-amber-400';
    }
  } else {
    // 2 Players
    if (currentTurn === 'player1') {
      turnText = t.player1Turn;
      turnColor = 'text-sky-400';
    } else {
      turnText = t.player2Turn;
      turnColor = 'text-orange-400';
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 md:p-5 select-none">
      {/* Top Status Bar: Scores, Player Names, Remaining Pens, Pause */}
      <header className="flex items-center justify-between gap-2 w-full max-w-4xl mx-auto">
        {/* Player 1 Cluster (Blue) */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/95 border border-sky-500/40 rounded-2xl px-3 py-2 shadow-lg">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-400/30 shrink-0">
            P1
          </div>
          <div>
            <div className="text-xs font-bold text-white max-w-[90px] md:max-w-[130px] truncate">
              {config.p1Name}
            </div>
            {/* Pens Left Dots */}
            <div className="flex items-center gap-1 mt-0.5" title={`Remaining Pens: ${remainingP1}`}>
              {Array.from({ length: config.pensPerTeam }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i < remainingP1
                      ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]'
                      : 'bg-slate-700 opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Central Series Score Cluster & Turn Badge */}
        <div className="flex flex-col items-center">
          {/* Series Score Badge */}
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl px-4 py-1.5 flex items-center gap-3 shadow-lg tabular-nums">
            <span className="text-base font-black text-sky-400">{scoreP1}</span>
            <span className="text-xs font-bold text-slate-500">:</span>
            <span className="text-base font-black text-orange-400">{scoreP2}</span>
          </div>

          {/* Turn Indicator Pill */}
          <div className="mt-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow text-[11px] font-bold tracking-wide">
            <span className={turnColor}>{turnText}</span>
          </div>
        </div>

        {/* Player 2 / AI Cluster (Orange/Red) & Pause Button */}
        <div className="flex items-center gap-2">
          {/* Player 2 Cluster */}
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/95 border border-orange-500/40 rounded-2xl px-3 py-2 shadow-lg">
            <div className="text-right">
              <div className="text-xs font-bold text-white max-w-[90px] md:max-w-[130px] truncate">
                {config.p2Name}
              </div>
              {/* Pens Left Dots */}
              <div className="flex items-center justify-end gap-1 mt-0.5" title={`Remaining Pens: ${remainingP2}`}>
                {Array.from({ length: config.pensPerTeam }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i < remainingP2
                        ? 'bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.7)]'
                        : 'bg-slate-700 opacity-40'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-400/30 shrink-0">
              {config.mode === 'vs-ai' ? 'AI' : 'P2'}
            </div>
          </div>

          {/* Pause Button */}
          <button
            onClick={() => {
              sound.playClick();
              onPause();
            }}
            className="pointer-events-auto w-10 h-10 rounded-2xl bg-slate-900/95 border border-slate-750 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-lg active:scale-95"
            title={t.pause}
            aria-label={t.pause}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Bottom Hint Banner: Clean one-handed hint (low occlusion, pointer-events: none) */}
      <footer className="w-full flex justify-center pb-2">
        {!isSimulating && !isAiTurn && (
          <div className="px-4 py-1.5 rounded-full bg-slate-900/85 border border-slate-700/60 shadow text-[11px] text-slate-300 font-medium tracking-wide flex items-center gap-2">
            <span className="text-amber-400">💡</span>
            <span>{t.pullToFlick}</span>
          </div>
        )}
      </footer>
    </div>
  );
};
