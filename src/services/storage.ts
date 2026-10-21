/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerProfile, GameSettings, ComprehensiveStats, LeaderboardEntry } from '../types/game';

const STORAGE_KEYS = {
  PROFILE: 'penfight_profile_v1',
  SETTINGS: 'penfight_settings_v1',
  STATS: 'penfight_stats_v1',
  LEADERBOARD: 'penfight_leaderboard_v1',
};

export const DEFAULT_PROFILE: PlayerProfile = {
  nickname: 'School Champ',
  avatarId: 'av-topper',
  xp: 120,
  level: 1,
  wins: 0,
  losses: 0,
  matchesPlayed: 0,
  currentStreak: 0,
  bestStreak: 0,
  favoritePenId: 'cheap-ballpoint',
  equippedPenId: 'cheap-ballpoint',
  selectedDeskTheme: 'classroom-teak',
  unlockedPens: ['cheap-ballpoint', 'classic-blue'],
  unlockedAvatars: ['av-topper', 'av-backbencher'],
};

export const DEFAULT_SETTINGS: GameSettings = {
  language: 'en',
  theme: 'dark',
  soundEnabled: true,
  masterVolume: 0.8,
  sfxVolume: 0.9,
  aimGuide: true,
  reducedMotion: false,
  vibration: true,
  autoNextMatch: false,
  seriesLength: 3,
};

export const DEFAULT_STATS: ComprehensiveStats = {
  totalPlayTimeSeconds: 0,
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  fastestWinSeconds: 0,
  longestMatchSeconds: 0,
  averageMatchSeconds: 0,
  aiStats: {
    easy: { played: 0, won: 0 },
    normal: { played: 0, won: 0 },
    hard: { played: 0, won: 0 },
    master: { played: 0, won: 0 },
  },
  twoPlayerStats: {
    played: 0,
    p1Wins: 0,
    p2Wins: 0,
  },
  totalKnockouts: 0,
  totalFlicks: 0,
};

export const INITIAL_LOCAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'lb-1', nickname: 'DeskWizard', avatarId: 'av-master', level: 8, wins: 42, streak: 9, favoritePen: 'rare-collector', date: 'Yesterday' },
  { id: 'lb-2', nickname: 'PenStriker', avatarId: 'av-captain', level: 6, wins: 29, streak: 6, favoritePen: 'heavy-metal', date: '3 days ago' },
  { id: 'lb-3', nickname: 'BackbenchHero', avatarId: 'av-backbencher', level: 5, wins: 21, streak: 4, favoritePen: 'orange-school', date: '1 week ago' },
  { id: 'lb-4', nickname: 'SurgicalFlick', avatarId: 'av-gamer', level: 4, wins: 15, streak: 3, favoritePen: 'balanced-tournament', date: '2 weeks ago' },
];

