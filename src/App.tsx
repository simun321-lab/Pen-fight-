/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameMode,
  AIDifficulty,
  TeamId,
  PenInstance,
  MatchConfig,
  MatchStats,
  PlayerProfile,
  GameSettings,
  ComprehensiveStats,
  LeaderboardEntry,
} from './types/game';
import {
  UserAccount,
  OnlineRoom,
  NotificationItem,
  ChatMessage,
  OnlineMatchRecord,
} from './types/multiplayer';
import { StorageService } from './services/storage';
import { PhysicsEngine } from './services/physics';
import { AIService } from './services/ai';
import { sound } from './services/sound';
import { api } from './services/api';
import { socket } from './services/socket';

import { DeskCanvas } from './components/DeskCanvas';
import { MainMenu } from './components/MainMenu';
import { MatchHUD } from './components/MatchHUD';
import { OnlineMatchHUD } from './components/OnlineMatchHUD';
import { ModeSelectModal } from './components/ModeSelectModal';
import { PenLockerModal } from './components/PenLockerModal';
import { ProfileModal } from './components/ProfileModal';
import { StatsModal } from './components/StatsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SettingsModal } from './components/SettingsModal';
import { RulesModal } from './components/RulesModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';

import { AuthModal } from './components/AuthModal';
import { MultiplayerMenuModal } from './components/MultiplayerMenuModal';
import { RoomLobbyModal } from './components/RoomLobbyModal';
import { FriendsModal } from './components/FriendsModal';
import { PublicProfileModal } from './components/PublicProfileModal';
import { NotificationDropdown } from './components/NotificationDropdown';
import { AchievementsModal } from './components/AchievementsModal';
import { RoomBrowserModal } from './components/RoomBrowserModal';

type AppScreen = 'menu' | 'playing' | 'online_playing';

