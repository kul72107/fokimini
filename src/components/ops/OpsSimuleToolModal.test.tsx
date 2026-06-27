import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { OPS_OBJECTIVES, getStepToolChainItems } from '@/lib/opsEngine';
import { SimuleGame } from './OpsSimuleToolModal';

function getUniqueChainToolIds() {
  return [
    ...new Set(
      OPS_OBJECTIVES.flatMap((objective) => (
        objective.steps.flatMap((step) => getStepToolChainItems(step).map((item) => item.opsToolId))
      )),
    ),
  ];
}

describe('ops modal simuletool GUI coverage', () => {
  it('server-renders every ordered chain simuletool as a non-fallback playable GUI', () => {
    const scoreSpy = vi.fn();

    for (const gameId of getUniqueChainToolIds()) {
      const markup = renderToStaticMarkup(<SimuleGame gameId={gameId} onScoreChange={scoreSpy} />);

      expect(markup.length, `${gameId} should render visible UI`).toBeGreaterThan(500);
      expect(markup, `${gameId} should not fall back to generic Ops Circuit`).not.toContain('Ops Circuit');
      expect(
        /<(button|input|select|textarea)\b/.test(markup),
        `${gameId} should expose playable controls`,
      ).toBe(true);
    }
  });
});
