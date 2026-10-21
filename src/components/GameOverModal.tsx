/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MatchConfig, MatchStats, GameSettings } from '../types/game';
import { getTranslation } from '../services/localization';
import { sound } from '../services/sound';

interface GameOverModalProps {
  config: MatchConfig;
  stats: MatchStats;
  settings: GameSettings;
  isOpen: boolean;
  isSeriesOver: boolean;
  roundWinner: 'player1' | 'player2' | 'player3' | 'tie';
  seriesWinner: 'player1' | 'player2' | 'player3' | 'tie' | null;
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
  onlineResults?: Array<{
    userId: string;
    username: string;
    displayName: string;
    placement: number;
    ratingDelta: number;
    newRating: number;
  }>;
  onNextRound: () => void;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  config,
  stats,
  settings,
  isOpen,
  isSeriesOver,
  roundWinner,
  seriesWinner,
  xpEarned,
  leveledUp,
  newLevel,
  onlineResults,
  onNextRound,
  onPlayAgain,
  onExit,
}) => {
  const t = getTranslation(settings.language);

  if (!isOpen) return null;

  const isP1Winner = isSeriesOver ? seriesWinner === 'player1' : roundWinner === 'player1';
  const isTie = isSeriesOver ? seriesWinner === 'tie' : roundWinner === 'tie';

  let title = '';
  let titleColor = '';
  let icon = '🏆';

  if (onlineResults && onlineResults.length > 0) {
    const winner = onlineResults.find(r => r.placement === 1) || onlineResults[0];
    title = `${winner.displayName} Wins!`;
    titleColor = 'text-amber-400';
    icon = '👑';
  } else if (isTie) {
    title = t.roundTie;
    titleColor = 'text-amber-400';
    icon = '🤝';
  } else if (config.mode === 'vs-ai') {
    if (isP1Winner) {
      title = isSeriesOver ? t.matchWon : t.victory;
      titleColor = 'text-yellow-400';
      icon = '🏆';
    } else {
      title = isSeriesOver ? t.matchLost : t.defeat;
      titleColor = 'text-rose-400';
      icon = '💥';
    }
  } else {
    const winnerName = isP1Winner ? config.p1Name : config.p2Name;
    title = `${winnerName} ${t.victory}`;
    titleColor = isP1Winner ? 'text-sky-400' : 'text-orange-400';
    icon = '👑';
  }

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalFlicks = stats.totalFlicksP1 + stats.totalFlicksP2;
  const accuracyP1 = stats.totalFlicksP1 > 0 ? Math.min(100, Math.round((stats.knockoutsP1 / stats.totalFlicksP1) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl text-center flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Outcome Trophy Icon */}
        <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg animate-bounce">
          {icon}
        </div>

        {/* Title */}
        <h2 className={`text-2xl md:text-3xl font-black font-heading tracking-tight mb-1 ${titleColor}`}>
          {title}
        </h2>

        {/* Online Placement Results */}
        {onlineResults && onlineResults.length > 0 ? (
          <div className="my-3 space-y-2">
            {onlineResults.map(res => (
              <div
                key={res.userId}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                  res.placement === 1
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm">
                    {res.placement === 1 ? '🥇 1st' : res.placement === 2 ? '🥈 2nd' : '🥉 3rd'}
                  </span>
                  <span>{res.displayName}</span>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-bold ${res.ratingDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {res.ratingDelta >= 0 ? `+${res.ratingDelta}` : res.ratingDelta} ELO
                  </span>
                  <span className="text-[10px] text-slate-500 block">Rating: {res.newRating}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Series Score Banner */
          <div className="inline-flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-1.5 rounded-2xl mx-auto mb-4 tabular-nums text-sm font-bold">
            <span className="text-sky-400">{config.p1Name}: {stats.seriesScoreP1}</span>
            <span className="text-slate-600">·</span>
            <span className="text-orange-400">{config.p2Name}: {stats.seriesScoreP2}</span>
          </div>
        )}

        {/* Level Up Flash Banner */}
        {leveledUp && (
          <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/60 animate-pulse flex items-center justify-center gap-2">
            <span className="text-xl">⭐</span>
            <span className="font-extrabold text-amber-300 text-sm tracking-wide">
              {t.levelUp} {t.level} {newLevel}
            </span>
          </div>
        )}

        {/* XP Reward Card */}
        {xpEarned > 0 && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 mb-5 flex items-center justify-between px-5">
            <span className="text-xs text-slate-400 font-semibold">{t.xpEarned}</span>
            <span className="text-base font-black text-amber-400 tabular-nums">+{xpEarned} XP</span>
          </div>
        )}

        {/* Match Statistics Grid */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 mb-6">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            {t.matchSummary}
          </div>
          <div className="grid grid-cols-2 gap-2 text-left text-xs">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">{t.duration}</span>
              <span className="text-white font-bold tabular-nums">{formatDuration(stats.durationSeconds)}</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">{t.totalFlicks}</span>
              <span className="text-white font-bold tabular-nums">{totalFlicks}</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">{t.knockouts}</span>
              <span className="text-white font-bold tabular-nums">{stats.knockoutsP1 + stats.knockoutsP2}</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">{t.accuracy}</span>
              <span className="text-white font-bold tabular-nums">{accuracyP1}%</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mt-auto">
          {!isSeriesOver && !onlineResults ? (
            <button
              onClick={() => {
                sound.playClick();
                onNextRound();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all border-b-3 border-amber-600 flex items-center justify-center gap-2"
            >
              <span>{t.nextRound}</span>
              <span>→</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                onPlayAgain();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all border-b-3 border-amber-600 flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>{t.playAgain}</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onExit();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-sm tracking-wide border border-slate-700 transition-colors"
          >
            {t.exitToMenu}
          </button>
        </div>
      </div>
    </div>
  );
};
