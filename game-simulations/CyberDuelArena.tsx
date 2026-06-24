import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CircuitBoard,
  Clock,
  Database,
  Eye,
  Flame,
  Gauge,
  GitBranch,
  Globe2,
  HardDrive,
  Network,
  Radar,
  RotateCcw,
  Route,
  Server,
  Shield,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  Target,
  Trophy,
  Wifi,
  Zap,
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type Phase = 'loadout' | 'duel' | 'debrief';
type ToolCategory = 'map' | 'sensor' | 'policy' | 'response' | 'recovery' | 'special';
type NodeStatus =
  | 'healthy'
  | 'watching'
  | 'degraded'
  | 'classified'
  | 'guarded'
  | 'contained'
  | 'stable'
  | 'restored'
  | 'isolated'
  | 'explained';

interface DuelTool {
  id: string;
  name: string;
  category: ToolCategory;
  training: string;
  strength: string;
  blindSpot: string;
  energy: number;
}

interface ServiceNode {
  id: string;
  name: string;
  role: string;
  icon: 'client' | 'dns' | 'edge' | 'web' | 'api' | 'db' | 'storage';
  x: number;
  y: number;
  status: NodeStatus;
  impact: number;
  dependsOn?: string[];
}

interface DuelMove {
  id: string;
  toolId: string;
  label: string;
  targetNodeId: string;
  result: string;
  lesson: string;
  uptime: number;
  threat: number;
  diagnosis: number;
  falsePositive: number;
  resource: number;
  nodeStatus?: NodeStatus;
}

interface DuelEvent {
  id: string;
  round: number;
  title: string;
  source: string;
  summary: string;
  pressure: number;
  primaryNodeId: string;
  evidence: string[];
  tags: string[];
  moves: DuelMove[];
}

interface AppliedMove {
  event: DuelEvent;
  move: DuelMove;
}

interface Metrics {
  uptime: number;
  threat: number;
  diagnosis: number;
  falsePositive: number;
  resource: number;
}

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  map: 'Map',
  sensor: 'Sensor',
  policy: 'Policy',
  response: 'Response',
  recovery: 'Recovery',
  special: 'Special',
};

const CATEGORY_COLORS: Record<ToolCategory, string> = {
  map: '#A78BFA',
  sensor: '#60A5FA',
  policy: '#FACC15',
  response: '#F87171',
  recovery: '#4ADE80',
  special: '#F472B6',
};

const TOOLS: DuelTool[] = [
  {
    id: 'dependency_graph',
    name: 'Dependency Graph',
    category: 'map',
    training: 'Service Dependency',
    strength: 'Predicts what breaks before you isolate or restart a node.',
    blindSpot: 'Slow when live traffic is changing every second.',
    energy: 6,
  },
  {
    id: 'network_map',
    name: 'Network Map',
    category: 'map',
    training: 'Topology Basics',
    strength: 'Shows allowed paths through DNS, firewall, web, API, and data layers.',
    blindSpot: 'Does not prove root cause by itself.',
    energy: 4,
  },
  {
    id: 'traffic_monitor',
    name: 'Traffic Monitor',
    category: 'sensor',
    training: 'Traffic Classification',
    strength: 'Separates normal spikes from suspicious retry patterns.',
    blindSpot: 'Weak on config drift and storage changes.',
    energy: 5,
  },
  {
    id: 'dns_monitor',
    name: 'DNS Monitor',
    category: 'sensor',
    training: 'Resolver Hygiene',
    strength: 'Finds regional route drift and bad resolver answers.',
    blindSpot: 'Does not read application logs.',
    energy: 5,
  },
  {
    id: 'log_timeline',
    name: 'Log Timeline',
    category: 'sensor',
    training: 'Incident Timeline',
    strength: 'Links symptoms to the earlier event that caused them.',
    blindSpot: 'Needs a follow-up action to change system state.',
    energy: 6,
  },
  {
    id: 'firewall_editor',
    name: 'Firewall Editor',
    category: 'policy',
    training: 'Firewall Rule Order',
    strength: 'Creates narrow allow/block rules while preserving good traffic.',
    blindSpot: 'Broad rules create false-positive damage.',
    energy: 7,
  },
  {
    id: 'rate_limiter',
    name: 'Rate Limiter',
    category: 'policy',
    training: 'Traffic Shaping',
    strength: 'Keeps service responsive under noisy pressure.',
    blindSpot: 'Can slow healthy users if used too early.',
    energy: 8,
  },
  {
    id: 'access_policy',
    name: 'Access Policy',
    category: 'policy',
    training: 'Least Privilege',
    strength: 'Narrows service-to-service access to expected flows.',
    blindSpot: 'May break dependencies without a map.',
    energy: 7,
  },
  {
    id: 'isolate_node',
    name: 'Isolate Node',
    category: 'response',
    training: 'Containment',
    strength: 'Stops simulated spread or noisy internal behavior fast.',
    blindSpot: 'Can hurt uptime if the target is critical.',
    energy: 9,
  },
  {
    id: 'quarantine_queue',
    name: 'Quarantine Queue',
    category: 'response',
    training: 'Evidence-Based Response',
    strength: 'Holds suspicious objects without shutting down whole services.',
    blindSpot: 'Too broad means false positives.',
    energy: 8,
  },
  {
    id: 'patch_service',
    name: 'Patch Service',
    category: 'response',
    training: 'Safe Patching',
    strength: 'Closes the simulated weakness after evidence is clear.',
    blindSpot: 'Costs time and resources.',
    energy: 10,
  },
  {
    id: 'config_rollback',
    name: 'Config Rollback',
    category: 'recovery',
    training: 'Change Control',
    strength: 'Reverts risky drift quickly.',
    blindSpot: 'Weak if the problem is live traffic.',
    energy: 8,
  },
  {
    id: 'backup_restore',
    name: 'Backup Restore',
    category: 'recovery',
    training: 'Recovery Strategy',
    strength: 'Restores a trusted service or data state.',
    blindSpot: 'Wasteful if the root cause is still active.',
    energy: 12,
  },
  {
    id: 'service_restart',
    name: 'Service Restart',
    category: 'recovery',
    training: 'Service SLO',
    strength: 'Clears transient overload quickly.',
    blindSpot: 'Does not diagnose why it happened.',
    energy: 6,
  },
  {
    id: 'honeypot_node',
    name: 'Honeypot Node',
    category: 'special',
    training: 'Deception Signals',
    strength: 'Mirrors suspicious sessions into a safe evidence path.',
    blindSpot: 'Needs monitoring to be valuable.',
    energy: 8,
  },
  {
    id: 'canary_file',
    name: 'Canary File',
    category: 'special',
    training: 'Tripwire Design',
    strength: 'Reveals unexpected storage access.',
    blindSpot: 'Only covers data-layer behavior.',
    energy: 6,
  },
  {
    id: 'circuit_breaker',
    name: 'Circuit Breaker',
    category: 'special',
    training: 'Failure Containment',
    strength: 'Protects critical dependencies from cascading failure.',
    blindSpot: 'Can hide the deeper cause if left on forever.',
    energy: 9,
  },
];