export class StorageService {
  public static getProfile(): PlayerProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_PROFILE };
  }

  public static saveProfile(profile: PlayerProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  public static getSettings(): GameSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_SETTINGS };
  }

  public static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  public static getStats(): ComprehensiveStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      if (data) {
        return { ...DEFAULT_STATS, ...JSON.parse(data) };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_STATS };
  }

  public static saveStats(stats: ComprehensiveStats): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }

  public static getLeaderboard(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return [...INITIAL_LOCAL_LEADERBOARD];
  }

  public static saveLeaderboard(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(entries));
    } catch {
      // ignore
    }
  }

  public static addMatchXP(xpGained: number, isWin: boolean): { newProfile: PlayerProfile; leveledUp: boolean; unlockedPenNames: string[] } {
    const profile = this.getProfile();
    const oldLevel = profile.level;
    const newXp = profile.xp + xpGained;
    
    // Level formula: level = floor(sqrt(xp / 100)) + 1
    const newLevel = Math.max(1, Math.floor(Math.sqrt(newXp / 100)) + 1);
    const leveledUp = newLevel > oldLevel;

    const newWins = profile.wins + (isWin ? 1 : 0);
    const newLosses = profile.losses + (isWin ? 0 : 1);
    const newMatches = profile.matchesPlayed + 1;
    const newStreak = isWin ? profile.currentStreak + 1 : 0;
    const newBestStreak = Math.max(profile.bestStreak, newStreak);

    // Check unlocks
    const unlockedPenNames: string[] = [];
    const unlockedPens = [...profile.unlockedPens];
    const unlockedAvatars = [...profile.unlockedAvatars];

    // Check unlocks based on newLevel
    if (newLevel >= 2) {
      if (!unlockedPens.includes('orange-school')) unlockedPens.push('orange-school');
      if (!unlockedAvatars.includes('av-artist')) unlockedAvatars.push('av-artist');
    }
    if (newLevel >= 3) {
      if (!unlockedPens.includes('heavy-metal')) unlockedPens.push('heavy-metal');
      if (!unlockedAvatars.includes('av-captain')) unlockedAvatars.push('av-captain');
    }
    if (newLevel >= 4) {
      if (!unlockedPens.includes('gel-ink-stylus')) unlockedPens.push('gel-ink-stylus');
      if (!unlockedAvatars.includes('av-gamer')) unlockedAvatars.push('av-gamer');
    }
    if (newLevel >= 5) {
      if (!unlockedPens.includes('balanced-tournament')) unlockedPens.push('balanced-tournament');
      if (!unlockedAvatars.includes('av-scientist')) unlockedAvatars.push('av-scientist');
    }
    if (newLevel >= 6) {
      if (!unlockedPens.includes('vintage-fountain')) unlockedPens.push('vintage-fountain');
      if (!unlockedAvatars.includes('av-rebel')) unlockedAvatars.push('av-rebel');
    }
    if (newLevel >= 7) {
      if (!unlockedPens.includes('rare-collector')) unlockedPens.push('rare-collector');
      if (!unlockedAvatars.includes('av-master')) unlockedAvatars.push('av-master');
    }

    const updatedProfile: PlayerProfile = {
      ...profile,
      xp: newXp,
      level: newLevel,
      wins: newWins,
      losses: newLosses,
      matchesPlayed: newMatches,
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      unlockedPens,
      unlockedAvatars,
    };

    this.saveProfile(updatedProfile);

    // Update player on leaderboard
    const lb = this.getLeaderboard();
    const existingIdx = lb.findIndex(e => e.isPlayer || e.nickname === profile.nickname);
    const playerEntry: LeaderboardEntry = {
      id: 'player-local',
      nickname: profile.nickname,
      avatarId: profile.avatarId,
      level: newLevel,
      wins: newWins,
      streak: newStreak,
      favoritePen: profile.favoritePenId,
      date: 'Just now',
      isPlayer: true,
    };

    if (existingIdx >= 0) {
      lb[existingIdx] = playerEntry;
    } else {
      lb.push(playerEntry);
    }
    lb.sort((a, b) => b.wins - a.wins);
    this.saveLeaderboard(lb);

    return {
      newProfile: updatedProfile,
      leveledUp,
      unlockedPenNames,
    };
  }

  public static exportAllData(): string {
    const backup = {
      profile: this.getProfile(),
      settings: this.getSettings(),
      stats: this.getStats(),
      leaderboard: this.getLeaderboard(),
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(backup, null, 2);
  }

  public static importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profile) this.saveProfile(data.profile);
      if (data.settings) this.saveSettings(data.settings);
      if (data.stats) this.saveStats(data.stats);
      if (data.leaderboard) this.saveLeaderboard(data.leaderboard);
      return true;
    } catch {
      return false;
    }
  }

  public static resetAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.STATS);
      localStorage.removeItem(STORAGE_KEYS.LEADERBOARD);
    } catch {
      // ignore
    }
  }
}
