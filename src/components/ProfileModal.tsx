/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerProfile, GameSettings } from '../types/game';
import { AVATARS_CATALOG, PENS_CATALOG } from '../data/pens';
import { getTranslation } from '../services/localization';
import { sound } from '../services/sound';

interface ProfileModalProps {
  profile: PlayerProfile;
  settings: GameSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (updated: PlayerProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  settings,
  isOpen,
  onClose,
  onSaveProfile,
}) => {
  const t = getTranslation(settings.language);
  const [nickname, setNickname] = useState(profile.nickname);
  const [selectedAvatarId, setSelectedAvatarId] = useState(profile.avatarId);
  const [isEditingName, setIsEditingName] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    sound.playClick();
    onSaveProfile({
      ...profile,
      nickname: nickname.trim() || profile.nickname,
      avatarId: selectedAvatarId,
    });
    setIsEditingName(false);
  };

  const favoritePen = PENS_CATALOG.find(p => p.id === profile.favoritePenId) || PENS_CATALOG[0];
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
          {t.profileTitle}
        </h2>

        {/* Student ID Card Showcase */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-5 mb-5 shadow-inner">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-lg border-2 border-amber-300">
                {AVATARS_CATALOG.find(a => a.id === selectedAvatarId)?.icon || '🎓'}
              </div>
              <span className="absolute -bottom-1.5 -right-1 px-1.5 py-0.5 rounded-full bg-slate-900 border border-amber-400 text-[10px] font-black text-amber-300">
                {t.level} {profile.level}
              </span>
            </div>

            {/* Nickname & School Desk Title */}
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value.slice(0, 16))}
                    className="bg-slate-800 text-white text-sm font-bold px-3 py-1.5 rounded-xl border border-amber-400 focus:outline-none w-full"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    {profile.nickname}
                  </h3>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setIsEditingName(true);
                    }}
                    className="text-slate-400 hover:text-amber-300 text-xs p-1"
                    title="Edit Name"
                  >
                    ✏️
                  </button>
                </div>
              )}
              <div className="text-xs text-amber-300/80 mt-0.5">
                Classroom Pen Fighter · {profile.xp} XP
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">{t.wins}</span>
              <span className="text-sm font-black text-amber-400 tabular-nums">{profile.wins}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">{t.winRate}</span>
              <span className="text-sm font-black text-sky-400 tabular-nums">{winRate}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">{t.bestStreak}</span>
              <span className="text-sm font-black text-emerald-400 tabular-nums">{profile.bestStreak}</span>
            </div>
          </div>
        </div>

        {/* Avatar Selection Grid */}
        <div className="mb-5">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            {t.chooseAvatar}
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {AVATARS_CATALOG.map(avatar => {
              const isUnlocked = profile.unlockedAvatars.includes(avatar.id) || profile.level >= avatar.unlockLevel;
              const isSelected = selectedAvatarId === avatar.id;
              const avatarName = settings.language === 'bn' ? avatar.nameBn : avatar.name;

              return (
                <button
                  key={avatar.id}
                  disabled={!isUnlocked}
                  onClick={() => {
                    sound.playClick();
                    setSelectedAvatarId(avatar.id);
                    onSaveProfile({ ...profile, avatarId: avatar.id });
                  }}
                  className={`relative p-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 shadow-md ring-2 ring-amber-400/20'
                      : isUnlocked
                      ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-500 text-slate-200'
                      : 'bg-slate-950/40 border-slate-800 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span className="text-2xl mb-1">{avatar.icon}</span>
                  <span className="text-[10px] font-semibold text-center leading-tight truncate w-full">
                    {avatarName}
                  </span>
                  {!isUnlocked && (
                    <span className="absolute top-1 right-1 text-[9px] bg-slate-900 px-1 rounded text-slate-400">
                      Lvl {avatar.unlockLevel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Favorite Pen Showcase */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖊️</span>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">{t.favPen}</span>
              <span className="text-xs font-bold text-white">
                {settings.language === 'bn' ? favoritePen.nameBn : favoritePen.name}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-400/30">
            ★ {favoritePen.category}
          </span>
        </div>
      </div>
    </div>
  );
};
