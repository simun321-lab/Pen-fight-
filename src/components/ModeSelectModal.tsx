/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameMode, AIDifficulty, GameSettings } from '../types/game';
import { getTranslation } from '../services/localization';
import { sound } from '../services/sound';

interface ModeSelectModalProps {
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (mode: GameMode, difficulty: AIDifficulty) => void;
  onStartOnline: () => void;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({
  settings,
  isOpen,
  onClose,
  onStartMatch,
  onStartOnline,
}) => {
  const t = getTranslation(settings.language);
  const [selectedMode, setSelectedMode] = useState<GameMode>('vs-ai');
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('normal');

  if (!isOpen) return null;

  const handleStart = () => {
    sound.playClick();
    onStartMatch(selectedMode, selectedDifficulty);
  };

  const difficultyList: Array<{ id: AIDifficulty; label: string; desc: string; icon: string }> = [
    { id: 'easy', label: t.easy, desc: t.easyDesc, icon: '🌱' },
    { id: 'normal', label: t.normal, desc: t.normalDesc, icon: '🎯' },
    { id: 'hard', label: t.hard, desc: t.hardDesc, icon: '🔥' },
    { id: 'master', label: t.master, desc: t.masterDesc, icon: '👑' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
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

        {/* Modal Title */}
        <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight text-center mb-1">
          {t.selectMode}
        </h2>
        <p className="text-xs text-slate-400 text-center mb-5">
          {t.tagline}
        </p>

        {/* Mode Selection Cards */}
        <div className="space-y-3 mb-6">
          {/* Card 1: VS Computer */}
          <button
            onClick={() => {
              sound.playClick();
              setSelectedMode('vs-ai');
            }}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
              selectedMode === 'vs-ai'
                ? 'bg-sky-950/60 border-sky-400 shadow-md ring-2 ring-sky-400/20'
                : 'bg-slate-850/80 border-slate-750 hover:border-slate-600 bg-slate-800/40'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-2xl shrink-0 shadow">
              🤖
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-base">{t.modeVsAi}</span>
                {selectedMode === 'vs-ai' && (
                  <span className="text-xs font-bold text-sky-400 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-400/30">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1">{t.modeVsAiDesc}</p>
            </div>
          </button>

          {/* AI Difficulty Selector (Visible only when VS AI selected) */}
          {selectedMode === 'vs-ai' && (
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl ml-4 mr-1 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2.5">
                {t.selectDifficulty}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {difficultyList.map(diff => (
                  <button
                    key={diff.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedDifficulty(diff.id);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedDifficulty === diff.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <span>{diff.icon}</span>
                      <span>{diff.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{diff.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Card 2: 2 Players Pass & Play */}
          <button
            onClick={() => {
              sound.playClick();
              setSelectedMode('local-2p');
            }}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
              selectedMode === 'local-2p'
                ? 'bg-emerald-950/60 border-emerald-400 shadow-md ring-2 ring-emerald-400/20'
                : 'bg-slate-850/80 border-slate-750 hover:border-slate-600 bg-slate-800/40'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-2xl shrink-0 shadow">
              👥
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-base">{t.modeLocal2p}</span>
                {selectedMode === 'local-2p' && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1">{t.modeLocal2pDesc}</p>
            </div>
          </button>

          {/* Card 3: Online Multiplayer (Active!) */}
          <button
            onClick={() => {
              sound.playClick();
              onStartOnline();
            }}
            className="w-full p-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-sky-950/60 to-slate-900 hover:border-amber-400 transition-all flex items-start gap-4 text-left group shadow"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-2xl shrink-0 text-slate-950 shadow">
              🌐
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-base">{t.modeOnline}</span>
                <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                  LIVE 2P & 3P
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">Real-time matchmaking, private room codes, and 3-Player FFA battles.</p>
            </div>
          </button>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 border-b-3 border-amber-600"
        >
          <span>{t.startBattle}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
