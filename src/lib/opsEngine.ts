import { ALL_TOOLS, type AttackTool, type BattleTarget } from './battleEngine';

export type OpsEffect =
  | 'recon'
  | 'osint'
  | 'dns'
  | 'network'
  | 'traffic'
  | 'web'
  | 'sql'
  | 'xss'
  | 'credential'
  | 'session'
  | 'social'
  | 'crypto'
  | 'malware'
  | 'payload'
  | 'endpoint'
  | 'persistence'
  | 'exfil'
  | 'defense'
  | 'patch'
  | 'waf'
  | 'firewall'
  | 'edr'
  | 'log'
  | 'backup'
  | 'cert'
  | 'proxy'
  | 'stealth';

export type OpsFamily =
  | 'Web Breach'
  | 'Account Takeover'
  | 'Endpoint Compromise'
  | 'Malware Operation'
  | 'Network Intrusion'
  | 'Data Theft'
  | 'Service Disruption'
  | 'Defense Response';

export interface OpsStep {
  id: string;
  title: string;
  role: string;
  accepts: OpsEffect[];
  creates: OpsEffect[];
  result: string;
  defenderCounters: OpsEffect[];
}

export interface OpsObjective {
  id: string;
  family: OpsFamily;
  title: string;
  result: string;
  surface: string;
  difficulty: 1 | 2 | 3;
  reward: number;
  risk: number;
  description: string;
  steps: OpsStep[];
}

export interface OpsProgress {
  objectiveId: string;
  completedSteps: string[];
  blocked: number;
  score: number;
}

export interface OpsDefenseStep {
  id: string;
  title: string;
  role: string;
  uses: OpsEffect[];
  result: string;
}

export interface OpsDefenseObjective {
  id: string;
  title: string;
  layer: string;
  result: string;
  reward: number;
  description: string;
  steps: OpsDefenseStep[];
}

export interface OpsDefenseProgress {
  objectiveId: string;
  completedSteps: string[];
  score: number;
}

export interface OpsActionOutcome {
  status: 'complete' | 'blocked' | 'off_path' | 'already_done';
  objectiveId: string;
  stepId?: string;
  toolId: number;
  points: number;
  created: OpsEffect[];
  bridgeEffects?: OpsEffect[];
  message: string;
  counter?: string;
  counterEffect?: OpsEffect;
  counterDescription?: string;
  counterMiniGame?: string;
}

export interface OpsMatchSummary {
  completedObjectives: number;
  totalObjectives: number;
  completedSteps: number;
  totalSteps: number;
  partialObjectives: number;
  progressPercent: number;
  attackerScore: number;
  defenderScore: number;
  blockedActions: number;
  defenderCompletedObjectives: number;
  defenderTotalObjectives: number;
  defenderCompletedSteps: number;
  defenderTotalSteps: number;
  defenderProgressPercent: number;
  defenderCompletedTitles: string[];
  xpGained: number;
  toolsUsed: number[];
  winner: 'attacker' | 'defender';
  completedTitles: string[];
  partialTitles: string[];
}

export interface ToolOpsProfile {
  tool: AttackTool;
  effects: OpsEffect[];
  stability: number;
}

export interface OpsDefenseControl {
  id: string;
  name: string;
  layer: string;
  provider: string;
  protects: OpsEffect[];
  strength: number;
  description: string;
  miniGame: string;
}

export interface OpsDefenseOutcome {
  status: 'advanced' | 'held';
  objectiveId?: string;
  stepId?: string;
  points: number;
  message: string;
  controlName?: string;
  effects: OpsEffect[];
}

