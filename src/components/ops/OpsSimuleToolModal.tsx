import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle,
  Fingerprint,
  Gauge,
  Puzzle,
  Shield,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import {
  SIMULE_TOOLS,
  type SimuleTool,
} from '@/components/game-simulations/simuleTools';
import PasswordQuest from '@/components/game-simulations/PasswordQuest';
import PhishingDetective from '@/components/game-simulations/PhishingDetective';
import FirewallDefender from '@/components/game-simulations/FirewallDefender';
import CryptoCat from '@/components/game-simulations/CryptoCat';
import MalwareHunter from '@/components/game-simulations/MalwareHunter';
import NetworkNavigator from '@/components/game-simulations/NetworkNavigator';
import SSLHandshake from '@/components/game-simulations/SSLHandshake';
import DNSResolver from '@/components/game-simulations/DNSResolver';
import PacketTracer from '@/components/game-simulations/PacketTracer';
import SubnetCalculator from '@/components/game-simulations/SubnetCalculator';
import VPNTunnel from '@/components/game-simulations/VPNTunnel';
import LoadBalancer from '@/components/game-simulations/LoadBalancer';
import IDSAlert from '@/components/game-simulations/IDSAlert';
import CertificateChain from '@/components/game-simulations/CertificateChain';
import ProxyServer from '@/components/game-simulations/ProxyServer';
import PortScanner from '@/components/game-simulations/PortScanner';
import PacketSnifferGUI from '@/components/game-simulations/PacketSnifferGUI';
import EncryptionPipeline from '@/components/game-simulations/EncryptionPipeline';
import SQLSafari from '@/components/game-simulations/SQLSafari';
import StegoSpy from '@/components/game-simulations/StegoSpy';
import XSSXpert from '@/components/game-simulations/XSSXpert';
import CertChampion from '@/components/game-simulations/CertChampion';
import HashHacker from '@/components/game-simulations/HashHacker';
import AccessAce from '@/components/game-simulations/AccessAce';
import LogAnalyzer from '@/components/game-simulations/LogAnalyzer';
import NmapScanner from '@/components/game-simulations/NmapScanner';
import DNSLookup from '@/components/game-simulations/DNSLookup';
import WhoisLookup from '@/components/game-simulations/WhoisLookup';
import SQLInjector from '@/components/game-simulations/SQLInjector';
import XSSTester from '@/components/game-simulations/XSSTester';
import HashCracker from '@/components/game-simulations/HashCracker';
import PhishingSim from '@/components/game-simulations/PhishingSim';
import CertViewer from '@/components/game-simulations/CertViewer';
import XORTool from '@/components/game-simulations/XORTool';
import TrojanBuilder from '@/components/game-simulations/TrojanBuilder';
import KeyloggerSim from '@/components/game-simulations/KeyloggerSim';
import {
  getEffectLabel,
  getToolOpsProfile,
  type OpsEffect,
  type OpsObjective,
  type OpsStep,
} from '@/lib/opsEngine';
import type { AttackTool, BattleTarget } from '@/lib/battleEngine';
import {
  createOpsToolContext,
  type OpsProofOption,
  type OpsToolContext,
} from '@/lib/opsContext';

type ScoreHandler = (score: number) => void;

interface Props {
  tool: AttackTool;
  objective: OpsObjective;
  step: OpsStep;
  target: BattleTarget;
  availableEffects: OpsEffect[];
  chainPosition: number;
  chainTotal: number;
  nextChainToolName?: string;
  onCancel: () => void;
  onComplete: (score: number) => void;
}

function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getRequiredScore(objective: OpsObjective) {
  return objective.difficulty === 1 ? 40 : objective.difficulty === 2 ? 50 : 60;
}

function getSimuleTool(tool: AttackTool): SimuleTool | undefined {
  return SIMULE_TOOLS.find((candidate) => candidate.battleId === tool.id || candidate.name === tool.name);
}

