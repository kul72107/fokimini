import { z } from "zod";
import { createRouter, publicQuery, authedQuery, authedMutation } from "./middleware";
import { getDb } from "./queries/connection";
import { playerProfiles, playerStats, xpLogs, gameSessions, playerDefenses } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

function xpForLevel(level: number) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function levelFromXp(totalXp: number) {
  let level = 1;
  let xpNeeded = 100;
  let remaining = totalXp;
  while (remaining >= xpNeeded) {
    remaining -= xpNeeded;
    level++;
    xpNeeded = xpForLevel(level);
  }
  return { level, currentXp: remaining, nextLevelXp: xpNeeded };
}

export const playerRouter = createRouter({
  // ─── Get Profile ───
  getProfile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = BigInt(ctx.user.id);

    let profile = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, Number(userId))).limit(1);
    let stats = await db.select().from(playerStats).where(eq(playerStats.userId, Number(userId))).limit(1);
    let defenses = await db.select().from(playerDefenses).where(eq(playerDefenses.userId, Number(userId))).limit(1);

    // Auto-create if missing
    if (profile.length === 0) {
      await db.insert(playerProfiles).values({
        userId: Number(userId),
        displayName: ctx.user.name || "Hacker" + Math.floor(Math.random() * 9999),
      });
      profile = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, Number(userId))).limit(1);
    }
    if (stats.length === 0) {
      await db.insert(playerStats).values({ userId: Number(userId) });
      stats = await db.select().from(playerStats).where(eq(playerStats.userId, Number(userId))).limit(1);
    }
    if (defenses.length === 0) {
      await db.insert(playerDefenses).values({ userId: Number(userId) });
      defenses = await db.select().from(playerDefenses).where(eq(playerDefenses.userId, Number(userId))).limit(1);
    }

    const p = profile[0];
    const lvl = levelFromXp(p.totalXp);

    return {
      ...p,
      level: lvl.level,
      currentXp: lvl.currentXp,
      nextLevelXp: lvl.nextLevelXp,
      stats: stats[0],
      defenses: defenses[0],
    };
  }),

  // ─── Update Profile ───
  updateProfile: authedMutation
    .input(z.object({
      displayName: z.string().min(2).max(32).optional(),
      title: z.string().max(64).optional(),
      avatar: z.string().max(32).optional(),
      country: z.string().length(2).optional(),
      bio: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.update(playerProfiles).set(input).where(eq(playerProfiles.userId, Number(ctx.user.id)));
      return { ok: true };
    }),

  // ─── Add XP ───
  addXp: authedMutation
    .input(z.object({
      action: z.string(),
      xpGained: z.number().int().positive(),
      description: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const uid = Number(ctx.user.id);

      // Log XP
      await db.insert(xpLogs).values({
        userId: uid,
        action: input.action,
        xpGained: input.xpGained,
        description: input.description,
        metadata: input.metadata,
      });

      // Update total
      const profile = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, uid)).limit(1);
      if (profile.length > 0) {
        const newTotal = profile[0].totalXp + input.xpGained;
        const lvl = levelFromXp(newTotal);
        await db.update(playerProfiles)
          .set({ totalXp: newTotal, level: lvl.level })
          .where(eq(playerProfiles.userId, uid));
      }

      return { ok: true, totalXp: (profile[0]?.totalXp || 0) + input.xpGained };
    }),

  // ─── Record Game Session ───
  recordGame: authedMutation
    .input(z.object({
      gameId: z.string(),
      score: z.number().int(),
      stars: z.number().int().min(0).max(3),
      timeElapsed: z.number().int(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const uid = Number(ctx.user.id);

      const existing = await db.select().from(gameSessions)
        .where(and(eq(gameSessions.userId, uid), eq(gameSessions.gameId, input.gameId)))
        .limit(1);

      if (existing.length > 0) {
        const e = existing[0];
        await db.update(gameSessions).set({
          completed: true,
          bestScore: Math.max(e.bestScore, input.score),
          stars: Math.max(e.stars, input.stars),
          attempts: e.attempts + 1,
          bestTime: e.bestTime ? Math.min(e.bestTime, input.timeElapsed) : input.timeElapsed,
          completedAt: new Date(),
        }).where(eq(gameSessions.id, e.id));
      } else {
        await db.insert(gameSessions).values({
          userId: uid,
          gameId: input.gameId,
          completed: true,
          bestScore: input.score,
          stars: input.stars,
          attempts: 1,
          bestTime: input.timeElapsed,
          completedAt: new Date(),
        });
      }

      // Also increment games completed stat
      await db.update(playerStats)
        .set({ gamesCompleted: db.$count(gameSessions, and(eq(gameSessions.userId, uid), eq(gameSessions.completed, true))) })
        .where(eq(playerStats.userId, uid));

      return { ok: true };
    }),

  // ─── Get Game Progress ───
  getGameProgress: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const sessions = await db.select().from(gameSessions)
      .where(eq(gameSessions.userId, Number(ctx.user.id)))
      .orderBy(desc(gameSessions.updatedAt));
    return sessions;
  }),

  // ─── Update Defenses ───
  updateDefenses: authedMutation
    .input(z.object({
      firewallLevel: z.number().int().min(0).max(20).optional(),
      idsLevel: z.number().int().min(0).max(20).optional(),
      honeypotLevel: z.number().int().min(0).max(20).optional(),
      encryptionLevel: z.number().int().min(0).max(20).optional(),
      backupLevel: z.number().int().min(0).max(20).optional(),
      antiVirusLevel: z.number().int().min(0).max(20).optional(),
      wafLevel: z.number().int().min(0).max(20).optional(),
      shieldActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const total = Object.values(input).filter(v => typeof v === "number").reduce((a, b) => (a as number) + (b as number), 0) as number;
      await db.update(playerDefenses)
        .set({ ...input, totalDefensePower: total * 5 + 10 })
        .where(eq(playerDefenses.userId, Number(ctx.user.id)));
      return { ok: true };
    }),
});
