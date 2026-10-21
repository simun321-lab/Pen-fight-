/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount } from '../types/multiplayer';
import { api } from '../services/api';
import { sound } from '../services/sound';
import { AVATARS_CATALOG } from '../data/pens';

interface AuthModalProps {
  currentUser: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount, token: string) => void;
  onSignOut: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onAuthSuccess,
  onSignOut,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'upgrade'>(currentUser?.isGuest ? 'upgrade' : 'login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('av-topper');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await api.login(username, password);
        sound.playClick();
        onAuthSuccess(res.user, res.token);
        onClose();
      } else if (tab === 'register') {
        const res = await api.register(username, displayName || username, selectedAvatarId, password);
        sound.playClick();
        onAuthSuccess(res.user, res.token);
        onClose();
      } else if (tab === 'upgrade') {
        const res = await api.upgradeGuest(username, displayName || username, password);
        sound.playClick();
        onAuthSuccess(res.user, api.getToken() || '');
        onClose();
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

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

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-2xl border border-amber-500/30">
            👤
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight">
              {currentUser && !currentUser.isGuest ? 'Account Settings' : 'Player Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {currentUser?.isGuest ? 'Playing as Guest · Upgrade to save permanent stats' : 'Sign in to access online duels & 3P battles'}
            </p>
          </div>
        </div>

        {/* Current User Status Banner */}
        {currentUser && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-xl">
                {AVATARS_CATALOG.find(a => a.id === currentUser.avatarId)?.icon || '🎓'}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {currentUser.displayName} <span className="text-slate-400 font-normal">(@{currentUser.username})</span>
                </span>
                <span className="text-[10px] text-amber-300 font-mono block">
                  ID: {currentUser.id} {currentUser.isGuest && '· (Guest)'}
                </span>
              </div>
            </div>

            {!currentUser.isGuest && (
              <button
                onClick={() => {
                  sound.playClick();
                  onSignOut();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        )}

        {/* Tab switchers if not logged in or guest */}
        {(!currentUser || currentUser.isGuest) && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-5">
            {currentUser?.isGuest ? (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setTab('upgrade');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === 'upgrade' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Upgrade to Account
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setTab('login');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    tab === 'login' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setTab('register');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    tab === 'register' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        )}

        {/* Auth Form */}
        {(!currentUser || currentUser.isGuest) && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Unique Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16))}
                placeholder="e.g. shadow_striker"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                3–16 letters, numbers, or underscores.
              </span>
            </div>

            {(tab === 'register' || tab === 'upgrade') && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value.slice(0, 20))}
                  placeholder="e.g. School Legend"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            {(tab === 'register' || tab === 'upgrade') && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATARS_CATALOG.slice(0, 4).map(av => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatarId(av.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        selectedAvatarId === av.id
                          ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl mb-0.5">{av.icon}</span>
                      <span className="text-[10px] text-slate-300 truncate w-full text-center">{av.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all border-b-3 border-amber-600 mt-2 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : tab === 'register' ? 'Register Account' : 'Upgrade Guest Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
