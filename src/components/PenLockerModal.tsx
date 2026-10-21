/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PenDef, PlayerProfile, GameSettings } from '../types/game';
import { PENS_CATALOG } from '../data/pens';
import { getTranslation } from '../services/localization';
import { sound } from '../services/sound';

interface PenLockerModalProps {
  profile: PlayerProfile;
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
  onEquipPen: (penId: string) => void;
  onToggleFavorite: (penId: string) => void;
}

export const PenLockerModal: React.FC<PenLockerModalProps> = ({
  profile,
  settings,
  isOpen,
  onClose,
  onEquipPen,
  onToggleFavorite,
}) => {
  const t = getTranslation(settings.language);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [styleMode, setStyleMode] = useState<'classic' | 'real'>('classic');

  if (!isOpen) return null;

  const currentPen: PenDef = PENS_CATALOG[currentIndex] || PENS_CATALOG[0];
  const isUnlocked = profile.unlockedPens.includes(currentPen.id) || profile.level >= currentPen.unlockLevel;
  const isEquipped = profile.equippedPenId === currentPen.id;
  const isFavorite = profile.favoritePenId === currentPen.id;

  const handlePrev = () => {
    sound.playClick();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : PENS_CATALOG.length - 1));
  };

  const handleNext = () => {
    sound.playClick();
    setCurrentIndex(prev => (prev < PENS_CATALOG.length - 1 ? prev + 1 : 0));
  };

  // Helper for stats bars (scale 0 to 100)
  const statsList = [
    { label: t.penMass, value: Math.round(((currentPen.stats.mass - 0.8) / 1.7) * 100), raw: `${currentPen.stats.mass}x`, color: 'bg-amber-400' },
    { label: t.penLength, value: Math.round(((currentPen.stats.length - 85) / 45) * 100), raw: `${currentPen.stats.length}mm`, color: 'bg-sky-400' },
    { label: t.penGrip, value: Math.round(((currentPen.stats.grip - 0.5) / 0.9) * 100), raw: `${currentPen.stats.grip}μ`, color: 'bg-emerald-400' },
    { label: t.penBounce, value: Math.round(((currentPen.stats.restitution - 0.3) / 0.5) * 100), raw: `${Math.round(currentPen.stats.restitution * 100)}%`, color: 'bg-purple-400' },
    { label: t.penStability, value: Math.round(((currentPen.stats.stability - 0.5) / 1.0) * 100), raw: `${currentPen.stats.stability}`, color: 'bg-rose-400' },
  ];

  const penName = settings.language === 'bn' ? currentPen.nameBn : currentPen.name;
  const penDesc = settings.language === 'bn' ? currentPen.descriptionBn : currentPen.description;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[94vh] overflow-y-auto">
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
        <div className="flex items-center justify-between pr-8 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight">
              {t.penLockerTitle}
            </h2>
            <div className="text-xs text-slate-400">
              Pen {currentIndex + 1} of {PENS_CATALOG.length}
            </div>
          </div>

          {/* Style Mode Toggle: Classic vs Real */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-[10px] font-bold">
            <button
              onClick={() => {
                sound.playClick();
                setStyleMode('classic');
              }}
              className={`px-2 py-1 rounded-lg transition-colors ${
                styleMode === 'classic' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.styleClassic}
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setStyleMode('real');
              }}
              className={`px-2 py-1 rounded-lg transition-colors ${
                styleMode === 'real' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.styleReal}
            </button>
          </div>
        </div>

        {/* 3D-Like Interactive Pen Showcase Stage on Wood Background */}
        <div className="relative w-full h-44 md:h-52 rounded-2xl overflow-hidden wood-pattern border border-amber-900/60 shadow-inner flex items-center justify-center mb-4">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* Pen Carousel Navigation Chevrons */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/80 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all"
            aria-label="Previous Pen"
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900/80 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all"
            aria-label="Next Pen"
          >
            ›
          </button>

          {/* Favorite Star Button */}
          {isUnlocked && (
            <button
              onClick={() => {
                sound.playClick();
                onToggleFavorite(currentPen.id);
              }}
              className={`absolute top-3 left-3 z-20 p-2 rounded-xl border backdrop-blur-sm transition-all ${
                isFavorite
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isFavorite ? 'Favorite Pen' : 'Mark as Favorite'}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )}

          {/* Lock Overlay if pen is locked */}
          {!isUnlocked && (
            <div className="absolute inset-0 z-10 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl mb-2 text-amber-300">
                🔒
              </div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                {t.locked}
              </div>
              <div className="text-xs text-amber-300/90 mt-0.5">
                {t.unlockAtLevel} {currentPen.unlockLevel}
              </div>
            </div>
          )}

          {/* Large Pen Illustration Preview */}
          <div className="relative z-1 flex items-center justify-center w-full max-w-sm px-6">
            <svg
              className="w-full h-24 filter drop-shadow-[0_12px_16px_rgba(0,0,0,0.6)]"
              viewBox="0 0 260 50"
              fill="none"
            >
              {/* Drop Shadow onto wood table */}
              <rect x="25" y="32" width="210" height="12" rx="6" fill="rgba(0, 0, 0, 0.4)" />

              {/* Main Barrel */}
              <rect x="30" y="14" width="160" height="22" rx="4" fill={currentPen.colors.barrel} />
              {/* Highlight gleam */}
              <rect x="30" y="15" width="160" height="6" fill="rgba(255, 255, 255, 0.3)" />
              {/* Barrel bottom shading */}
              <rect x="30" y="30" width="160" height="6" fill={currentPen.colors.barrelEnd} />

              {/* Grip Section */}
              <rect x="130" y="14" width="46" height="22" fill={currentPen.colors.grip} />
              {/* Rib texture on grip */}
              <line x1="138" y1="14" x2="138" y2="36" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
              <line x1="146" y1="14" x2="146" y2="36" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
              <line x1="154" y1="14" x2="154" y2="36" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
              <line x1="162" y1="14" x2="162" y2="36" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
              <line x1="170" y1="14" x2="170" y2="36" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />

              {/* Tip / Nib Section */}
              <polygon points="190,14 235,23 235,27 190,36" fill={currentPen.colors.tip} />
              {/* Shiny metal bevel */}
              <polygon points="190,14 235,23 235,24 190,18" fill="#ffffff" />
              {/* Ballpoint Ball */}
              <circle cx="236" cy="25" r="2.5" fill="#334155" />

              {/* Cap & Clip on Left End */}
              <rect x="16" y="13" width="46" height="24" rx="4" fill={currentPen.colors.cap} />
              {/* Clip */}
              <rect x="22" y="10" width="34" height="4" rx="2" fill={currentPen.colors.clip} />
              <circle cx="56" cy="12" r="3" fill={currentPen.colors.clip} />
              {/* Metal accent band */}
              <rect x="60" y="13" width="4" height="24" fill={currentPen.colors.accent} />
            </svg>
          </div>
        </div>

        {/* Pen Information */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-heading">
              {penName}
            </h3>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
              {currentPen.category}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {penDesc}
          </p>
        </div>

        {/* Detailed Stats Bars */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 mb-5">
          {statsList.map(stat => (
            <div key={stat.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 w-28 shrink-0">{stat.label}</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className={`h-full ${stat.color} rounded-full transition-all duration-300`}
                  style={{ width: `${Math.max(12, Math.min(100, stat.value))}%` }}
                />
              </div>
              <span className="text-slate-300 font-mono text-[11px] w-12 text-right tabular-nums">
                {stat.raw}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button: Equip / Locked */}
        <div className="mt-auto">
          {isUnlocked ? (
            <button
              onClick={() => {
                sound.playClick();
                onEquipPen(currentPen.id);
              }}
              disabled={isEquipped}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isEquipped
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-lg border-b-3 border-amber-600 active:scale-98'
              }`}
            >
              {isEquipped ? (
                <>
                  <span>✓</span>
                  <span>{t.equipped}</span>
                </>
              ) : (
                <span>{t.equip}</span>
              )}
            </button>
          ) : (
            <div className="w-full py-3 px-6 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2">
              <span>🔒</span>
              <span>{t.unlockAtLevel} {currentPen.unlockLevel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