function getCounterOptions(effect: OpsEffect) {
  const map: Partial<Record<OpsEffect, { right: string; traps: string[] }>> = {
    firewall: {
      right: 'Shape traffic through the allowed service lane',
      traps: ['Spray every port', 'Disable the whole edge policy'],
    },
    waf: {
      right: 'Use a narrow app-layer test and respect blocked patterns',
      traps: ['Force the same blocked payload', 'Ignore normal visitor behavior'],
    },
    patch: {
      right: 'Pick the smallest scoped fix path before retrying',
      traps: ['Change unrelated services', 'Skip version and config checks'],
    },
    log: {
      right: 'Correlate timestamps before taking the next action',
      traps: ['Trust one isolated event', 'Delete noisy evidence'],
    },
    edr: {
      right: 'Reduce suspicious behavior and isolate the lab process',
      traps: ['Keep persistence running', 'Blend every process together'],
    },
    cert: {
      right: 'Verify issuer, host, expiry, and fingerprint',
      traps: ['Accept the first certificate', 'Check only the lock icon'],
    },
    backup: {
      right: 'Verify the clean snapshot before touching live data',
      traps: ['Overwrite the last clean copy', 'Restore without integrity checks'],
    },
    dns: {
      right: 'Compare resolver answer with the expected record',
      traps: ['Trust the local answer blindly', 'Change every DNS record'],
    },
    proxy: {
      right: 'Route only the needed request path through the proxy',
      traps: ['Proxy all traffic at once', 'Hide the source of every request'],
    },
    network: {
      right: 'Trace the exact path before changing route state',
      traps: ['Jump to an unrelated subnet', 'Assume every hop is hostile'],
    },
    traffic: {
      right: 'Filter the relevant protocol and inspect the flow',
      traps: ['Capture noise without a filter', 'Treat volume as proof'],
    },
    web: {
      right: 'Stay on the active app surface and verify behavior',
      traps: ['Click unrelated pages', 'Assume the UI proves backend access'],
    },
    social: {
      right: 'Validate the human clue against a second signal',
      traps: ['Trust urgency language', 'Treat a profile hint as proof'],
    },
    malware: {
      right: 'Keep the sample contained and watch behavior',
      traps: ['Run without isolation', 'Classify by filename only'],
    },
    payload: {
      right: 'Stage only the safe lab payload and monitor response',
      traps: ['Use an unbounded payload', 'Skip containment'],
    },
    endpoint: {
      right: 'Check process, file, and session context together',
      traps: ['Trust one process name', 'Ignore local policy state'],
    },
    session: {
      right: 'Validate scope, expiry, and revocation path',
      traps: ['Reuse every token', 'Ignore session owner'],
    },
    credential: {
      right: 'Confirm the credential clue without exposing secrets',
      traps: ['Paste secrets everywhere', 'Ignore reset state'],
    },
    crypto: {
      right: 'Check integrity before relying on encoded data',
      traps: ['Treat encoding as encryption', 'Ignore key/source mismatch'],
    },
    exfil: {
      right: 'Move only sanitized proof through the approved channel',
      traps: ['Dump everything', 'Skip proof minimization'],
    },
  };

  return map[effect] ?? {
    right: `Use the ${getEffectLabel(effect)} clue only where the active step needs it`,
    traps: ['Force it into every route', 'Ignore the target context'],
  };
}

function rotateOptions(options: string[], seed: string) {
  const offset = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
}

