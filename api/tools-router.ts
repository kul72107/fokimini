import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { cyberTools, playerInventory, playerProfiles } from "../db/schema";
import { eq, and, gte } from "drizzle-orm";

export const toolsRouter = createRouter({
  // ─── Get All Tools ───
  getAll: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(cyberTools).orderBy(cyberTools.unlockLevel);
  }),

  // ─── Get Player Inventory ───
  getInventory: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const items = await db.select().from(playerInventory)
      .where(eq(playerInventory.userId, Number(ctx.user.id)));

    const allTools = await db.select().from(cyberTools);
    const toolMap = new Map(allTools.map(t => [t.id, t]));

    return items.map(item => ({
      ...item,
      tool: toolMap.get(item.toolId),
    }));
  }),

  // ─── Unlock Tool ───
  unlock: authedMutation
    .input(z.object({ toolId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const uid = Number(ctx.user.id);

      // Check player level
      const profile = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, uid)).limit(1);
      const tool = await db.select().from(cyberTools).where(eq(cyberTools.id, input.toolId)).limit(1);

      if (!tool.length) return { ok: false, error: "Tool not found" };
      if (profile[0].level < tool[0].unlockLevel) return { ok: false, error: `Requires level ${tool[0].unlockLevel}` };

      // Check if already owned
      const existing = await db.select().from(playerInventory)
        .where(and(eq(playerInventory.userId, uid), eq(playerInventory.toolId, input.toolId)))
        .limit(1);

      if (existing.length > 0) return { ok: false, error: "Already owned" };

      await db.insert(playerInventory).values({
        userId: uid,
        toolId: input.toolId,
        quantity: 1,
        tier: 1,
        usesRemaining: 100,
      });

      return { ok: true };
    }),

  // ─── Get Available Tools (by level) ───
  getAvailable: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const profile = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, Number(ctx.user.id))).limit(1);
    const level = profile[0]?.level || 1;

    const owned = await db.select().from(playerInventory)
      .where(eq(playerInventory.userId, Number(ctx.user.id)));
    const ownedIds = new Set(owned.map(o => o.toolId));

    const available = await db.select().from(cyberTools)
      .where(gte(cyberTools.unlockLevel, 1));

    return available.map(t => ({
      ...t,
      isOwned: ownedIds.has(t.id),
      canUnlock: level >= t.unlockLevel && !ownedIds.has(t.id),
    }));
  }),
});
