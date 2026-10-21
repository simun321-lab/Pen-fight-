/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NotificationItem, ChallengeRequest } from '../types/multiplayer';
import { sound } from '../services/sound';

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  isOpen: boolean;
  onClose: () => void;
  onAcceptChallenge: (challengeId: string) => void;
  onDeclineChallenge: (challengeId: string) => void;
  onAcceptFriend: (requestId: string) => void;
  onDeclineFriend: (requestId: string) => void;
  onClearAll: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isOpen,
  onClose,
  onAcceptChallenge,
  onDeclineChallenge,
  onAcceptFriend,
  onDeclineFriend,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 z-50 w-80 md:w-96 bg-slate-900 border border-slate-700/85 rounded-3xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white font-heading">Notifications</span>
          {notifications.length > 0 && (
            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full">
              {notifications.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={() => {
                sound.playClick();
                onClearAll();
              }}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No new notifications.
          </div>
        ) : (
          notifications.map(item => {
            const isChallenge = item.type === 'challenge' && item.data;
            const isFriendReq = item.type === 'friend_request' && item.data;
            const challengeData = item.data as ChallengeRequest | undefined;

            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-300">{item.title}</span>
                  <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                </div>
                <p className="text-slate-300 leading-snug mb-2">{item.message}</p>

                {/* Challenge Action Buttons */}
                {isChallenge && challengeData && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        onAcceptChallenge(challengeData.id);
                        onClose();
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] transition-colors"
                    >
                      Accept Duel
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        onDeclineChallenge(challengeData.id);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {/* Friend Request Action Buttons */}
                {isFriendReq && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        onAcceptFriend(item.id);
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        onDeclineFriend(item.id);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