export const OPS_DEFENSE_CONTROLS: OpsDefenseControl[] = [
  {
    id: 'waf-rule-forge',
    name: 'WAF Rule Forge',
    layer: 'Web App',
    provider: 'Fortress WAF',
    protects: ['waf', 'patch', 'web', 'sql', 'xss'],
    strength: 8,
    description: 'Builds narrow web rules for SQL, XSS, upload, and content guard stages.',
    miniGame: 'Tune allow/deny patterns without blocking normal visitors.',
  },
  {
    id: 'patch-lab',
    name: 'Patch Lab',
    layer: 'Application',
    provider: 'Secure Build Pipeline',
    protects: ['patch', 'web', 'sql', 'xss', 'session'],
    strength: 7,
    description: 'Applies focused fixes to vulnerable forms, sessions, plugins, and config paths.',
    miniGame: 'Choose the smallest patch that closes the active exploit path.',
  },
  {
    id: 'edr-behavior-shield',
    name: 'EDR Behavior Shield',
    layer: 'Endpoint',
    provider: '3rd Party EDR',
    protects: ['edr', 'malware', 'payload', 'endpoint', 'persistence'],
    strength: 8,
    description: 'Watches behavior instead of only signatures, catching payload staging and persistence.',
    miniGame: 'Classify process, registry, and network behaviors before the payload stabilizes.',
  },
  {
    id: 'av-sandbox',
    name: 'AV Sandbox Detonation',
    layer: 'Endpoint',
    provider: 'Antivirus Suite',
    protects: ['edr', 'malware', 'payload'],
    strength: 6,
    description: 'Runs suspicious files in a safe sandbox before they touch the user workflow.',
    miniGame: 'Compare file behavior against safe baseline actions.',
  },
  {
    id: 'firewall-policy-board',
    name: 'Firewall Policy Board',
    layer: 'Network',
    provider: 'Fortress Firewall',
    protects: ['firewall', 'network', 'traffic', 'proxy'],
    strength: 7,
    description: 'Blocks unsafe routes, tunnels, and traffic pressure while keeping core services alive.',
    miniGame: 'Place rule cards in the right order before the attacker finds a route.',
  },
  {
    id: 'dns-integrity-guard',
    name: 'DNS Integrity Guard',
    layer: 'Name Resolution',
    provider: 'DNSSEC Watch',
    protects: ['dns', 'cert', 'web'],
    strength: 7,
    description: 'Detects local pharming, poisoned answers, and suspicious resolver drift.',
    miniGame: 'Compare expected records, resolver answers, and local host entries.',
  },
  {
    id: 'certificate-pin-watch',
    name: 'Certificate Pin Watch',
    layer: 'Trust',
    provider: 'Browser Trust Monitor',
    protects: ['cert', 'crypto', 'web', 'session'],
    strength: 6,
    description: 'Flags fake-site redirects and session interception with certificate mismatch checks.',
    miniGame: 'Match issuer, fingerprint, host, and expiry before accepting the site.',
  },
  {
    id: 'token-revoker',
    name: 'Token Revoker',
    layer: 'Identity',
    provider: 'IAM Console',
    protects: ['session', 'credential', 'log'],
    strength: 7,
    description: 'Revokes stolen cookies, API keys, and temporary sessions before they become pivots.',
    miniGame: 'Pick the exact token family to revoke without logging out safe users.',
  },
  {
    id: 'log-correlator',
    name: 'Log Correlator',
    layer: 'Monitoring',
    provider: 'SIEM Lite',
    protects: ['log', 'traffic', 'osint', 'recon'],
    strength: 6,
    description: 'Turns scattered DNS, login, endpoint, and web clues into one defense decision.',
    miniGame: 'Connect matching events across time without chasing decoys.',
  },
  {
    id: 'backup-restore-drill',
    name: 'Backup Restore Drill',
    layer: 'Recovery',
    provider: 'Backup Vault',
    protects: ['backup', 'exfil', 'defense'],
    strength: 5,
    description: 'Verifies backup integrity and cuts off dump paths or ransomware pressure.',
    miniGame: 'Restore the clean snapshot while preserving recent safe changes.',
  },
  {
    id: 'browser-popup-guard',
    name: 'Browser Popup Guard',
    layer: 'Browser',
    provider: '3rd Party Browser Shield',
    protects: ['web', 'payload', 'social', 'proxy'],
    strength: 5,
    description: 'Blocks unsafe popups, fake prompts, and redirect tricks before users interact.',
    miniGame: 'Allow legitimate prompts and block deceptive overlays.',
  },
  {
    id: 'deception-honeypot',
    name: 'Deception Honeypot',
    layer: 'Trap',
    provider: 'Fortress Decoys',
    protects: ['stealth', 'recon', 'network', 'malware'],
    strength: 6,
    description: 'Creates believable decoys that waste attacker steps and reveal their route.',
    miniGame: 'Pick a decoy that matches the attacker objective closely enough.',
  },
];

export const OPS_DEFENSE_OBJECTIVES: OpsDefenseObjective[] = [
  {
    id: 'evidence-triage',
    title: 'Evidence Triage',
    layer: 'Monitoring',
    result: 'Attack route classified',
    reward: 180,
    description: 'Read the attacker trail and turn scattered clues into one defense picture.',
    steps: [
      {
        id: 'collect-signals',
        title: 'Collect live signals',
        role: 'Observe',
        uses: ['log', 'traffic', 'recon', 'osint'],
        result: 'Signals collected',
      },
      {
        id: 'correlate-route',
        title: 'Correlate the route',
        role: 'Analyze',
        uses: ['log', 'traffic', 'network', 'dns'],
        result: 'Route correlated',
      },
      {
        id: 'classify-chain',
        title: 'Classify attack chain',
        role: 'Decision',
        uses: ['edr', 'log', 'defense'],
        result: 'Attack chain classified',
      },
    ],
  },
  {
    id: 'containment-stack',
    title: 'Containment Stack',
    layer: 'Controls',
    result: 'Active route contained',
    reward: 220,
    description: 'Use specific controls to stop the current route without shutting down the whole site.',
    steps: [
      {
        id: 'shape-web-policy',
        title: 'Shape web policy',
        role: 'WAF',
        uses: ['waf', 'patch', 'web', 'sql', 'xss'],
        result: 'Web policy tuned',
      },
      {
        id: 'cut-network-route',
        title: 'Cut unsafe route',
        role: 'Network',
        uses: ['firewall', 'network', 'traffic', 'proxy'],
        result: 'Unsafe route contained',
      },
      {
        id: 'watch-endpoint',
        title: 'Watch endpoint behavior',
        role: 'Endpoint',
        uses: ['edr', 'malware', 'payload', 'endpoint'],
        result: 'Endpoint behavior contained',
      },
    ],
  },
  {
    id: 'identity-trust-recovery',
    title: 'Identity Trust Recovery',
    layer: 'Trust',
    result: 'Tokens and trust restored',
    reward: 210,
    description: 'Undo session, certificate, redirect, and credential pressure before it becomes a pivot.',
    steps: [
      {
        id: 'verify-certificate',
        title: 'Verify certificate trust',
        role: 'Trust',
        uses: ['cert', 'crypto', 'web', 'dns'],
        result: 'Trust mismatch checked',
      },
      {
        id: 'revoke-sensitive-tokens',
        title: 'Revoke sensitive tokens',
        role: 'Identity',
        uses: ['session', 'credential', 'log'],
        result: 'Sensitive tokens revoked',
      },
      {
        id: 'restore-browser-policy',
        title: 'Restore browser policy',
        role: 'Browser',
        uses: ['web', 'payload', 'social', 'proxy'],
        result: 'Browser trust restored',
      },
    ],
  },
  {
    id: 'recovery-and-deception',
    title: 'Recovery And Deception',
    layer: 'Recovery',
    result: 'Clean state restored',
    reward: 190,
    description: 'Recover safe state and use decoys to slow future pivots.',
    steps: [
      {
        id: 'verify-backup',
        title: 'Verify clean backup',
        role: 'Recovery',
        uses: ['backup', 'exfil', 'defense'],
        result: 'Clean backup verified',
      },
      {
        id: 'plant-decoy',
        title: 'Plant believable decoy',
        role: 'Deception',
        uses: ['stealth', 'recon', 'network', 'malware'],
        result: 'Decoy route planted',
      },
      {
        id: 'prove-service-health',
        title: 'Prove service health',
        role: 'Recovery',
        uses: ['backup', 'log', 'traffic', 'defense'],
        result: 'Service health proved',
      },
    ],
  },
];

