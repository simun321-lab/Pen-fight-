/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSettings } from '../types/game';
import { getTranslation } from '../services/localization';
import { sound } from '../services/sound';

interface PauseModalProps {
  settings: GameSettings;
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  settings,
  isOpen,
  onResume,
  onRestart,
  onOpenSettings,
  onExit,
}) => {
  const t = getTranslation(settings.language);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl mx-auto mb-3 text-amber-300">
          ⏸️
        </div>

        <h3 className="text-xl font-black text-white font-heading tracking-tight mb-1">
          {t.gamePaused}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          {t.tagline}
        </p>

        <div className="space-y-3">
          {/* Resume */}
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all border-b-3 border-amber-600"
          >
            {t.resume}
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm tracking-wide border border-slate-700 transition-colors"
          >
            {t.restartMatch}
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-sm tracking-wide border border-slate-700 transition-colors"
          >
            {t.settings}
          </button>

          {/* Exit */}
          <button
            onClick={() => {
              sound.playClick();
              onExit();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-bold text-sm tracking-wide border border-rose-800/40 transition-colors"
          >
            {t.exitToMenu}
          </button>
        </div>
      </div>
    </div>
  );
};
