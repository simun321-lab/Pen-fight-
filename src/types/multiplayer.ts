/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TeamId } from './game';

export type UserStatus = 'online' | 'offline' | 'in-match' | 'away';

export interface UserAccount {
  id: string; // permanent player ID (e.g. PF-7821)
  username: string; // unique lowercase handle
  displayName: string;
  avatarId: string;
  avatarUrl?: string;
  isGuest: boolean;
  token?: string; // session auth token
  createdAt: string;
  status: UserStatus;
  rating1v1: number;
  highestRating1v1: number;
  rating3p: number;
  highestRating3p: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Grandmaster';
  stats: {
    matches1v1: number;
    wins1v1: number;
    matches3p: number;
    wins3p: number;
    currentStreak: number;
    bestStreak: number;
    totalKnockouts: number;
  };
  favoritePenId: string;
  unlockedAchievements: string[];
}

export interface FriendEntry {
  id: string; // UserAccount.id
  username: string;
  displayName: string;
  avatarId: string;
  status: UserStatus;
  currentMatchRoomId?: string;
  level: number;
  rating1v1: number;
  favoritePenId: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatarId: string;
  toUserId: string;
  createdAt: string;
}

export type ChallengeType = 'duel-1v1' | 'ffa-3p';

export interface ChallengeRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatarId: string;
  toUserId: string;
  toUsername: string;
  type: ChallengeType;
  createdAt: string;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface NotificationItem {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'challenge' | 'challenge_declined' | 'room_invite' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
}

export interface RoomParticipant {
  userId: string;
  username: string;
  displayName: string;
  avatarId: string;
  equippedPenId: string;
  team: TeamId;
  isHost: boolean;
  isReady: boolean;
  connected: boolean;
  score: number;
}

export interface OnlineRoom {
  id: string; // unique room code (e.g. DESK88)
  name: string;
  hostId: string;
  type: 'duel-1v1' | 'ffa-3p';
  capacity: 2 | 3;
  isPublic: boolean;
  password?: string;
  status: 'waiting' | 'in-match' | 'finished';
  participants: RoomParticipant[];
  deskTheme: 'classroom-teak' | 'classic-oak' | 'dark-mahogany' | 'chalkboard-green';
  seriesLength: number; // 1, 3, or 5
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId?: string;
  userId: string;
  username: string;
  displayName: string;
  avatarId: string;
  text: string;
  isEmote?: boolean;
  timestamp: string;
}

export interface OnlineMatchRecord {
  id: string;
  type: 'duel-1v1' | 'ffa-3p';
  date: string;
  durationSeconds: number;
  participants: Array<{
    userId: string;
    username: string;
    displayName: string;
    avatarId: string;
    placement: number; // 1, 2, or 3
    knockouts: number;
    ratingDelta: number;
    newRating: number;
  }>;
  winnerId: string;
  winnerName: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  icon: string;
  xpReward: number;
}