export const OPS_OBJECTIVES: OpsObjective[] = [
  {
    id: 'database-leak',
    family: 'Web Breach',
    title: 'Database Leak',
    result: 'Sanitized customer table proof',
    surface: 'Public web app + data layer',
    difficulty: 2,
    reward: 360,
    risk: 42,
    description: 'Find a safe route from public web evidence to a simulated database proof record.',
    steps: [
      {
        id: 'map-web-surface',
        title: 'Map the public surface',
        role: 'Discovery',
        accepts: ['recon', 'dns', 'network', 'osint'],
        creates: ['recon', 'web'],
        result: 'Web surface mapped',
        defenderCounters: ['firewall', 'log'],
      },
      {
        id: 'find-data-route',
        title: 'Find a data-layer route',
        role: 'Web Analysis',
        accepts: ['web', 'sql', 'log'],
        creates: ['sql'],
        result: 'Data route exposed',
        defenderCounters: ['waf', 'patch'],
      },
      {
        id: 'open-query-window',
        title: 'Open a controlled query window',
        role: 'Access',
        accepts: ['sql', 'credential', 'session'],
        creates: ['session'],
        result: 'Query window opened',
        defenderCounters: ['waf', 'patch', 'log'],
      },
      {
        id: 'pull-db-proof',
        title: 'Pull sanitized proof',
        role: 'Objective',
        accepts: ['exfil', 'crypto', 'sql'],
        creates: ['exfil'],
        result: 'Database proof captured',
        defenderCounters: ['backup', 'log'],
      },
    ],
  },
  {
    id: 'admin-panel-access',
    family: 'Account Takeover',
    title: 'Admin Panel Access',
    result: 'Temporary admin session',
    surface: 'Login portal + identity controls',
    difficulty: 2,
    reward: 330,
    risk: 38,
    description: 'Chain identity clues, credentials, and session handling into a simulated admin login.',
    steps: [
      {
        id: 'profile-admin',
        title: 'Profile likely admin identity',
        role: 'OSINT',
        accepts: ['osint', 'recon', 'dns'],
        creates: ['osint'],
        result: 'Admin identity clue found',
        defenderCounters: ['log'],
      },
      {
        id: 'test-credential-path',
        title: 'Test credential path',
        role: 'Credential Work',
        accepts: ['credential', 'social', 'crypto'],
        creates: ['credential'],
        result: 'Credential path validated',
        defenderCounters: ['edr', 'log'],
      },
      {
        id: 'stabilize-session',
        title: 'Stabilize the session',
        role: 'Session',
        accepts: ['session', 'cert', 'proxy'],
        creates: ['session'],
        result: 'Admin session stabilized',
        defenderCounters: ['patch', 'log'],
      },
    ],
  },
  {
    id: 'session-hijack-sim',
    family: 'Account Takeover',
    title: 'Session Hijack Sim',
    result: 'Revocable session token',
    surface: 'Browser session + transport checks',
    difficulty: 3,
    reward: 420,
    risk: 54,
    description: 'Use endpoint or traffic evidence to obtain a simulated, revocable session token.',
    steps: [
      {
        id: 'observe-session-path',
        title: 'Observe session traffic path',
        role: 'Traffic',
        accepts: ['traffic', 'proxy', 'cert', 'network'],
        creates: ['traffic'],
        result: 'Session path observed',
        defenderCounters: ['cert', 'log'],
      },
      {
        id: 'capture-session-artifact',
        title: 'Capture session artifact',
        role: 'Capture',
        accepts: ['endpoint', 'malware', 'session'],
        creates: ['session'],
        result: 'Session artifact captured',
        defenderCounters: ['edr', 'patch'],
      },
      {
        id: 'replay-lab-session',
        title: 'Replay in lab browser',
        role: 'Objective',
        accepts: ['session', 'proxy', 'stealth'],
        creates: ['exfil'],
        result: 'Revocable session token acquired',
        defenderCounters: ['log', 'patch'],
      },
    ],
  },
  {
    id: 'web-malware-implant',
    family: 'Web Breach',
    title: 'Web Malware Implant',
    result: 'Simulated web payload planted',
    surface: 'CMS, plugin, or upload flow',
    difficulty: 3,
    reward: 440,
    risk: 60,
    description: 'Move from web weakness to a safe simulated payload on the site surface.',
    steps: [
      {
        id: 'find-upload-or-cms',
        title: 'Find upload or CMS path',
        role: 'Discovery',
        accepts: ['recon', 'web', 'osint'],
        creates: ['web'],
        result: 'CMS path discovered',
        defenderCounters: ['waf', 'log'],
      },
      {
        id: 'bypass-content-guard',
        title: 'Bypass content guard',
        role: 'Bypass',
        accepts: ['xss', 'web', 'proxy', 'stealth'],
        creates: ['payload'],
        result: 'Payload path opened',
        defenderCounters: ['waf', 'patch'],
      },
      {
        id: 'plant-web-payload',
        title: 'Plant simulated web payload',
        role: 'Payload',
        accepts: ['payload', 'malware', 'persistence'],
        creates: ['malware', 'persistence'],
        result: 'Web payload staged',
        defenderCounters: ['edr', 'log'],
      },
    ],
  },
  {
    id: 'keylogger-telemetry',
    family: 'Endpoint Compromise',
    title: 'Keylogger Telemetry',
    result: 'Simulated keystroke telemetry',
    surface: 'Endpoint + user workflow',
    difficulty: 2,
    reward: 340,
    risk: 48,
    description: 'Deliver a safe lab payload, observe endpoint behavior, and collect simulated telemetry.',
    steps: [
      {
        id: 'deliver-lab-payload',
        title: 'Deliver lab payload',
        role: 'Delivery',
        accepts: ['social', 'payload', 'malware'],
        creates: ['payload'],
        result: 'Payload delivered',
        defenderCounters: ['edr', 'log'],
      },
      {
        id: 'establish-endpoint-view',
        title: 'Establish endpoint view',
        role: 'Endpoint',
        accepts: ['endpoint', 'malware', 'persistence'],
        creates: ['endpoint'],
        result: 'Endpoint view established',
        defenderCounters: ['edr', 'patch'],
      },
      {
        id: 'collect-key-telemetry',
        title: 'Collect simulated telemetry',
        role: 'Objective',
        accepts: ['credential', 'endpoint', 'exfil'],
        creates: ['credential', 'exfil'],
        result: 'Telemetry captured',
        defenderCounters: ['edr', 'log'],
      },
    ],
  },
  {
    id: 'cookie-capture',
    family: 'Endpoint Compromise',
    title: 'Cookie Capture',
    result: 'Browser cookie proof',
    surface: 'Browser profile + local trust',
    difficulty: 2,
    reward: 320,
    risk: 44,
    description: 'Use local endpoint access to bridge into web identity without treating malware as a dead end.',
    steps: [
      {
        id: 'gain-local-context',
        title: 'Gain local context',
        role: 'Endpoint',
        accepts: ['endpoint', 'malware', 'osint'],
        creates: ['endpoint'],
        result: 'Local context opened',
        defenderCounters: ['edr'],
      },
      {
        id: 'locate-browser-store',
        title: 'Locate browser store',
        role: 'Discovery',
        accepts: ['recon', 'log', 'credential'],
        creates: ['session'],
        result: 'Browser store located',
        defenderCounters: ['edr', 'patch'],
      },
      {
        id: 'extract-cookie-proof',
        title: 'Extract cookie proof',
        role: 'Objective',
        accepts: ['session', 'crypto', 'exfil'],
        creates: ['session', 'exfil'],
        result: 'Cookie proof captured',
        defenderCounters: ['log', 'patch'],
      },
    ],
  },
  {
    id: 'api-key-theft',
    family: 'Data Theft',
    title: 'API Key Theft',
    result: 'Revoked API key proof',
    surface: 'Source, config, and deployment traces',
    difficulty: 2,
    reward: 350,
    risk: 40,
    description: 'Find a configuration path and extract a simulated key that defenders can revoke.',
    steps: [
      {
        id: 'map-code-surface',
        title: 'Map code/config surface',
        role: 'Recon',
        accepts: ['osint', 'recon', 'dns'],
        creates: ['osint'],
        result: 'Code surface mapped',
        defenderCounters: ['log'],
      },
      {
        id: 'find-secret-pattern',
        title: 'Find secret pattern',
        role: 'Analysis',
        accepts: ['credential', 'crypto', 'log'],
        creates: ['credential'],
        result: 'Secret pattern found',
        defenderCounters: ['patch'],
      },
      {
        id: 'validate-revoked-key',
        title: 'Validate revoked key proof',
        role: 'Objective',
        accepts: ['session', 'exfil', 'proxy'],
        creates: ['exfil'],
        result: 'API key proof captured',
        defenderCounters: ['log', 'patch'],
      },
    ],
  },
  {
    id: 'internal-service-access',
    family: 'Network Intrusion',
    title: 'Internal Service Access',
    result: 'Internal dashboard route',
    surface: 'Network path + service controls',
    difficulty: 3,
    reward: 430,
    risk: 52,
    description: 'Bridge from outside visibility to a simulated internal service route.',
    steps: [
      {
        id: 'trace-network-path',
        title: 'Trace network path',
        role: 'Network',
        accepts: ['network', 'traffic', 'dns'],
        creates: ['network'],
        result: 'Route mapped',
        defenderCounters: ['firewall'],
      },
      {
        id: 'find-service-gap',
        title: 'Find service gap',
        role: 'Scanning',
        accepts: ['recon', 'network', 'proxy'],
        creates: ['recon'],
        result: 'Service gap found',
        defenderCounters: ['firewall', 'log'],
      },
      {
        id: 'open-tunnel-window',
        title: 'Open tunnel window',
        role: 'Access',
        accepts: ['proxy', 'stealth', 'session'],
        creates: ['session'],
        result: 'Internal route opened',
        defenderCounters: ['firewall', 'log'],
      },
    ],
  },
  {
    id: 'service-disruption',
    family: 'Service Disruption',
    title: 'Service Disruption',
    result: 'Temporary uptime drop',
    surface: 'DNS, load balancer, and traffic controls',
    difficulty: 2,
    reward: 300,
    risk: 46,
    description: 'Create a short simulated availability failure without needing a single magic DDoS button.',
    steps: [
      {
        id: 'find-traffic-choke',
        title: 'Find traffic choke point',
        role: 'Discovery',
        accepts: ['traffic', 'network', 'dns'],
        creates: ['traffic'],
        result: 'Choke point identified',
        defenderCounters: ['firewall', 'log'],
      },
      {
        id: 'stress-routing-layer',
        title: 'Stress routing layer',
        role: 'Pressure',
        accepts: ['network', 'proxy', 'payload'],
        creates: ['payload'],
        result: 'Routing pressure applied',
        defenderCounters: ['firewall', 'backup'],
      },
      {
        id: 'force-failover',
        title: 'Force failover event',
        role: 'Objective',
        accepts: ['traffic', 'network', 'stealth'],
        creates: ['exfil'],
        result: 'Failover event triggered',
        defenderCounters: ['backup', 'log'],
      },
    ],
  },
  {
    id: 'pharming-redirect',
    family: 'Malware Operation',
    title: 'Local Pharming Redirect',
    result: 'Fake-site redirect proof',
    surface: 'Endpoint DNS trust + certificate checks',
    difficulty: 3,
    reward: 410,
    risk: 55,
    description: 'Use endpoint malware to redirect a local web visit, then prove it with certificate inspection.',
    steps: [
      {
        id: 'place-local-network-hook',
        title: 'Place local network hook',
        role: 'Payload',
        accepts: ['malware', 'payload', 'endpoint'],
        creates: ['payload', 'endpoint'],
        result: 'Local hook placed',
        defenderCounters: ['edr', 'patch'],
      },
      {
        id: 'alter-name-resolution',
        title: 'Alter name-resolution path',
        role: 'Bridge',
        accepts: ['dns', 'network', 'proxy'],
        creates: ['dns', 'web'],
        result: 'Redirect path opened',
        defenderCounters: ['firewall', 'log'],
      },
      {
        id: 'validate-cert-mismatch',
        title: 'Validate certificate mismatch',
        role: 'Objective',
        accepts: ['cert', 'crypto', 'web'],
        creates: ['exfil'],
        result: 'Fake-site redirect proof captured',
        defenderCounters: ['cert', 'patch'],
      },
    ],
  },
  {
    id: 'backup-dump',
    family: 'Data Theft',
    title: 'Backup Dump',
    result: 'Backup index proof',
    surface: 'Backup storage + access policy',
    difficulty: 2,
    reward: 310,
    risk: 36,
    description: 'Find weak backup exposure and prove access with a safe index artifact.',
    steps: [
      {
        id: 'discover-backup-surface',
        title: 'Discover backup surface',
        role: 'Discovery',
        accepts: ['osint', 'dns', 'recon'],
        creates: ['recon'],
        result: 'Backup surface discovered',
        defenderCounters: ['log'],
      },
      {
        id: 'test-access-policy',
        title: 'Test access policy',
        role: 'Policy',
        accepts: ['credential', 'session', 'web'],
        creates: ['session'],
        result: 'Policy gap confirmed',
        defenderCounters: ['patch'],
      },
      {
        id: 'pull-index-proof',
        title: 'Pull backup index proof',
        role: 'Objective',
        accepts: ['backup', 'exfil', 'crypto'],
        creates: ['exfil'],
        result: 'Backup index captured',
        defenderCounters: ['backup', 'log'],
      },
    ],
  },
  {
    id: 'attack-blocked',
    family: 'Defense Response',
    title: 'Full Attack Block',
    result: 'Incoming chain neutralized',
    surface: 'Fortress defense stack',
    difficulty: 1,
    reward: 280,
    risk: 22,
    description: 'Play the defender side: identify the incoming chain and stop it with specific controls.',
    steps: [
      {
        id: 'read-incoming-evidence',
        title: 'Read incoming evidence',
        role: 'Triage',
        accepts: ['log', 'edr', 'traffic'],
        creates: ['log'],
        result: 'Attack evidence classified',
        defenderCounters: ['stealth'],
      },
      {
        id: 'apply-specific-control',
        title: 'Apply specific control',
        role: 'Control',
        accepts: ['patch', 'waf', 'firewall', 'edr'],
        creates: ['defense'],
        result: 'Attack path interrupted',
        defenderCounters: ['payload'],
      },
      {
        id: 'verify-recovery',
        title: 'Verify recovery',
        role: 'Recovery',
        accepts: ['backup', 'cert', 'log'],
        creates: ['backup'],
        result: 'Attack fully blocked',
        defenderCounters: ['malware'],
      },
    ],
  },
];

