/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'vs-ai' | 'local-2p' | 'practice';

export type AIDifficulty = 'easy' | 'normal' | 'hard' | 'master';

export type TeamId = 'player1' | 'player2' | 'player3';

export type TurnPhase = 'aiming' | 'simulating' | 'round-settling' | 'round-over' | 'match-over';

export type DeskTheme = 'classic-oak' | 'classroom-teak' | 'dark-mahogany' | 'chalkboard-green';

export interface PenStats {
  mass: number;         // 1.0 (light) - 2.5 (heavy)
  length: number;       // 85 - 130 px
  width: number;        // 13 - 22 px
  grip: number;         // 0.6 (slippery) - 1.4 (high friction)
  restitution: number;  // 0.4 (soft) - 0.78 (bouncy)
  stability: number;    // 0.5 (spins easily) - 1.5 (very stable straight shots)
}

export interface PenColors {
  barrel: string;
  barrelEnd: string;
  cap: string;
  clip: string;
  grip: string;
  tip: string;
  accent: string;
}

export interface PenDef {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  category: 'starter' | 'standard' | 'heavy' | 'precision' | 'legendary';
  stats: PenStats;
  colors: PenColors;
  unlockLevel: number;
  style: 'classic' | 'modern' | 'vintage' | 'metallic';
}

export interface PenInstance {
  id: string;
  team: TeamId;
  penDefId: string;
  // Position (center of mass)
  x: number;
  y: number;
  // Linear velocity
  vx: number;
  vy: number;
  // Rotation in radians
  angle: number;
  // Angular velocity in radians per second
  angularVelocity: number;
  // State
  eliminated: boolean;
  fallProgress: number; // 0 = fully on desk, 1 = fallen off desk
  fallRotation: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

export interface MatchConfig {
  mode: GameMode;
  difficulty: AIDifficulty;
  deskTheme: DeskTheme;
  seriesLength: number; // 1, 3, or 5 wins
  p1PenId: string;
  p2PenId: string;
  p1Name: string;
  p2Name: string;
  pensPerTeam: number; // usually 2 or 3
}

export interface MatchStats {
  durationSeconds: number;
  totalFlicksP1: number;
  totalFlicksP2: number;
  knockoutsP1: number;
  knockoutsP2: number;
  winningTeam: TeamId | 'tie' | null;
  seriesScoreP1: number;
  seriesScoreP2: number;
}

export interface PlayerProfile {
  nickname: string;
  avatarId: string;
  xp: number;
  level: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
  currentStreak: number;
  bestStreak: number;
  favoritePenId: string;
  equippedPenId: string;
  selectedDeskTheme: DeskTheme;
  unlockedPens: string[];
  unlockedAvatars: string[];
}

export interface GameSettings {
  language: 'en' | 'bn';
  theme: 'system' | 'light' | 'dark';
  soundEnabled: boolean;
  masterVolume: number;
  sfxVolume: number;
  aimGuide: boolean;
  reducedMotion: boolean;
  vibration: boolean;
  autoNextMatch: boolean;
  seriesLength: number;
}

export interface ComprehensiveStats {
  totalPlayTimeSeconds: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  fastestWinSeconds: number;
  longestMatchSeconds: number;
  averageMatchSeconds: number;
  aiStats: Record<AIDifficulty, { played: number; won: number }>;
  twoPlayerStats: { played: number; p1Wins: number; p2Wins: number };
  totalKnockouts: number;
  totalFlicks: number;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  avatarId: string;
  level: number;
  wins: number;
  streak: number;
  favoritePen: string;
  date: string;
  isPlayer?: boolean;
}
