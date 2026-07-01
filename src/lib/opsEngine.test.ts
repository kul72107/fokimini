import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALL_TOOLS, type BattleTarget } from './battleEngine';
import {
  OPS_OBJECTIVES,
  createInitialOpsProgress,
  getNextOpsStep,
  getRecommendedTools,
  getStepToolChainItems,
  getToolOpsProfile,
  resolveOpsAction,
} from './opsEngine';
import {
  createOpsTargetProfile,
  createOpsToolContext,
} from './opsContext';

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

  it('keeps every chain segment aligned with the active step effects', () => {
    const mismatches = OPS_OBJECTIVES.flatMap((objective) => (
      objective.steps.flatMap((step) => (
        getStepToolChainItems(step).map((item) => {
          const profile = getToolOpsProfile(item.tool);
          const matchingEffects = profile.effects.filter((effect) => step.accepts.includes(effect));
          return {
            objective: objective.id,
            step: step.id,
            tool: item.tool.name,
            accepts: step.accepts,
            provides: profile.effects,
            matchingEffects,
          };
        })
      ))
    )).filter((entry) => entry.matchingEffects.length === 0);

    expect(mismatches).toEqual([]);
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

  it('walks every objective through ordered GUI segments without random fallback progress', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    for (const objective of OPS_OBJECTIVES) {
      let progress = createInitialOpsProgress()[objective.id];
      let guard = 0;

      while (getNextOpsStep(objective, progress)) {
        const nextStep = getNextOpsStep(objective, progress);
        const recommended = getRecommendedTools(nextStep, progress);
        expect(recommended).toHaveLength(1);

        const outcome = resolveOpsAction({
          objective,
          progress,
          tool: recommended[0],
          target: lowDefenseTarget,
          isOwned: true,
          simuleScore: 100,
        });

        expect(outcome.status).toBe('complete');
        expect(outcome.completedToolIds).toContain(outcome.opsToolId);

        const nextToolRuns = { ...(progress.completedToolRuns ?? {}) };
        if (outcome.stepId && outcome.completedToolIds) {
          nextToolRuns[outcome.stepId] = outcome.completedToolIds;
        }

        const nextCompletedSteps = [...progress.completedSteps];
        if (outcome.stepComplete && outcome.stepId && !nextCompletedSteps.includes(outcome.stepId)) {
          nextCompletedSteps.push(outcome.stepId);
        }

        progress = {
          ...progress,
          completedSteps: nextCompletedSteps,
          completedToolRuns: nextToolRuns,
          score: progress.score + outcome.points,
        };
        guard += 1;
        expect(guard).toBeLessThan(100);
      }

      expect(progress.completedSteps).toHaveLength(objective.steps.length);
      expect(getRecommendedTools(getNextOpsStep(objective, progress), progress)).toEqual([]);
    }
  });
});

describe('target-bound VS operation context', () => {
  it('generates deterministic fake platform assets from the active target', () => {
    const first = createOpsTargetProfile(lowDefenseTarget);
    const second = createOpsTargetProfile(lowDefenseTarget);

    expect(first).toEqual(second);
    expect(first.platformName).toBe('Test Target Portal');
    expect(first.primaryDomain).toBe('app.test-target.ops');
    expect(first.databaseName).toBe('test_target_customer_vault');
    expect(first.certificate.subject).toContain(first.primaryDomain);
    expect(first.services.map((service) => service.host)).toContain(first.hosts.api);
  });

  it('builds objective-specific proof cards from the same target context', () => {
    const objective = OPS_OBJECTIVES.find((item) => item.id === 'database-leak');
    expect(objective).toBeDefined();
    const step = objective!.steps[0];
    const chain = getStepToolChainItems(step);

    const context = createOpsToolContext({
      target: lowDefenseTarget,
      objective: objective!,
      step,
      tool: chain[0].tool,
      chainPosition: 1,
      chainTotal: chain.length,
    });

    expect(context.contract.expectedProof).toContain('app.test-target.ops');
    expect(context.contract.expectedProof).toContain('test-target.ops');
    expect(context.contract.options.some((option) => option.correct)).toBe(true);
    expect(context.contract.options.some((option) => !option.correct)).toBe(true);
    expect(context.contract.options.every((option) => !option.label.includes('google.com'))).toBe(true);
    expect(context.contract.options.every((option) => !option.label.includes('github.com'))).toBe(true);
  });
  it('requires chained tool outputs before later VS simuletools can pass their handoff gate', () => {
    const objective = OPS_OBJECTIVES.find((item) => item.id === 'database-leak');
    expect(objective).toBeDefined();
    const firstStep = objective!.steps[0];
    const firstChain = getStepToolChainItems(firstStep);

    const dnsContext = createOpsToolContext({
      target: lowDefenseTarget,
      objective: objective!,
      step: firstStep,
      tool: firstChain[0].tool,
      chainPosition: 1,
      chainTotal: firstChain.length,
      opsToolId: firstChain[0].opsToolId,
    });

    expect(dnsContext.carryRequirement).toBeUndefined();
    expect(dnsContext.emittedArtifacts.map((artifact) => artifact.value)).toContain('app.test-target.ops');

    const portScanContext = createOpsToolContext({
      target: lowDefenseTarget,
      objective: objective!,
      step: firstStep,
      tool: firstChain[1].tool,
      chainPosition: 2,
      chainTotal: firstChain.length,
      carryArtifacts: dnsContext.emittedArtifacts,
      opsToolId: firstChain[1].opsToolId,
    });

    expect(portScanContext.carryRequirement?.sourceToolName).toBe('DNS Lookup GUI');
    expect(portScanContext.carryRequirement?.expectedValue).toBe('app.test-target.ops');
    expect(portScanContext.carryRequirement?.options.some((option) => option.correct && option.value === 'app.test-target.ops')).toBe(true);
    expect(portScanContext.carryRequirement?.options.some((option) => !option.correct)).toBe(true);

    const dataStep = objective!.steps[1];
    const dataChain = getStepToolChainItems(dataStep);
    const sqlSafariContext = createOpsToolContext({
      target: lowDefenseTarget,
      objective: objective!,
      step: dataStep,
      tool: dataChain[0].tool,
      chainPosition: 1,
      chainTotal: dataChain.length,
      carryArtifacts: [...dnsContext.emittedArtifacts, ...portScanContext.emittedArtifacts],
      opsToolId: dataChain[0].opsToolId,
    });

    expect(sqlSafariContext.carryRequirement?.sourceToolName).toBe('Advanced Port Scan');
    expect(sqlSafariContext.carryRequirement?.expectedValue).toBe('app.test-target.ops:443');
    expect(sqlSafariContext.carryRequirement?.options.every((option) => !option.value.includes('google.com'))).toBe(true);
    expect(sqlSafariContext.carryRequirement?.options.every((option) => !option.value.includes('github.com'))).toBe(true);
  });});
