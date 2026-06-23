import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  varchar,
  text,
  int,
  timestamp,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

/* ═══════════════════════════════════════════════════════════════════════
   AUTH (from Kimi OAuth — DO NOT MODIFY)
   ═══════════════════════════════════════════════════════════════════════ */

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* ═══════════════════════════════════════════════════════════════════════
   LOCAL AUTH (username/password — independent from Kimi OAuth)
   ═══════════════════════════════════════════════════════════════════════ */

export const localUsers = mysqlTable("local_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 32 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 32 }).notNull(),
  avatar: varchar("avatar", { length: 32 }).default("cat-default"),
  level: int("level").default(1).notNull(),
  totalXp: int("total_xp").default(0).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

/* ═══════════════════════════════════════════════════════════════════════
   PLAYER PROFILE
   ═══════════════════════════════════════════════════════════════════════ */

export const playerProfiles = mysqlTable("player_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().unique(),
  displayName: varchar("display_name", { length: 32 }).notNull(),
  title: varchar("title", { length: 64 }).default("Script Kitten").notNull(),
  level: int("level").default(1).notNull(),
  totalXp: int("total_xp").default(0).notNull(),
  avatar: varchar("avatar", { length: 32 }).default("cat-default").notNull(),
  country: varchar("country", { length: 2 }).default("US"),
  bio: text("bio"),
  isOnline: boolean("is_online").default(false).notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
  streakDays: int("streak_days").default(0).notNull(),
  maxStreak: int("max_streak").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

/* ═══════════════════════════════════════════════════════════════════════
   PLAYER STATS
   ═══════════════════════════════════════════════════════════════════════ */

export const playerStats = mysqlTable("player_stats", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().unique(),
  gamesPlayed: int("games_played").default(0).notNull(),
  gamesCompleted: int("games_completed").default(0).notNull(),
  totalScore: int("total_score").default(0).notNull(),
  attacksLaunched: int("attacks_launched").default(0).notNull(),
  attacksSuccessful: int("attacks_successful").default(0).notNull(),
  attacksDefended: int("attacks_defended").default(0).notNull(),
  attacksFailed: int("attacks_failed").default(0).notNull(),
  toolsUnlocked: int("tools_unlocked").default(3).notNull(),
  toolsUpgraded: int("tools_upgraded").default(0).notNull(),
  duelsWon: int("duels_won").default(0).notNull(),
  duelsLost: int("duels_lost").default(0).notNull(),
  tournamentsJoined: int("tournaments_joined").default(0).notNull(),
  tournamentsWon: int("tournaments_won").default(0).notNull(),
  rankPoints: int("rank_points").default(100).notNull(),
  currentStreak: int("current_streak").default(0).notNull(),
  bestStreak: int("best_streak").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

/* ═══════════════════════════════════════════════════════════════════════
   XP LOG
   ═══════════════════════════════════════════════════════════════════════ */

export const xpLogs = mysqlTable("xp_logs", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  xpGained: int("xp_gained").notNull(),
  description: text("description"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ═══════════════════════════════════════════════════════════════════════
   CYBER TOOLS (Arsenal)
   ═══════════════════════════════════════════════════════════════════════ */

export const cyberTools = mysqlTable("cyber_tools", {
  id: serial("id").primaryKey(),
  toolId: varchar("tool_id", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "recon", "network", "web", "crypto", "malware", "social", "defense", "advanced"
  ]).notNull(),
  power: int("power").default(10).notNull(),
  cooldown: int("cooldown").default(60).notNull(),
  defenseBreak: int("defense_break").default(5).notNull(),
  stealthLevel: int("stealth_level").default(1).notNull(),
  unlockLevel: int("unlock_level").default(1).notNull(),
  icon: varchar("icon", { length: 64 }).notNull(),
  tier: int("tier").default(1).notNull(),
});

/* ═══════════════════════════════════════════════════════════════════════
   PLAYER INVENTORY
   ═══════════════════════════════════════════════════════════════════════ */

export const playerInventory = mysqlTable("player_inventory", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  toolId: bigint("tool_id", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  tier: int("tier").default(1).notNull(),
  usesRemaining: int("uses_remaining").default(100).notNull(),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ═══════════════════════════════════════════════════════════════════════
   PLAYER DEFENSES (Fortress)
   ═══════════════════════════════════════════════════════════════════════ */

export const playerDefenses = mysqlTable("player_defenses", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull().unique(),
  firewallLevel: int("firewall_level").default(1).notNull(),
  idsLevel: int("ids_level").default(1).notNull(),
  honeypotLevel: int("honeypot_level").default(0).notNull(),
  encryptionLevel: int("encryption_level").default(1).notNull(),
  backupLevel: int("backup_level").default(0).notNull(),
  antiVirusLevel: int("anti_virus_level").default(1).notNull(),
  wafLevel: int("waf_level").default(0).notNull(),
  shieldActive: boolean("shield_active").default(true).notNull(),
  shieldExpiresAt: timestamp("shield_expires_at"),
  totalDefensePower: int("total_defense_power").default(10).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

/* ═══════════════════════════════════════════════════════════════════════
   BATTLE LOGS (PvP Attacks)
   ═══════════════════════════════════════════════════════════════════════ */

export const battleLogs = mysqlTable("battle_logs", {
  id: serial("id").primaryKey(),
  attackerId: bigint("attacker_id", { mode: "number", unsigned: true }).notNull(),
  defenderId: bigint("defender_id", { mode: "number", unsigned: true }).notNull(),
  attackType: mysqlEnum("attack_type", [
    "port_scan", "sql_injection", "xss", "ddos", "phishing",
    "brute_force", "trojan", "ransomware", "social_engineering",
    "mitm", "zero_day", "custom"
  ]).notNull(),
  toolsUsed: json("tools_used"),
  result: mysqlEnum("result", ["full_breach", "breach", "partial", "defended", "blocked"]).notNull(),
  xpGained: int("xp_gained").default(0).notNull(),
  lootTools: json("loot_tools"),
  damageDealt: int("damage_dealt").default(0).notNull(),
  damageBlocked: int("damage_blocked").default(0).notNull(),
  replayData: json("replay_data"),
  isRevenge: boolean("is_revenge").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ═══════════════════════════════════════════════════════════════════════
   GAME SESSIONS (24 Training Games Progress)
   ═══════════════════════════════════════════════════════════════════════ */

export const gameSessions = mysqlTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  gameId: varchar("game_id", { length: 64 }).notNull(),
  completed: boolean("completed").default(false).notNull(),
  bestScore: int("best_score").default(0).notNull(),
  stars: int("stars").default(0).notNull(),
  attempts: int("attempts").default(0).notNull(),
  bestTime: int("best_time").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

/* ═══════════════════════════════════════════════════════════════════════
   ACHIEVEMENTS
   ═══════════════════════════════════════════════════════════════════════ */

export const achievements = mysqlTable("achievements", {
  id: serial("id").primaryKey(),
  achievementId: varchar("achievement_id", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "beginner", "explorer", "hacker", "master", "legend",
    "combat", "defense", "social", "special"
  ]).notNull(),
  xpReward: int("xp_reward").default(50).notNull(),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  icon: varchar("icon", { length: 64 }).notNull(),
  requirement: text("requirement"),
});

/* ═══════════════════════════════════════════════════════════════════════
   PLAYER ACHIEVEMENTS
   ═══════════════════════════════════════════════════════════════════════ */

export const playerAchievements = mysqlTable("player_achievements", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  achievementId: bigint("achievement_id", { mode: "number", unsigned: true }).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

/* ═══════════════════════════════════════════════════════════════════════
   LEADERBOARD (Weekly)
   ═══════════════════════════════════════════════════════════════════════ */

export const leaderboardEntries = mysqlTable("leaderboard_entries", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  weekNumber: int("week_number").notNull(),
  year: int("year").notNull(),
  category: mysqlEnum("category", [
    "xp", "combat", "defense", "training", "overall"
  ]).notNull(),
  score: int("score").default(0).notNull(),
  rank: int("rank").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

/* ═══════════════════════════════════════════════════════════════════════
   NOTIFICATIONS
   ═══════════════════════════════════════════════════════════════════════ */

export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", [
    "attack_received", "attack_success", "attack_failed",
    "level_up", "achievement", "tool_unlocked", "friend_request",
    "tournament", "system", "revenge_available"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("is_read").default(false).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