export function SimuleGame({
  gameId,
  onScoreChange,
  opsContext,
}: {
  gameId: string;
  onScoreChange: ScoreHandler;
  opsContext?: OpsToolContext;
}) {
  const gameProps = { onScoreChange, opsContext };
  switch (gameId) {
    case 'password-quest':
      return <PasswordQuest {...gameProps} />;
    case 'phishing-detective':
      return <PhishingDetective {...gameProps} />;
    case 'firewall-defender':
      return <FirewallDefender {...gameProps} />;
    case 'crypto-cat':
      return <CryptoCat {...gameProps} />;
    case 'malware-hunter':
      return <MalwareHunter {...gameProps} />;
    case 'network-navigator':
      return <NetworkNavigator {...gameProps} />;
    case 'ssl-handshake':
      return <SSLHandshake {...gameProps} />;
    case 'dns-resolver':
      return <DNSResolver {...gameProps} />;
    case 'packet-tracer':
      return <PacketTracer {...gameProps} />;
    case 'subnet-calculator':
      return <SubnetCalculator {...gameProps} />;
    case 'vpn-tunnel':
      return <VPNTunnel {...gameProps} />;
    case 'load-balancer':
      return <LoadBalancer {...gameProps} />;
    case 'ids-alert':
      return <IDSAlert {...gameProps} />;
    case 'certificate-chain':
      return <CertificateChain {...gameProps} />;
    case 'proxy-server':
      return <ProxyServer {...gameProps} />;
    case 'port-scanner':
      return <PortScanner {...gameProps} />;
    case 'encryption-pipeline':
      return <EncryptionPipeline {...gameProps} />;
    case 'sql-safari':
      return <SQLSafari {...gameProps} />;
    case 'stego-spy':
      return <StegoSpy {...gameProps} />;
    case 'xss-xpert':
      return <XSSXpert {...gameProps} />;
    case 'cert-champion':
      return <CertChampion {...gameProps} />;
    case 'hash-hacker':
      return <HashHacker {...gameProps} />;
    case 'access-ace':
      return <AccessAce {...gameProps} />;
    case 'log-analyzer':
      return <LogAnalyzer {...gameProps} />;
    case 'nmap-scanner':
    case 'advanced-port-scan':
      return <NmapScanner {...gameProps} />;
    case 'dns-lookup-gui':
      return <DNSLookup {...gameProps} />;
    case 'whois-lookup':
      return <WhoisLookup {...gameProps} />;
    case 'sql-injector-gui':
      return <SQLInjector {...gameProps} />;
    case 'xss-tester-gui':
      return <XSSTester {...gameProps} />;
    case 'hash-cracker-gui':
      return <HashCracker {...gameProps} />;
    case 'phishing-sim-gui':
      return <PhishingSim {...gameProps} />;
    case 'cert-viewer-gui':
      return <CertViewer {...gameProps} />;
    case 'network-packet-tracer':
      return <PacketSnifferGUI {...gameProps} />;
    case 'xor-tool':
      return <XORTool {...gameProps} />;
    case 'trojan-builder':
      return <TrojanBuilder {...gameProps} />;
    case 'keylogger-sim':
      return <KeyloggerSim {...gameProps} />;
    default:
      return <OpsCircuitFallback onScoreChange={onScoreChange} opsContext={opsContext} />;
  }
}

