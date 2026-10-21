/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

app.use(express.json());

// In-memory persistent database structures with JSON persistence backup
const DATA_FILE = path.join(__dirname, '.penfight_server_data.json');

interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  passwordHash?: string;
  avatarId: string;
  isGuest: boolean;
  token: string;
  createdAt: string;
  rating1v1: number;
  highestRating1v1: number;
  rating3p: number;
  highestRating3p: number;
  matches1v1: number;
  wins1v1: number;
  matches3p: number;
  wins3p: number;
  currentStreak: number;
  bestStreak: number;
  totalKnockouts: number;
  favoritePenId: string;
  unlockedAchievements: string[];
  friends: string[]; // user IDs
  blockedUsers: string[]; // user IDs
}

interface StoredRoom {
  id: string; // 6-char code
  name: string;
  hostId: string;
  type: 'duel-1v1' | 'ffa-3p';
  capacity: 2 | 3;
  isPublic: boolean;
  password?: string;
  status: 'waiting' | 'in-match' | 'finished';
  participants: Array<{
    userId: string;
    username: string;
    displayName: string;
    avatarId: string;
    equippedPenId: string;
    team: 'player1' | 'player2' | 'player3';
    isHost: boolean;
    isReady: boolean;
    connected: boolean;
    score: number;
  }>;
  deskTheme: string;
  seriesLength: number;
  currentTurn?: 'player1' | 'player2' | 'player3';
  activeRound?: number;
  createdAt: string;
}

interface MatchHistoryEntry {
  id: string;
  type: 'duel-1v1' | 'ffa-3p';
  date: string;
  durationSeconds: number;
  participants: Array<{
    userId: string;
    username: string;
    displayName: string;
    avatarId: string;
    placement: number;
    knockouts: number;
    ratingDelta: number;
    newRating: number;
  }>;
  winnerId: string;
  winnerName: string;
}

interface StoredChallenge {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatarId: string;
  toUserId: string;
  toUsername: string;
  type: 'duel-1v1' | 'ffa-3p';
  createdAt: string;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

interface FriendRequestItem {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatarId: string;
  toUserId: string;
  createdAt: string;
}

// In-Memory Database
const users = new Map<string, StoredUser>(); // id -> user
const usersByUsername = new Map<string, string>(); // username -> id
const tokens = new Map<string, string>(); // token -> userId
const rooms = new Map<string, StoredRoom>(); // code -> room
const matchHistory: MatchHistoryEntry[] = [];
const friendRequests = new Map<string, FriendRequestItem>(); // id -> req
const challenges = new Map<string, StoredChallenge>(); // id -> challenge
const userReports: Array<{ reporterId: string; targetId: string; reason: string; timestamp: string }> = [];

// Matchmaking queues (user IDs)
const queue1v1: string[] = [];
const queue3p: string[] = [];

// Load persisted state if exists
function loadPersistedData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (Array.isArray(data.users)) {
        for (const u of data.users) {
          users.set(u.id, u);
          usersByUsername.set(u.username.toLowerCase(), u.id);
          tokens.set(u.token, u.id);
        }
      }
      if (Array.isArray(data.matchHistory)) {
        matchHistory.push(...data.matchHistory);
      }
    }
  } catch (err) {
    console.error('Failed to load persisted data', err);
  }
}

function savePersistedData() {
  try {
    const data = {
      users: Array.from(users.values()),
      matchHistory: matchHistory.slice(-100),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save data', err);
  }
}

loadPersistedData();

// Helper to generate player ID
function generatePlayerId(): string {
  let id = '';
  do {
    const num = Math.floor(10000 + Math.random() * 90000);
    id = `PF-${num}`;
  } while (users.has(id));
  return id;
}

// Helper to generate room code (e.g. DESK82)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

// User Tier calculation from rating
function getTier(rating: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Grandmaster' {
  if (rating >= 1800) return 'Grandmaster';
  if (rating >= 1600) return 'Diamond';
  if (rating >= 1400) return 'Platinum';
  if (rating >= 1200) return 'Gold';
  if (rating >= 1050) return 'Silver';
  return 'Bronze';
}

// Format public user profile
function toPublicUser(u: StoredUser) {
  const isOnline = activeSockets.has(u.id);
  const activeRoom = Array.from(rooms.values()).find(r => r.status === 'in-match' && r.participants.some(p => p.userId === u.id));
  const status = isOnline ? (activeRoom ? 'in-match' : 'online') : 'offline';

  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarId: u.avatarId,
    isGuest: u.isGuest,
    createdAt: u.createdAt,
    status,
    rating1v1: u.rating1v1,
    highestRating1v1: u.highestRating1v1,
    rating3p: u.rating3p,
    highestRating3p: u.highestRating3p,
    tier: getTier(Math.max(u.rating1v1, u.rating3p)),
    stats: {
      matches1v1: u.matches1v1,
      wins1v1: u.wins1v1,
      matches3p: u.matches3p,
      wins3p: u.wins3p,
      currentStreak: u.currentStreak,
      bestStreak: u.bestStreak,
      totalKnockouts: u.totalKnockouts,
    },
    favoritePenId: u.favoritePenId,
    unlockedAchievements: u.unlockedAchievements,
  };
}

