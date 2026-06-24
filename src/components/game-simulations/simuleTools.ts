export type SimuleToolCategory = 'map' | 'sensor' | 'policy' | 'response' | 'recovery' | 'special';

export interface SimuleTool {
  id: string;
  name: string;
  category: SimuleToolCategory;
  training: string;
  strength: string;
  blindSpot: string;
  energy: number;
}

export const SIMULE_TOOL_CATEGORY_LABELS: Record<SimuleToolCategory, string> = {
  map: 'Map',
  sensor: 'Sensor',
  policy: 'Policy',
  response: 'Response',
  recovery: 'Recovery',
  special: 'Special',
};

export const SIMULE_TOOL_CATEGORY_COLORS: Record<SimuleToolCategory, string> = {
  map: '#A78BFA',
  sensor: '#60A5FA',
  policy: '#FACC15',
  response: '#F87171',
  recovery: '#4ADE80',
  special: '#F472B6',
};

export const SIMULE_TOOLS: SimuleTool[] = [
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

export const DEFAULT_DUEL_LOADOUT: Record<SimuleToolCategory, string> = {
  map: 'dependency_graph',
  sensor: 'traffic_monitor',
  policy: 'firewall_editor',
  response: 'isolate_node',
  recovery: 'config_rollback',
  special: 'honeypot_node',
};

export function getSimuleToolById(id: string): SimuleTool {
  return SIMULE_TOOLS.find((tool) => tool.id === id) ?? SIMULE_TOOLS[0];
}

export function getSimuleToolsByIds(ids: readonly string[]): SimuleTool[] {
  return ids.map(getSimuleToolById);
}
