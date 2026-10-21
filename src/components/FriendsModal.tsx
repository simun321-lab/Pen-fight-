/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types/multiplayer';
import { api } from '../services/api';
import { sound } from '../services/sound';
import { AVATARS_CATALOG } from '../data/pens';

interface FriendsModalProps {
  currentUser: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onChallengePlayer: (targetUserId: string, type: 'duel-1v1' | 'ffa-3p') => void;
  onViewProfile: (userId: string) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onChallengePlayer,
  onViewProfile,
}) => {
  const [tab, setTab] = useState<'friends' | 'search' | 'blocked'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserAccount[]>([]);
  const [searching, setSearching] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.searchUsers(searchQuery.trim());
        setSearchResults(res.users.filter(u => u.id !== currentUser?.id));
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.id]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
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
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-2xl border border-emerald-500/30">
            👥
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight">
              Friends & Challenges
            </h2>
            <p className="text-xs text-slate-400">
              Connect with classmates and initiate live desk battles
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-4">
          <button
            onClick={() => {
              sound.playClick();
              setTab('friends');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'friends' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            My Friends
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setTab('search');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'search' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Search Students
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setTab('blocked');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'blocked' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Blocked
          </button>
        </div>

        {/* Tab 1: Friends List */}
        {tab === 'friends' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="p-8 text-center text-slate-500">
              <span className="text-3xl block mb-2">🤝</span>
              <span className="text-sm font-bold text-slate-300 block mb-1">Search for Classmates</span>
              <span className="text-xs text-slate-400 block max-w-xs mx-auto mb-3">
                Use the Search tab above to find players by username or Player ID and challenge them to a pen duel!
              </span>
              <button
                onClick={() => setTab('search')}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Find Players Now
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Search Students */}
        {tab === 'search' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by username or Player ID (e.g. PF-12345)..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {searching ? (
                <div className="text-center py-8 text-xs text-slate-400">Searching classrooms...</div>
              ) : searchResults.length === 0 && searchQuery ? (
                <div className="text-center py-8 text-xs text-slate-500">No student found matching &ldquo;{searchQuery}&rdquo;</div>
              ) : (
                searchResults.map(user => {
                  const avatar = AVATARS_CATALOG.find(a => a.id === user.avatarId) || AVATARS_CATALOG[0];
                  return (
                    <div
                      key={user.id}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1"
                        onClick={() => onViewProfile(user.id)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                          {avatar.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white hover:text-amber-300 transition-colors">
                              {user.displayName}
                            </span>
                            <span className="text-[10px] text-slate-400">@{user.username}</span>
                          </div>
                          <span className="text-[10px] text-amber-300 font-mono">
                            ID: {user.id} · 1v1: {user.rating1v1} ELO
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            sound.playClick();
                            onChallengePlayer(user.id, 'duel-1v1');
                            showToast(`1v1 Challenge sent to @${user.username}!`);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-[11px] font-bold transition-colors"
                          title="Challenge to 1v1 Duel"
                        >
                          ⚔️ 1v1
                        </button>
                        <button
                          onClick={() => {
                            sound.playClick();
                            onChallengePlayer(user.id, 'ffa-3p');
                            showToast(`3-Player FFA Challenge sent to @${user.username}!`);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-[11px] font-bold transition-colors"
                          title="Challenge to 3-Player FFA"
                        >
                          👑 3P
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Blocked Users */}
        {tab === 'blocked' && (
          <div className="flex-1 overflow-y-auto p-4 text-center text-xs text-slate-500">
            No blocked students. You can block any player directly from their profile card to prevent challenges or invitations.
          </div>
        )}

        {toastMsg && (
          <div className="mt-3 p-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold text-center">
            {toastMsg}
          </div>
        )}
      </div>
    </div>
  );
};
