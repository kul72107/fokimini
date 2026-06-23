import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { leaderboardEntries, playerProfiles, playerStats, playerAchievements, achievements } from "../db/schema";
import { eq, and, desc, gte } from "drizzle-orm";

export const leaderboardRouter = createRouter({
  // ─── Weekly Leaderboard ───
  weekly: publicQuery
    .input(z.object({
      category: z.enum(["xp", "combat", "defense", "training", "overall"]).default("overall"),
      weekNumber: z.number().int().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const category = input?.category || "overall";

      // Get current week if not specified
      const now = new Date();
      const weekNum = input?.weekNumber || Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const year = now.getFullYear();

      const entries = await db.select().from(leaderboardEntries)
        .where(and(
          eq(leaderboardEntries.category, category),
          eq(leaderboardEntries.weekNumber, weekNum),
          eq(leaderboardEntries.year, year)
        ))
        .orderBy(leaderboardEntries.score)
        .limit(100);

      // Get player names
      const profileMap = new Map<number, typeof playerProfiles.$inferSelect>();
      for (const entry of entries) {
        if (!profileMap.has(entry.userId)) {
          const p = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, entry.userId)).limit(1);
          if (p.length) profileMap.set(entry.userId, p[0]);
        }
      }

      return entries.map((e, i) => ({
        rank: i + 1,
        ...e,
        displayName: profileMap.get(e.userId)?.displayName || "Unknown",
        avatar: profileMap.get(e.userId)?.avatar || "cat-default",
        title: profileMap.get(e.userId)?.title || "Script Kitten",
      }));
    }),

  // ─── Top Players (by XP) ───
  topPlayers: publicQuery.query(async () => {
    const db = getDb();
    const profiles = await db.select().from(playerProfiles)
      .orderBy(desc(playerProfiles.totalXp))
      .limit(50);
    return profiles.map((p, i) => ({
      rank: i + 1,
      ...p,
    }));
  }),

  // ─── Achievements ───
  getAchievements: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(achievements).orderBy(achievements.category);
  }),

  // ─── Player Achievements ───
  getPlayerAchievements: publicQuery
    .input(z.object({ userId: z.number().int() }))
    .query(async ({ input }) => {
      const db = getDb();
      const pa = await db.select().from(playerAchievements)
        .where(eq(playerAchievements.userId, input.userId));

      const achMap = new Map<number, typeof achievements.$inferSelect>();
      const allAch = await db.select().from(achievements);
      for (const a of allAch) achMap.set(a.id, a);

      return pa.map(a => ({
        ...a,
        achievement: achMap.get(a.achievementId),
      }));
    }),

  // ─── Earn Achievement ───
  earnAchievement: publicQuery
    .input(z.object({ userId: z.number().int(), achievementId: z.number().int() }))
    .query(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(playerAchievements)
        .where(and(eq(playerAchievements.userId, input.userId), eq(playerAchievements.achievementId, input.achievementId)))
        .limit(1);

      if (existing.length > 0) return { ok: false, error: "Already earned" };

      await db.insert(playerAchievements).values({
        userId: input.userId,
        achievementId: input.achievementId,
      });

      // Award XP
      const ach = await db.select().from(achievements).where(eq(achievements.id, input.achievementId)).limit(1);
      if (ach.length) {
        await db.update(playerProfiles)
          .set({ totalXp: db.$count(playerProfiles, eq(playerProfiles.userId, input.userId)) + ach[0].xpReward })
          .where(eq(playerProfiles.userId, input.userId));
      }

      return { ok: true };
    }),
});
