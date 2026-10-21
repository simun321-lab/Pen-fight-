/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerProfile, GameSettings } from '../types/game';
import { UserAccount, NotificationItem } from '../types/multiplayer';
import { getTranslation } from '../services/localization';
import { sound } from '../services/sound';
import { AVATARS_CATALOG } from '../data/pens';

interface MainMenuProps {
  profile: PlayerProfile;
  settings: GameSettings;
  currentUser: UserAccount | null;
  notifications: NotificationItem[];
  onOpenModeSelect: () => void;
  onOpenMultiplayer: () => void;
  onOpenPenLocker: () => void;
  onOpenProfile: () => void;
  onOpenStats: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onOpenAchievements: () => void;
  onOpenAuth: () => void;
  onOpenNotifications: () => void;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  profile,
  settings,
  currentUser,
  notifications,
  onOpenModeSelect,
  onOpenMultiplayer,
  onOpenPenLocker,
  onOpenProfile,
  onOpenStats,
  onOpenLeaderboard,
  onOpenSettings,
  onOpenRules,
  onOpenAchievements,
  onOpenAuth,
  onOpenNotifications,
  onToggleMute,
}) => {
  const t = getTranslation(settings.language);
  const currentAvatar = AVATARS_CATALOG.find(a => a.id === (currentUser?.avatarId || profile.avatarId)) || AVATARS_CATALOG[0];

  const currentLevelBaseXp = ((profile.level - 1) ** 2) * 100;
  const nextLevelXp = (profile.level ** 2) * 100;
  const xpInCurrentLevel = Math.max(0, profile.xp - currentLevelBaseXp);
  const xpNeeded = Math.max(1, nextLevelXp - currentLevelBaseXp);
  const xpPercent = Math.min(100, Math.floor((xpInCurrentLevel / xpNeeded) * 100));

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 overflow-y-auto select-none bg-slate-950">
      {/* Background school desk ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40 wood-pattern" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90" />

      {/* Top Header Bar: Profile Badge, Notifications, Settings */}
      <header className="relative z-10 flex items-center justify-between gap-3">
        {/* Student Profile Badge */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenProfile();
          }}
          className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 hover:border-amber-400/60 transition-all rounded-2xl p-2.5 pr-4 text-left group shadow-lg"
          title="Student Profile"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
            {currentAvatar.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-100 group-hover:text-amber-300 transition-colors">
                {currentUser?.displayName || profile.nickname}
              </span>
              <span className="text-[11px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {t.level} {profile.level}
              </span>
            </div>
            {/* Player ID & XP */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-amber-300/80 font-mono">
                {currentUser ? currentUser.id : `${profile.xp} ${t.xp}`}
              </span>
            </div>
          </div>
        </button>

        {/* Quick Utility Buttons (Notifications, Account, Sound, Settings) */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenNotifications();
            }}
            className="relative w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-400 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-md"
            title="Notifications"
          >
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center ring-2 ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Account / Auth Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenAuth();
            }}
            className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-sky-400 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-md"
            title={currentUser?.isGuest ? 'Upgrade Account' : 'Account'}
          >
            <span className="text-lg">{currentUser?.isGuest ? '👤' : '🛡️'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              onToggleMute();
              sound.playClick();
            }}
            className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-md"
            title={settings.soundEnabled ? 'Mute' : 'Unmute'}
            aria-label="Toggle Sound"
          >
            {settings.soundEnabled ? (
              <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-md"
            title={t.settings}
            aria-label={t.settings}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Centerpiece: Title Lockup & Crossed Pens Illustration */}
      <main className="relative z-10 flex flex-col items-center justify-center my-auto py-5 text-center">
        {/* Bespoke Crossed Pens Vector Icon */}
        <div className="relative mb-2 flex items-center justify-center">
          <svg className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]" viewBox="0 0 120 120" fill="none">
            {/* Crossed Pen 1 (Blue Ballpoint) */}
            <g transform="rotate(-45 60 60)">
              <rect x="22" y="58" width="76" height="10" rx="3" fill="rgba(0,0,0,0.3)" />
              <rect x="20" y="55" width="54" height="10" rx="2" fill="#2563eb" />
              <rect x="20" y="55" width="54" height="3" fill="#60a5fa" />
              <rect x="54" y="55" width="16" height="10" fill="#1d4ed8" />
              <line x1="58" y1="55" x2="58" y2="65" stroke="#3b82f6" strokeWidth="1" />
              <line x1="62" y1="55" x2="62" y2="65" stroke="#3b82f6" strokeWidth="1" />
              <polygon points="74,55 94,60 74,65" fill="#cbd5e1" />
              <circle cx="94" cy="60" r="1.5" fill="#475569" />
              <rect x="12" y="53.5" width="18" height="13" rx="2" fill="#1e3a8a" />
              <rect x="18" y="51" width="14" height="2.5" rx="1" fill="#93c5fd" />
            </g>

            {/* Crossed Pen 2 (Red Heavy Ballpoint) */}
            <g transform="rotate(45 60 60)">
              <rect x="22" y="58" width="76" height="10" rx="3" fill="rgba(0,0,0,0.3)" />
              <rect x="20" y="55" width="54" height="10" rx="2" fill="#dc2626" />
              <rect x="20" y="55" width="54" height="3" fill="#f87171" />
              <rect x="54" y="55" width="16" height="10" fill="#991b1b" />
              <polygon points="74,55 94,60 74,65" fill="#e2e8f0" />
              <circle cx="94" cy="60" r="1.5" fill="#1e293b" />
              <rect x="12" y="53.5" width="18" height="13" rx="2" fill="#7f1d1d" />
              <rect x="18" y="51" width="14" height="2.5" rx="1" fill="#fca5a5" />
            </g>

            {/* Central Impact Spark */}
            <circle cx="60" cy="60" r="4" fill="#facc15" />
            <path d="M60 52 L62 58 L68 60 L62 62 L60 68 L58 62 L52 60 L58 58 Z" fill="#fef08a" />
          </svg>
        </div>

        {/* Title Lockup */}
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white font-heading uppercase drop-shadow-md">
          PEN <span className="text-amber-400">FIGHT</span>
        </h1>
        <p className="text-sm md:text-base font-semibold text-amber-200/90 tracking-wide mt-0.5">
          THE SCHOOL DESK SERIES
        </p>

        {/* Action CTAs */}
        <div className="mt-6 w-full max-w-xs px-2 space-y-2.5">
          {/* Online Classroom Multiplayer CTA */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenMultiplayer();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm md:text-base tracking-wider uppercase shadow-[0_8px_25px_rgba(56,189,248,0.35)] active:translate-y-0.5 transition-all flex items-center justify-center gap-2.5 border-b-4 border-blue-800 cursor-pointer"
          >
            <span>🌐</span>
            <span>ONLINE CLASSROOM</span>
            <span className="text-[10px] bg-sky-300 text-slate-950 px-1.5 py-0.2 rounded font-black">
              LIVE 2P & 3P
            </span>
          </button>

          {/* Local / AI Match Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenModeSelect();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-md active:translate-y-0.5 transition-all flex items-center justify-center gap-2 border-b-3 border-amber-600 cursor-pointer"
          >
            <span>▶</span>
            <span>{t.playNow} (AI & Local 2P)</span>
          </button>
        </div>

        {/* Online Rating & Streak Strip */}
        <div className="flex items-center gap-4 mt-5 px-4 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 tabular-nums">
          <div>
            <span className="text-sky-400 font-bold">{currentUser?.rating1v1 || 1000}</span> 1v1 ELO
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-600" />
          <div>
            <span className="text-amber-400 font-bold">{currentUser?.rating3p || 1000}</span> 3P ELO
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-600" />
          <div>
            <span className="text-emerald-400 font-bold">{currentUser?.stats.currentStreak || 0}</span> Streak 🔥
          </div>
        </div>
      </main>

      {/* Bottom Menu Navigation Grid */}
      <footer className="relative z-10 w-full max-w-lg mx-auto pt-2">
        <div className="grid grid-cols-5 gap-2 mb-2">
          {/* Pen Locker */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenPenLocker();
            }}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-400/50 hover:bg-slate-800/80 transition-all text-slate-300 hover:text-white group shadow"
          >
            <div className="text-lg mb-0.5 group-hover:scale-110 transition-transform">🖊️</div>
            <span className="text-[10px] font-semibold text-center leading-tight truncate w-full">{t.penLocker}</span>
          </button>

          {/* Achievements */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenAchievements();
            }}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-yellow-400/50 hover:bg-slate-800/80 transition-all text-slate-300 hover:text-white group shadow"
          >
            <div className="text-lg mb-0.5 group-hover:scale-110 transition-transform">🏅</div>
            <span className="text-[10px] font-semibold text-center leading-tight truncate w-full">Badges</span>
          </button>

          {/* Stats */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenStats();
            }}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-sky-400/50 hover:bg-slate-800/80 transition-all text-slate-300 hover:text-white group shadow"
          >
            <div className="text-lg mb-0.5 group-hover:scale-110 transition-transform">📊</div>
            <span className="text-[10px] font-semibold text-center leading-tight truncate w-full">{t.stats}</span>
          </button>

          {/* Leaderboard */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-yellow-400/50 hover:bg-slate-800/80 transition-all text-slate-300 hover:text-white group shadow"
          >
            <div className="text-lg mb-0.5 group-hover:scale-110 transition-transform">🏆</div>
            <span className="text-[10px] font-semibold text-center leading-tight truncate w-full">{t.leaderboard}</span>
          </button>

          {/* Rules */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenRules();
            }}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-400/50 hover:bg-slate-800/80 transition-all text-slate-300 hover:text-white group shadow"
          >
            <div className="text-lg mb-0.5 group-hover:scale-110 transition-transform">📖</div>
            <span className="text-[10px] font-semibold text-center leading-tight truncate w-full">{t.howToPlay}</span>
          </button>
        </div>

        {/* Small version footer */}
        <div className="text-center text-[10px] text-slate-500 font-mono tracking-wider">
          {t.version} · Realtime Multiplayer
        </div>
      </footer>
    </div>
  );
};