const EFFECT_LABELS: Record<OpsEffect, string> = {
  recon: 'Recon',
  osint: 'OSINT',
  dns: 'DNS',
  network: 'Network',
  traffic: 'Traffic',
  web: 'Web',
  sql: 'SQL',
  xss: 'XSS',
  credential: 'Credential',
  session: 'Session',
  social: 'Social',
  crypto: 'Crypto',
  malware: 'Malware',
  payload: 'Payload',
  endpoint: 'Endpoint',
  persistence: 'Persistence',
  exfil: 'Exfil',
  defense: 'Defense',
  patch: 'Patch',
  waf: 'WAF',
  firewall: 'Firewall',
  edr: 'EDR',
  log: 'Log',
  backup: 'Backup',
  cert: 'Cert',
  proxy: 'Proxy',
  stealth: 'Stealth',
};

export function getEffectLabel(effect: OpsEffect): string {
  return EFFECT_LABELS[effect];
}

const BRIDGE_OPERATOR_EFFECTS: OpsEffect[] = [
  'recon',
  'osint',
  'log',
  'traffic',
  'proxy',
  'session',
  'credential',
  'web',
  'network',
  'defense',
  'patch',
  'cert',
  'crypto',
];

export function createInitialOpsProgress(): Record<string, OpsProgress> {
  return Object.fromEntries(
    OPS_OBJECTIVES.map((objective) => [
      objective.id,
      { objectiveId: objective.id, completedSteps: [], blocked: 0, score: 0 },
    ]),
  );
}

