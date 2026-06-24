/* ═══════════════════════════════════════════════════════════════
   CLIENT-SIDE AUTH (localStorage) — No backend required
   ═══════════════════════════════════════════════════════════════ */

export interface LocalUser {
  id: number;
  username: string;
  displayName: string;
  name: string;
  avatar: string;
  level: number;
  totalXp: number;
  role: string;
  title: string;
  country: string;
  bio: string;
  createdAt: string;
}

const USERS_KEY = 'cyberpaw_users';
const CURRENT_USER_KEY = 'cyberpaw_current_user';

function getUsers(): Record<string, { passwordHash: string; user: LocalUser }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { passwordHash: string; user: LocalUser }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Simple hash (not bcrypt — client-side, for demo/educational purposes)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(36) + '_' + str.length;
}

function levelFromXp(totalXp: number): number {
  let level = 1;
  let xpNeeded = 100;
  let remaining = totalXp;
  while (remaining >= xpNeeded) {
    remaining -= xpNeeded;
    level++;
    xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
  }
  return level;
}

function getTitle(level: number): string {
  if (level >= 30) return 'Legendary CyberLion';
  if (level >= 25) return 'Net Ninja Cat';
  if (level >= 20) return 'Phantom Pounce';
  if (level >= 15) return 'Data Tiger';
  if (level >= 10) return 'Neon Claw';
  if (level >= 7) return 'Shadow Tail';
  if (level >= 5) return 'Cyber Purr-ogrammer';
  if (level >= 3) return 'Whisker Hacker';
  if (level >= 2) return 'Code Cat';
  return 'Script Kitten';
}

