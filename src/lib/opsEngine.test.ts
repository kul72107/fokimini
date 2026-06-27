import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALL_TOOLS, type BattleTarget } from './battleEngine';
import {
  OPS_OBJECTIVES,
  createInitialOpsProgress,
  getNextOpsStep,
  getRecommendedTools,
  getStepToolChainItems,
  resolveOpsAction,
} from './opsEngine';

const lowDefenseTarget: BattleTarget = {
  userId: -100,
  displayName: 'Test Target',
  level: 1,
  defensePower: 1,
  wins: 0,
  losses: 0,
  isBot: true,
};

function toolByName(name: string) {
  const tool = ALL_TOOLS.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`Missing tool fixture: ${name}`);
  return tool;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ordered ops simuletool chains', () => {
  it('maps every objective step to at least one non-meta simuletool', () => {
    const stepChains = OPS_OBJECTIVES.flatMap((objective) => (
      objective.steps.map((step) => ({
        objective: objective.id,
        step: step.id,
        tools: getStepToolChainItems(step).map((item) => item.tool.name),
      }))
    ));

    expect(stepChains).toHaveLength(44);
    expect(stepChains.filter((chain) => chain.tools.length === 0)).toEqual([]);
    expect(stepChains.some((chain) => chain.tools.includes('Cyber Duel Arena'))).toBe(false);
    expect(stepChains.some((chain) => chain.tools.includes('Password Quest'))).toBe(false);
  });

  it('only recommends the next required simuletool for the active chain segment', () => {
    const objective = OPS_OBJECTIVES.find((item) => item.id === 'keylogger-telemetry');
    expect(objective).toBeDefined();

    const progress = createInitialOpsProgress()[objective!.id];
    const nextStep = getNextOpsStep(objective!, progress);
    const recommended = getRecommendedTools(nextStep, progress).map((tool) => tool.name);

    expect(recommended).toEqual(['Phishing Sim GUI']);
    expect(recommended).not.toContain('Nmap Scanner');
    expect(recommended).not.toContain('Keylogger Sim');
  });

  it('starts every objective on the first explicit chain segment', () => {
    const starts = OPS_OBJECTIVES.map((objective) => {
      const progress = createInitialOpsProgress()[objective.id];
      const nextStep = getNextOpsStep(objective, progress);
      const chain = getStepToolChainItems(nextStep);
      const recommended = getRecommendedTools(nextStep, progress);

      return {
        objective: objective.id,
        expected: chain[0]?.tool.name,
        recommended: recommended[0]?.name,
      };
    });

    expect(starts.filter((start) => start.expected !== start.recommended)).toEqual([]);
  });

  it('renders every chain simuletool through a dedicated VS modal GUI', () => {
    const modalSource = readFileSync(
      new URL('../components/ops/OpsSimuleToolModal.tsx', import.meta.url),
      'utf8',
    );
    const modalGameIds = new Set(
      [...modalSource.matchAll(/case '([^']+)':/g)].map((match) => match[1]),
    );
    const chainToolIds = [
      ...new Set(
        OPS_OBJECTIVES.flatMap((objective) => (
          objective.steps.flatMap((step) => getStepToolChainItems(step).map((item) => item.opsToolId))
        )),
      ),
    ];

    expect(chainToolIds.filter((toolId) => !modalGameIds.has(toolId))).toEqual([]);
    expect(chainToolIds).not.toContain('cyber-duel-arena');
    expect(chainToolIds).not.toContain('password-quest');
  });

  it('rejects meta or training-only games as operation progress', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const objective = OPS_OBJECTIVES.find((item) => item.id === 'database-leak');
    expect(objective).toBeDefined();
    const progress = createInitialOpsProgress()[objective!.id];

    for (const toolName of ['Cyber Duel Arena', 'Password Quest']) {
      const outcome = resolveOpsAction({
        objective: objective!,
        progress,
        tool: toolByName(toolName),
        target: lowDefenseTarget,
        isOwned: true,
        simuleScore: 100,
      });

      expect(outcome.status).toBe('off_path');
      expect(outcome.points).toBe(0);
      expect(outcome.created).toEqual([]);
    }
  });

  it('rejects a later chain tool until the previous segment is complete', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const objective = OPS_OBJECTIVES.find((item) => item.id === 'database-leak');
    expect(objective).toBeDefined();
    const progress = createInitialOpsProgress()[objective!.id];

    const outcome = resolveOpsAction({
      objective: objective!,
      progress,
      tool: toolByName('Advanced Port Scan'),
      target: lowDefenseTarget,
      isOwned: true,
      simuleScore: 100,
    });

    expect(outcome.status).toBe('off_path');
    expect(outcome.stepComplete).toBeUndefined();
    expect(outcome.points).toBe(0);
    expect(outcome.message).toContain('expects DNS Lookup GUI now');
  });

  it('records chain segments before completing the step', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const objective = OPS_OBJECTIVES.find((item) => item.id === 'database-leak');
    expect(objective).toBeDefined();
    const progress = createInitialOpsProgress()[objective!.id];

    const first = resolveOpsAction({
      objective: objective!,
      progress,
      tool: toolByName('DNS Lookup GUI'),
      target: lowDefenseTarget,
      isOwned: true,
      simuleScore: 100,
    });

    expect(first.status).toBe('complete');
    expect(first.stepComplete).toBe(false);
    expect(first.completedToolIds).toEqual(['dns-lookup-gui']);
    expect(first.created).toEqual([]);

    const chainedProgress = {
      ...progress,
      completedToolRuns: {
        ...progress.completedToolRuns,
        [first.stepId!]: first.completedToolIds!,
      },
    };

    expect(getRecommendedTools(getNextOpsStep(objective!, chainedProgress), chainedProgress).map((tool) => tool.name))
      .toEqual(['Advanced Port Scan']);

    const second = resolveOpsAction({
      objective: objective!,
      progress: chainedProgress,
      tool: toolByName('Advanced Port Scan'),
      target: lowDefenseTarget,
      isOwned: true,
      simuleScore: 100,
    });

    expect(second.status).toBe('complete');
    expect(second.stepComplete).toBe(true);
    expect(second.completedToolIds).toEqual(['dns-lookup-gui', 'advanced-port-scan']);
    expect(second.created).toEqual(['recon', 'web']);

    const completedStepProgress = {
      ...progress,
      completedSteps: [second.stepId!],
      completedToolRuns: {
        ...progress.completedToolRuns,
        [second.stepId!]: second.completedToolIds!,
      },
    };

    expect(getRecommendedTools(getNextOpsStep(objective!, completedStepProgress), completedStepProgress).map((tool) => tool.name))
      .toEqual(['SQL Safari']);

    const exhaustedProgress = {
      ...progress,
      completedToolRuns: {
        ...progress.completedToolRuns,
        [second.stepId!]: second.completedToolIds!,
      },
    };

    expect(getRecommendedTools(getNextOpsStep(objective!, exhaustedProgress), exhaustedProgress)).toEqual([]);
  });
});
