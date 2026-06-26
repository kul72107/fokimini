import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  Clock,
  Database,
  Eye,
  Flame,
  Globe,
  Lock,
  Play,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ALL_TOOLS,
  getUserTools,
  type AttackTool,
  type BattleTarget,
} from '@/lib/battleEngine';
import {
  OPS_OBJECTIVES,
  createInitialOpsProgress,
  getAllCreatedEffects,
  getDefenseControlsForStep,
  getEffectLabel,
  getNextOpsStep,
  getRecommendedTools,
  getToolOpsProfile,
  resolveOpsAction,
  summarizeOpsProgress,
  type OpsActionOutcome,
  type OpsEffect,
  type OpsFamily,
  type OpsMatchSummary,
  type OpsObjective,
  type OpsProgress,
  type OpsDefenseControl,
} from '@/lib/opsEngine';

export type { OpsMatchSummary };

const MATCH_SECONDS = 300;

const FAMILY_COLORS: Record<OpsFamily, string> = {
  'Web Breach': '#A78BFA',
  'Account Takeover': '#F472B6',
  'Endpoint Compromise': '#F87171',
  'Malware Operation': '#FB923C',
  'Network Intrusion': '#60A5FA',
  'Data Theft': '#FACC15',
  'Service Disruption': '#EF4444',
  'Defense Response': '#4ADE80',
};

const EFFECT_COLORS: Record<OpsEffect, string> = {
  recon: '#60A5FA',
  osint: '#38BDF8',
  dns: '#22D3EE',
  network: '#0EA5E9',
  traffic: '#6366F1',
  web: '#A78BFA',
  sql: '#C084FC',
  xss: '#F472B6',
  credential: '#FACC15',
  session: '#FB923C',
  social: '#F97316',
  crypto: '#EC4899',
  malware: '#F87171',
  payload: '#EF4444',
  endpoint: '#DC2626',
  persistence: '#B91C1C',
  exfil: '#7C3AED',
  defense: '#4ADE80',
  patch: '#22C55E',
  waf: '#84CC16',
  firewall: '#14B8A6',
  edr: '#10B981',
  log: '#A3E635',
  backup: '#2DD4BF',
  cert: '#818CF8',
  proxy: '#94A3B8',
  stealth: '#64748B',
};

const TOOL_CATEGORY_COLORS: Record<string, string> = {
  recon: '#60A5FA',
  network: '#22D3EE',
  web: '#A78BFA',
  crypto: '#F472B6',
  malware: '#F87171',
  social: '#FB923C',
  defense: '#4ADE80',
  advanced: '#FACC15',
};

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function getDifficultyLabel(difficulty: 1 | 2 | 3) {
  if (difficulty === 1) return 'Clean';
  if (difficulty === 2) return 'Tactical';
  return 'Hard';
}

function getObjectiveState(objective: OpsObjective, progress: OpsProgress) {
  const completed = progress.completedSteps.length;
  return {
    completed,
    total: objective.steps.length,
    isComplete: completed >= objective.steps.length,
    percent: Math.round((completed / objective.steps.length) * 100),
  };
}

function getSuggestedTools(step: ReturnType<typeof getNextOpsStep>, ownedIds: Set<number>, availableEffects: OpsEffect[]) {
  if (!step) return [];
  const recommended = getRecommendedTools(step, availableEffects);
  const ownedRecommended = recommended.filter((tool) => ownedIds.has(tool.id));
  const borrowedRecommended = recommended.filter((tool) => !ownedIds.has(tool.id));
  const ownedWildcards = ALL_TOOLS
    .filter((tool) => ownedIds.has(tool.id) && !recommended.some((candidate) => candidate.id === tool.id))
    .slice(0, 4);

  return [...ownedRecommended, ...borrowedRecommended, ...ownedWildcards].slice(0, 12);
}

interface TimelineEvent extends OpsActionOutcome {
  id: string;
  toolName: string;
  objectiveTitle: string;
}

