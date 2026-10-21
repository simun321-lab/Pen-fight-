/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ComprehensiveStats, PlayerProfile, GameSettings } from '../types/game';
import { getTranslation } from '../services/localization';
import { sound } from '../services/sound';

interface StatsModalProps {
  stats: ComprehensiveStats;
  profile: PlayerProfile;
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  stats,
  profile,
  settings,
  isOpen,
  onClose,
}) => {
  const t = getTranslation(settings.language);
  const [activeTab, setActiveTab] = useState<'me' | 'world'>('me');

  if (!isOpen) return null;

  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const formatTotalTime = (sec: number) => {
    if (!sec || sec <= 0) return '0 min';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const winRate = profile.matchesPlayed > 0 ? Math.round((profile.wins / profile.matchesPlayed) * 100) : 0;

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
        <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight mb-4">
          {t.statsTitle}
        </h2>

        {/* Me vs World Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-5">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('me');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'me'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.tabMe}
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('world');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'world'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.tabWorld}
          </button>
        </div>

        {/* Tab 1: Me (Local Stats) */}
        {activeTab === 'me' ? (
          <div className="space-y-4">
            {/* Primary KPI Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">{t.matchesPlayed}</span>
                <span className="text-xl font-black text-white tabular-nums mt-0.5 block">{profile.matchesPlayed}</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">{t.winRate}</span>
                <span className="text-xl font-black text-amber-400 tabular-nums mt-0.5 block">{winRate}%</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">{t.bestStreak}</span>
                <span className="text-xl font-black text-emerald-400 tabular-nums mt-0.5 block">{profile.bestStreak} 🔥</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">{t.totalPlayTime}</span>
                <span className="text-xl font-black text-sky-400 tabular-nums mt-0.5 block">{formatTotalTime(stats.totalPlayTimeSeconds)}</span>
              </div>
            </div>

            {/* Match Records Grid */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Match Records
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t.fastestWin}</span>
                  <span className="font-bold text-white tabular-nums">{formatSeconds(stats.fastestWinSeconds)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t.longestMatch}</span>
                  <span className="font-bold text-white tabular-nums">{formatSeconds(stats.longestMatchSeconds)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t.avgMatch}</span>
                  <span className="font-bold text-white tabular-nums">{formatSeconds(stats.averageMatchSeconds)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t.knockouts}</span>
                  <span className="font-bold text-white tabular-nums">{stats.totalKnockouts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t.totalFlicks}</span>
                  <span className="font-bold text-white tabular-nums">{stats.totalFlicks}</span>
                </div>
              </div>
            </div>

            {/* Performance by Difficulty */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                {t.aiRecords}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{t.easy}</span>
                  <span className="font-bold text-white tabular-nums">{stats.aiStats.easy.won}/{stats.aiStats.easy.played}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{t.normal}</span>
                  <span className="font-bold text-white tabular-nums">{stats.aiStats.normal.won}/{stats.aiStats.normal.played}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{t.hard}</span>
                  <span className="font-bold text-white tabular-nums">{stats.aiStats.hard.won}/{stats.aiStats.hard.played}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{t.master}</span>
                  <span className="font-bold text-white tabular-nums">{stats.aiStats.master.won}/{stats.aiStats.master.played}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: World (Future Backend feature honest empty state) */
          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-8 text-center my-auto">
            <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-400/20 text-3xl flex items-center justify-center mx-auto mb-4 text-sky-400">
              🌍
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {t.tabWorld}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto mb-4">
              {t.worldDisclaimer}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-bold text-amber-400">
              <span>🚀</span>
              <span>Online Backend Roadmap Item</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