export function createInitialOpsDefenseProgress(): Record<string, OpsDefenseProgress> {
  return Object.fromEntries(
    OPS_DEFENSE_OBJECTIVES.map((objective) => [
      objective.id,
      { objectiveId: objective.id, completedSteps: [], score: 0 },
    ]),
  );
}

function addEffects(effects: Set<OpsEffect>, values: OpsEffect[]) {
  values.forEach((value) => effects.add(value));
}

export function getToolOpsProfile(tool: AttackTool): ToolOpsProfile {
  const name = tool.name.toLowerCase();
  const effects = new Set<OpsEffect>();

  if (['recon', 'network', 'web', 'advanced'].includes(tool.category)) {
    effects.add('recon');
  }
  if (tool.category === 'crypto') effects.add('crypto');
  if (tool.category === 'malware') effects.add('malware');
  if (tool.category === 'social') effects.add('social');
  if (tool.category === 'defense') effects.add('defense');

  if (name.includes('dns')) addEffects(effects, ['dns', 'osint', 'network']);
  if (name.includes('whois')) addEffects(effects, ['osint', 'recon']);
  if (name.includes('nmap') || name.includes('port scan') || name.includes('scanner')) addEffects(effects, ['recon', 'network']);
  if (name.includes('packet') || name.includes('tracer')) addEffects(effects, ['traffic', 'network']);
  if (name.includes('proxy') || name.includes('vpn')) addEffects(effects, ['proxy', 'stealth', 'network']);
  if (name.includes('sql')) addEffects(effects, ['sql', 'web']);
  if (name.includes('xss')) addEffects(effects, ['xss', 'web', 'payload']);
  if (name.includes('hash') || name.includes('password') || name.includes('access')) addEffects(effects, ['credential', 'crypto']);
  if (name.includes('phishing')) addEffects(effects, ['osint', 'payload']);
  if (name.includes('trojan') || name.includes('keylogger') || name.includes('malware')) addEffects(effects, ['malware', 'payload', 'endpoint']);
  if (name.includes('cert') || name.includes('ssl')) addEffects(effects, ['cert', 'crypto']);
  if (name.includes('firewall')) addEffects(effects, ['firewall', 'defense']);
  if (name.includes('ids') || name.includes('log')) addEffects(effects, ['log', 'edr', 'traffic']);
  if (name.includes('backup')) addEffects(effects, ['backup', 'defense']);
  if (name.includes('encryption') || name.includes('crypto') || name.includes('xor')) addEffects(effects, ['crypto']);
  if (name.includes('load balancer')) addEffects(effects, ['traffic', 'network']);
  if (name.includes('subnet')) addEffects(effects, ['network', 'recon']);
  if (name.includes('stego')) addEffects(effects, ['exfil', 'stealth']);
  if (name.includes('duel')) addEffects(effects, ['defense', 'log', 'traffic']);

  if (effects.size === 0) effects.add('recon');

  return {
    tool,
    effects: [...effects],
    stability: Math.min(8, Math.max(2, tool.tier + tool.stealthLevel)),
  };
}