export function OpsBattleMode({
  target,
  user,
  onBack,
  onComplete,
}: {
  target: BattleTarget;
  user: any;
  onBack: () => void;
  onComplete: (summary: OpsMatchSummary) => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(MATCH_SECONDS);
  const [progressMap, setProgressMap] = useState<Record<string, OpsProgress>>(() => createInitialOpsProgress());
  const [selectedObjectiveId, setSelectedObjectiveId] = useState(OPS_OBJECTIVES[0].id);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [finished, setFinished] = useState(false);

  const ownedIds = useMemo(() => new Set(getUserTools(user.id).map((tool) => tool.id)), [user.id]);
  const selectedObjective = OPS_OBJECTIVES.find((objective) => objective.id === selectedObjectiveId) ?? OPS_OBJECTIVES[0];
  const selectedProgress = progressMap[selectedObjective.id];
  const nextStep = getNextOpsStep(selectedObjective, selectedProgress);
  const pinnedEffects = useMemo(() => getAllCreatedEffects(progressMap), [progressMap]);
  const suggestedTools = useMemo(() => getSuggestedTools(nextStep, ownedIds, pinnedEffects), [nextStep, ownedIds, pinnedEffects]);
  const activeDefenseControls = useMemo(() => getDefenseControlsForStep(nextStep, target), [nextStep, target]);

  const completedCount = OPS_OBJECTIVES.filter((objective) => {
    const progress = progressMap[objective.id];
    return progress.completedSteps.length >= objective.steps.length;
  }).length;
  const completedSteps = Object.values(progressMap).reduce((sum, progress) => sum + progress.completedSteps.length, 0);
  const totalSteps = OPS_OBJECTIVES.reduce((sum, objective) => sum + objective.steps.length, 0);

  const attackerScore = Object.values(progressMap).reduce((sum, progress) => sum + progress.score, 0);
  const blockedActions = Object.values(progressMap).reduce((sum, progress) => sum + progress.blocked, 0);

  const finishMatch = () => {
    if (finished) return;
    setFinished(true);
    onComplete(summarizeOpsProgress(progressMap, target));
  };

  useEffect(() => {
    if (finished) return;
    if (secondsLeft <= 0) {
      finishMatch();
      return;
    }
    const timer = setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, finished]);

  useEffect(() => {
    if (completedCount >= OPS_OBJECTIVES.length) {
      const doneTimer = setTimeout(finishMatch, 700);
      return () => clearTimeout(doneTimer);
    }
  }, [completedCount]);

  const handleToolUse = (tool: AttackTool) => {
    if (finished) return;
    const progress = progressMap[selectedObjective.id];
    const outcome = resolveOpsAction({
      objective: selectedObjective,
      progress,
      tool,
      target,
      isOwned: ownedIds.has(tool.id),
      availableEffects: pinnedEffects,
    });

    setProgressMap((current) => {
      const existing = current[selectedObjective.id];
      const nextCompleted = [...existing.completedSteps];
      if (outcome.status === 'complete' && outcome.stepId && !nextCompleted.includes(outcome.stepId)) {
        nextCompleted.push(outcome.stepId);
      }
      return {
        ...current,
        [selectedObjective.id]: {
          ...existing,
          completedSteps: nextCompleted,
          blocked: existing.blocked + (outcome.status === 'blocked' ? 1 : 0),
          score: existing.score + outcome.points,
        },
      };
    });

    setTimeline((events) => [
      {
        ...outcome,
        id: `${Date.now()}-${Math.random()}`,
        toolName: tool.name,
        objectiveTitle: selectedObjective.title,
      },
      ...events,
    ].slice(0, 12));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 220 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -220 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="max-w-7xl mx-auto px-4 pt-6 pb-16"
    >
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 font-nunito text-sm font-black text-purple-dark hover:text-purple-primary"
      >
        <ChevronLeft size={18} strokeWidth={3} />
        Back to Targets
      </button>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1.4fr_0.9fr_0.8fr]">
        <div className="rounded-2xl border-4 border-black bg-white p-5 card-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-black bg-red-alert">
              <Swords size={28} strokeWidth={3} className="text-white" />
            </div>
            <div>
              <h1 className="font-fredoka text-3xl font-black text-purple-darker text-outline-sm">CYBERPAW OPS</h1>
              <p className="font-nunito text-sm font-bold text-purple-dark">
                Timed objective raid against {target.displayName}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <StatPill icon={<Clock size={16} strokeWidth={3} />} label="Time" value={formatTime(secondsLeft)} color="#FACC15" />
            <StatPill icon={<Target size={16} strokeWidth={3} />} label="Objectives" value={`${completedCount}/${OPS_OBJECTIVES.length}`} color="#4ADE80" />
            <StatPill icon={<Activity size={16} strokeWidth={3} />} label="Steps" value={`${completedSteps}/${totalSteps}`} color="#60A5FA" />
            <StatPill icon={<Zap size={16} strokeWidth={3} />} label="Score" value={attackerScore.toString()} color="#A78BFA" />
          </div>
        </div>

        <div className="rounded-2xl border-4 border-black bg-purple-dark p-5 text-white card-shadow">
          <div className="flex items-center gap-2">
            <Shield size={20} strokeWidth={3} className="text-yellow-accent" />
            <h2 className="font-fredoka text-xl font-black">Defender Pressure</h2>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="font-nunito text-xs font-black uppercase text-purple-lighter">Fortress Power</p>
              <p className="font-fredoka text-4xl font-black text-yellow-accent">{target.defensePower}</p>
            </div>
            <div className="text-right">
              <p className="font-nunito text-xs font-black uppercase text-purple-lighter">Blocked</p>
              <p className="font-fredoka text-3xl font-black text-green-success">{blockedActions}</p>
            </div>
          </div>
          <div className="mt-4 h-4 overflow-hidden rounded-full border-2 border-black bg-white">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, target.defensePower)}%` }}
              className="h-full bg-green-success"
            />
          </div>
        </div>

        <div className="rounded-2xl border-4 border-black bg-white p-5 card-shadow">
          <div className="flex items-center gap-2">
            <Sparkles size={20} strokeWidth={3} className="text-purple-primary" />
            <h2 className="font-fredoka text-xl font-black text-purple-darker">Operation Assets</h2>
          </div>
          <div className="mt-3 flex min-h-[92px] flex-wrap content-start gap-2">
            {pinnedEffects.length === 0 ? (
              <p className="font-nunito text-sm font-bold text-purple-light">
                Completed steps will pin access, payload, defense, and intel effects for later objectives.
              </p>
            ) : (
              pinnedEffects.map((effect) => <EffectBadge key={effect} effect={effect} />)
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.35fr_0.85fr]">
        <ObjectiveList
          progressMap={progressMap}
          selectedObjectiveId={selectedObjective.id}
          onSelect={setSelectedObjectiveId}
        />

        <div className="space-y-5">
          <ObjectiveDetail objective={selectedObjective} progress={selectedProgress} />
          <ToolRunner
            nextStep={nextStep}
            suggestedTools={suggestedTools}
            ownedIds={ownedIds}
            availableEffects={pinnedEffects}
            onUseTool={handleToolUse}
          />
        </div>

        <div className="space-y-5">
          <DefenderPlaybook controls={activeDefenseControls} target={target} />
          <Timeline events={timeline} />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={finishMatch}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-4 border-black bg-yellow-accent px-5 py-3 font-fredoka text-lg font-black text-black transition-transform hover:scale-[1.01]"
        >
          <Trophy size={22} strokeWidth={3} />
          End Operation And Score
        </button>
        <button
          onClick={() => setSelectedObjectiveId(OPS_OBJECTIVES.find((objective) => {
            const progress = progressMap[objective.id];
            return progress.completedSteps.length < objective.steps.length;
          })?.id ?? OPS_OBJECTIVES[0].id)}
          className="flex items-center justify-center gap-2 rounded-2xl border-4 border-black bg-white px-5 py-3 font-fredoka text-lg font-black text-purple-darker transition-transform hover:scale-[1.01]"
        >
          <ArrowRight size={22} strokeWidth={3} />
          Jump To Next Open Goal
        </button>
      </div>
    </motion.div>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border-[3px] border-black bg-purple-pale px-3 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black" style={{ backgroundColor: color }}>
        {icon}
      </span>
      <div>
        <p className="font-nunito text-[10px] font-black uppercase text-purple-dark">{label}</p>
        <p className="font-fredoka text-lg font-black text-purple-darker">{value}</p>
      </div>
    </div>
  );
}

function EffectBadge({ effect }: { effect: OpsEffect }) {
  return (
    <span
      className="rounded-full border-2 border-black px-2.5 py-1 font-nunito text-[10px] font-black uppercase text-black"
      style={{ backgroundColor: EFFECT_COLORS[effect] }}
    >
      {getEffectLabel(effect)}
    </span>
  );
}

function ObjectiveList({
  progressMap,
  selectedObjectiveId,
  onSelect,
}: {
  progressMap: Record<string, OpsProgress>;
  selectedObjectiveId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border-4 border-black bg-white p-4 card-shadow">
      <div className="mb-3 flex items-center gap-2">
        <Database size={20} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-xl font-black text-purple-darker">Match Objectives</h2>
      </div>
      <div className="max-h-[690px] space-y-2 overflow-y-auto pr-1">
        {OPS_OBJECTIVES.map((objective) => {
          const progress = progressMap[objective.id];
          const state = getObjectiveState(objective, progress);
          const active = selectedObjectiveId === objective.id;
          const color = FAMILY_COLORS[objective.family];
          return (
            <button
              key={objective.id}
              onClick={() => onSelect(objective.id)}
              className={`w-full rounded-xl border-[3px] p-3 text-left transition-all ${
                active ? 'border-purple-primary bg-purple-pale' : 'border-black/20 bg-white hover:border-purple-light'
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border-2 border-black"
                  style={{ backgroundColor: state.isComplete ? '#4ADE80' : color }}
                >
                  {state.isComplete ? <CheckCircle size={18} strokeWidth={3} /> : <Target size={18} strokeWidth={3} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-fredoka text-sm font-black text-purple-darker">{objective.title}</h3>
                    <span className="font-nunito text-[10px] font-black text-purple-primary">
                      {state.completed}/{state.total}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-nunito text-[11px] font-bold text-purple-dark">{objective.result}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full border-2 border-black bg-purple-pale">
                    <div className="h-full" style={{ width: `${state.percent}%`, backgroundColor: color }} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ObjectiveDetail({
  objective,
  progress,
}: {
  objective: OpsObjective;
  progress: OpsProgress;
}) {
  const state = getObjectiveState(objective, progress);
  const nextStep = getNextOpsStep(objective, progress);
  const color = FAMILY_COLORS[objective.family];

  return (
    <div className="rounded-2xl border-4 border-black bg-white p-5 card-shadow">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border-2 border-black px-3 py-1 font-nunito text-[10px] font-black uppercase text-black"
              style={{ backgroundColor: color }}
            >
              {objective.family}
            </span>
            <span className="rounded-full border-2 border-black bg-purple-pale px-3 py-1 font-nunito text-[10px] font-black uppercase text-purple-darker">
              {getDifficultyLabel(objective.difficulty)}
            </span>
          </div>
          <h2 className="mt-2 font-fredoka text-3xl font-black text-purple-darker">{objective.title}</h2>
          <p className="mt-1 font-nunito text-sm font-bold text-purple-dark">{objective.description}</p>
        </div>
        <div className="rounded-xl border-[3px] border-black bg-yellow-accent px-4 py-3 text-center">
          <p className="font-nunito text-[10px] font-black uppercase">Result</p>
          <p className="font-fredoka text-sm font-black">{objective.result}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MiniInfo icon={<Globe size={16} strokeWidth={3} />} label="Surface" value={objective.surface} />
        <MiniInfo icon={<Flame size={16} strokeWidth={3} />} label="Risk" value={`${objective.risk}/100`} />
        <MiniInfo icon={<Trophy size={16} strokeWidth={3} />} label="Reward" value={`${objective.reward} pts`} />
      </div>

      <div className="mt-5 space-y-2">
        {objective.steps.map((step, index) => {
          const complete = progress.completedSteps.includes(step.id);
          const current = nextStep?.id === step.id;
          return (
            <div
              key={step.id}
              className={`rounded-xl border-[3px] p-3 ${
                complete
                  ? 'border-black bg-green-success/20'
                  : current
                    ? 'border-purple-primary bg-purple-pale'
                    : 'border-black/20 bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-2 border-black"
                  style={{ backgroundColor: complete ? '#4ADE80' : current ? color : '#E5E7EB' }}
                >
                  {complete ? <CheckCircle size={16} strokeWidth={3} /> : current ? <Play size={16} strokeWidth={3} /> : <Lock size={16} strokeWidth={3} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-nunito text-[10px] font-black uppercase text-purple-primary">Step {index + 1} · {step.role}</span>
                    {current && <span className="rounded-full bg-yellow-accent px-2 py-0.5 font-nunito text-[9px] font-black text-black">ACTIVE</span>}
                  </div>
                  <h3 className="font-fredoka text-base font-black text-purple-darker">{step.title}</h3>
                  <p className="font-nunito text-xs font-bold text-purple-dark">{complete ? step.result : `Accepts: ${step.accepts.map(getEffectLabel).join(', ')}`}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {getDefenseControlsForStep(step).slice(0, 3).map((control) => (
                      <span key={control.id} className="rounded-full border border-black bg-white px-2 py-0.5 font-nunito text-[9px] font-black uppercase text-purple-darker">
                        {control.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.isComplete && (
        <div className="mt-4 rounded-xl border-[3px] border-black bg-green-success p-3 text-center">
          <p className="font-fredoka text-lg font-black text-black">Objective complete: {objective.result}</p>
        </div>
      )}
    </div>
  );
}

function DefenderPlaybook({
  controls,
  target,
}: {
  controls: OpsDefenseControl[];
  target: BattleTarget;
}) {
  return (
    <div className="rounded-2xl border-4 border-black bg-white p-4 card-shadow">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck size={20} strokeWidth={3} className="text-green-success" />
        <h2 className="font-fredoka text-xl font-black text-purple-darker">Defender Playbook</h2>
      </div>
      <p className="mb-3 font-nunito text-xs font-bold text-purple-dark">
        {target.displayName} can interrupt the active step with specific controls, not only a generic firewall.
      </p>
      <div className="space-y-2">
        {controls.length === 0 ? (
          <div className="rounded-xl border-[3px] border-black bg-purple-pale p-3 text-center">
            <p className="font-nunito text-sm font-bold text-purple-light">No active step selected.</p>
          </div>
        ) : (
          controls.map((control) => <DefenseControlCard key={control.id} control={control} />)
        )}
      </div>
    </div>
  );
}

function DefenseControlCard({ control }: { control: OpsDefenseControl }) {
  return (
    <div className="rounded-xl border-[3px] border-black bg-purple-pale p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2 border-black bg-green-success">
          <Shield size={18} strokeWidth={3} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-fredoka text-sm font-black text-purple-darker">{control.name}</h3>
            <span className="rounded-full border border-black bg-white px-2 py-0.5 font-nunito text-[8px] font-black uppercase text-purple-dark">
              {control.layer}
            </span>
          </div>
          <p className="mt-1 font-nunito text-[11px] font-bold text-purple-dark">{control.description}</p>
          <p className="mt-1 font-nunito text-[10px] font-black text-purple-primary">{control.miniGame}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {control.protects.slice(0, 4).map((effect) => <EffectBadge key={effect} effect={effect} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border-[3px] border-black bg-purple-pale p-3">
      <div className="mb-1 flex items-center gap-2 text-purple-primary">
        {icon}
        <span className="font-nunito text-[10px] font-black uppercase">{label}</span>
      </div>
      <p className="font-nunito text-xs font-black text-purple-darker">{value}</p>
    </div>
  );
}

function ToolRunner({
  nextStep,
  suggestedTools,
  ownedIds,
  availableEffects,
  onUseTool,
}: {
  nextStep: ReturnType<typeof getNextOpsStep>;
  suggestedTools: AttackTool[];
  ownedIds: Set<number>;
  availableEffects: OpsEffect[];
  onUseTool: (tool: AttackTool) => void;
}) {
  const neededEffects = nextStep?.accepts ?? [];
  const bridgedEffects = availableEffects.filter((effect) => neededEffects.includes(effect));

  return (
    <div className="rounded-2xl border-4 border-black bg-white p-5 card-shadow">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap size={20} strokeWidth={3} className="text-yellow-accent" />
          <h2 className="font-fredoka text-xl font-black text-purple-darker">Action Kit</h2>
        </div>
        {nextStep && (
          <span className="rounded-full border-2 border-black bg-purple-pale px-3 py-1 font-nunito text-[10px] font-black uppercase text-purple-darker">
            Need {neededEffects.map(getEffectLabel).join(' / ')}
          </span>
        )}
      </div>

      {!nextStep ? (
        <div className="rounded-xl border-[3px] border-black bg-green-success/20 p-4 text-center">
          <CheckCircle size={32} strokeWidth={3} className="mx-auto mb-2 text-green-success" />
          <p className="font-fredoka text-lg font-black text-purple-darker">This objective is complete.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestedTools.map((tool) => {
            const profile = getToolOpsProfile(tool);
            const owned = ownedIds.has(tool.id);
            const color = TOOL_CATEGORY_COLORS[tool.category] || '#7C3AED';
            const directMatches = profile.effects.some((effect) => neededEffects.includes(effect));
            const bridgeMatches = !directMatches && bridgedEffects.length > 0;
            return (
              <button
                key={tool.id}
                onClick={() => onUseTool(tool)}
                className="rounded-xl border-[3px] border-black bg-purple-pale p-3 text-left transition-transform hover:scale-[1.02]"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border-2 border-black"
                    style={{ backgroundColor: color }}
                  >
                    {directMatches ? <Activity size={20} strokeWidth={3} /> : <Eye size={20} strokeWidth={3} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-fredoka text-sm font-black text-purple-darker">{tool.name}</h3>
                      <div className="flex flex-shrink-0 gap-1">
                        {bridgeMatches && (
                          <span className="rounded-full border border-black bg-yellow-accent px-1.5 py-0.5 font-nunito text-[8px] font-black text-black">
                            BRIDGE
                          </span>
                        )}
                        <span className={`rounded-full border border-black px-1.5 py-0.5 font-nunito text-[8px] font-black ${owned ? 'bg-green-success text-black' : 'bg-white text-purple-dark'}`}>
                          {owned ? 'OWNED' : 'LAB'}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-2 font-nunito text-[11px] font-bold text-purple-dark">{tool.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {profile.effects.slice(0, 4).map((effect) => <EffectBadge key={effect} effect={effect} />)}
                      {bridgeMatches && bridgedEffects.slice(0, 2).map((effect) => (
                        <EffectBadge key={`bridge-${tool.id}-${effect}`} effect={effect} />
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="rounded-2xl border-4 border-black bg-white p-4 card-shadow">
      <div className="mb-3 flex items-center gap-2">
        <Clock size={20} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-xl font-black text-purple-darker">Ops Feed</h2>
      </div>
      <div className="max-h-[690px] space-y-2 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="rounded-xl border-[3px] border-black bg-purple-pale p-4 text-center">
              <Activity size={32} strokeWidth={3} className="mx-auto mb-2 text-purple-light" />
              <p className="font-nunito text-sm font-bold text-purple-dark">Run an action to start the operation feed.</p>
            </div>
          ) : (
            events.map((event) => <TimelineRow key={event.id} event={event} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const config = {
    complete: { color: '#4ADE80', icon: <CheckCircle size={15} strokeWidth={3} />, label: 'STEP' },
    blocked: { color: '#F87171', icon: <ShieldCheck size={15} strokeWidth={3} />, label: 'BLOCK' },
    off_path: { color: '#FACC15', icon: <AlertTriangle size={15} strokeWidth={3} />, label: 'OFF PATH' },
    already_done: { color: '#A78BFA', icon: <Sparkles size={15} strokeWidth={3} />, label: 'DONE' },
  }[event.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border-[3px] border-black bg-purple-pale p-3"
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full border border-black px-2 py-0.5 font-nunito text-[9px] font-black text-black" style={{ backgroundColor: config.color }}>
          {config.icon}
          {config.label}
        </span>
        <span className="truncate font-nunito text-[10px] font-black text-purple-primary">{event.objectiveTitle}</span>
      </div>
      <p className="font-nunito text-xs font-bold text-purple-darker">{event.message}</p>
      {event.bridgeEffects && event.bridgeEffects.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {event.bridgeEffects.map((effect) => (
            <EffectBadge key={`${event.id}-${effect}`} effect={effect} />
          ))}
        </div>
      )}
      <p className="mt-1 font-nunito text-[10px] font-black text-purple-light">
        {event.toolName} · +{event.points} pts
      </p>
    </motion.div>
  );
}

export function OpsResultPanel({
  summary,
  target,
  onRunAgain,
  onBackToTargets,
}: {
  summary: OpsMatchSummary;
  target: BattleTarget;
  onRunAgain: () => void;
  onBackToTargets: () => void;
}) {
  const attackerWon = summary.winner === 'attacker';

  return (
    <motion.div
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="mx-auto max-w-3xl px-4 pt-8 pb-16"
    >
      <div className={`rounded-2xl border-4 border-black p-7 text-center card-shadow-lg ${attackerWon ? 'bg-yellow-accent' : 'bg-blue-100'}`}>
        {attackerWon ? (
          <Trophy size={70} strokeWidth={2.5} className="mx-auto mb-3 text-purple-darker" />
        ) : (
          <Shield size={70} strokeWidth={2.5} className="mx-auto mb-3 text-blue-info" />
        )}
        <h1 className="font-fredoka text-5xl font-black text-purple-darker text-outline-sm">
          {attackerWon ? 'OPS WON!' : 'DEFENSE HELD'}
        </h1>
        <p className="mt-2 font-nunito text-sm font-black text-purple-dark">
          Timed operation against {target.displayName} is complete.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        <ResultStat label="Objectives" value={`${summary.completedObjectives}/${summary.totalObjectives}`} icon={<Target size={20} strokeWidth={3} />} />
        <ResultStat label="Step Progress" value={`${summary.completedSteps}/${summary.totalSteps}`} icon={<Activity size={20} strokeWidth={3} />} />
        <ResultStat label="Attack Score" value={summary.attackerScore.toString()} icon={<Flame size={20} strokeWidth={3} />} />
        <ResultStat label="Defense Score" value={summary.defenderScore.toString()} icon={<Shield size={20} strokeWidth={3} />} />
        <ResultStat label="Blocked" value={summary.blockedActions.toString()} icon={<XCircle size={20} strokeWidth={3} />} />
      </div>

      <div className="mt-5 rounded-2xl border-4 border-black bg-white p-5 card-shadow">
        <h2 className="font-fredoka text-xl font-black text-purple-darker">Completed Goals</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {summary.completedTitles.length === 0 ? (
            <p className="font-nunito text-sm font-bold text-purple-light">
              No full objective completed. You still earned progress from partial chains.
            </p>
          ) : (
            summary.completedTitles.map((title) => (
              <span key={title} className="rounded-full border-2 border-black bg-green-success px-3 py-1 font-nunito text-xs font-black text-black">
                {title}
              </span>
            ))
          )}
        </div>
      </div>

      {summary.partialObjectives > 0 && (
        <div className="mt-5 rounded-2xl border-4 border-black bg-purple-pale p-5 card-shadow">
          <h2 className="font-fredoka text-xl font-black text-purple-darker">
            Partial Chains · {summary.progressPercent}% total progress
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.partialTitles.map((title) => (
              <span key={title} className="rounded-full border-2 border-black bg-yellow-accent px-3 py-1 font-nunito text-xs font-black text-black">
                {title}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onRunAgain}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-4 border-black bg-red-alert px-5 py-3 font-fredoka text-lg font-black text-white transition-transform hover:scale-[1.01]"
        >
          <Swords size={22} strokeWidth={3} />
          Run Another Ops
        </button>
        <button
          onClick={onBackToTargets}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-4 border-black bg-white px-5 py-3 font-fredoka text-lg font-black text-purple-darker transition-transform hover:scale-[1.01]"
        >
          <Target size={22} strokeWidth={3} />
          Back To Targets
        </button>
      </div>
    </motion.div>
  );
}

function ResultStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-4 border-black bg-white p-4 text-center card-shadow">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-purple-pale text-purple-primary">
        {icon}
      </div>
      <p className="font-nunito text-[10px] font-black uppercase text-purple-dark">{label}</p>
      <p className="font-fredoka text-2xl font-black text-purple-darker">{value}</p>
    </div>
  );
}
