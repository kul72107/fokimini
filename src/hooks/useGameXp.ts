import { trpc } from "@/providers/trpc";

export function useGameXp() {
  const utils = trpc.useUtils();
  const addXp = trpc.player.addXp.useMutation({
    onSuccess: async () => {
      await utils.player.getProfile.invalidate();
      await utils.player.getGameProgress.invalidate();
    },
  });
  const recordGame = trpc.player.recordGame.useMutation({
    onSuccess: async () => {
      await utils.player.getProfile.invalidate();
      await utils.player.getGameProgress.invalidate();
    },
  });

  const completeGame = async (gameId: string, score: number, stars: number, time: number) => {
    await addXp.mutateAsync({
      action: "game_complete",
      xpGained: score,
      description: `Completed ${gameId}`,
    });
    await recordGame.mutateAsync({
      gameId,
      score,
      stars,
      timeElapsed: time,
    });
  };

  return { completeGame, isLoading: addXp.isPending || recordGame.isPending };
}