// ===================== REST API ROUTES =====================

// 1. Guest session initialization
app.post('/api/auth/guest', (req, res) => {
  const { existingId } = req.body;
  if (existingId && users.has(existingId)) {
    const existing = users.get(existingId)!;
    return res.json({ user: toPublicUser(existing), token: existing.token });
  }

  const id = generatePlayerId();
  const username = `student_${id.replace('PF-', '')}`;
  const token = `tok_guest_${Math.random().toString(36).substring(2)}${Date.now()}`;

  const guestUser: StoredUser = {
    id,
    username,
    displayName: `Student ${id.replace('PF-', '')}`,
    avatarId: 'av-topper',
    isGuest: true,
    token,
    createdAt: new Date().toISOString(),
    rating1v1: 1000,
    highestRating1v1: 1000,
    rating3p: 1000,
    highestRating3p: 1000,
    matches1v1: 0,
    wins1v1: 0,
    matches3p: 0,
    wins3p: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalKnockouts: 0,
    favoritePenId: 'cheap-ballpoint',
    unlockedAchievements: [],
    friends: [],
    blockedUsers: [],
  };

  users.set(id, guestUser);
  usersByUsername.set(username.toLowerCase(), id);
  tokens.set(token, id);
  savePersistedData();

  res.json({ user: toPublicUser(guestUser), token });
});

// 2. Account Registration
app.post('/api/auth/register', (req, res) => {
  const { username, displayName, avatarId, password } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (usersByUsername.has(cleanUsername)) {
    return res.status(409).json({ error: 'Username is already taken' });
  }

  const id = generatePlayerId();
  const token = `tok_user_${Math.random().toString(36).substring(2)}${Date.now()}`;

  const newUser: StoredUser = {
    id,
    username: cleanUsername,
    displayName: (displayName || cleanUsername).trim(),
    passwordHash: password || 'default_secret',
    avatarId: avatarId || 'av-topper',
    isGuest: false,
    token,
    createdAt: new Date().toISOString(),
    rating1v1: 1000,
    highestRating1v1: 1000,
    rating3p: 1000,
    highestRating3p: 1000,
    matches1v1: 0,
    wins1v1: 0,
    matches3p: 0,
    wins3p: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalKnockouts: 0,
    favoritePenId: 'cheap-ballpoint',
    unlockedAchievements: [],
    friends: [],
    blockedUsers: [],
  };

  users.set(id, newUser);
  usersByUsername.set(cleanUsername, id);
  tokens.set(token, id);
  savePersistedData();

  res.json({ user: toPublicUser(newUser), token });
});

