/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount } from '../types/multiplayer';
import { sound } from '../services/sound';

interface MultiplayerMenuModalProps {
  currentUser: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onJoinQueue: (mode: 'duel-1v1' | 'ffa-3p') => void;
  onCreateRoom: (capacity: 2 | 3, isPublic: boolean, password?: string) => void;
  onJoinRoomCode: (code: string) => void;
  onOpenRoomBrowser: () => void;
  onOpenFriends: () => void;
  onOpenAuth: () => void;
}

export const MultiplayerMenuModal: React.FC<MultiplayerMenuModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onJoinQueue,
  onCreateRoom,
  onJoinRoomCode,
  onOpenRoomBrowser,
  onOpenFriends,
  onOpenAuth,
}) => {
  const [view, setView] = useState<'main' | 'create' | 'join'>('main');
  const [capacity, setCapacity] = useState<2 | 3>(2);
  const [isPublic, setIsPublic] = useState(true);
  const [roomPassword, setRoomPassword] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
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

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-2xl border border-sky-400/30">
            🌐
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight">
              Online Classroom
            </h2>
            <p className="text-xs text-slate-400">
              Real-time Pen Fight battles across classrooms
            </p>
          </div>
        </div>

        {/* User Card Strip */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎓</span>
            <div>
              <span className="text-xs font-bold text-white block">
                {currentUser?.displayName || 'Student'}
              </span>
              <span className="text-[10px] text-amber-300 font-mono">
                1v1: {currentUser?.rating1v1 || 1000} ELO · 3P: {currentUser?.rating3p || 1000} ELO
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onOpenAuth();
            }}
            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 transition-colors"
          >
            {currentUser?.isGuest ? 'Upgrade' : 'Account'}
          </button>
        </div>

        {view === 'main' && (
          <div className="space-y-3">
            {/* 1. Quick 1v1 Duel */}
            <button
              onClick={() => {
                sound.playClick();
                onJoinQueue('duel-1v1');
              }}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-sky-950/70 to-slate-900 border border-sky-500/40 hover:border-sky-400 transition-all text-left flex items-center justify-between group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-2xl border border-sky-400/30 group-hover:scale-105 transition-transform">
                  ⚔️
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Quick 1v1 Duel</span>
                  <span className="text-[11px] text-slate-400 block">Instant matchmaking against another student</span>
                </div>
              </div>
              <span className="text-sm text-sky-400 font-bold">Match →</span>
            </button>

            {/* 2. Quick 3-Player Free-for-All */}
            <button
              onClick={() => {
                sound.playClick();
                onJoinQueue('ffa-3p');
              }}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 to-slate-900 border border-amber-500/40 hover:border-amber-400 transition-all text-left flex items-center justify-between group shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl border border-amber-400/30 group-hover:scale-105 transition-transform">
                  👑
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">3-Player Free-for-All (FFA)</span>
                  <span className="text-[11px] text-slate-400 block">3 students, 3 corners, 1 desk champion</span>
                </div>
              </div>
              <span className="text-sm text-amber-400 font-bold">Match →</span>
            </button>

            {/* Grid: Create Room & Join Room */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => {
                  sound.playClick();
                  setView('create');
                }}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-600 transition-all text-left"
              >
                <div className="text-xl mb-1">🏠</div>
                <span className="text-xs font-bold text-white block">Create Room</span>
                <span className="text-[10px] text-slate-400 block">Custom 2P or 3P lobby</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setView('join');
                }}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-600 transition-all text-left"
              >
                <div className="text-xl mb-1">🔑</div>
                <span className="text-xs font-bold text-white block">Join with Code</span>
                <span className="text-[10px] text-slate-400 block">Enter a friend's room code</span>
              </button>
            </div>

            {/* Public Room Browser & Friends shortcuts */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenRoomBrowser();
                }}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-bold flex items-center justify-center gap-2"
              >
                <span>📋</span>
                <span>Room Browser</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenFriends();
                }}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-bold flex items-center justify-center gap-2"
              >
                <span>👥</span>
                <span>Friends & Challenges</span>
              </button>
            </div>
          </div>
        )}

        {/* View 2: Create Room */}
        {view === 'create' && (
          <div className="space-y-4">
            <button
              onClick={() => setView('main')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold"
            >
              ← Back to Modes
            </button>

            {/* Capacity: 2 Players or 3 Players */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Room Capacity & Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCapacity(2)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    capacity === 2
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-sm text-white block">2-Player Duel</span>
                  <span className="text-[10px] text-slate-400">Best of 3 series format</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCapacity(3)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    capacity === 3
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-sm text-white block">3-Player FFA</span>
                  <span className="text-[10px] text-slate-400">3 players free-for-all</span>
                </button>
              </div>
            </div>

            {/* Room Visibility */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                    isPublic ? 'bg-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Public (Listed in Browser)
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                    !isPublic ? 'bg-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Private (Code Only)
                </button>
              </div>
            </div>

            {/* Optional Room Password */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Password (Optional)
              </label>
              <input
                type="text"
                value={roomPassword}
                onChange={e => setRoomPassword(e.target.value.slice(0, 10))}
                placeholder="Leave blank for open lobby"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onCreateRoom(capacity, isPublic, roomPassword || undefined);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg transition-all border-b-3 border-amber-600"
            >
              Create Room & Open Lobby
            </button>
          </div>
        )}

        {/* View 3: Join Room with Code */}
        {view === 'join' && (
          <div className="space-y-4">
            <button
              onClick={() => setView('main')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold"
            >
              ← Back to Modes
            </button>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Enter Room Code
              </label>
              <input
                type="text"
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="e.g. DESK82"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono font-bold tracking-widest text-center text-amber-300 focus:outline-none"
                autoFocus
              />
              <span className="text-[10px] text-slate-400 block mt-1 text-center">
                Ask the room host for their 5 or 6-character room code.
              </span>
            </div>

            <button
              disabled={joinCodeInput.trim().length < 4}
              onClick={() => {
                sound.playClick();
                onJoinRoomCode(joinCodeInput.trim());
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-b from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg transition-all border-b-3 border-amber-600 disabled:opacity-50"
            >
              Join Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
