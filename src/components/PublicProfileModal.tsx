/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types/multiplayer';
import { api } from '../services/api';
import { sound } from '../services/sound';
import { AVATARS_CATALOG, PENS_CATALOG } from '../data/pens';

interface PublicProfileModalProps {
  userId: string | null;
  currentUserId?: string;
  isOpen: boolean;
  onClose: () => void;
  onChallengePlayer: (userId: string, type: 'duel-1v1' | 'ffa-3p') => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  userId,
  currentUserId,
  isOpen,
  onClose,
  onChallengePlayer,
}) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !isOpen) return;
    setLoading(true);
    api.getUserProfile(userId)
      .then(res => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [userId, isOpen]);

  if (!isOpen || !userId) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopyId = () => {
    if (user && navigator.clipboard) {
      sound.playClick();
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const avatar = AVATARS_CATALOG.find(a => a.id === user?.avatarId) || AVATARS_CATALOG[0];
  const favoritePen = PENS_CATALOG.find(p => p.id === user?.favoritePenId) || PENS_CATALOG[0];

  const winRate1v1 = user && user.stats.matches1v1 > 0 ? Math.round((user.stats.wins1v1 / user.stats.matches1v1) * 100) : 0;
  const winRate3p = user && user.stats.matches3p > 0 ? Math.round((user.stats.wins3p / user.stats.matches3p) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
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

        {loading || !user ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading student profile...</div>
        ) : (
          <div>
            {/* Header / Avatar & Names */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-lg border-2 border-amber-300 shrink-0">
                {avatar.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white truncate">
                    {user.displayName}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                    {user.tier}
                  </span>
                </div>
                <span className="text-xs text-slate-400 block font-mono">@{user.username}</span>

                {/* Player ID with copy button */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-amber-300/90 font-mono font-bold">{user.id}</span>
                  <button
                    onClick={handleCopyId}
                    className="text-[10px] text-slate-400 hover:text-white underline"
                  >
                    {copiedId ? 'Copied!' : 'Copy ID'}
                  </button>
                </div>
              </div>
            </div>

            {/* Online Status */}
            <div className="flex items-center gap-2 text-xs mb-4">
              <span className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-emerald-400' : user.status === 'in-match' ? 'bg-amber-400' : 'bg-slate-500'}`} />
              <span className="text-slate-300 font-semibold capitalize">
                {user.status === 'in-match' ? 'In Active Match' : user.status === 'online' ? 'Online' : 'Offline'}
              </span>
              <span className="text-slate-500 text-[10px]">· Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Ratings & Streaks Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">1v1 Rating</span>
                  <span className="text-xl font-black text-sky-400 tabular-nums">{user.rating1v1}</span>
                  <span className="text-[9px] text-slate-500 block">Peak: {user.highestRating1v1}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">3-Player Rating</span>
                  <span className="text-xl font-black text-amber-400 tabular-nums">{user.rating3p}</span>
                  <span className="text-[9px] text-slate-500 block">Peak: {user.highestRating3p}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">1v1 Win Rate</span>
                  <span className="font-bold text-white tabular-nums">{winRate1v1}%</span>
                  <span className="text-[9px] text-slate-500">{user.stats.wins1v1}/{user.stats.matches1v1}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">3P Win Rate</span>
                  <span className="font-bold text-white tabular-nums">{winRate3p}%</span>
                  <span className="text-[9px] text-slate-500">{user.stats.wins3p}/{user.stats.matches3p}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Streak</span>
                  <span className="font-bold text-emerald-400 tabular-nums">{user.stats.currentStreak} 🔥</span>
                  <span className="text-[9px] text-slate-500">Best: {user.stats.bestStreak}</span>
                </div>
              </div>
            </div>

            {/* Favorite Pen */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🖊️</span>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Signature Pen</span>
                  <span className="text-xs font-bold text-white">{favoritePen.name}</span>
                </div>
              </div>
              <span className="text-[10px] text-amber-300 font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {favoritePen.category}
              </span>
            </div>

            {/* Actions: Challenge 1v1 / 3P */}
            {user.id !== currentUserId && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onChallengePlayer(user.id, 'duel-1v1');
                      showToast('1v1 Challenge sent!');
                    }}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>⚔️</span>
                    <span>Challenge 1v1</span>
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onChallengePlayer(user.id, 'ffa-3p');
                      showToast('3-Player FFA Challenge sent!');
                    }}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs uppercase shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>👑</span>
                    <span>Challenge 3P</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    onClick={async () => {
                      sound.playClick();
                      await api.reportPlayer(user.id, 'Inappropriate behavior');
                      showToast('Player reported to school board.');
                    }}
                    className="text-slate-500 hover:text-rose-400 transition-colors text-[11px]"
                  >
                    Report Player
                  </button>
                  <button
                    onClick={async () => {
                      sound.playClick();
                      await api.blockPlayer(user.id, true);
                      showToast(`Blocked @${user.username}`);
                    }}
                    className="text-slate-500 hover:text-rose-400 transition-colors text-[11px]"
                  >
                    Block Player
                  </button>
                </div>
              </div>
            )}

            {toastMsg && (
              <div className="mt-3 p-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold text-center">
                {toastMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