// 3. Account Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });

  const userId = usersByUsername.get(username.trim().toLowerCase());
  if (!userId || !users.has(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = users.get(userId)!;
  if (user.passwordHash && password && user.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.json({ user: toPublicUser(user), token: user.token });
});

// 4. Upgrade Guest to Full Account
app.post('/api/auth/upgrade', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = tokens.get(token || '');
  if (!userId || !users.has(userId)) return res.status(401).json({ error: 'Unauthorized' });

  const { newUsername, newDisplayName, password } = req.body;
  const cleanUsername = (newUsername || '').trim().toLowerCase();

  if (cleanUsername.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (usersByUsername.has(cleanUsername) && usersByUsername.get(cleanUsername) !== userId) {
    return res.status(409).json({ error: 'Username is already taken' });
  }

  const user = users.get(userId)!;
  usersByUsername.delete(user.username.toLowerCase());
  user.username = cleanUsername;
  user.displayName = (newDisplayName || cleanUsername).trim();
  user.passwordHash = password || user.passwordHash;
  user.isGuest = false;

  usersByUsername.set(cleanUsername, userId);
  savePersistedData();

  res.json({ user: toPublicUser(user) });
});

// 5. Update Profile
app.patch('/api/auth/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = tokens.get(token || '');
  if (!userId || !users.has(userId)) return res.status(401).json({ error: 'Unauthorized' });

  const user = users.get(userId)!;
  const { displayName, avatarId, favoritePenId } = req.body;

  if (displayName) user.displayName = displayName.trim();
  if (avatarId) user.avatarId = avatarId;
  if (favoritePenId) user.favoritePenId = favoritePenId;

  savePersistedData();
  res.json({ user: toPublicUser(user) });
});

// 6. Search Users
app.get('/api/users/search', (req, res) => {
  const query = (req.query.q as string || '').trim().toLowerCase();
  if (!query) return res.json({ users: [] });

  const results = Array.from(users.values())
    .filter(u => u.username.toLowerCase().includes(query) || u.id.toLowerCase().includes(query) || u.displayName.toLowerCase().includes(query))
    .slice(0, 15)
    .map(toPublicUser);

  res.json({ users: results });
});

// 7. Get User by ID
app.get('/api/users/:id', (req, res) => {
  const user = users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: toPublicUser(user) });
});

// 8. Public Rooms List
app.get('/api/rooms', (req, res) => {
  const typeFilter = req.query.type as string;
  const openRooms = Array.from(rooms.values())
    .filter(r => r.isPublic && r.status === 'waiting' && r.participants.length < r.capacity)
    .filter(r => !typeFilter || r.type === typeFilter);

  res.json({ rooms: openRooms });
});

// 9. Match History
app.get('/api/history', (req, res) => {
  const userId = req.query.userId as string;
  let records = matchHistory;
  if (userId) {
    records = records.filter(m => m.participants.some(p => p.userId === userId));
  }
  res.json({ records: records.slice(-30).reverse() });
});

// 10. Global Ratings Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const mode = req.query.mode === '3p' ? '3p' : '1v1';
  const allUsers = Array.from(users.values());

  if (mode === '3p') {
    allUsers.sort((a, b) => b.rating3p - a.rating3p);
  } else {
    allUsers.sort((a, b) => b.rating1v1 - a.rating1v1);
  }

  const top = allUsers.slice(0, 50).map((u, i) => ({
    rank: i + 1,
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarId: u.avatarId,
    rating: mode === '3p' ? u.rating3p : u.rating1v1,
    tier: getTier(mode === '3p' ? u.rating3p : u.rating1v1),
    wins: mode === '3p' ? u.wins3p : u.wins1v1,
    matches: mode === '3p' ? u.matches3p : u.matches1v1,
    favoritePenId: u.favoritePenId,
  }));

  res.json({ leaderboard: top });
});

// 11. Report Player
app.post('/api/report', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = tokens.get(token || '');
  const { targetId, reason } = req.body;
  if (userId && targetId) {
    userReports.push({ reporterId: userId, targetId, reason: reason || 'Unspecified', timestamp: new Date().toISOString() });
  }
  res.json({ success: true });
});

// 12. Block / Unblock Player
app.post('/api/block', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const userId = tokens.get(token || '');
  if (!userId || !users.has(userId)) return res.status(401).json({ error: 'Unauthorized' });

  const { targetId, block } = req.body;
  const user = users.get(userId)!;
  if (block) {
    if (!user.blockedUsers.includes(targetId)) user.blockedUsers.push(targetId);
  } else {
    user.blockedUsers = user.blockedUsers.filter(id => id !== targetId);
  }
  savePersistedData();
  res.json({ blockedUsers: user.blockedUsers });
});

// ===================== REALTIME WEBSOCKET SERVER =====================
const wss = new WebSocketServer({ server, path: '/ws' });

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  currentRoomId?: string;
  isAlive?: boolean;
}

const activeSockets = new Map<string, AuthenticatedSocket>(); // userId -> ws