function OpsCircuitFallback({
  onScoreChange,
  opsContext,
}: {
  onScoreChange: ScoreHandler;
  opsContext?: OpsToolContext;
}) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const target = opsContext?.target;
  const lanes = [
    {
      id: 'signal',
      title: 'Signal',
      cards: [
        target?.logs.loginEvent ?? 'Trusted log event',
        'Random banner text',
        target ? `${target.hosts.resolver} -> ${target.ips.web}` : 'Matching DNS clue',
      ],
      answer: target ? `${target.hosts.resolver} -> ${target.ips.web}` : 'Matching DNS clue',
    },
    {
      id: 'route',
      title: 'Route',
      cards: [
        target ? `${target.primaryDomain}${target.adminPath}` : 'Verified target path',
        'Noisy detour',
        target?.hosts.cdn ?? 'Unrelated endpoint',
      ],
      answer: target ? `${target.primaryDomain}${target.adminPath}` : 'Verified target path',
    },
    {
      id: 'control',
      title: 'Control',
      cards: [
        target ? `Scoped action for ${target.platformName}` : 'Small scoped action',
        'Broad unsafe change',
        'Ignore the counter',
      ],
      answer: target ? `Scoped action for ${target.platformName}` : 'Small scoped action',
    },
  ];

  const choose = (laneId: string, card: string) => {
    const next = { ...selected, [laneId]: card };
    setSelected(next);
    const correct = lanes.filter((lane) => next[lane.id] === lane.answer).length;
    onScoreChange(Math.round((correct / lanes.length) * 100));
  };

  return (
    <div className="rounded-2xl border-4 border-black bg-purple-pale p-4">
      <div className="mb-3 flex items-center gap-2">
        <Puzzle size={20} strokeWidth={3} className="text-purple-primary" />
        <h3 className="font-fredoka text-xl font-black text-purple-darker">Ops Circuit</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {lanes.map((lane) => (
          <div key={lane.id} className="rounded-xl border-[3px] border-black bg-white p-3">
            <p className="mb-2 font-fredoka text-base font-black text-purple-darker">{lane.title}</p>
            <div className="space-y-2">
              {lane.cards.map((card) => {
                const active = selected[lane.id] === card;
                const correct = active && card === lane.answer;
                return (
                  <button
                    key={card}
                    onClick={() => choose(lane.id, card)}
                    className={`w-full rounded-xl border-2 border-black px-3 py-2 text-left font-nunito text-xs font-black transition-transform hover:scale-[1.01] ${
                      correct ? 'bg-green-success' : active ? 'bg-yellow-accent' : 'bg-purple-pale'
                    }`}
                  >
                    {card}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EffectBadge({ effect }: { effect: OpsEffect }) {
  return (
    <span className="rounded-full border-2 border-black bg-white px-2.5 py-1 font-nunito text-[10px] font-black uppercase text-purple-darker">
      {getEffectLabel(effect)}
    </span>
  );
}

function CounterStackChallenge({
  counters,
  opsContext,
  onScoreChange,
}: {
  counters: OpsEffect[];
  opsContext?: OpsToolContext;
  onScoreChange: ScoreHandler;
}) {
  const visibleCounters = counters.slice(0, 3);
  const [answers, setAnswers] = useState<Record<OpsEffect, string>>({} as Record<OpsEffect, string>);
  const optionSets = useMemo(() => {
    return visibleCounters.map((effect) => {
      const config = getCounterOptions(effect);
      return {
        effect,
        right: config.right,
        options: rotateOptions([config.right, ...config.traps], effect),
      };
    });
  }, [visibleCounters.join('|')]);

  if (visibleCounters.length === 0) {
    return (
      <div className="rounded-2xl border-[3px] border-black bg-green-success/20 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle size={20} strokeWidth={3} className="text-green-success" />
          <h3 className="font-fredoka text-lg font-black text-purple-darker">No active counter stack</h3>
        </div>
      </div>
    );
  }

  const choose = (effect: OpsEffect, answer: string) => {
    const next = { ...answers, [effect]: answer };
    setAnswers(next);
    const correct = optionSets.filter((set) => next[set.effect] === set.right).length;
    onScoreChange(Math.round((correct / optionSets.length) * 100));
  };

  return (
    <div className="rounded-2xl border-[3px] border-black bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Shield size={20} strokeWidth={3} className="text-green-success" />
        <h3 className="font-fredoka text-xl font-black text-purple-darker">Counter Stack</h3>
      </div>
      <p className="mb-3 font-nunito text-xs font-bold text-purple-dark">
        Target defenses appear automatically for {opsContext?.target.platformName ?? 'this step'}. Pick the clean maneuver for each one.
      </p>
      <div className="space-y-3">
        {optionSets.map((set) => (
          <div key={set.effect} className="rounded-xl border-2 border-black bg-purple-pale p-3">
            <p className="mb-2 font-nunito text-[10px] font-black uppercase text-purple-primary">
              {getEffectLabel(set.effect)} pressure
            </p>
            <div className="space-y-2">
              {set.options.map((option) => {
                const active = answers[set.effect] === option;
                const correct = active && option === set.right;
                const wrong = active && option !== set.right;
                return (
                  <button
                    key={option}
                    onClick={() => choose(set.effect, option)}
                    className={`w-full rounded-xl border-2 border-black px-3 py-2 text-left font-nunito text-[11px] font-black transition-transform hover:scale-[1.01] ${
                      correct ? 'bg-green-success text-black' : wrong ? 'bg-red-alert text-white' : 'bg-white text-purple-darker'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtifactProofChallenge({
  opsContext,
  onScoreChange,
}: {
  opsContext: OpsToolContext;
  onScoreChange: ScoreHandler;
}) {
  const requiredCount = opsContext.contract.options.filter((option) => option.correct).length;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const choose = (option: OpsProofOption) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(option.id)) next.delete(option.id);
      else next.add(option.id);

      const correctPicked = opsContext.contract.options.filter((item) => item.correct && next.has(item.id)).length;
      const wrongPicked = opsContext.contract.options.filter((item) => !item.correct && next.has(item.id)).length;
      const score = Math.max(0, Math.round((correctPicked / Math.max(1, requiredCount)) * 100) - wrongPicked * 35);
      onScoreChange(score);
      return next;
    });
  };

  return (
    <div className="mt-3 rounded-2xl border-[3px] border-black bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Fingerprint size={20} strokeWidth={3} className="text-purple-primary" />
        <h3 className="font-fredoka text-xl font-black text-purple-darker">Target Proof</h3>
      </div>
      <p className="font-nunito text-xs font-bold text-purple-dark">
        {opsContext.contract.instruction}
      </p>
      <div className="mt-3 space-y-2">
        {opsContext.contract.options.map((option) => {
          const active = selected.has(option.id);
          return (
            <button
              key={option.id}
              data-ops-proof={option.correct ? 'correct' : 'decoy'}
              data-ops-proof-selected={active ? 'true' : 'false'}
              onClick={() => choose(option)}
              className={`w-full rounded-xl border-2 border-black px-3 py-2 text-left transition-transform hover:scale-[1.01] ${
                active ? 'bg-yellow-accent' : 'bg-purple-pale'
              }`}
            >
              <span className="block font-nunito text-[11px] font-black text-purple-darker">
                {option.label}
              </span>
              <span className="block font-nunito text-[10px] font-bold text-purple-dark">
                {option.detail}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 rounded-xl border-2 border-black bg-green-success/20 px-3 py-2 font-nunito text-[10px] font-black uppercase text-purple-darker">
        Expected proof: {opsContext.contract.expectedProof}
      </p>
    </div>
  );
}

export default function OpsSimuleToolModal({
  tool,
  objective,
  step,
  target,
  availableEffects,
  chainPosition,
  chainTotal,
  nextChainToolName,
  onCancel,
  onComplete,
}: Props) {
  const [currentScore, setCurrentScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [counterScore, setCounterScore] = useState(step.defenderCounters.length === 0 ? 100 : 0);
  const [proofScore, setProofScore] = useState(0);
  const [scoreEvents, setScoreEvents] = useState(0);
  const simuleTool = useMemo(() => getSimuleTool(tool), [tool]);
  const profile = useMemo(() => getToolOpsProfile(tool), [tool]);
  const opsContext = useMemo(() => createOpsToolContext({
    target,
    objective,
    step,
    tool,
    chainPosition,
    chainTotal,
  }), [target, objective, step, tool, chainPosition, chainTotal]);
  const requiredScore = getRequiredScore(objective);
  const directEffects = profile.effects.filter((effect) => step.accepts.includes(effect));
  const bridgedEffects = availableEffects.filter((effect) => step.accepts.includes(effect) && !profile.effects.includes(effect));
  const operationScore = Math.round((bestScore * 0.56) + (counterScore * 0.2) + (proofScore * 0.24));
  const requiredProofScore = 60;
  const canComplete = operationScore >= requiredScore && proofScore >= requiredProofScore;
  const isFinalChainSegment = chainPosition >= chainTotal;

  const handleScoreChange = (score: number) => {
    const normalized = clampScore(score);
    setCurrentScore(normalized);
    setBestScore((current) => Math.max(current, normalized));
    setScoreEvents((current) => current + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-purple-darker/70 px-3 py-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.94, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 16 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="mx-auto flex max-h-[92vh] max-w-6xl flex-col overflow-hidden rounded-2xl border-4 border-black bg-white card-shadow-lg"
        >
          <div className="border-b-4 border-black bg-yellow-accent p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border-2 border-black bg-white px-3 py-1 font-nunito text-[10px] font-black uppercase text-purple-darker">
                    Auto surfaced simuletool
                  </span>
                  <span className="rounded-full border-2 border-black bg-purple-pale px-3 py-1 font-nunito text-[10px] font-black uppercase text-purple-darker">
                    {objective.title}
                  </span>
                  <span className="rounded-full border-2 border-black bg-green-success px-3 py-1 font-nunito text-[10px] font-black uppercase text-black">
                    Segment {chainPosition}/{chainTotal}
                  </span>
                </div>
                <h2 className="font-fredoka text-3xl font-black text-purple-darker text-outline-sm">
                  {tool.name}
                </h2>
                <p className="font-nunito text-sm font-black text-purple-dark">
                  {step.title} on {opsContext.target.platformName} ({opsContext.target.primaryDomain})
                </p>
              </div>
              <button
                onClick={onCancel}
                className="flex h-11 w-11 items-center justify-center rounded-xl border-[3px] border-black bg-white text-purple-darker transition-transform hover:scale-105"
                aria-label="Close simuletool"
              >
                <X size={22} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[0.34fr_0.66fr]">
            <aside className="overflow-y-auto border-b-4 border-black bg-purple-pale p-4 lg:border-b-0 lg:border-r-4">
              <div className="rounded-2xl border-[3px] border-black bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Target size={20} strokeWidth={3} className="text-purple-primary" />
                  <h3 className="font-fredoka text-xl font-black text-purple-darker">Step Gate</h3>
                </div>
                <p className="font-nunito text-xs font-bold text-purple-dark">
                  This modal commits segment {chainPosition}/{chainTotal} against {opsContext.target.platformName}. The VS step advances only after the ordered tool GUI, counter stack, and target proof are all strong enough.
                </p>
                <div className="mt-4 rounded-xl border-[3px] border-black bg-purple-pale p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-nunito text-[10px] font-black uppercase text-purple-dark">Operation score</span>
                    <span className="font-fredoka text-xl font-black text-purple-darker">{operationScore}/100</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full border-2 border-black bg-white">
                    <div
                      className="h-full bg-green-success"
                      style={{ width: `${operationScore}%` }}
                    />
                  </div>
                  <p className="mt-2 font-nunito text-[10px] font-black uppercase text-purple-primary">
                    Required {requiredScore}/100 · Tool {bestScore}/100 · Counter {counterScore}/100 · Proof {proofScore}/100
                  </p>
                  <p className="mt-1 font-nunito text-[10px] font-black uppercase text-purple-light">
                    Current tool {currentScore}/100 · Events {scoreEvents}
                  </p>
                  {nextChainToolName && (
                    <p className="mt-1 font-nunito text-[10px] font-black uppercase text-purple-dark">
                      Next segment: {nextChainToolName}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <CounterStackChallenge
                  counters={step.defenderCounters}
                  opsContext={opsContext}
                  onScoreChange={(score) => setCounterScore(clampScore(score))}
                />
              </div>

              <ArtifactProofChallenge
                opsContext={opsContext}
                onScoreChange={(score) => setProofScore(clampScore(score))}
              />

              <div className="mt-3 rounded-2xl border-[3px] border-black bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Activity size={20} strokeWidth={3} className="text-blue-info" />
                  <h3 className="font-fredoka text-xl font-black text-purple-darker">Tactical Fit</h3>
                </div>
                <p className="font-nunito text-[11px] font-bold text-purple-dark">
                  {simuleTool?.strength ?? tool.description}
                </p>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="mb-1 font-nunito text-[10px] font-black uppercase text-purple-primary">Step needs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {step.accepts.map((effect) => <EffectBadge key={effect} effect={effect} />)}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 font-nunito text-[10px] font-black uppercase text-purple-primary">Tool provides</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.effects.map((effect) => <EffectBadge key={effect} effect={effect} />)}
                    </div>
                  </div>
                  {bridgedEffects.length > 0 && (
                    <div>
                      <p className="mb-1 font-nunito text-[10px] font-black uppercase text-purple-primary">Pinned bridge</p>
                      <div className="flex flex-wrap gap-1.5">
                        {bridgedEffects.map((effect) => <EffectBadge key={effect} effect={effect} />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border-[3px] border-black bg-white p-4">
                <div className="flex items-center gap-2">
                  <Shield size={20} strokeWidth={3} className="text-green-success" />
                  <h3 className="font-fredoka text-xl font-black text-purple-darker">Target Context</h3>
                </div>
                <p className="mt-1 font-nunito text-xs font-bold text-purple-dark">
                  {opsContext.target.orgName} uses {opsContext.target.databaseName}, {opsContext.target.apiName}, and {opsContext.target.sessionCookieName}. Defense power {target.defensePower}.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[...directEffects, ...bridgedEffects].length === 0 ? (
                    <span className="rounded-full border-2 border-black bg-yellow-accent px-2.5 py-1 font-nunito text-[10px] font-black uppercase text-black">
                      weak fit
                    </span>
                  ) : (
                    [...directEffects, ...bridgedEffects].map((effect) => <EffectBadge key={`fit-${effect}`} effect={effect} />)
                  )}
                </div>
              </div>
            </aside>

            <main className="min-h-0 overflow-y-auto bg-white p-4">
              <div className="mb-3 flex flex-col gap-2 rounded-2xl border-[3px] border-black bg-purple-pale p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} strokeWidth={3} className="text-purple-primary" />
                  <div>
                    <p className="font-fredoka text-lg font-black text-purple-darker">
                      Play the simuletool GUI
                    </p>
                    <p className="font-nunito text-xs font-bold text-purple-dark">
                      Use the actual controls below; the operation result uses your best score.
                    </p>
                    <p className="font-nunito text-[10px] font-black uppercase text-purple-primary">
                      Target-bound: {opsContext.target.primaryDomain} · {opsContext.target.databaseName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border-[3px] border-black bg-white px-3 py-2">
                  <Gauge size={18} strokeWidth={3} className="text-green-success" />
                  <span className="font-fredoka text-lg font-black text-purple-darker">{operationScore}/100</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border-[3px] border-black bg-white">
                <SimuleGame
                  gameId={simuleTool?.gameId ?? tool.name}
                  onScoreChange={handleScoreChange}
                  opsContext={opsContext}
                />
              </div>
            </main>
          </div>

          <div className="flex flex-col gap-3 border-t-4 border-black bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 font-nunito text-xs font-black text-purple-dark">
              {canComplete ? (
                <>
                  <CheckCircle size={18} strokeWidth={3} className="text-green-success" />
                  {isFinalChainSegment
                    ? 'Operation run is strong enough to complete this VS step.'
                    : 'Operation run is strong enough to commit this chain segment.'}
                </>
              ) : (
                <>
                  <Zap size={18} strokeWidth={3} className="text-yellow-accent" />
                  Reach {requiredScore}/100 and target proof {requiredProofScore}/100 to submit this chain segment.
                </>
              )}
            </div>
            <button
              onClick={() => onComplete(operationScore)}
              disabled={!canComplete}
              className={`flex items-center justify-center gap-2 rounded-2xl border-4 border-black px-5 py-3 font-fredoka text-lg font-black transition-transform ${
                canComplete
                  ? 'bg-green-success text-black hover:scale-[1.01]'
                  : 'cursor-not-allowed bg-gray-200 text-gray-500'
              }`}
            >
              <CheckCircle size={22} strokeWidth={3} />
              {isFinalChainSegment ? 'Complete VS Step' : 'Commit Segment'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