export function getNextOpsStep(objective: OpsObjective, progress: OpsProgress): OpsStep | null {
  return objective.steps.find((step) => !progress.completedSteps.includes(step.id)) ?? null;
}

export function getNextOpsDefenseStep(
  objective: OpsDefenseObjective,
  progress: OpsDefenseProgress,
): OpsDefenseStep | null {
  return objective.steps.find((step) => !progress.completedSteps.includes(step.id)) ?? null;
}

export function getCreatedEffects(objective: OpsObjective, progress: OpsProgress): OpsEffect[] {
  const created = new Set<OpsEffect>();
  objective.steps.forEach((step) => {
    if (progress.completedSteps.includes(step.id)) addEffects(created, step.creates);
  });
  return [...created];
}

export function getAllCreatedEffects(progressMap: Record<string, OpsProgress>): OpsEffect[] {
  const created = new Set<OpsEffect>();
  OPS_OBJECTIVES.forEach((objective) => {
    getCreatedEffects(objective, progressMap[objective.id]).forEach((effect) => created.add(effect));
  });
  return [...created];
}

function getMatchingEffects(effects: OpsEffect[], accepts: OpsEffect[]) {
  return effects.filter((effect) => accepts.includes(effect));
}

function canUseBridgeOperator(profile: ToolOpsProfile, step: OpsStep) {
  return profile.effects.some(
    (effect) => step.creates.includes(effect) || BRIDGE_OPERATOR_EFFECTS.includes(effect),
  );
}

export function getRecommendedTools(step: OpsStep | null, availableEffects: OpsEffect[] = []): AttackTool[] {
  if (!step) return [];
  const bridgeAvailable = getMatchingEffects(availableEffects, step.accepts).length > 0;
  return ALL_TOOLS
    .map((tool) => {
      const profile = getToolOpsProfile(tool);
      const direct = getMatchingEffects(profile.effects, step.accepts).length > 0;
      const bridge = bridgeAvailable && canUseBridgeOperator(profile, step);
      return { tool, direct, bridge, tier: tool.tier, power: tool.power };
    })
    .filter((candidate) => candidate.direct || candidate.bridge)
    .sort((a, b) => {
      if (a.direct !== b.direct) return a.direct ? -1 : 1;
      if (a.bridge !== b.bridge) return a.bridge ? -1 : 1;
      return b.tier - a.tier || b.power - a.power;
    })
    .map((candidate) => candidate.tool)
    .slice(0, 10);
}

