# Pen Fight: The School Desk Series — Online Multiplayer Expansion

A mobile-first browser game recreating the nostalgic school activity where students flick their pens across a wooden desk to knock opponent pens out of the playing area.

Now upgraded with a **complete full-stack real-time online multiplayer system** supporting **2-Player Duels** and **3-Player Free-for-All (FFA)** battles!

---

## 🌟 Game Highlights & Multiplayer Systems

### 1. User Account & Identity System
- **Unique Usernames & Permanent Player IDs**: Each player has an immutable permanent Player ID (e.g. `PF-84920`) and unique username.
- **Guest Mode & Upgrades**: Play immediately as a guest student without friction, or upgrade to a registered account without losing XP, level, or unlocked pens.
- **Live Presence**: Online, Offline, and In-Match indicators.

### 2. Online Multiplayer Modes
- **2-Player Duels (1v1)**:
  - Best of 3 format.
  - Server-authoritative turn control, synchronized pen launches, real-time collision resolution, and table edge eliminations.
  - Winner & loser verified on server with competitive ELO rating changes.
- **3-Player Free-for-All (1v1v1)**:
  - 3 independent players positioned at 3 corners of the desk:
    - Player 1 (Blue / Cyan)
    - Player 2 (Amber / Orange)
    - Player 3 (Emerald Green)
  - Fair clockwise turn rotation among surviving players.
  - When a player loses both pens, they are eliminated; turn order automatically skips eliminated players.
  - Last surviving desk champion wins! 1st, 2nd, and 3rd placements awarded with separate 3-Player ELO ratings.

### 3. Matchmaking & Room Systems
- **Quick Play Matchmaking**:
  - 1v1 Duel queue (matches 2 players).
  - 3-Player FFA queue (matches 3 players).
  - Searching status banner with cancel and instant match transition.
- **Private Room Lobbies & Code Sharing**:
  - Create custom 2P or 3P rooms with unique 5-letter codes (e.g. `DESK82`).
  - 1-click room code copying.
  - Ready/Not Ready toggles and host countdown start.
  - In-lobby and in-game chat and reaction emotes.
- **Public Room Browser**:
  - Filter active open lobbies by 2P or 3P and join with one tap.

### 4. Friends & Realtime Challenge System
- Search classmates by exact username or Player ID prefix.
- Direct **Challenge 1v1** or **Challenge 3P** buttons.
- Real-time notification delivered through WebSocket with instant Accept/Decline action.
- Accepting a challenge automatically forms a match room for both players.
- Player safety controls: Block Player and Report Player options.

### 5. In-Game Communication & Emotes
- Floating reaction emotes (🔥, 😂, 🎯, 👏, 😱, 👑, 💪, 🏆) appearing above pens.
- Preset quick-chat phrases ("Good game!", "Nice shot!", "Close call!").

### 6. Classroom Achievements & ELO Ratings
- 8 verified achievements with XP bonuses (*Classroom Debut*, *First Blood*, *Desk Regular*, *Unstoppable Streak*, *Triple Threat Triumph*, *Study Group Duel*, *Schoolyard Legend*, *Edge Knockout Ace*).
- Separate 1v1 and 3-Player competitive ratings with tiers from **Bronze** to **Grandmaster**.
- Global ratings leaderboard and match history review.

### 7. Offline & Single-Player Modes (Completely Preserved!)
- **VS Computer**: 4 AI difficulties (Easy, Normal, Hard, Grandmaster).
- **2 Players (Pass & Play)**: Local turn-based battle on the same device.
- **Pen Locker**: 8 detailed pens with distinct mass, length, desk grip, and bounce attributes.
- **Classroom Themes**: 4 desk wood finishes (Teak, Oak, Mahogany, Chalkboard).
- **Pure Web Audio API**: 100% procedural sound synthesis (works completely offline).
- **Bilingual**: Full English and বাংলা (Bangla) translation support.

---

## 🚀 How to Launch and Play Online

### Start the Server
```bash
# Install dependencies
npm install

# Start full-stack server (HTTP + WebSockets on port 3000)
npm run dev
```

### Playing with Other People:
1. Open the game in two or three separate browser tabs (or on separate mobile devices/laptops on the same network or shared URL).
2. Click **Online Classroom** on the main menu.
3. Test either:
   - **Quick 1v1** or **Quick 3P**: Queue up in both windows; within seconds the match room forms and both players enter the desk arena!
   - **Create Room**: Host creates a 2P or 3P room, copies the 5-letter Room Code, and the other player enters the code under "Join with Code".
   - **Direct Challenge**: Search the other player's username or Player ID in Friends Hub and hit **Challenge 1v1** or **Challenge 3P**!
