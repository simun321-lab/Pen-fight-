/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSettings } from '../types/game';
import { getTranslation } from '../services/localization';
import { sound } from '../services/sound';

interface RulesModalProps {
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
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
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xl border border-amber-500/30">
            📖
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight">
              {t.rulesTitle}
            </h2>
            <p className="text-xs text-slate-400">
              The Legendary Classroom Game
            </p>
          </div>
        </div>

        {/* Rules Cards */}
        <div className="space-y-3 mb-6">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span>🪑</span>
              <span>{t.rule1Title}</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.rule1Desc}
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span>🎯</span>
              <span>{t.rule2Title}</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.rule2Desc}
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span>⚖️</span>
              <span>{t.rule3Title}</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.rule3Desc}
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-yellow-300 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span>🏆</span>
              <span>{t.rule4Title}</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.rule4Desc}
            </p>
          </div>
        </div>

        {/* Got It Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full py-3 px-6 rounded-2xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all border-b-3 border-amber-600"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