const DEFAULT_LOADOUT: Record<ToolCategory, string> = {
  map: 'dependency_graph',
  sensor: 'traffic_monitor',
  policy: 'firewall_editor',
  response: 'isolate_node',
  recovery: 'config_rollback',
  special: 'honeypot_node',
};

const SERVICE_NODES: ServiceNode[] = [
  { id: 'client', name: 'Client', role: 'Normal user traffic', icon: 'client', x: 8, y: 50, status: 'healthy', impact: 76 },
  { id: 'dns', name: 'DNS', role: 'Name resolution', icon: 'dns', x: 22, y: 22, status: 'healthy', impact: 74 },
  { id: 'edge', name: 'Edge Firewall', role: 'Ingress policy', icon: 'edge', x: 36, y: 50, status: 'watching', impact: 90, dependsOn: ['dns'] },
  { id: 'web', name: 'Web', role: 'Storefront', icon: 'web', x: 52, y: 50, status: 'degraded', impact: 92, dependsOn: ['edge'] },
  { id: 'api', name: 'API', role: 'Checkout logic', icon: 'api', x: 68, y: 50, status: 'healthy', impact: 95, dependsOn: ['web'] },
  { id: 'db', name: 'Database', role: 'Orders and identity', icon: 'db', x: 86, y: 28, status: 'healthy', impact: 98, dependsOn: ['api'] },
  { id: 'storage', name: 'Storage', role: 'Receipts and media', icon: 'storage', x: 86, y: 72, status: 'watching', impact: 83, dependsOn: ['api'] },
];