export function getDefenseControlsForEffects(effects: OpsEffect[], target?: BattleTarget): OpsDefenseControl[] {
  const targetBoost = target ? Math.min(3, Math.floor(target.defensePower / 45)) : 0;
  return OPS_DEFENSE_CONTROLS
    .filter((control) => control.protects.some((effect) => effects.includes(effect)))
    .map((control) => ({ ...control, strength: control.strength + targetBoost }))
    .sort((a, b) => b.strength - a.strength || a.name.localeCompare(b.name));
}

export function getDefenseControlsForStep(step: OpsStep | null, target?: BattleTarget): OpsDefenseControl[] {
  if (!step) return [];
  return getDefenseControlsForEffects(step.defenderCounters, target).slice(0, 6);
}

function pickDefenseControl(counter: OpsEffect, target: BattleTarget): OpsDefenseControl {
  const candidates = getDefenseControlsForEffects([counter], target);
  if (candidates.length === 0) return OPS_DEFENSE_CONTROLS[0];
  const topWindow = candidates.slice(0, Math.min(candidates.length, target.defensePower > 70 ? 4 : 2));
  return topWindow[Math.floor(Math.random() * topWindow.length)];
}

export function getOpsDefenseProgressStats(progressMap: Record<string, OpsDefenseProgress>) {
  const completedObjectives = OPS_DEFENSE_OBJECTIVES.filter((objective) => {
    const progress = progressMap[objective.id];
    return progress && progress.completedSteps.length >= objective.steps.length;
  });
  const totalSteps = OPS_DEFENSE_OBJECTIVES.reduce((sum, objective) => sum + objective.steps.length, 0);
  const completedSteps = Object.values(progressMap).reduce((sum, progress) => sum + progress.completedSteps.length, 0);
  const score = Object.values(progressMap).reduce((sum, progress) => sum + progress.score, 0);

  return {
    completedObjectives: completedObjectives.length,
    totalObjectives: OPS_DEFENSE_OBJECTIVES.length,
    completedSteps,
    totalSteps,
    progressPercent: Math.round((completedSteps / totalSteps) * 100),
    score,
    completedTitles: completedObjectives.map((objective) => objective.title),
  };
}

