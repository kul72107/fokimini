import { authRouter } from "./auth-router";
import { localAuthRouter } from "./local-auth-router";
import { playerRouter } from "./player-router";
import { toolsRouter } from "./tools-router";
import { battleRouter } from "./battle-router";
import { leaderboardRouter } from "./leaderboard-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  player: playerRouter,
  tools: toolsRouter,
  battle: battleRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
