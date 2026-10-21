/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OnlineRoom } from '../types/multiplayer';
import { api } from '../services/api';
import { sound } from '../services/sound';

interface RoomBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomCode: string) => void;
}

export const RoomBrowserModal: React.FC<RoomBrowserModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
}) => {
  const [rooms, setRooms] = useState<OnlineRoom[]>([]);
  const [filter, setFilter] = useState<'all' | 'duel-1v1' | 'ffa-3p'>('all');
  const [loading, setLoading] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await api.getPublicRooms(filter === 'all' ? undefined : filter);
      setRooms(res.rooms);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRooms();
    }
  }, [isOpen, filter]);

  if (!isOpen) return null;

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
        <div className="flex items-center justify-between pr-8 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-300 flex items-center justify-center text-2xl border border-sky-500/30">
              📋
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight">
                Public Room Browser
              </h2>
              <p className="text-xs text-slate-400">
                Join an active waiting lobby with other students
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              fetchRooms();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            title="Refresh Rooms"
          >
            🔄
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Capacities
          </button>
          <button
            onClick={() => setFilter('duel-1v1')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'duel-1v1' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            2-Player Duels
          </button>
          <button
            onClick={() => setFilter('ffa-3p')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'ffa-3p' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            3-Player FFA
          </button>
        </div>

        {/* Rooms List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading public lobbies...</div>
          ) : rooms.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <span className="text-3xl block mb-2">🪑</span>
              <span className="text-xs block text-slate-400 mb-1">No public lobbies open right now</span>
              <span className="text-[11px] block">Create your own room or queue up for Quick Match!</span>
            </div>
          ) : (
            rooms.map(room => (
              <div
                key={room.id}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-bold text-white">
                      {room.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      [{room.id}]
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {room.type === 'ffa-3p' ? '3-Player Free-for-All' : '2-Player Duel'} · Occupancy: {room.participants.length}/{room.capacity}
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    onJoinRoom(room.id);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold uppercase transition-colors"
                >
                  Join
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