const EVENTS: DuelEvent[] = [
  {
    id: 'traffic-surge',
    round: 1,
    title: 'Traffic surge at the edge',
    source: 'Edge Firewall',
    summary: 'The storefront is busy, but a slice of traffic has suspicious retry timing.',
    pressure: 72,
    primaryNodeId: 'edge',
    evidence: [
      'Healthy sessions still complete checkout.',
      'Unknown sources retry faster than normal clients.',
      'Database remains stable while Web CPU rises.',
    ],
    tags: ['traffic', 'firewall', 'false-positive-risk'],
    moves: [
      {
        id: 'r1-classify',
        toolId: 'traffic_monitor',
        label: 'Classify burst before blocking',
        targetNodeId: 'edge',
        result: 'You separate normal shoppers from noisy retry patterns.',
        lesson: 'Observation first reduced false positives.',
        uptime: 5,
        threat: 8,
        diagnosis: 10,
        falsePositive: 0,
        resource: -5,
        nodeStatus: 'classified',
      },
      {
        id: 'r1-firewall',
        toolId: 'firewall_editor',
        label: 'Limit unknown routes only',
        targetNodeId: 'edge',
        result: 'The rule trims noisy sessions without closing checkout.',
        lesson: 'Narrow policy beats broad blocking.',
        uptime: 8,
        threat: 9,
        diagnosis: 6,
        falsePositive: 3,
        resource: -7,
        nodeStatus: 'guarded',
      },
      {
        id: 'r1-rate',
        toolId: 'rate_limiter',
        label: 'Apply adaptive rate limit',
        targetNodeId: 'web',
        result: 'Web recovers while normal users keep a slower path.',
        lesson: 'Rate limits protect uptime, but still cost user friction.',
        uptime: 10,
        threat: 6,
        diagnosis: 4,
        falsePositive: 4,
        resource: -8,
        nodeStatus: 'stable',
      },
      {
        id: 'r1-honeypot',
        toolId: 'honeypot_node',
        label: 'Mirror suspicious sessions',
        targetNodeId: 'edge',
        result: 'Suspicious sessions move into a decoy path for evidence.',
        lesson: 'Deception creates safer signal than guessing.',
        uptime: 3,
        threat: 10,
        diagnosis: 8,
        falsePositive: 0,
        resource: -8,
        nodeStatus: 'watching',
      },
    ],
  },
  {
    id: 'dns-drift',
    round: 2,
    title: 'DNS answers drift',
    source: 'DNS',
    summary: 'Some clients resolve the API through an unexpected path after a scheduled change.',
    pressure: 66,
    primaryNodeId: 'dns',
    evidence: [
      'The drift started after a config rollout.',
      'Internal services still resolve correctly.',
      'Only one external region shows the mismatch.',
    ],
    tags: ['dns', 'config', 'routing'],
    moves: [
      {
        id: 'r2-dns',
        toolId: 'dns_monitor',
        label: 'Compare resolver answers',
        targetNodeId: 'dns',
        result: 'You prove the drift is regional, not service-wide.',
        lesson: 'Resolver evidence avoids needless isolation.',
        uptime: 1,
        threat: 8,
        diagnosis: 12,
        falsePositive: 0,
        resource: -5,
        nodeStatus: 'explained',
      },
      {
        id: 'r2-rollback',
        toolId: 'config_rollback',
        label: 'Rollback DNS config',
        targetNodeId: 'dns',
        result: 'The known-good route returns and API errors drop.',
        lesson: 'Rollback fits config drift better than restart.',
        uptime: 11,
        threat: 8,
        diagnosis: 4,
        falsePositive: 2,
        resource: -8,
        nodeStatus: 'healthy',
      },
      {
        id: 'r2-access',
        toolId: 'access_policy',
        label: 'Pin API ingress policy',
        targetNodeId: 'api',
        result: 'API accepts only expected service paths while drift clears.',
        lesson: 'Least privilege limits blast radius.',
        uptime: 5,
        threat: 7,
        diagnosis: 5,
        falsePositive: 4,
        resource: -7,
        nodeStatus: 'guarded',
      },
      {
        id: 'r2-map',
        toolId: 'dependency_graph',
        label: 'Check DNS blast radius',
        targetNodeId: 'dns',
        result: 'You confirm the drift does not require taking API offline.',
        lesson: 'Dependency reasoning prevents self-inflicted outage.',
        uptime: 6,
        threat: 4,
        diagnosis: 11,
        falsePositive: 0,
        resource: -6,
        nodeStatus: 'explained',
      },
    ],
  },
  {
    id: 'auth-noise',
    round: 3,
    title: 'Checkout auth noise',
    source: 'API',
    summary: 'Checkout auth events spike while most sessions remain valid.',
    pressure: 70,
    primaryNodeId: 'api',
    evidence: [
      'Failures cluster around stale tokens.',
      'Successful users share normal device fingerprints.',
      'No Database write anomaly appears yet.',
    ],
    tags: ['auth', 'api', 'timeline'],
    moves: [
      {
        id: 'r3-timeline',
        toolId: 'log_timeline',
        label: 'Rebuild auth timeline',
        targetNodeId: 'api',
        result: 'You tie the noise to token refresh failures.',
        lesson: 'Timeline work prevents overreaction.',
        uptime: 4,
        threat: 7,
        diagnosis: 13,
        falsePositive: 0,
        resource: -6,
        nodeStatus: 'explained',
      },
      {
        id: 'r3-access',
        toolId: 'access_policy',
        label: 'Tighten token refresh path',
        targetNodeId: 'api',
        result: 'Only expected refresh flows reach checkout.',
        lesson: 'Policy can be surgical when evidence is specific.',
        uptime: 8,
        threat: 9,
        diagnosis: 6,
        falsePositive: 3,
        resource: -7,
        nodeStatus: 'guarded',
      },
      {
        id: 'r3-firewall',
        toolId: 'firewall_editor',
        label: 'Allow checkout, block noisy retries',
        targetNodeId: 'edge',
        result: 'Retry storms fall while checkout remains reachable.',
        lesson: 'Good firewall work preserves the happy path.',
        uptime: 7,
        threat: 8,
        diagnosis: 4,
        falsePositive: 4,
        resource: -7,
        nodeStatus: 'guarded',
      },
      {
        id: 'r3-isolate',
        toolId: 'isolate_node',
        label: 'Isolate API immediately',
        targetNodeId: 'api',
        result: 'The noise stops, but checkout drops hard.',
        lesson: 'Containment without dependency context hurts uptime.',
        uptime: -12,
        threat: 9,
        diagnosis: 2,
        falsePositive: 14,
        resource: -9,
        nodeStatus: 'isolated',
      },
    ],
  },
  {
    id: 'storage-warning',
    round: 4,
    title: 'Storage integrity warning',
    source: 'Storage',
    summary: 'A small set of receipt objects changed outside normal timing.',
    pressure: 76,
    primaryNodeId: 'storage',
    evidence: [
      'Only receipt copies changed, not order rows.',
      'The Web node is stable.',
      'A canary object was read before the warning.',
    ],
    tags: ['storage', 'integrity', 'evidence'],
    moves: [
      {
        id: 'r4-canary',
        toolId: 'canary_file',
        label: 'Check canary access trail',
        targetNodeId: 'storage',
        result: 'The canary trail points to the same narrow object group.',
        lesson: 'Tripwires are strongest when tied to timeline evidence.',
        uptime: 3,
        threat: 12,
        diagnosis: 12,
        falsePositive: 0,
        resource: -6,
        nodeStatus: 'explained',
      },
      {
        id: 'r4-quarantine',
        toolId: 'quarantine_queue',
        label: 'Quarantine changed receipts only',
        targetNodeId: 'storage',
        result: 'Receipts are held for review while checkout remains online.',
        lesson: 'Targeted quarantine protects uptime.',
        uptime: 6,
        threat: 10,
        diagnosis: 5,
        falsePositive: 6,
        resource: -8,
        nodeStatus: 'contained',
      },
      {
        id: 'r4-restore',
        toolId: 'backup_restore',
        label: 'Restore clean receipt copy',
        targetNodeId: 'storage',
        result: 'Known-good receipts return, but the operation costs time.',
        lesson: 'Recovery works best after containment.',
        uptime: 9,
        threat: 5,
        diagnosis: 4,
        falsePositive: 0,
        resource: -12,
        nodeStatus: 'restored',
      },
      {
        id: 'r4-map',
        toolId: 'network_map',
        label: 'Check storage path exposure',
        targetNodeId: 'storage',
        result: 'You confirm storage is not directly exposed to clients.',
        lesson: 'Topology helps scope the incident.',
        uptime: 4,
        threat: 5,
        diagnosis: 9,
        falsePositive: 0,
        resource: -4,
        nodeStatus: 'classified',
      },
    ],
  },
  {
    id: 'db-pressure',
    round: 5,
    title: 'Database pool pressure',
    source: 'Database',
    summary: 'Connection pools rise after the earlier API auth noise.',
    pressure: 82,
    primaryNodeId: 'db',
    evidence: [
      'Database writes are valid but too frequent.',
      'API workers retry when checkout waits longer than usual.',
      'Storage is contained and no longer adding pressure.',
    ],
    tags: ['dependency', 'database', 'slo'],
    moves: [
      {
        id: 'r5-dependency',
        toolId: 'dependency_graph',
        label: 'Model API to Database blast radius',
        targetNodeId: 'db',
        result: 'You see that isolating Database would break checkout.',
        lesson: 'Dependency reasoning prevents self-inflicted outages.',
        uptime: 6,
        threat: 5,
        diagnosis: 13,
        falsePositive: 0,
        resource: -6,
        nodeStatus: 'explained',
      },
      {
        id: 'r5-circuit',
        toolId: 'circuit_breaker',
        label: 'Protect Database with breaker',
        targetNodeId: 'db',
        result: 'Checkout queues gracefully instead of exhausting Database.',
        lesson: 'Circuit breakers preserve critical dependencies.',
        uptime: 12,
        threat: 8,
        diagnosis: 5,
        falsePositive: 2,
        resource: -9,
        nodeStatus: 'guarded',
      },
      {
        id: 'r5-rate',
        toolId: 'rate_limiter',
        label: 'Shape API retry traffic',
        targetNodeId: 'api',
        result: 'Retry traffic slows and Database pressure drops.',
        lesson: 'Traffic shaping can be safer than isolation.',
        uptime: 9,
        threat: 7,
        diagnosis: 4,
        falsePositive: 3,
        resource: -8,
        nodeStatus: 'stable',
      },
      {
        id: 'r5-restart',
        toolId: 'service_restart',
        label: 'Restart Database service',
        targetNodeId: 'db',
        result: 'The pool clears briefly, but checkout stalls.',
        lesson: 'Restarting critical services without root cause is costly.',
        uptime: -8,
        threat: 2,
        diagnosis: 1,
        falsePositive: 8,
        resource: -6,
        nodeStatus: 'degraded',
      },
    ],
  },
  {
    id: 'stabilize',
    round: 6,
    title: 'Final stabilization window',
    source: 'Control Plane',
    summary: 'The arena asks for one final action before scoring.',
    pressure: 64,
    primaryNodeId: 'api',
    evidence: [
      'Edge rules are stable.',
      'DNS drift is understood.',
      'Storage scope is contained.',
      'API and Database need a clean steady state.',
    ],
    tags: ['stabilization', 'root-cause', 'debrief'],
    moves: [
      {
        id: 'r6-patch',
        toolId: 'patch_service',
        label: 'Patch token refresh service',
        targetNodeId: 'api',
        result: 'The refresh path stabilizes for the rest of the duel.',
        lesson: 'Patch after evidence, not before it.',
        uptime: 10,
        threat: 12,
        diagnosis: 8,
        falsePositive: 0,
        resource: -10,
        nodeStatus: 'healthy',
      },
      {
        id: 'r6-rollback',
        toolId: 'config_rollback',
        label: 'Rollback risky control-plane flag',
        targetNodeId: 'api',
        result: 'The API returns to a known stable configuration.',
        lesson: 'Change control is a strong finishing move.',
        uptime: 8,
        threat: 6,
        diagnosis: 7,
        falsePositive: 0,
        resource: -8,
        nodeStatus: 'stable',
      },
      {
        id: 'r6-restart',
        toolId: 'service_restart',
        label: 'Restart Web workers after policy fix',
        targetNodeId: 'web',
        result: 'Workers clear stale queues after the safer rules are in place.',
        lesson: 'Restart is best after the cause is controlled.',
        uptime: 7,
        threat: 4,
        diagnosis: 5,
        falsePositive: 0,
        resource: -6,
        nodeStatus: 'stable',
      },
      {
        id: 'r6-honeypot',
        toolId: 'honeypot_node',
        label: 'Keep decoy monitoring active',
        targetNodeId: 'edge',
        result: 'The decoy keeps collecting signal while production is stable.',
        lesson: 'Monitoring should continue after containment.',
        uptime: 5,
        threat: 8,
        diagnosis: 6,
        falsePositive: 0,
        resource: -8,
        nodeStatus: 'watching',
      },
    ],
  },
];