export const localAuth = {
  register(username: string, password: string, displayName: string): { ok: true; user: LocalUser } | { ok: false; error: string } {
    const users = getUsers();
    if (users[username]) {
      return { ok: false, error: 'Username already taken' };
    }
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      return { ok: false, error: 'Username must be 3-32 chars (alphanumeric + _)' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters' };
    }

    const id = Object.keys(users).length + 1;
    const user: LocalUser = {
      id,
      username,
      displayName: displayName || username,
      name: displayName || username,
      avatar: 'cat',
      level: 1,
      totalXp: 0,
      role: 'user',
      title: 'Script Kitten',
      country: 'US',
      bio: '',
      createdAt: new Date().toISOString(),
    };

    users[username] = { passwordHash: simpleHash(password), user };
    saveUsers(users);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    // Initialize player data
    localAuth.initPlayerData(id);

    return { ok: true, user };
  },

  login(username: string, password: string): { ok: true; user: LocalUser } | { ok: false; error: string } {
    const users = getUsers();
    const record = users[username];
    if (!record) {
      return { ok: false, error: 'Invalid username or password' };
    }
    if (record.passwordHash !== simpleHash(password)) {
      return { ok: false, error: 'Invalid username or password' };
    }

    // Update title based on level
    record.user.title = getTitle(record.user.level);
    record.user.name = record.user.displayName;

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(record.user));
    return { ok: true, user: record.user };
  },

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  me(): LocalUser | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  getCurrentUser(): LocalUser | null {
    return this.me();
  },

  // XP & Level
  addXp(amount: number): LocalUser | null {
    const user = this.me();
    if (!user) return null;
    user.totalXp += amount;
    user.level = levelFromXp(user.totalXp);
    user.title = getTitle(user.level);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    // Update in users registry too
    const users = getUsers();
    if (users[user.username]) {
      users[user.username].user = user;
      saveUsers(users);
    }

    // Save XP log
    const logs = JSON.parse(localStorage.getItem('cyberpaw_xp_logs') || '[]');
    logs.unshift({ action: 'xp_gain', xpGained: amount, createdAt: new Date().toISOString() });
    localStorage.setItem('cyberpaw_xp_logs', JSON.stringify(logs.slice(0, 50)));

    return user;
  },

  getXpLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('cyberpaw_xp_logs') || '[]');
    } catch {
      return [];
    }
  },

  // Player Stats
  getStats() {
    return JSON.parse(localStorage.getItem('cyberpaw_stats') || JSON.stringify({
      gamesPlayed: 0, gamesCompleted: 0, attacksLaunched: 0,
      attacksDefended: 0, toolsUnlocked: 3, duelsWon: 0, duelsLost: 0,
      rankPoints: 100, currentStreak: 0, bestStreak: 0,
    }));
  },

  updateStats(partial: Record<string, number>) {
    const stats = this.getStats();
    localStorage.setItem('cyberpaw_stats', JSON.stringify({ ...stats, ...partial }));
  },

  // Game Progress
  getGameProgress(): Record<string, any> {
    try {
      return JSON.parse(localStorage.getItem('cyberpaw_game_progress') || '{}');
    } catch {
      return {};
    }
  },

  recordGame(gameId: string, score: number, stars: number) {
    const progress = this.getGameProgress();
    const existing = progress[gameId];
    progress[gameId] = {
      completed: true,
      bestScore: Math.max(existing?.bestScore || 0, score),
      stars: Math.max(existing?.stars || 0, stars),
      attempts: (existing?.attempts || 0) + 1,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem('cyberpaw_game_progress', JSON.stringify(progress));

    // Update stats
    const stats = this.getStats();
    const completedCount = Object.values(progress).filter((p: any) => p.completed).length;
    this.updateStats({ gamesPlayed: stats.gamesPlayed + 1, gamesCompleted: completedCount });

    // Add XP
    this.addXp(score);
  },

  // Defense
  getDefenses() {
    return JSON.parse(localStorage.getItem('cyberpaw_defenses') || JSON.stringify({
      firewallLevel: 1, idsLevel: 1, honeypotLevel: 0,
      encryptionLevel: 1, backupLevel: 0, antiVirusLevel: 1, wafLevel: 0,
      totalDefensePower: 35,
    }));
  },

  updateDefenses(partial: Record<string, number>) {
    const d = { ...this.getDefenses(), ...partial };
    const total = (d.firewallLevel + d.idsLevel + d.honeypotLevel + d.encryptionLevel + d.backupLevel + d.antiVirusLevel + d.wafLevel) * 5 + 10;
    d.totalDefensePower = total;
    localStorage.setItem('cyberpaw_defenses', JSON.stringify(d));
  },

  // Inventory
  getInventory(): number[] {
    try {
      return JSON.parse(localStorage.getItem('cyberpaw_inventory') || '[1,2,3]');
    } catch {
      return [1, 2, 3]; // Default: port_scanner, dns_lookup, firewall_config
    }
  },

  addTool(toolId: number) {
    const inv = this.getInventory();
    if (!inv.includes(toolId)) {
      inv.push(toolId);
      localStorage.setItem('cyberpaw_inventory', JSON.stringify(inv));
    }
  },

  initPlayerData(userId: number) {
    if (!localStorage.getItem('cyberpaw_stats')) {
      localStorage.setItem('cyberpaw_stats', JSON.stringify({
        gamesPlayed: 0, gamesCompleted: 0, attacksLaunched: 0,
        attacksDefended: 0, toolsUnlocked: 3, duelsWon: 0, duelsLost: 0,
        rankPoints: 100, currentStreak: 0, bestStreak: 0,
      }));
    }
    if (!localStorage.getItem('cyberpaw_defenses')) {
      localStorage.setItem('cyberpaw_defenses', JSON.stringify({
        firewallLevel: 1, idsLevel: 1, honeypotLevel: 0,
        encryptionLevel: 1, backupLevel: 0, antiVirusLevel: 1, wafLevel: 0,
        totalDefensePower: 35,
      }));
    }
    if (!localStorage.getItem('cyberpaw_inventory')) {
      localStorage.setItem('cyberpaw_inventory', '[1,2,3]');
    }
    if (!localStorage.getItem('cyberpaw_xp_logs')) {
      localStorage.setItem('cyberpaw_xp_logs', JSON.stringify([{
        action: 'welcome', xpGained: 25,
        description: 'Welcome to CyberPaw Arena!',
        createdAt: new Date().toISOString(),
      }]));
    }
  },
};