export function resolveOpsDefenseAction({
  progressMap,
  outcome,
  target,
  controls,
}: {
  progressMap: Record<string, OpsDefenseProgress>;
  outcome: OpsActionOutcome;
  target: BattleTarget;
  controls: OpsDefenseControl[];
}): OpsDefenseOutcome {
  const outcomeEffects = [
    ...new Set([
      ...outcome.created,
      ...(outcome.bridgeEffects ?? []),
      ...(outcome.counterEffect ? [outcome.counterEffect] : []),
      ...controls.flatMap((control) => control.protects),
    ]),
  ];

  const candidates = OPS_DEFENSE_OBJECTIVES
    .map((objective) => {
      const progress = progressMap[objective.id];
      const nextStep = getNextOpsDefenseStep(objective, progress);
      if (!nextStep) return null;
      const matchingEffects = nextStep.uses.filter((effect) => outcomeEffects.includes(effect));
      return { objective, progress, nextStep, matchingEffects };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .sort((a, b) => b.matchingEffects.length - a.matchingEffects.length);

  if (candidates.length === 0) {
    return {
      status: 'held',
      points: 0,
      message: `${target.displayName}'s defense stack has already completed every response chain.`,
      effects: outcomeEffects,
    };
  }

  const best = candidates[0];
  const control = controls.find((item) => item.protects.some((effect) => best.nextStep.uses.includes(effect)));
  const matchBonus = best.matchingEffects.length * 12;
  const blockBonus = outcome.status === 'blocked' ? 32 : outcome.status === 'off_path' ? 20 : 0;
  const pressure = Math.min(95, target.defensePower * 0.55 + matchBonus + blockBonus);
  const advances = outcome.status === 'blocked' || Math.random() * 100 < pressure;

  if (!advances) {
    return {
      status: 'held',
      objectiveId: best.objective.id,
      stepId: best.nextStep.id,
      points: 6,
      controlName: control?.name,
      message: `${target.displayName}'s defenders watched "${best.nextStep.title}" but did not complete that response yet.`,
      effects: best.matchingEffects,
    };
  }

  const points = Math.round(best.objective.reward / best.objective.steps.length + target.defensePower / 12 + matchBonus);

  return {
    status: 'advanced',
    objectiveId: best.objective.id,
    stepId: best.nextStep.id,
    points,
    controlName: control?.name,
    message: `${target.displayName}'s ${control?.name ?? best.objective.layer} advanced "${best.nextStep.title}". ${best.nextStep.result}.`,
    effects: best.matchingEffects,
  };
}

export function resolveOpsAction({
  objective,
  progress,
  tool,
  target,
  isOwned,
  availableEffects = [],
}: {
  objective: OpsObjective;
  progress: OpsProgress;
  tool: AttackTool;
  target: BattleTarget;
  isOwned: boolean;
  availableEffects?: OpsEffect[];
}): OpsActionOutcome {
  const nextStep = getNextOpsStep(objective, progress);
  const profile = getToolOpsProfile(tool);

  if (!nextStep) {
    return {
      status: 'already_done',
      objectiveId: objective.id,
      toolId: tool.id,
      points: 0,
      created: [],
      message: `${objective.title} is already complete.`,
    };
  }

  const directMatches = getMatchingEffects(profile.effects, nextStep.accepts);
  const bridgeMatches = getMatchingEffects(availableEffects, nextStep.accepts)
    .filter((effect) => !profile.effects.includes(effect));
  const bridgeAllowed = bridgeMatches.length > 0 && canUseBridgeOperator(profile, nextStep);

  if (directMatches.length === 0 && !bridgeAllowed) {
    return {
      status: 'off_path',
      objectiveId: objective.id,
      stepId: nextStep.id,
      toolId: tool.id,
      points: 8,
      created: [],
      message: `${tool.name} is useful elsewhere, but it does not move "${nextStep.title}" forward.`,
    };
  }

  const combinedEffects = [...new Set([...profile.effects, ...bridgeMatches])];
  const bridgeOnly = directMatches.length === 0 && bridgeAllowed;
  const counterHit = nextStep.defenderCounters.some((counter) => combinedEffects.includes(counter));
  const defensePressure = Math.min(48, Math.max(8, target.defensePower / 5 + objective.risk / 5));
  const ownedBonus = isOwned ? 10 : 0;
  const stabilityBonus = profile.stability * 4;
  const bridgeRisk = bridgeOnly ? 7 : bridgeMatches.length > 0 ? 3 : 0;
  const blockChance = Math.max(6, Math.min(44, defensePressure - stabilityBonus - ownedBonus + (counterHit ? 8 : 0) + bridgeRisk));
  const blocked = Math.random() * 100 < blockChance;

  if (blocked) {
    const counter = nextStep.defenderCounters[Math.floor(Math.random() * nextStep.defenderCounters.length)];
    const defenseControl = pickDefenseControl(counter, target);
    return {
      status: 'blocked',
      objectiveId: objective.id,
      stepId: nextStep.id,
      toolId: tool.id,
      points: 12,
      created: [],
      bridgeEffects: bridgeMatches,
      counter: defenseControl.name,
      counterEffect: counter,
      counterDescription: defenseControl.description,
      counterMiniGame: defenseControl.miniGame,
      message: `${target.displayName}'s ${defenseControl.name} interrupted ${tool.name}. ${defenseControl.miniGame}`,
    };
  }

  const stepIndex = objective.steps.findIndex((step) => step.id === nextStep.id);
  const bridgeBonus = bridgeMatches.length > 0 ? 14 : 0;
  const bridgePenalty = bridgeOnly ? 16 : 0;
  const points = Math.round(objective.reward / objective.steps.length + tool.power / 3 + (isOwned ? 18 : 6) + bridgeBonus - bridgePenalty);
  const completed = stepIndex === objective.steps.length - 1;
  const bridgeText = bridgeMatches.length > 0
    ? ` using pinned ${bridgeMatches.map(getEffectLabel).join(' + ')} access`
    : '';

  return {
    status: 'complete',
    objectiveId: objective.id,
    stepId: nextStep.id,
    toolId: tool.id,
    points: completed ? points + Math.round(objective.reward * 0.25) : points,
    created: nextStep.creates,
    bridgeEffects: bridgeMatches,
    message: completed
      ? `${objective.result} achieved through ${tool.name}${bridgeText}.`
      : `${nextStep.result}. ${tool.name}${bridgeText} opened the next operation step.`,
  };
}

export function summarizeOpsProgress(
  progressMap: Record<string, OpsProgress>,
  target: BattleTarget,
  toolsUsed: number[] = [],
  defenseProgressMap: Record<string, OpsDefenseProgress> = createInitialOpsDefenseProgress(),
): OpsMatchSummary {
  const completed = OPS_OBJECTIVES.filter((objective) => {
    const progress = progressMap[objective.id];
    return progress && progress.completedSteps.length >= objective.steps.length;
  });
  const partial = OPS_OBJECTIVES.filter((objective) => {
    const progress = progressMap[objective.id];
    return progress && progress.completedSteps.length > 0 && progress.completedSteps.length < objective.steps.length;
  });
  const totalSteps = OPS_OBJECTIVES.reduce((sum, objective) => sum + objective.steps.length, 0);
  const completedSteps = Object.values(progressMap).reduce((sum, progress) => sum + progress.completedSteps.length, 0);
  const attackerScore = Object.values(progressMap).reduce((sum, progress) => sum + progress.score, 0);
  const blockedActions = Object.values(progressMap).reduce((sum, progress) => sum + progress.blocked, 0);
  const remainingObjectives = OPS_OBJECTIVES.length - completed.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);
  const defenseStats = getOpsDefenseProgressStats(defenseProgressMap);
  const defenderScore = Math.round(
    target.defensePower * 1.4
    + blockedActions * 45
    + remainingObjectives * 22
    + defenseStats.score
    + defenseStats.completedSteps * 18
    - progressPercent * 1.2,
  );

  return {
    completedObjectives: completed.length,
    totalObjectives: OPS_OBJECTIVES.length,
    completedSteps,
    totalSteps,
    partialObjectives: partial.length,
    progressPercent,
    attackerScore,
    defenderScore: Math.max(0, defenderScore),
    blockedActions,
    defenderCompletedObjectives: defenseStats.completedObjectives,
    defenderTotalObjectives: defenseStats.totalObjectives,
    defenderCompletedSteps: defenseStats.completedSteps,
    defenderTotalSteps: defenseStats.totalSteps,
    defenderProgressPercent: defenseStats.progressPercent,
    defenderCompletedTitles: defenseStats.completedTitles,
    xpGained: 0,
    toolsUsed: [...new Set(toolsUsed)],
    winner: attackerScore >= defenderScore ? 'attacker' : 'defender',
    completedTitles: completed.map((objective) => objective.title),
    partialTitles: partial.map((objective) => objective.title),
  };
}