const nodeEdges: [string, string][] = [
  ['client', 'dns'],
  ['client', 'edge'],
  ['dns', 'edge'],
  ['edge', 'web'],
  ['web', 'api'],
  ['api', 'db'],
  ['api', 'storage'],
];

const clampMetric = (value: number) => Math.max(0, Math.min(100, value));

function scoreFromMetrics(metrics: Metrics) {
  return Math.round(
    metrics.uptime * 0.3 +
      metrics.threat * 0.25 +
      metrics.diagnosis * 0.2 +
      (100 - metrics.falsePositive) * 0.15 +
      metrics.resource * 0.1,
  );
}

function toolById(id: string) {
  return TOOLS.find((tool) => tool.id === id) ?? TOOLS[0];
}

function nodeById(id: string) {
  return SERVICE_NODES.find((node) => node.id === id) ?? SERVICE_NODES[0];
}

function categoryIcon(category: ToolCategory) {
  switch (category) {
    case 'map':
      return <Network size={16} strokeWidth={3} />;
    case 'sensor':
      return <Radar size={16} strokeWidth={3} />;
    case 'policy':
      return <ShieldQuestion size={16} strokeWidth={3} />;
    case 'response':
      return <Flame size={16} strokeWidth={3} />;
    case 'recovery':
      return <RotateCcw size={16} strokeWidth={3} />;
    case 'special':
      return <Sparkles size={16} strokeWidth={3} />;
    default:
      return <Sparkles size={16} strokeWidth={3} />;
  }
}

