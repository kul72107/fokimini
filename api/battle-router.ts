import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { battleLogs, playerDefenses, playerProfiles, playerStats, notifications } from "../db/schema";
import { eq, and, desc, or } from "drizzle-orm";

const ATTACK_TYPES = ["port_scan", "sql_injection", "xss", "ddos", "phishing", "brute_force", "trojan", "ransomware", "social_engineering", "mitm", "zero_day", "custom"] as const;
const RESULTS = ["full_breach", "breach", "partial", "defended", "blocked"] as const;

function calcBattle(attackerLevel: number, toolPower: number, defensePower: number, defenderLevel: number) {
  const luck = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
  const attackScore = (attackerLevel * 2 + toolPower) * luck;
  const defenseScore = defenderLevel * 3 + defensePower;
  const ratio = attackScore / defenseScore;

  if (ratio > 2.0) return { result: "full_breach" as const, damage: Math.floor(40 * ratio), xp: 50 };
  if (ratio > 1.3) return { result: "breach" as const, damage: Math.floor(25 * ratio), xp: 30 };
  if (ratio > 0.8) return { result: "partial" as const, damage: Math.floor(10 * ratio), xp: 15 };
  if (ratio > 0.5) return { result: "defended" as const, damage: 0, xp: 5 };
  return { result: "blocked" as const, damage: 0, xp: 0 };
}

export const battleRouter = createRouter({
  // ─── Launch Attack ───
  attack: authedMutation
    .input(z.object({
      targetUserId: z.number().int(),
      attackType: z.enum(ATTACK_TYPES),
      toolIds: z.array(z.number().int()),
      isRevenge: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const attackerId = Number(ctx.user.id);
      const defenderId = input.targetUserId;

      if (attackerId === defenderId) return { ok: false, error: "Cannot attack yourself" };

      // Get attacker profile
      const aProfile = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, attackerId)).limit(1);
      if (!aProfile.length) return { ok: false, error: "Attacker profile not found" };

      // Get defender defense
      const dDefense = await db.select().from(playerDefenses).where(eq(playerDefenses.userId, defenderId)).limit(1);
      const dProfile = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, defenderId)).limit(1);

      const defensePower = dDefense[0]?.totalDefensePower || 10;
      const defenderLevel = dProfile[0]?.level || 1;

      // Calculate tool power
      const toolPower = input.toolIds.length * 15 + 5;

      // Battle calculation
      const result = calcBattle(aProfile[0].level, toolPower, defensePower, defenderLevel);

      // Record battle
      await db.insert(battleLogs).values({
        attackerId,
        defenderId,
        attackType: input.attackType,
        toolsUsed: input.toolIds,
        result: result.result,
        xpGained: result.xp,
        damageDealt: result.damage,
        damageBlocked: defensePower - result.damage,
        isRevenge: input.isRevenge,
        replayData: {
          attackerLevel: aProfile[0].level,
          defenderLevel,
          toolPower,
          defensePower,
          luck: result.damage / Math.max(toolPower, 1),
        },
      });

      // Update attacker stats
      await db.update(playerStats)
        .set({ attacksLaunched: db.$count(battleLogs, eq(battleLogs.attackerId, attackerId)) + 1 })
        .where(eq(playerStats.userId, attackerId));

      if (result.result === "full_breach" || result.result === "breach") {
        await db.update(playerStats)
          .set({ attacksSuccessful: db.$count(battleLogs, and(eq(battleLogs.attackerId, attackerId), or(...["full_breach", "breach"].map(r => eq(battleLogs.result, r))))) })
          .where(eq(playerStats.userId, attackerId));
      }

      // Notify defender
      await db.insert(notifications).values({
        userId: defenderId,
        type: result.result === "blocked" || result.result === "defended" ? "attack_failed" : "attack_received",
        title: result.result === "blocked" ? "Attack Blocked!" : result.result === "defended" ? "Attack Defended!" : "You Were Attacked!",
        message: `${aProfile[0].displayName} launched a ${input.attackType} attack. Result: ${result.result}`,
        metadata: { attackerId, attackType: input.attackType, result: result.result, damage: result.damage },
      });

      return { ok: true, result: result.result, damage: result.damage, xp: result.xp };
    }),

  // ─── Get Battle History ───
  getHistory: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const uid = Number(ctx.user.id);
    const logs = await db.select().from(battleLogs)
      .where(or(eq(battleLogs.attackerId, uid), eq(battleLogs.defenderId, uid)))
      .orderBy(desc(battleLogs.createdAt))
      .limit(50);
    return logs;
  }),

  // ─── Get Attack Targets (available players) ───
  getTargets: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const profiles = await db.select().from(playerProfiles)
      .where(eq(playerProfiles.isOnline, true))
      .limit(20);
    // Filter out self
    return profiles.filter(p => p.userId !== Number(ctx.user.id));
  }),

  // ─── Get Notifications ───
  getNotifications: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(notifications)
      .where(eq(notifications.userId, Number(ctx.user.id)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }),

  // ─── Mark Notification Read ───
  markRead: authedMutation
    .input(z.object({ notificationId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, input.notificationId), eq(notifications.userId, Number(ctx.user.id))));
      return { ok: true };
    }),
});