// Broadcast helper to room participants
function broadcastToRoom(roomId: string, message: Record<string, unknown>, excludeUserId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);

  for (const p of room.participants) {
    if (excludeUserId && p.userId === excludeUserId) continue;
    const client = activeSockets.get(p.userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Send event to specific user
function sendToUser(userId: string, message: Record<string, unknown>) {
  const client = activeSockets.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

// ELO rating calculator
function calculateElo(ratingA: number, ratingB: number, actualA: number, kFactor: number = 32): { deltaA: number; deltaB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const deltaA = Math.round(kFactor * (actualA - expectedA));
  return { deltaA, deltaB: -deltaA };
}

// Matchmaking match creator
function tryProcessMatchmaking() {
  // 1v1 Queue
  while (queue1v1.length >= 2) {
    const p1Id = queue1v1.shift()!;
    const p2Id = queue1v1.shift()!;
    if (!activeSockets.has(p1Id) || !activeSockets.has(p2Id)) continue;

    createMatchmakingRoom([p1Id, p2Id], 'duel-1v1', 2);
  }

  // 3-Player FFA Queue
  while (queue3p.length >= 3) {
    const p1Id = queue3p.shift()!;
    const p2Id = queue3p.shift()!;
    const p3Id = queue3p.shift()!;
    if (!activeSockets.has(p1Id) || !activeSockets.has(p2Id) || !activeSockets.has(p3Id)) continue;

    createMatchmakingRoom([p1Id, p2Id, p3Id], 'ffa-3p', 3);
  }
}

function createMatchmakingRoom(playerIds: string[], type: 'duel-1v1' | 'ffa-3p', capacity: 2 | 3) {
  const roomCode = generateRoomCode();
  const teams: Array<'player1' | 'player2' | 'player3'> = ['player1', 'player2', 'player3'];

  const participants = playerIds.map((uid, idx) => {
    const u = users.get(uid)!;
    return {
      userId: uid,
      username: u.username,
      displayName: u.displayName,
      avatarId: u.avatarId,
      equippedPenId: u.favoritePenId || 'cheap-ballpoint',
      team: teams[idx],
      isHost: idx === 0,
      isReady: true,
      connected: true,
      score: 0,
    };
  });

  const room: StoredRoom = {
    id: roomCode,
    name: `Desk Arena ${roomCode}`,
    hostId: playerIds[0],
    type,
    capacity,
    isPublic: false,
    status: 'in-match',
    participants,
    deskTheme: 'classroom-teak',
    seriesLength: capacity === 2 ? 3 : 1,
    currentTurn: 'player1',
    activeRound: 1,
    createdAt: new Date().toISOString(),
  };

  rooms.set(roomCode, room);

  // Notify each player
  for (const p of participants) {
    const client = activeSockets.get(p.userId);
    if (client) client.currentRoomId = roomCode;

    sendToUser(p.userId, {
      type: 'match_found',
      room,
      yourTeam: p.team,
    });
  }
}

// WebSocket connection lifecycle
wss.on('connection', (ws: AuthenticatedSocket) => {
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (rawData: string) => {
    try {
      const data = JSON.parse(rawData.toString());
      handleSocketMessage(ws, data);
    } catch (err) {
      console.error('Invalid WS payload', err);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      activeSockets.delete(ws.userId);

      // Remove from matchmaking queues
      const idx1 = queue1v1.indexOf(ws.userId);
      if (idx1 >= 0) queue1v1.splice(idx1, 1);
      const idx3 = queue3p.indexOf(ws.userId);
      if (idx3 >= 0) queue3p.splice(idx3, 1);

      // Handle room disconnect
      if (ws.currentRoomId && rooms.has(ws.currentRoomId)) {
        const room = rooms.get(ws.currentRoomId)!;
        const participant = room.participants.find(p => p.userId === ws.userId);
        if (participant) {
          participant.connected = false;

          // If room waiting in lobby, remove or transfer host
          if (room.status === 'waiting') {
            room.participants = room.participants.filter(p => p.userId !== ws.userId);
            if (room.participants.length === 0) {
              rooms.delete(ws.currentRoomId);
            } else {
              if (room.hostId === ws.userId) {
                room.hostId = room.participants[0].userId;
                room.participants[0].isHost = true;
              }
              broadcastToRoom(ws.currentRoomId, { type: 'room:update', room });
            }
          } else {
            // In active match: broadcast disconnect notice
            broadcastToRoom(ws.currentRoomId, {
              type: 'player:disconnected',
              userId: ws.userId,
              username: participant.username,
            });
          }
        }
      }
    }
  });
});

// Periodic heartbeat
setInterval(() => {
  wss.clients.forEach(client => {
    const ws = client as AuthenticatedSocket;
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Core WebSocket message dispatcher
function handleSocketMessage(ws: AuthenticatedSocket, msg: Record<string, unknown>) {
  const type = msg.type as string;

  // 1. Auth on connect
  if (type === 'auth:init') {
    const { token, userId } = msg as { token?: string; userId?: string };
    const authId = (token ? tokens.get(token) : null) || userId;
    if (authId && users.has(authId)) {
      ws.userId = authId;
      activeSockets.set(authId, ws);
      sendToUser(authId, { type: 'auth:success', user: toPublicUser(users.get(authId)!) });
    }
    return;
  }

  if (!ws.userId) return; // Must be authenticated
  const currentUserId = ws.userId;
  const currentUser = users.get(currentUserId)!;

  // 2. Queue for Matchmaking
  if (type === 'matchmaking:join') {
    const mode = msg.mode === 'ffa-3p' ? 'ffa-3p' : 'duel-1v1';
    if (mode === 'ffa-3p') {
      if (!queue3p.includes(currentUserId)) queue3p.push(currentUserId);
    } else {
      if (!queue1v1.includes(currentUserId)) queue1v1.push(currentUserId);
    }
    sendToUser(currentUserId, { type: 'matchmaking:queued', mode });
    tryProcessMatchmaking();
    return;
  }

  if (type === 'matchmaking:leave') {
    const idx1 = queue1v1.indexOf(currentUserId);
    if (idx1 >= 0) queue1v1.splice(idx1, 1);
    const idx3 = queue3p.indexOf(currentUserId);
    if (idx3 >= 0) queue3p.splice(idx3, 1);
    sendToUser(currentUserId, { type: 'matchmaking:cancelled' });
    return;
  }

  // 3. Create Private Room
  if (type === 'room:create') {
    const { capacity = 2, isPublic = false, password, deskTheme = 'classroom-teak', seriesLength = 3 } = msg as {
      capacity?: 2 | 3;
      isPublic?: boolean;
      password?: string;
      deskTheme?: string;
      seriesLength?: number;
    };

    const roomCode = generateRoomCode();
    const room: StoredRoom = {
      id: roomCode,
      name: `${currentUser.displayName}'s Room`,
      hostId: currentUserId,
      type: capacity === 3 ? 'ffa-3p' : 'duel-1v1',
      capacity,
      isPublic,
      password,
      status: 'waiting',
      participants: [
        {
          userId: currentUserId,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatarId: currentUser.avatarId,
          equippedPenId: currentUser.favoritePenId || 'cheap-ballpoint',
          team: 'player1',
          isHost: true,
          isReady: true,
          connected: true,
          score: 0,
        },
      ],
      deskTheme,
      seriesLength,
      createdAt: new Date().toISOString(),
    };

    rooms.set(roomCode, room);
    ws.currentRoomId = roomCode;

    sendToUser(currentUserId, { type: 'room:created', room });
    return;
  }

  // 4. Join Room
  if (type === 'room:join') {
    const { roomCode, password } = msg as { roomCode: string; password?: string };
    const code = (roomCode || '').trim().toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      return sendToUser(currentUserId, { type: 'room:error', message: 'Room not found.' });
    }
    if (room.status !== 'waiting') {
      return sendToUser(currentUserId, { type: 'room:error', message: 'Match already in progress.' });
    }
    if (room.participants.length >= room.capacity) {
      return sendToUser(currentUserId, { type: 'room:error', message: 'Room is full.' });
    }
    if (room.password && room.password !== password) {
      return sendToUser(currentUserId, { type: 'room:error', message: 'Incorrect room password.' });
    }

    const teamList: Array<'player1' | 'player2' | 'player3'> = ['player1', 'player2', 'player3'];
    const assignedTeam = teamList[room.participants.length];

    room.participants.push({
      userId: currentUserId,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatarId: currentUser.avatarId,
      equippedPenId: currentUser.favoritePenId || 'cheap-ballpoint',
      team: assignedTeam,
      isHost: false,
      isReady: false,
      connected: true,
      score: 0,
    });

    ws.currentRoomId = code;
    broadcastToRoom(code, { type: 'room:update', room });
    return;
  }

  // 5. Toggle Ready in Room
  if (type === 'room:ready') {
    const { roomId, isReady } = msg as { roomId: string; isReady: boolean };
    const room = rooms.get(roomId);
    if (!room) return;

    const p = room.participants.find(part => part.userId === currentUserId);
    if (p) {
      p.isReady = isReady;
      broadcastToRoom(roomId, { type: 'room:update', room });
    }
    return;
  }

  // 6. Start Room Match (Host only)
  if (type === 'room:start') {
    const { roomId } = msg as { roomId: string };
    const room = rooms.get(roomId);
    if (!room || room.hostId !== currentUserId) return;

    if (room.participants.length !== room.capacity) {
      return sendToUser(currentUserId, { type: 'room:error', message: `Need ${room.capacity} players to start.` });
    }

    const allReady = room.participants.every(p => p.isReady || p.isHost);
    if (!allReady) {
      return sendToUser(currentUserId, { type: 'room:error', message: 'All players must be Ready.' });
    }

    room.status = 'in-match';
    room.currentTurn = 'player1';
    room.activeRound = 1;

    broadcastToRoom(roomId, { type: 'room:match_start', room });
    return;
  }

  // 7. Leave Room
  if (type === 'room:leave') {
    const { roomId } = msg as { roomId: string };
    const room = rooms.get(roomId);
    if (!room) return;

    room.participants = room.participants.filter(p => p.userId !== currentUserId);
    ws.currentRoomId = undefined;

    if (room.participants.length === 0) {
      rooms.delete(roomId);
    } else {
      if (room.hostId === currentUserId) {
        room.hostId = room.participants[0].userId;
        room.participants[0].isHost = true;
      }
      broadcastToRoom(roomId, { type: 'room:update', room });
    }
    sendToUser(currentUserId, { type: 'room:left' });
    return;
  }

  // 8. In-Match Flick Action (Synchronized turn execution)
  if (type === 'match:flick') {
    const { roomId, penId, dirX, dirY, power, offsetRatio } = msg as {
      roomId: string;
      penId: string;
      dirX: number;
      dirY: number;
      power: number;
      offsetRatio: number;
    };

    const room = rooms.get(roomId);
    if (!room || room.status !== 'in-match') return;

    // Verify player is on active team
    const participant = room.participants.find(p => p.userId === currentUserId);
    if (!participant || participant.team !== room.currentTurn) {
      return; // Not their turn
    }

    // Broadcast valid flick to all participants in room
    broadcastToRoom(roomId, {
      type: 'match:flick_broadcast',
      penId,
      dirX,
      dirY,
      power,
      offsetRatio,
      team: participant.team,
    });
    return;
  }

  // 9. Round Resolved (All pens settled)
  if (type === 'match:round_settled') {
    const { roomId, survivingTeams } = msg as {
      roomId: string;
      survivingTeams: Array<'player1' | 'player2' | 'player3'>;
    };

    const room = rooms.get(roomId);
    if (!room || room.status !== 'in-match') return;

    // Check if only 1 team survived
    if (survivingTeams.length <= 1) {
      const winnerTeam = survivingTeams[0] || null;
      let roundWinnerParticipant = room.participants.find(p => p.team === winnerTeam);

      if (roundWinnerParticipant) {
        roundWinnerParticipant.score += 1;
      }

      // Check series win (e.g. 2 wins for best of 3)
      const targetWins = Math.ceil(room.seriesLength / 2);
      const seriesWinner = room.participants.find(p => p.score >= targetWins);

      if (seriesWinner || room.capacity === 3) {
        // MATCH CONCLUDED!
        room.status = 'finished';

        const matchWinner = seriesWinner || roundWinnerParticipant || room.participants[0];
        const winnerUser = users.get(matchWinner.userId)!;

        // ELO Rating Calculations
        const participantResults = room.participants.map((p, idx) => {
          const u = users.get(p.userId)!;
          const isWinner = p.userId === matchWinner.userId;
          const ratingKey = room.capacity === 3 ? 'rating3p' : 'rating1v1';
          const highestKey = room.capacity === 3 ? 'highestRating3p' : 'highestRating1v1';
          const matchesKey = room.capacity === 3 ? 'matches3p' : 'matches1v1';
          const winsKey = room.capacity === 3 ? 'wins3p' : 'wins1v1';

          let delta = 0;
          if (room.capacity === 2) {
            const opponent = room.participants.find(o => o.userId !== p.userId);
            const oppUser = opponent ? users.get(opponent.userId) : null;
            const oppRating = oppUser ? oppUser[ratingKey] : 1000;
            const elo = calculateElo(u[ratingKey], oppRating, isWinner ? 1 : 0);
            delta = elo.deltaA;
          } else {
            // 3-Player ELO
            delta = isWinner ? 32 : -16;
          }

          u[ratingKey] = Math.max(500, u[ratingKey] + delta);
          u[highestKey] = Math.max(u[highestKey], u[ratingKey]);
          u[matchesKey] += 1;
          if (isWinner) {
            u[winsKey] += 1;
            u.currentStreak += 1;
            u.bestStreak = Math.max(u.bestStreak, u.currentStreak);
          } else {
            u.currentStreak = 0;
          }

          // Check Achievements
          if (!u.unlockedAchievements.includes('first_online_match')) u.unlockedAchievements.push('first_online_match');
          if (isWinner && !u.unlockedAchievements.includes('first_victory')) u.unlockedAchievements.push('first_victory');
          if (u.matches1v1 + u.matches3p >= 10 && !u.unlockedAchievements.includes('ten_online_matches')) u.unlockedAchievements.push('ten_online_matches');
          if (u.currentStreak >= 5 && !u.unlockedAchievements.includes('five_streak')) u.unlockedAchievements.push('five_streak');
          if (isWinner && room.capacity === 3 && !u.unlockedAchievements.includes('three_player_champion')) u.unlockedAchievements.push('three_player_champion');
          if (u.rating1v1 >= 1300 || u.rating3p >= 1300) {
            if (!u.unlockedAchievements.includes('veteran_player')) u.unlockedAchievements.push('veteran_player');
          }

          return {
            userId: p.userId,
            username: p.username,
            displayName: p.displayName,
            avatarId: p.avatarId,
            placement: isWinner ? 1 : idx + 2,
            knockouts: 2,
            ratingDelta: delta,
            newRating: u[ratingKey],
          };
        });

        savePersistedData();

        // Record official match history
        const historyRecord: MatchHistoryEntry = {
          id: `match_${Date.now()}`,
          type: room.type,
          date: new Date().toISOString(),
          durationSeconds: 120,
          participants: participantResults,
          winnerId: matchWinner.userId,
          winnerName: matchWinner.displayName,
        };
        matchHistory.push(historyRecord);

        broadcastToRoom(roomId, {
          type: 'match:game_over',
          winnerId: matchWinner.userId,
          winnerTeam: matchWinner.team,
          results: participantResults,
          room,
        });
      } else {
        // Next Round in Series
        room.activeRound = (room.activeRound || 1) + 1;
        room.currentTurn = 'player1';
        broadcastToRoom(roomId, {
          type: 'match:next_round',
          room,
          winnerTeam,
        });
      }
    } else {
      // Rotate turn among surviving teams
      const allTeams: Array<'player1' | 'player2' | 'player3'> =
        room.capacity === 3 ? ['player1', 'player2', 'player3'] : ['player1', 'player2'];
      const curIndex = allTeams.indexOf(room.currentTurn || 'player1');

      let nextTeam = room.currentTurn;
      for (let i = 1; i <= allTeams.length; i++) {
        const candidate = allTeams[(curIndex + i) % allTeams.length];
        if (survivingTeams.includes(candidate)) {
          nextTeam = candidate;
          break;
        }
      }

      room.currentTurn = nextTeam;
      broadcastToRoom(roomId, {
        type: 'match:turn_change',
        currentTurn: nextTeam,
      });
    }
    return;
  }

  // 10. In-Game Chat / Emote
  if (type === 'chat:send') {
    const { roomId, text, isEmote } = msg as { roomId: string; text: string; isEmote?: boolean };
    if (!text || typeof text !== 'string') return;

    broadcastToRoom(roomId, {
      type: 'chat:message',
      message: {
        id: `msg_${Date.now()}`,
        roomId,
        userId: currentUserId,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarId: currentUser.avatarId,
        text: text.slice(0, 80),
        isEmote: !!isEmote,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    });
    return;
  }

  // 11. Friend System Requests
  if (type === 'friend:request') {
    const { targetUserId } = msg as { targetUserId: string };
    const target = users.get(targetUserId);
    if (!target || target.blockedUsers.includes(currentUserId) || currentUser.friends.includes(targetUserId)) {
      return;
    }

    const reqId = `fr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const request: FriendRequestItem = {
      id: reqId,
      fromUserId: currentUserId,
      fromUsername: currentUser.username,
      fromDisplayName: currentUser.displayName,
      fromAvatarId: currentUser.avatarId,
      toUserId: targetUserId,
      createdAt: new Date().toISOString(),
    };

    friendRequests.set(reqId, request);

    sendToUser(targetUserId, {
      type: 'notification:new',
      notification: {
        id: reqId,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${currentUser.displayName} (@${currentUser.username}) sent you a friend request!`,
        timestamp: 'Just now',
        read: false,
        data: request,
      },
    });
    return;
  }

  if (type === 'friend:respond') {
    const { requestId, accept } = msg as { requestId: string; accept: boolean };
    const reqItem = friendRequests.get(requestId);
    if (!reqItem || reqItem.toUserId !== currentUserId) return;

    friendRequests.delete(requestId);

    if (accept) {
      const otherUser = users.get(reqItem.fromUserId);
      if (otherUser) {
        if (!currentUser.friends.includes(reqItem.fromUserId)) currentUser.friends.push(reqItem.fromUserId);
        if (!otherUser.friends.includes(currentUserId)) otherUser.friends.push(currentUserId);
        savePersistedData();

        sendToUser(reqItem.fromUserId, {
          type: 'notification:new',
          notification: {
            id: `fa_${Date.now()}`,
            type: 'friend_accepted',
            title: 'Friend Request Accepted',
            message: `${currentUser.displayName} accepted your friend request!`,
            timestamp: 'Just now',
            read: false,
          },
        });
      }
    }
    return;
  }

  // 12. Realtime Challenge System
  if (type === 'challenge:send') {
    const { targetUserId, challengeType = 'duel-1v1' } = msg as {
      targetUserId: string;
      challengeType?: 'duel-1v1' | 'ffa-3p';
    };

    const target = users.get(targetUserId);
    if (!target || target.blockedUsers.includes(currentUserId) || targetUserId === currentUserId) {
      return sendToUser(currentUserId, { type: 'challenge:error', message: 'Unable to challenge this player.' });
    }

    const challId = `ch_${Date.now()}`;
    const challenge: StoredChallenge = {
      id: challId,
      fromUserId: currentUserId,
      fromUsername: currentUser.username,
      fromDisplayName: currentUser.displayName,
      fromAvatarId: currentUser.avatarId,
      toUserId: targetUserId,
      toUsername: target.username,
      type: challengeType,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 45000, // 45s expiration
      status: 'pending',
    };

    challenges.set(challId, challenge);

    sendToUser(targetUserId, {
      type: 'challenge:incoming',
      challenge,
    });
    sendToUser(currentUserId, {
      type: 'challenge:sent',
      challenge,
    });
    return;
  }

  if (type === 'challenge:respond') {
    const { challengeId, accept } = msg as { challengeId: string; accept: boolean };
    const chall = challenges.get(challengeId);
    if (!chall || chall.toUserId !== currentUserId || chall.status !== 'pending') return;

    if (accept) {
      chall.status = 'accepted';
      // Automatically launch a private room lobby for the two players!
      createMatchmakingRoom([chall.fromUserId, chall.toUserId], chall.type, chall.type === 'ffa-3p' ? 3 : 2);
    } else {
      chall.status = 'declined';
      sendToUser(chall.fromUserId, {
        type: 'challenge:declined',
        username: currentUser.displayName,
      });
    }
    return;
  }
}

// ===================== CLIENT VITE INTEGRATION =====================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Pen Fight Full-Stack Online Server running on port ${PORT}`);
  });
}

startServer();