function nodeIcon(icon: ServiceNode['icon']) {
  switch (icon) {
    case 'client':
      return <Wifi size={16} strokeWidth={3} />;
    case 'dns':
      return <Route size={16} strokeWidth={3} />;
    case 'edge':
      return <Shield size={16} strokeWidth={3} />;
    case 'web':
      return <Globe2 size={16} strokeWidth={3} />;
    case 'api':
      return <CircuitBoard size={16} strokeWidth={3} />;
    case 'db':
      return <Database size={16} strokeWidth={3} />;
    case 'storage':
      return <HardDrive size={16} strokeWidth={3} />;
    default:
      return <Server size={16} strokeWidth={3} />;
  }
}

function statusColor(status: NodeStatus) {
  switch (status) {
    case 'healthy':
    case 'stable':
    case 'restored':
      return '#4ADE80';
    case 'watching':
    case 'degraded':
    case 'classified':
      return '#FACC15';
    case 'guarded':
    case 'contained':
    case 'explained':
      return '#A78BFA';
    case 'isolated':
      return '#F87171';
    default:
      return '#D8B4FE';
  }
}

export default function CyberDuelArena({ onScoreChange }: Props) {
  const [phase, setPhase] = useState<Phase>('loadout');
  const [loadout, setLoadout] = useState<Record<ToolCategory, string>>({ ...DEFAULT_LOADOUT });
  const [roundIndex, setRoundIndex] = useState(0);
  const [metrics, setMetrics] = useState<Metrics>({
    uptime: 82,
    threat: 18,
    diagnosis: 20,
    falsePositive: 0,
    resource: 100,
  });
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({});
  const [history, setHistory] = useState<AppliedMove[]>([]);

  const selectedToolIds = useMemo(() => Object.values(loadout), [loadout]);
  const currentEvent = EVENTS[roundIndex];
  const liveScore = scoreFromMetrics(metrics);
  const opponentScore = 78;
  const won = liveScore >= opponentScore;

  useEffect(() => {
    onScoreChange(Math.min(100, liveScore));
  }, [liveScore, onScoreChange]);

  const availableMoves = useMemo(() => {
    const matching = currentEvent.moves.filter((move) => selectedToolIds.includes(move.toolId));
    return [
      ...matching,
      {
        id: `fallback-${currentEvent.id}`,
        toolId: 'manual_review',
        label: 'Manual review and hold changes',
        targetNodeId: currentEvent.primaryNodeId,
        result: 'You avoid a reckless change, but pressure stays on the service.',
        lesson: 'Missing tools slow the response and leave less evidence.',
        uptime: -3,
        threat: 2,
        diagnosis: 3,
        falsePositive: 0,
        resource: -4,
        nodeStatus: 'watching' as NodeStatus,
      },
    ];
  }, [currentEvent, selectedToolIds]);

  const chooseTool = (tool: DuelTool) => {
    setLoadout((prev) => ({ ...prev, [tool.category]: tool.id }));
  };

  const applyMove = (move: DuelMove) => {
    setMetrics((prev) => ({
      uptime: clampMetric(prev.uptime + move.uptime),
      threat: clampMetric(prev.threat + move.threat),
      diagnosis: clampMetric(prev.diagnosis + move.diagnosis),
      falsePositive: clampMetric(prev.falsePositive + move.falsePositive),
      resource: clampMetric(prev.resource + move.resource),
    }));
    if (move.nodeStatus) {
      setNodeStatuses((prev) => ({ ...prev, [move.targetNodeId]: move.nodeStatus! }));
    }
    setHistory((prev) => [...prev, { event: currentEvent, move }]);
    if (roundIndex === EVENTS.length - 1) {
      setPhase('debrief');
    } else {
      setRoundIndex((prev) => prev + 1);
    }
  };

  const resetDuel = () => {
    setPhase('loadout');
    setLoadout({ ...DEFAULT_LOADOUT });
    setRoundIndex(0);
    setMetrics({
      uptime: 82,
      threat: 18,
      diagnosis: 20,
      falsePositive: 0,
      resource: 100,
    });
    setNodeStatuses({});
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-pale via-white to-pink-pale p-3 sm:p-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <header className="rounded-3xl border-[4px] border-black bg-white p-4 shadow-[6px_6px_0_#111827]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-green-300 px-3 py-1 font-nunito text-[11px] font-black text-purple-dark">
                <ShieldCheck size={14} strokeWidth={3} />
                Safe Blue vs Blue Simulation
              </div>
              <h1 className="font-fredoka text-2xl font-black text-purple-dark sm:text-3xl">
                Cyber Duel: Service Defense Arena
              </h1>
              <p className="mt-1 max-w-3xl font-nunito text-sm font-bold text-purple-light">
                Build a six-tool loadout, read the simulated network, defend uptime, and win by making evidence-based decisions.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
              <MetricBadge label="Your Score" value={liveScore} color="#4ADE80" />
              <MetricBadge label="Opponent" value={opponentScore} color="#F472B6" />
              <MetricBadge label="Round" value={phase === 'loadout' ? 0 : Math.min(roundIndex + 1, EVENTS.length)} color="#A78BFA" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {phase === 'loadout' && (
            <motion.div
              key="loadout"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="grid gap-4 lg:grid-cols-[1fr_360px]"
            >
              <section className="rounded-3xl border-[4px] border-black bg-white p-4 shadow-[6px_6px_0_#111827]">
                <div className="mb-4 flex items-center gap-2">
                  <Target className="text-pink-accent" size={22} strokeWidth={3} />
                  <h2 className="font-fredoka text-xl font-black text-purple-dark">Choose one tool per slot</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {(['map', 'sensor', 'policy', 'response', 'recovery', 'special'] as ToolCategory[]).map((category) => (
                    <ToolCategoryChooser
                      key={category}
                      category={category}
                      selectedId={loadout[category]}
                      onChoose={chooseTool}
                    />
                  ))}
                </div>
              </section>

              <aside className="rounded-3xl border-[4px] border-black bg-purple-dark p-4 text-white shadow-[6px_6px_0_#111827]">
                <h3 className="font-fredoka text-xl font-black">Mission Blend</h3>
                <p className="mt-2 font-nunito text-sm font-bold text-purple-lighter">
                  This duel combines training from firewall rules, DNS, traffic classification, recovery, evidence review, and service dependency missions.
                </p>
                <div className="mt-4 space-y-2">
                  {Object.entries(loadout).map(([category, toolId]) => {
                    const tool = toolById(toolId);
                    return (
                      <div key={category} className="rounded-2xl border-[3px] border-black bg-white/10 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-nunito text-xs font-black text-yellow-accent">
                            {CATEGORY_LABELS[category as ToolCategory]}
                          </span>
                          <span className="rounded-full bg-white px-2 py-1 font-nunito text-[10px] font-black text-purple-dark">
                            -{tool.energy} energy
                          </span>
                        </div>
                        <p className="mt-1 font-nunito text-sm font-black">{tool.name}</p>
                        <p className="font-nunito text-[11px] font-bold text-purple-lighter">{tool.training}</p>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPhase('duel')}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-pink-accent px-5 py-3 font-nunito font-black text-white transition-transform hover:scale-[1.02]"
                >
                  <Zap size={18} strokeWidth={3} />
                  Start Cyber Duel
                </button>
              </aside>
            </motion.div>
          )}

          {phase === 'duel' && (
            <motion.div
              key="duel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="grid gap-4 xl:grid-cols-[1fr_420px]"
            >
              <section className="space-y-4">
                <MetricsPanel metrics={metrics} />
                <NetworkBoard event={currentEvent} nodeStatuses={nodeStatuses} />
                <Timeline history={history} />
              </section>

              <aside className="space-y-4">
                <EventCard event={currentEvent} />
                <section className="rounded-3xl border-[4px] border-black bg-white p-4 shadow-[6px_6px_0_#111827]">
                  <h3 className="mb-3 flex items-center gap-2 font-fredoka text-xl font-black text-purple-dark">
                    <Shield size={22} strokeWidth={3} className="text-purple-primary" />
                    Available Moves
                  </h3>
                  <div className="space-y-3">
                    {availableMoves.map((move) => (
                      <MoveButton key={move.id} move={move} onApply={applyMove} />
                    ))}
                  </div>
                </section>
              </aside>
            </motion.div>
          )}

          {phase === 'debrief' && (
            <motion.div
              key="debrief"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="grid gap-4 lg:grid-cols-[380px_1fr]"
            >
              <section className="rounded-3xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#111827]">
                <div className="mb-4 flex items-center gap-3">
                  {won ? (
                    <Trophy size={36} strokeWidth={3} className="text-yellow-accent" fill="#FACC15" />
                  ) : (
                    <ShieldQuestion size={36} strokeWidth={3} className="text-pink-accent" />
                  )}
                  <div>
                    <h2 className="font-fredoka text-2xl font-black text-purple-dark">
                      {won ? 'Victory by judgment' : 'Close defensive loss'}
                    </h2>
                    <p className="font-nunito text-sm font-bold text-purple-light">
                      You scored {liveScore} vs {opponentScore}.
                    </p>
                  </div>
                </div>
                <MetricsPanel metrics={metrics} compact />
                <button
                  onClick={resetDuel}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-black bg-purple-primary px-5 py-3 font-nunito font-black text-white transition-transform hover:scale-[1.02]"
                >
                  <RotateCcw size={18} strokeWidth={3} />
                  Replay With New Loadout
                </button>
              </section>

              <section className="rounded-3xl border-[4px] border-black bg-white p-5 shadow-[6px_6px_0_#111827]">
                <h3 className="mb-3 flex items-center gap-2 font-fredoka text-xl font-black text-purple-dark">
                  <BookOpen size={22} strokeWidth={3} className="text-purple-primary" />
                  Debrief and Training Follow-up
                </h3>
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="space-y-3">
                    {history.map(({ event, move }) => (
                      <div key={move.id} className="rounded-2xl border-[3px] border-black bg-purple-pale p-3">
                        <p className="font-nunito text-[11px] font-black text-purple-light">
                          Round {event.round}: {event.title}
                        </p>
                        <p className="font-nunito text-sm font-black text-purple-dark">{move.label}</p>
                        <p className="mt-1 font-nunito text-xs font-bold text-purple-light">{move.lesson}</p>
                      </div>
                    ))}
                  </div>
                  <TrainingRecommendations metrics={metrics} history={history} />
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MetricBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border-[3px] border-black bg-white px-3 py-2">
      <p className="font-nunito text-[10px] font-black uppercase text-purple-light">{label}</p>
      <p className="font-fredoka text-xl font-black" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function ToolCategoryChooser({
  category,
  selectedId,
  onChoose,
}: {
  category: ToolCategory;
  selectedId: string;
  onChoose: (tool: DuelTool) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl border-[3px] border-black text-white"
          style={{ backgroundColor: CATEGORY_COLORS[category] }}
        >
          {categoryIcon(category)}
        </span>
        <h3 className="font-fredoka text-lg font-black text-purple-dark">{CATEGORY_LABELS[category]}</h3>
      </div>
      <div className="space-y-2">
        {TOOLS.filter((tool) => tool.category === category).map((tool) => {
          const selected = selectedId === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onChoose(tool)}
              className={`w-full rounded-2xl border-[3px] border-black p-3 text-left transition-transform hover:scale-[1.01] ${
                selected ? 'bg-yellow-accent' : 'bg-purple-pale'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-nunito text-sm font-black text-purple-dark">{tool.name}</p>
                  <p className="mt-1 font-nunito text-[11px] font-bold text-purple-light">{tool.strength}</p>
                </div>
                {selected ? <CheckCircle2 size={18} strokeWidth={3} className="text-green-success" /> : null}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="rounded-full bg-white px-2 py-1 font-nunito text-[10px] font-black text-purple-dark">
                  {tool.training}
                </span>
                <span className="rounded-full bg-purple-dark px-2 py-1 font-nunito text-[10px] font-black text-white">
                  -{tool.energy}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MetricsPanel({ metrics, compact = false }: { metrics: Metrics; compact?: boolean }) {
  const metricRows = [
    { label: 'Uptime', value: metrics.uptime, color: '#4ADE80' },
    { label: 'Threat Handling', value: metrics.threat, color: '#A78BFA' },
    { label: 'Diagnosis', value: metrics.diagnosis, color: '#60A5FA' },
    { label: 'Clean Traffic', value: 100 - metrics.falsePositive, color: '#F472B6' },
    { label: 'Energy', value: metrics.resource, color: '#FACC15' },
  ];

  return (
    <section className={`rounded-3xl border-[4px] border-black bg-white ${compact ? 'p-3' : 'p-4'} shadow-[6px_6px_0_#111827]`}>
      <div className="mb-3 flex items-center gap-2">
        <Gauge size={22} strokeWidth={3} className="text-purple-primary" />
        <h3 className="font-fredoka text-xl font-black text-purple-dark">Score Engine</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {metricRows.map((metric) => (
          <div key={metric.label} className="rounded-2xl border-[3px] border-black bg-purple-pale p-3">
            <div className="flex items-center justify-between">
              <span className="font-nunito text-[10px] font-black text-purple-light">{metric.label}</span>
              <span className="font-fredoka text-lg font-black" style={{ color: metric.color }}>
                {metric.value}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full border-[2px] border-black bg-white">
              <div className="h-full rounded-full" style={{ width: `${metric.value}%`, backgroundColor: metric.color }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NetworkBoard({
  event,
  nodeStatuses,
}: {
  event: DuelEvent;
  nodeStatuses: Record<string, NodeStatus>;
}) {
  return (
    <section className="rounded-3xl border-[4px] border-black bg-white p-4 shadow-[6px_6px_0_#111827]">
      <div className="mb-3 flex items-center gap-2">
        <GitBranch size={22} strokeWidth={3} className="text-purple-primary" />
        <h3 className="font-fredoka text-xl font-black text-purple-dark">Simulated Network</h3>
      </div>
      <div className="relative h-[360px] overflow-hidden rounded-3xl border-[3px] border-black bg-gradient-to-br from-purple-pale to-white">
        <svg className="absolute inset-0 h-full w-full">
          {nodeEdges.map(([from, to]) => {
            const a = nodeById(from);
            const b = nodeById(to);
            return (
              <line
                key={`${from}-${to}`}
                x1={`${a.x}%`}
                y1={`${a.y}%`}
                x2={`${b.x}%`}
                y2={`${b.y}%`}
                stroke="#111827"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.25"
              />
            );
          })}
        </svg>

        {SERVICE_NODES.map((node) => {
          const status = nodeStatuses[node.id] ?? node.status;
          const active = event.primaryNodeId === node.id;
          const color = statusColor(status);
          return (
            <motion.div
              key={node.id}
              layout
              className="absolute w-32 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-[3px] border-black bg-white p-2 shadow-[4px_4px_0_#111827]"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                boxShadow: active ? `0 0 0 5px ${color}55, 4px 4px 0 #111827` : '4px 4px 0 #111827',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border-[2px] border-black text-white" style={{ backgroundColor: color }}>
                  {nodeIcon(node.icon)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-nunito text-xs font-black text-purple-dark">{node.name}</p>
                  <p className="truncate font-nunito text-[9px] font-bold text-purple-light">{node.role}</p>
                </div>
              </div>
              <div className="mt-2 rounded-full px-2 py-1 text-center font-nunito text-[10px] font-black text-purple-dark" style={{ backgroundColor: `${color}33` }}>
                {status}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function EventCard({ event }: { event: DuelEvent }) {
  return (
    <section className="rounded-3xl border-[4px] border-black bg-white p-4 shadow-[6px_6px_0_#111827]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-nunito text-[11px] font-black text-purple-light">
            Round {event.round} of {EVENTS.length} • {event.source}
          </p>
          <h3 className="font-fredoka text-xl font-black text-purple-dark">{event.title}</h3>
        </div>
        <span className="rounded-full border-[3px] border-black bg-yellow-accent px-3 py-1 font-nunito text-[11px] font-black text-purple-dark">
          Pressure {event.pressure}
        </span>
      </div>
      <p className="font-nunito text-sm font-bold text-purple-dark">{event.summary}</p>
      <div className="mt-3 space-y-2">
        {event.evidence.map((item) => (
          <div key={item} className="flex items-start gap-2 rounded-2xl bg-purple-pale p-2">
            <Eye size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-purple-primary" />
            <span className="font-nunito text-xs font-bold text-purple-dark">{item}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {event.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-purple-dark px-2 py-1 font-nunito text-[10px] font-black text-white">
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}

function MoveButton({ move, onApply }: { move: DuelMove; onApply: (move: DuelMove) => void }) {
  const tool = move.toolId === 'manual_review' ? null : toolById(move.toolId);
  const color = tool ? CATEGORY_COLORS[tool.category] : '#9CA3AF';

  return (
    <button
      onClick={() => onApply(move)}
      className="w-full rounded-2xl border-[3px] border-black bg-purple-pale p-3 text-left transition-transform hover:scale-[1.01]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[3px] border-black text-white" style={{ backgroundColor: color }}>
          {tool ? categoryIcon(tool.category) : <Clock size={16} strokeWidth={3} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-nunito text-[11px] font-black text-purple-light">{tool?.name ?? 'Fallback'}</p>
            <span className="font-nunito text-[10px] font-black text-purple-light">{nodeById(move.targetNodeId).name}</span>
          </div>
          <p className="font-nunito text-sm font-black text-purple-dark">{move.label}</p>
          <p className="mt-1 font-nunito text-xs font-bold text-purple-light">{move.result}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Delta label="Up" value={move.uptime} />
            <Delta label="Threat" value={move.threat} />
            <Delta label="Diag" value={move.diagnosis} />
            <Delta label="Clean" value={-move.falsePositive} invert />
            <Delta label="Energy" value={move.resource} />
          </div>
        </div>
      </div>
    </button>
  );
}

function Delta({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? value >= 0 : value > 0;
  const color = value === 0 ? '#9CA3AF' : good ? '#22C55E' : '#EF4444';
  return (
    <span className="rounded-full bg-white px-2 py-1 font-nunito text-[10px] font-black" style={{ color }}>
      {label} {value > 0 ? '+' : ''}
      {value}
    </span>
  );
}

function Timeline({ history }: { history: AppliedMove[] }) {
  return (
    <section className="rounded-3xl border-[4px] border-black bg-white p-4 shadow-[6px_6px_0_#111827]">
      <div className="mb-3 flex items-center gap-2">
        <Clock size={22} strokeWidth={3} className="text-purple-primary" />
        <h3 className="font-fredoka text-xl font-black text-purple-dark">Decision Timeline</h3>
      </div>
      {history.length === 0 ? (
        <p className="font-nunito text-sm font-bold text-purple-light">
          No moves yet. Read the evidence, then choose a tool action.
        </p>
      ) : (
        <div className="space-y-2">
          {history.slice(-4).map(({ event, move }) => (
            <div key={move.id} className="flex items-start gap-2 rounded-2xl bg-purple-pale p-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[2px] border-black bg-white font-fredoka text-sm font-black text-purple-dark">
                {event.round}
              </span>
              <div>
                <p className="font-nunito text-sm font-black text-purple-dark">{move.label}</p>
                <p className="font-nunito text-[11px] font-bold text-purple-light">{move.lesson}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TrainingRecommendations({ metrics, history }: { metrics: Metrics; history: AppliedMove[] }) {
  const recommendations = useMemo(() => {
    const items = new Set<string>();
    if (metrics.uptime < 76) items.add('Service SLO Training');
    if (metrics.threat < 70) items.add('Evidence-Based Response');
    if (metrics.diagnosis < 70) items.add('Incident Timeline');
    if (metrics.falsePositive > 18) items.add('False Positive Control');
    if (metrics.resource < 55) items.add('Resource Budgeting');
    history.forEach(({ move }) => {
      if (move.toolId !== 'manual_review') items.add(toolById(move.toolId).training);
    });
    if (items.size < 4) {
      items.add('Firewall Rule Order');
      items.add('Service Dependency');
      items.add('Recovery Strategy');
    }
    return [...items].slice(0, 6);
  }, [history, metrics]);

  return (
    <div className="rounded-3xl border-[3px] border-black bg-yellow-accent p-4">
      <h4 className="mb-3 flex items-center gap-2 font-fredoka text-lg font-black text-purple-dark">
        <Sparkles size={20} strokeWidth={3} />
        Recommended Missions
      </h4>
      <div className="space-y-2">
        {recommendations.map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-2xl bg-white p-2">
            {metrics.falsePositive > 18 ? (
              <AlertTriangle size={16} strokeWidth={3} className="text-red-alert" />
            ) : (
              <CheckCircle2 size={16} strokeWidth={3} className="text-green-success" />
            )}
            <span className="font-nunito text-sm font-black text-purple-dark">{item}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-white p-3">
        <p className="font-nunito text-xs font-bold text-purple-light">
          The duel stays defensive: there are no real exploits, payloads, or attack instructions. It is a state-machine exercise for service availability, firewall judgment, and incident response.
        </p>
      </div>
    </div>
  );
}