export default function App() {
  // Persistence state
  const [profile, setProfile] = useState<PlayerProfile>(() => StorageService.getProfile());
  const [settings, setSettings] = useState<GameSettings>(() => StorageService.getSettings());
  const [stats, setStats] = useState<ComprehensiveStats>(() => StorageService.getStats());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => StorageService.getLeaderboard());

  // Online Multiplayer State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeOnlineRoom, setActiveOnlineRoom] = useState<OnlineRoom | null>(null);
  const [myOnlineTeam, setMyOnlineTeam] = useState<TeamId>('player1');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lobbyChat, setLobbyChat] = useState<ChatMessage[]>([]);
  const [recentEmotes, setRecentEmotes] = useState<Array<{ userId: string; text: string; id: string }>>([]);
  const [matchmakingQueue, setMatchmakingQueue] = useState<'duel-1v1' | 'ffa-3p' | null>(null);
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(null);
  const [onlineGameOverResults, setOnlineGameOverResults] = useState<OnlineMatchRecord['participants'] | undefined>(undefined);

  // Screen & Navigation
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('menu');

  // Modals state
  const [isModeSelectOpen, setIsModeSelectOpen] = useState(false);
  const [isMultiplayerMenuOpen, setIsMultiplayerMenuOpen] = useState(false);
  const [isRoomLobbyOpen, setIsRoomLobbyOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isPublicProfileOpen, setIsPublicProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isRoomBrowserOpen, setIsRoomBrowserOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [isPenLockerOpen, setIsPenLockerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);

  // Active Match State
  const [matchConfig, setMatchConfig] = useState<MatchConfig>({
    mode: 'vs-ai',
    difficulty: 'normal',
    deskTheme: profile.selectedDeskTheme,
    seriesLength: settings.seriesLength,
    p1PenId: profile.equippedPenId,
    p2PenId: 'classic-blue',
    p1Name: profile.nickname,
    p2Name: 'Class AI',
    pensPerTeam: 2,
  });

  const [pens, setPens] = useState<PenInstance[]>([]);
  const [currentTurn, setCurrentTurn] = useState<TeamId>('player1');
  const [isAiTurn, setIsAiTurn] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const [scoreP1, setScoreP1] = useState<number>(0);
  const [scoreP2, setScoreP2] = useState<number>(0);
  const [matchStats, setMatchStats] = useState<MatchStats>({
    durationSeconds: 0,
    totalFlicksP1: 0,
    totalFlicksP2: 0,
    knockoutsP1: 0,
    knockoutsP2: 0,
    winningTeam: null,
    seriesScoreP1: 0,
    seriesScoreP2: 0,
  });

  const [roundWinner, setRoundWinner] = useState<'player1' | 'player2' | 'player3' | 'tie'>('player1');
  const [seriesWinner, setSeriesWinner] = useState<'player1' | 'player2' | 'player3' | 'tie' | null>(null);
  const [isSeriesOver, setIsSeriesOver] = useState<boolean>(false);
  const [xpGainedLastMatch, setXpGainedLastMatch] = useState<number>(0);
  const [leveledUpLastMatch, setLeveledUpLastMatch] = useState<boolean>(false);
  const [newLevelEarned, setNewLevelEarned] = useState<number>(profile.level);

  // Match timer reference
  const matchStartTimeRef = useRef<number>(Date.now());
  const aiTimeoutRef = useRef<number | null>(null);

  // Initialize Online User Identity & WebSocket Connection
  useEffect(() => {
    sound.setMute(!settings.soundEnabled);
    sound.setMasterVolume(settings.masterVolume);
    sound.setSfxVolume(settings.sfxVolume);

    // Initialize or restore guest session
    api.initGuest(localStorage.getItem('penfight_guest_id') || undefined)
      .then(res => {
        setCurrentUser(res.user);
        localStorage.setItem('penfight_guest_id', res.user.id);
        socket.connect(res.token, res.user.id);
      })
      .catch(err => {
        console.error('Failed to init guest', err);
      });

    return () => {
      socket.disconnect();
    };
  }, [settings]);

  /**
   * Setup Real-Time Socket Event Listeners
   */
  useEffect(() => {
    // 1. Auth success
    socket.on('auth:success', data => {
      const u = data.user as UserAccount;
      if (u) setCurrentUser(u);
    });

    // 2. Notifications
    socket.on('notification:new', data => {
      const notif = data.notification as NotificationItem;
      if (notif) {
        sound.playClick();
        setNotifications(prev => [notif, ...prev]);
      }
    });

    // 3. Match Found via Queue
    socket.on('match_found', data => {
      sound.playVictory();
      setMatchmakingQueue(null);
      setIsMultiplayerMenuOpen(false);

      const r = data.room as OnlineRoom;
      const team = data.yourTeam as TeamId;
      setActiveOnlineRoom(r);
      setMyOnlineTeam(team);

      // Launch Online Match Arena!
      startOnlineMatch(r, team);
    });

    // 4. Room Events
    socket.on('room:created', data => {
      const r = data.room as OnlineRoom;
      setActiveOnlineRoom(r);
      setMyOnlineTeam('player1');
      setIsMultiplayerMenuOpen(false);
      setIsRoomLobbyOpen(true);
    });

    socket.on('room:update', data => {
      const r = data.room as OnlineRoom;
      setActiveOnlineRoom(r);
      setIsRoomLobbyOpen(true);
    });

    socket.on('room:match_start', data => {
      const r = data.room as OnlineRoom;
      setActiveOnlineRoom(r);
      setIsRoomLobbyOpen(false);

      const myP = r.participants.find(p => p.userId === currentUser?.id);
      const team = myP?.team || 'player1';
      setMyOnlineTeam(team);

      startOnlineMatch(r, team);
    });

    socket.on('room:left', () => {
      setActiveOnlineRoom(null);
      setIsRoomLobbyOpen(false);
    });

    // 5. In-Match Broadcasts
    socket.on('match:flick_broadcast', data => {
      const { penId, dirX, dirY, power, offsetRatio } = data as {
        penId: string;
        dirX: number;
        dirY: number;
        power: number;
        offsetRatio: number;
      };

      setIsSimulating(true);
      setPens(prevPens => {
        const updated = [...prevPens];
        const targetPen = updated.find(p => p.id === penId);
        if (targetPen && !targetPen.eliminated) {
          PhysicsEngine.applyFlick(targetPen, dirX, dirY, power, offsetRatio);
        }
        return updated;
      });
    });

    socket.on('match:turn_change', data => {
      const nextTurn = data.currentTurn as TeamId;
      setCurrentTurn(nextTurn);
      setIsSimulating(false);
    });

    socket.on('match:next_round', data => {
      const r = data.room as OnlineRoom;
      setActiveOnlineRoom(r);
      startOnlineRound(r);
    });

    socket.on('match:game_over', data => {
      const results = data.results as OnlineMatchRecord['participants'];
      const r = data.room as OnlineRoom;
      setActiveOnlineRoom(r);
      setOnlineGameOverResults(results);

      const winnerTeam = data.winnerTeam as TeamId;
      setSeriesWinner(winnerTeam);
      setIsSeriesOver(true);
      setIsGameOverOpen(true);

      if (winnerTeam === myOnlineTeam) {
        sound.playVictory();
      } else {
        sound.playDefeat();
      }
    });

    // 6. Chat & Emotes
    socket.on('chat:message', data => {
      const msg = data.message as ChatMessage;
      if (msg) {
        if (msg.isEmote) {
          sound.playClick();
          const emoteItem = { userId: msg.userId, text: `${msg.displayName}: ${msg.text}`, id: msg.id };
          setRecentEmotes(prev => [...prev.slice(-3), emoteItem]);
          setTimeout(() => {
            setRecentEmotes(prev => prev.filter(e => e.id !== emoteItem.id));
          }, 3000);
        } else {
          setLobbyChat(prev => [...prev.slice(-20), msg]);
        }
      }
    });

    // 7. Incoming Realtime Challenge
    socket.on('challenge:incoming', data => {
      sound.playVictory();
      const chall = data.challenge as { id: string; fromDisplayName: string; fromUsername: string; type: string };
      setNotifications(prev => [
        {
          id: chall.id,
          type: 'challenge',
          title: 'Direct Challenge!',
          message: `${chall.fromDisplayName} (@${chall.fromUsername}) challenged you to a ${chall.type === 'ffa-3p' ? '3-Player FFA' : '1v1 Duel'}!`,
          timestamp: 'Just now',
          read: false,
          data: chall,
        },
        ...prev,
      ]);
      setIsNotificationsOpen(true);
    });

    return () => {
      socket.off('auth:success', () => {});
      socket.off('match_found', () => {});
      socket.off('room:created', () => {});
      socket.off('room:update', () => {});
      socket.off('room:match_start', () => {});
    };
  }, [currentUser, myOnlineTeam]);

  /**
   * Spawns pens on the wooden desk for 2-Player or 3-Player matches
   */
  const spawnPens = useCallback((p1PenId: string, p2PenId: string, p3PenId?: string, isThreePlayer: boolean = false): PenInstance[] => {
    const list: PenInstance[] = [];
    const deskW = window.innerWidth || 800;
    const deskH = window.innerHeight || 550;

    if (!isThreePlayer) {
      // 2-Player Mode: P1 on left, P2 on right
      const leftX = Math.max(120, deskW * 0.28);
      const rightX = Math.min(deskW - 120, deskW * 0.72);
      const centerY = deskH * 0.5;
      const spacingY = 95;

      for (let i = 0; i < 2; i++) {
        const yOffset = (i - 0.5) * spacingY;
        list.push({
          id: `p1_pen_${i + 1}`,
          team: 'player1',
          penDefId: p1PenId,
          x: leftX,
          y: centerY + yOffset,
          vx: 0,
          vy: 0,
          angle: 0 + (Math.random() - 0.5) * 0.15,
          angularVelocity: 0,
          eliminated: false,
          fallProgress: 0,
          fallRotation: 0,
          trail: [],
        });
      }

      for (let i = 0; i < 2; i++) {
        const yOffset = (i - 0.5) * spacingY;
        list.push({
          id: `p2_pen_${i + 1}`,
          team: 'player2',
          penDefId: p2PenId,
          x: rightX,
          y: centerY + yOffset,
          vx: 0,
          vy: 0,
          angle: Math.PI + (Math.random() - 0.5) * 0.15,
          angularVelocity: 0,
          eliminated: false,
          fallProgress: 0,
          fallRotation: 0,
          trail: [],
        });
      }
    } else {
      // 3-Player Free-for-All Mode: 3 corners of desk
      // Player 1 (Blue): Left Center
      const p1X = deskW * 0.25;
      const p1Y = deskH * 0.5;
      for (let i = 0; i < 2; i++) {
        list.push({
          id: `p1_pen_${i + 1}`,
          team: 'player1',
          penDefId: p1PenId,
          x: p1X,
          y: p1Y + (i - 0.5) * 75,
          vx: 0,
          vy: 0,
          angle: 0,
          angularVelocity: 0,
          eliminated: false,
          fallProgress: 0,
          fallRotation: 0,
          trail: [],
        });
      }

      // Player 2 (Orange): Top Right
      const p2X = deskW * 0.75;
      const p2Y = deskH * 0.32;
      for (let i = 0; i < 2; i++) {
        list.push({
          id: `p2_pen_${i + 1}`,
          team: 'player2',
          penDefId: p2PenId,
          x: p2X,
          y: p2Y + (i - 0.5) * 65,
          vx: 0,
          vy: 0,
          angle: Math.PI * 0.8,
          angularVelocity: 0,
          eliminated: false,
          fallProgress: 0,
          fallRotation: 0,
          trail: [],
        });
      }

      // Player 3 (Green): Bottom Right
      const p3X = deskW * 0.75;
      const p3Y = deskH * 0.68;
      for (let i = 0; i < 2; i++) {
        list.push({
          id: `p3_pen_${i + 1}`,
          team: 'player3',
          penDefId: p3PenId || 'gel-ink-stylus',
          x: p3X,
          y: p3Y + (i - 0.5) * 65,
          vx: 0,
          vy: 0,
          angle: -Math.PI * 0.8,
          angularVelocity: 0,
          eliminated: false,
          fallProgress: 0,
          fallRotation: 0,
          trail: [],
        });
      }
    }

    return list;
  }, []);

  /**
   * Starts a local single-player / pass-and-play match
   */
  const startNewLocalMatch = useCallback((mode: GameMode, difficulty: AIDifficulty) => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }

    const aiOpponentNames: Record<AIDifficulty, string> = {
      easy: 'Backbencher Siam',
      normal: 'Monitor Rahul',
      hard: 'Desk Champ Alex',
      master: 'Grandmaster Kabir',
    };

    const aiPenMap: Record<AIDifficulty, string> = {
      easy: 'cheap-ballpoint',
      normal: 'classic-blue',
      hard: 'heavy-metal',
      master: 'rare-collector',
    };

    const p2Pen = mode === 'vs-ai' ? aiPenMap[difficulty] : 'orange-school';
    const p2Name = mode === 'vs-ai' ? aiOpponentNames[difficulty] : 'Player 2';

    const newConfig: MatchConfig = {
      mode,
      difficulty,
      deskTheme: profile.selectedDeskTheme,
      seriesLength: settings.seriesLength,
      p1PenId: profile.equippedPenId,
      p2PenId: p2Pen,
      p1Name: profile.nickname,
      p2Name,
      pensPerTeam: 2,
    };

    setMatchConfig(newConfig);
    setScoreP1(0);
    setScoreP2(0);
    setMatchStats({
      durationSeconds: 0,
      totalFlicksP1: 0,
      totalFlicksP2: 0,
      knockoutsP1: 0,
      knockoutsP2: 0,
      winningTeam: null,
      seriesScoreP1: 0,
      seriesScoreP2: 0,
    });

    const newPens = spawnPens(newConfig.p1PenId, newConfig.p2PenId, undefined, false);
    setPens(newPens);
    setCurrentTurn('player1');
    setIsAiTurn(false);
    setIsSimulating(false);
    setIsSeriesOver(false);
    setSeriesWinner(null);
    setOnlineGameOverResults(undefined);
    matchStartTimeRef.current = Date.now();

    setIsModeSelectOpen(false);
    setIsGameOverOpen(false);
    setIsPauseOpen(false);
    setCurrentScreen('playing');
  }, [profile, settings, spawnPens]);

  /**
   * Starts an authoritative Online Match (2-player duel or 3-player FFA)
   */
  const startOnlineMatch = useCallback((room: OnlineRoom, myTeam: TeamId) => {
    const is3P = room.capacity === 3;
    const p1 = room.participants[0];
    const p2 = room.participants[1];
    const p3 = room.participants[2];

    const newConfig: MatchConfig = {
      mode: 'practice',
      difficulty: 'normal',
      deskTheme: room.deskTheme as MatchConfig['deskTheme'],
      seriesLength: room.seriesLength,
      p1PenId: p1?.equippedPenId || 'cheap-ballpoint',
      p2PenId: p2?.equippedPenId || 'classic-blue',
      p1Name: p1?.displayName || 'Player 1',
      p2Name: p2?.displayName || 'Player 2',
      pensPerTeam: 2,
    };

    setMatchConfig(newConfig);
    setMyOnlineTeam(myTeam);

    const newPens = spawnPens(
      p1?.equippedPenId || 'cheap-ballpoint',
      p2?.equippedPenId || 'classic-blue',
      p3?.equippedPenId || 'gel-ink-stylus',
      is3P
    );

    setPens(newPens);
    setCurrentTurn('player1');
    setIsSimulating(false);
    setIsSeriesOver(false);
    setSeriesWinner(null);
    setOnlineGameOverResults(undefined);

    setIsRoomLobbyOpen(false);
    setIsGameOverOpen(false);
    setCurrentScreen('online_playing');
  }, [spawnPens]);

  const startOnlineRound = useCallback((room: OnlineRoom) => {
    const is3P = room.capacity === 3;
    const p1 = room.participants[0];
    const p2 = room.participants[1];
    const p3 = room.participants[2];

    const newPens = spawnPens(
      p1?.equippedPenId || 'cheap-ballpoint',
      p2?.equippedPenId || 'classic-blue',
      p3?.equippedPenId || 'gel-ink-stylus',
      is3P
    );
    setPens(newPens);
    setCurrentTurn('player1');
    setIsSimulating(false);
    setIsGameOverOpen(false);
  }, [spawnPens]);

  /**
   * Local next round
   */
  const startNextLocalRound = useCallback(() => {
    const newPens = spawnPens(matchConfig.p1PenId, matchConfig.p2PenId, undefined, false);
    setPens(newPens);
    setCurrentTurn('player1');
    setIsAiTurn(false);
    setIsSimulating(false);
    setIsGameOverOpen(false);
  }, [matchConfig, spawnPens]);

  /**
   * Unified flick handler (local or online)
   */
  const handleFlick = useCallback((
    penId: string,
    dirX: number,
    dirY: number,
    power: number,
    offsetRatio: number
  ) => {
    if (currentScreen === 'online_playing' && activeOnlineRoom) {
      // In online match: send to authoritative server!
      socket.send('match:flick', {
        roomId: activeOnlineRoom.id,
        penId,
        dirX,
        dirY,
        power,
        offsetRatio,
      });
      return;
    }

    // In local match: execute directly
    setIsSimulating(true);
    setPens(prevPens => {
      const updated = [...prevPens];
      const targetPen = updated.find(p => p.id === penId);
      if (targetPen && !targetPen.eliminated) {
        PhysicsEngine.applyFlick(targetPen, dirX, dirY, power, offsetRatio);
      }
      return updated;
    });

    setMatchStats(prev => ({
      ...prev,
      totalFlicksP1: prev.totalFlicksP1 + (currentTurn === 'player1' ? 1 : 0),
      totalFlicksP2: prev.totalFlicksP2 + (currentTurn === 'player2' ? 1 : 0),
    }));
  }, [currentScreen, activeOnlineRoom, currentTurn]);

  /**
   * AI move scheduler
   */
  const scheduleAiMove = useCallback((currentPens: PenInstance[]) => {
    if (matchConfig.mode !== 'vs-ai') return;
    setIsAiTurn(true);

    const bounds = {
      x: 35,
      y: 35,
      width: (window.innerWidth || 800) - 70,
      height: (window.innerHeight || 550) - 70,
    };

    const decision = AIService.calculateMove(currentPens, bounds, matchConfig.difficulty);
    if (!decision) {
      setIsAiTurn(false);
      return;
    }

    aiTimeoutRef.current = window.setTimeout(() => {
      sound.playFlick(decision.power);
      handleFlick(decision.penId, decision.dirX, decision.dirY, decision.power, decision.offsetRatio);
      setIsAiTurn(false);
      aiTimeoutRef.current = null;
    }, decision.thinkingDurationMs);
  }, [matchConfig, handleFlick]);

  /**
   * Round settled callback
   */
  const handleRoundComplete = useCallback(() => {
    setIsSimulating(false);

    if (currentScreen === 'online_playing' && activeOnlineRoom) {
      // Identify surviving teams on the desk
      const surviving = Array.from(new Set(pens.filter(p => !p.eliminated).map(p => p.team)));
      // Inform server
      socket.send('match:round_settled', {
        roomId: activeOnlineRoom.id,
        survivingTeams: surviving,
      });
      return;
    }

    // Local match evaluation
    const survivingP1 = pens.filter(p => p.team === 'player1' && !p.eliminated).length;
    const survivingP2 = pens.filter(p => p.team === 'player2' && !p.eliminated).length;

    if (survivingP1 === 0 && survivingP2 === 0) {
      resolveLocalRoundOutcome('tie');
    } else if (survivingP1 === 0) {
      resolveLocalRoundOutcome('player2');
    } else if (survivingP2 === 0) {
      resolveLocalRoundOutcome('player1');
    } else {
      const nextTurn: TeamId = currentTurn === 'player1' ? 'player2' : 'player1';
      setCurrentTurn(nextTurn);
      if (matchConfig.mode === 'vs-ai' && nextTurn === 'player2') {
        scheduleAiMove(pens);
      }
    }
  }, [currentScreen, activeOnlineRoom, pens, currentTurn, matchConfig, scheduleAiMove]);

  const resolveLocalRoundOutcome = useCallback((winner: 'player1' | 'player2' | 'tie') => {
    const newScoreP1 = scoreP1 + (winner === 'player1' ? 1 : 0);
    const newScoreP2 = scoreP2 + (winner === 'player2' ? 1 : 0);
    setScoreP1(newScoreP1);
    setScoreP2(newScoreP2);
    setRoundWinner(winner);

    const targetWins = Math.ceil(matchConfig.seriesLength / 2);
    const seriesEnded = newScoreP1 >= targetWins || newScoreP2 >= targetWins;
    setIsSeriesOver(seriesEnded);

    let finalSeriesWinner: 'player1' | 'player2' | 'tie' | null = null;
    if (seriesEnded) {
      finalSeriesWinner = newScoreP1 > newScoreP2 ? 'player1' : newScoreP2 > newScoreP1 ? 'player2' : 'tie';
      setSeriesWinner(finalSeriesWinner);
    }

    const duration = Math.max(1, Math.floor((Date.now() - matchStartTimeRef.current) / 1000));

    if (winner === 'player1') sound.playVictory();
    else if (winner === 'player2') sound.playDefeat();

    let xp = winner === 'player1' ? 65 : winner === 'player2' ? 25 : 35;
    if (seriesEnded && finalSeriesWinner === 'player1') xp += 110;

    setXpGainedLastMatch(xp);

    const { newProfile, leveledUp } = StorageService.addMatchXP(xp, winner === 'player1');
    setProfile(newProfile);
    setLeveledUpLastMatch(leveledUp);
    setNewLevelEarned(newProfile.level);

    setMatchStats(prev => ({
      ...prev,
      durationSeconds: duration,
      seriesScoreP1: newScoreP1,
      seriesScoreP2: newScoreP2,
      knockoutsP1: prev.knockoutsP1 + (winner === 'player1' ? matchConfig.pensPerTeam : 0),
      knockoutsP2: prev.knockoutsP2 + (winner === 'player2' ? matchConfig.pensPerTeam : 0),
      winningTeam: winner,
    }));

    setIsGameOverOpen(true);
  }, [scoreP1, scoreP2, matchConfig]);

  const pensCountByTeam: Record<TeamId, number> = {
    player1: pens.filter(p => p.team === 'player1' && !p.eliminated).length,
    player2: pens.filter(p => p.team === 'player2' && !p.eliminated).length,
    player3: pens.filter(p => p.team === 'player3' && !p.eliminated).length,
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* SCREEN 1: MAIN MENU */}
      {currentScreen === 'menu' && (
        <MainMenu
          profile={profile}
          settings={settings}
          currentUser={currentUser}
          notifications={notifications}
          onOpenModeSelect={() => setIsModeSelectOpen(true)}
          onOpenMultiplayer={() => setIsMultiplayerMenuOpen(true)}
          onOpenPenLocker={() => setIsPenLockerOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenLeaderboard={() => {
            setLeaderboard(StorageService.getLeaderboard());
            setIsLeaderboardOpen(true);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onToggleMute={() => {
            const newMuted = !settings.soundEnabled;
            const updated = { ...settings, soundEnabled: newMuted };
            StorageService.saveSettings(updated);
            setSettings(updated);
            sound.setMute(!newMuted);
          }}
        />
      )}

      {/* SCREEN 2: LOCAL / AI PLAYING ARENA */}
      {currentScreen === 'playing' && (
        <div className="relative w-full h-full">
          <DeskCanvas
            pens={pens}
            currentTurn={currentTurn}
            isAiTurn={isAiTurn}
            deskThemeId={matchConfig.deskTheme}
            aimGuideEnabled={settings.aimGuide}
            reducedMotion={settings.reducedMotion}
            vibrationEnabled={settings.vibration}
            onFlick={handleFlick}
            onRoundComplete={handleRoundComplete}
          />

          <MatchHUD
            config={matchConfig}
            settings={settings}
            currentTurn={currentTurn}
            isAiTurn={isAiTurn}
            isSimulating={isSimulating}
            scoreP1={scoreP1}
            scoreP2={scoreP2}
            remainingP1={pensCountByTeam.player1}
            remainingP2={pensCountByTeam.player2}
            onPause={() => setIsPauseOpen(true)}
          />
        </div>
      )}

      {/* SCREEN 3: ONLINE MULTIPLAYER PLAYING ARENA (2P & 3P) */}
      {currentScreen === 'online_playing' && activeOnlineRoom && (
        <div className="relative w-full h-full">
          <DeskCanvas
            pens={pens}
            currentTurn={currentTurn}
            isAiTurn={currentTurn !== myOnlineTeam}
            deskThemeId={matchConfig.deskTheme}
            aimGuideEnabled={settings.aimGuide}
            reducedMotion={settings.reducedMotion}
            vibrationEnabled={settings.vibration}
            onFlick={handleFlick}
            onRoundComplete={handleRoundComplete}
          />

          <OnlineMatchHUD
            room={activeOnlineRoom}
            myTeam={myOnlineTeam}
            currentTurn={currentTurn}
            isSimulating={isSimulating}
            pensCountByTeam={pensCountByTeam}
            onSendChat={(text, isEmote) => {
              socket.send('chat:send', { roomId: activeOnlineRoom.id, text, isEmote });
            }}
            onLeaveMatch={() => {
              socket.send('room:leave', { roomId: activeOnlineRoom.id });
              setActiveOnlineRoom(null);
              setCurrentScreen('menu');
            }}
            recentEmotes={recentEmotes}
          />
        </div>
      )}

      {/* FLOATING MATCHMAKING BANNER */}
      {matchmakingQueue && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-amber-400 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs">
            <span className="font-bold text-white block">
              Searching for {matchmakingQueue === 'ffa-3p' ? '3-Player Free-for-All' : '1v1 Duel'} opponents...
            </span>
            <span className="text-[10px] text-slate-400">Classroom queue active</span>
          </div>
          <button
            onClick={() => {
              socket.send('matchmaking:leave');
              setMatchmakingQueue(null);
            }}
            className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* NOTIFICATIONS DROPDOWN */}
      <NotificationDropdown
        notifications={notifications}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onAcceptChallenge={challengeId => {
          socket.send('challenge:respond', { challengeId, accept: true });
        }}
        onDeclineChallenge={challengeId => {
          socket.send('challenge:respond', { challengeId, accept: false });
        }}
        onAcceptFriend={requestId => {
          socket.send('friend:respond', { requestId, accept: true });
        }}
        onDeclineFriend={requestId => {
          socket.send('friend:respond', { requestId, accept: false });
        }}
        onClearAll={() => setNotifications([])}
      />

      {/* ONLINE MULTIPLAYER MODAL */}
      <MultiplayerMenuModal
        currentUser={currentUser}
        isOpen={isMultiplayerMenuOpen}
        onClose={() => setIsMultiplayerMenuOpen(false)}
        onJoinQueue={mode => {
          setMatchmakingQueue(mode);
          socket.send('matchmaking:join', { mode });
          setIsMultiplayerMenuOpen(false);
        }}
        onCreateRoom={(capacity, isPublic, password) => {
          socket.send('room:create', { capacity, isPublic, password });
          setIsMultiplayerMenuOpen(false);
        }}
        onJoinRoomCode={roomCode => {
          socket.send('room:join', { roomCode });
          setIsMultiplayerMenuOpen(false);
        }}
        onOpenRoomBrowser={() => {
          setIsMultiplayerMenuOpen(false);
          setIsRoomBrowserOpen(true);
        }}
        onOpenFriends={() => {
          setIsMultiplayerMenuOpen(false);
          setIsFriendsOpen(true);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* ROOM LOBBY MODAL */}
      <RoomLobbyModal
        room={activeOnlineRoom}
        currentUser={currentUser}
        isOpen={isRoomLobbyOpen}
        onToggleReady={isReady => {
          if (activeOnlineRoom) socket.send('room:ready', { roomId: activeOnlineRoom.id, isReady });
        }}
        onStartMatch={() => {
          if (activeOnlineRoom) socket.send('room:start', { roomId: activeOnlineRoom.id });
        }}
        onLeaveRoom={() => {
          if (activeOnlineRoom) socket.send('room:leave', { roomId: activeOnlineRoom.id });
          setActiveOnlineRoom(null);
          setIsRoomLobbyOpen(false);
        }}
        onSendChat={text => {
          if (activeOnlineRoom) socket.send('chat:send', { roomId: activeOnlineRoom.id, text });
        }}
        chatMessages={lobbyChat}
        onInviteFriend={() => setIsFriendsOpen(true)}
      />

      {/* FRIENDS & CHALLENGES MODAL */}
      <FriendsModal
        currentUser={currentUser}
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        onChallengePlayer={(targetUserId, type) => {
          socket.send('challenge:send', { targetUserId, challengeType: type });
        }}
        onViewProfile={targetId => {
          setInspectedUserId(targetId);
          setIsPublicProfileOpen(true);
        }}
      />

      {/* PUBLIC PROFILE MODAL */}
      <PublicProfileModal
        userId={inspectedUserId}
        currentUserId={currentUser?.id}
        isOpen={isPublicProfileOpen}
        onClose={() => setIsPublicProfileOpen(false)}
        onChallengePlayer={(targetId, type) => {
          socket.send('challenge:send', { targetUserId: targetId, challengeType: type });
        }}
      />

      {/* PUBLIC ROOM BROWSER */}
      <RoomBrowserModal
        isOpen={isRoomBrowserOpen}
        onClose={() => setIsRoomBrowserOpen(false)}
        onJoinRoom={roomCode => {
          socket.send('room:join', { roomCode });
          setIsRoomBrowserOpen(false);
        }}
      />

      {/* ACHIEVEMENTS MODAL */}
      <AchievementsModal
        currentUser={currentUser}
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        language={settings.language}
      />

      {/* AUTH MODAL */}
      <AuthModal
        currentUser={currentUser}
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={user => setCurrentUser(user)}
        onSignOut={() => {
          api.setToken(null);
          api.initGuest().then(res => setCurrentUser(res.user));
        }}
      />

      {/* MODE SELECT MODAL */}
      <ModeSelectModal
        settings={settings}
        isOpen={isModeSelectOpen}
        onClose={() => setIsModeSelectOpen(false)}
        onStartMatch={startNewLocalMatch}
        onStartOnline={() => {
          setIsModeSelectOpen(false);
          setIsMultiplayerMenuOpen(true);
        }}
      />

      {/* PEN LOCKER MODAL */}
      <PenLockerModal
        profile={profile}
        settings={settings}
        isOpen={isPenLockerOpen}
        onClose={() => setIsPenLockerOpen(false)}
        onEquipPen={penId => {
          const updated = { ...profile, equippedPenId: penId };
          StorageService.saveProfile(updated);
          setProfile(updated);
          if (currentUser) {
            api.updateProfile(undefined, undefined, penId);
          }
        }}
        onToggleFavorite={penId => {
          const updated = { ...profile, favoritePenId: penId };
          StorageService.saveProfile(updated);
          setProfile(updated);
        }}
      />

      {/* PROFILE MODAL */}
      <ProfileModal
        profile={profile}
        settings={settings}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSaveProfile={updated => {
          StorageService.saveProfile(updated);
          setProfile(updated);
          if (currentUser) {
            api.updateProfile(updated.nickname, updated.avatarId, updated.favoritePenId);
          }
        }}
      />

      {/* STATS MODAL */}
      <StatsModal
        stats={stats}
        profile={profile}
        settings={settings}
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      {/* LEADERBOARD MODAL */}
      <LeaderboardModal
        entries={leaderboard}
        settings={settings}
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        settings={settings}
        selectedDeskTheme={profile.selectedDeskTheme}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={updated => {
          StorageService.saveSettings(updated);
          setSettings(updated);
        }}
        onUpdateDeskTheme={theme => {
          const updated = { ...profile, selectedDeskTheme: theme };
          StorageService.saveProfile(updated);
          setProfile(updated);
          setMatchConfig(prev => ({ ...prev, deskTheme: theme }));
        }}
        onDataReset={() => {
          setProfile(StorageService.getProfile());
          setSettings(StorageService.getSettings());
          setStats(StorageService.getStats());
          setLeaderboard(StorageService.getLeaderboard());
        }}
      />

      {/* RULES MODAL */}
      <RulesModal
        settings={settings}
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* PAUSE MODAL */}
      <PauseModal
        settings={settings}
        isOpen={isPauseOpen}
        onResume={() => setIsPauseOpen(false)}
        onRestart={() => {
          setIsPauseOpen(false);
          startNewLocalMatch(matchConfig.mode, matchConfig.difficulty);
        }}
        onOpenSettings={() => {
          setIsPauseOpen(false);
          setIsSettingsOpen(true);
        }}
        onExit={() => {
          if (aiTimeoutRef.current) {
            clearTimeout(aiTimeoutRef.current);
            aiTimeoutRef.current = null;
          }
          setIsPauseOpen(false);
          setCurrentScreen('menu');
        }}
      />

      {/* GAME OVER MODAL */}
      <GameOverModal
        config={matchConfig}
        stats={matchStats}
        settings={settings}
        isOpen={isGameOverOpen}
        isSeriesOver={isSeriesOver}
        roundWinner={roundWinner}
        seriesWinner={seriesWinner}
        xpEarned={xpGainedLastMatch}
        leveledUp={leveledUpLastMatch}
        newLevel={newLevelEarned}
        onlineResults={onlineGameOverResults}
        onNextRound={() => {
          if (currentScreen === 'online_playing') {
            setIsGameOverOpen(false);
          } else {
            startNextLocalRound();
          }
        }}
        onPlayAgain={() => {
          if (currentScreen === 'online_playing') {
            setIsGameOverOpen(false);
            setCurrentScreen('menu');
          } else {
            startNewLocalMatch(matchConfig.mode, matchConfig.difficulty);
          }
        }}
        onExit={() => {
          setIsGameOverOpen(false);
          setCurrentScreen('menu');
        }}
      />
    </div>
  );
}
