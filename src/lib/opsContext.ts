import type { AttackTool, BattleTarget } from './battleEngine';
import type { OpsEffect, OpsObjective, OpsStep } from './opsEngine';

export interface OpsServiceProfile {
  key: string;
  label: string;
  host: string;
  ip: string;
  port: number;
  service: string;
  version: string;
  role: string;
}

export interface OpsCertificateProfile {
  host: string;
  subject: string;
  issuer: string;
  serialNumber: string;
  fingerprint: string;
  validFrom: string;
  validTo: string;
  staleHost: string;
  staleSubject: string;
  staleIssuer: string;
  staleValidTo: string;
}

export interface OpsTargetProfile {
  targetId: string;
  targetName: string;
  orgName: string;
  platformName: string;
  primaryDomain: string;
  rootDomain: string;
  adminPath: string;
  databaseName: string;
  apiName: string;
  vendorName: string;
  widgetName: string;
  backupName: string;
  sessionCookieName: string;
  apiKeyName: string;
  supportEmail: string;
  adminEmail: string;
  engineerEmail: string;
  userEmail: string;
  adminUser: string;
  standardUser: string;
  serviceAccount: string;
  safePayloadName: string;
  repoName: string;
  cmsPath: string;
  uploadPath: string;
  xorKey: string;
  proofPhrase: string;
  hosts: {
    www: string;
    app: string;
    api: string;
    admin: string;
    db: string;
    vpn: string;
    backup: string;
    mail: string;
    vendor: string;
    old: string;
    cdn: string;
    auth: string;
    resolver: string;
  };
  ips: {
    web: string;
    api: string;
    admin: string;
    db: string;
    vpn: string;
    backup: string;
    mail: string;
    vendor: string;
    resolver: string;
    client: string;
    attacker: string;
  };
  networkCidr: string;
  services: OpsServiceProfile[];
  certificate: OpsCertificateProfile;
  logs: {
    loginEvent: string;
    dnsEvent: string;
    webEvent: string;
    endpointEvent: string;
    backupEvent: string;
    vendorEvent: string;
  };
}

export interface OpsProofOption {
  id: string;
  label: string;
  detail: string;
  correct: boolean;
}

export interface OpsStepContract {
  headline: string;
  instruction: string;
  expectedProof: string;
  createdArtifact: string;
  options: OpsProofOption[];
}

export type OpsCarryKind =
  | 'domain'
  | 'host'
  | 'web'
  | 'service'
  | 'port'
  | 'route'
  | 'table'
  | 'query'
  | 'key'
  | 'secret'
  | 'credential'
  | 'identity'
  | 'session'
  | 'payload'
  | 'endpoint'
  | 'traffic'
  | 'cert'
  | 'policy'
  | 'log'
  | 'backup'
  | 'proof';

export interface OpsCarryArtifact {
  id: string;
  kind: OpsCarryKind;
  label: string;
  value: string;
  detail: string;
  sourceToolId: string;
  sourceToolName: string;
  sourceStepId: string;
  targetId: string;
  objectiveId: string;
  chainPosition: number;
}

export interface OpsCarryOption {
  id: string;
  label: string;
  value: string;
  detail: string;
  correct: boolean;
}

export interface OpsCarryRequirement {
  id: string;
  label: string;
  prompt: string;
  expectedValue: string;
  expectedLabel: string;
  sourceArtifactId: string;
  sourceToolId: string;
  sourceToolName: string;
  sourceStepId: string;
  options: OpsCarryOption[];
}
export interface OpsToolContext {
  target: OpsTargetProfile;
  objective: {
    id: string;
    title: string;
    result: string;
    surface: string;
  };
  step: {
    id: string;
    title: string;
    role: string;
    result: string;
    accepts: OpsEffect[];
    creates: OpsEffect[];
  };
  tool?: {
    id: number;
    name: string;
    category: string;
  };
  chainPosition: number;
  chainTotal: number;
  carryArtifacts: OpsCarryArtifact[];
  carryRequirement?: OpsCarryRequirement;
  emittedArtifacts: OpsCarryArtifact[];
  contract: OpsStepContract;
}

function slugify(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'rival';
}

function humanizeSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function hashSeed(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function octet(seed: number, offset: number) {
  return 10 + ((seed + offset * 37) % 180);
}

function fingerprint(seed: number) {
  return Array.from({ length: 16 }, (_, index) => {
    const value = (seed + index * 41) % 256;
    return value.toString(16).padStart(2, '0').toUpperCase();
  }).join(':');
}

export function createOpsTargetProfile(target: BattleTarget): OpsTargetProfile {
  const slug = slugify(target.displayName || `target-${target.userId}`);
  const orgBase = humanizeSlug(slug);
  const seed = hashSeed(`${target.userId}-${target.displayName}-${target.level}-${target.defensePower}`);
  const rootDomain = `${slug}.ops`;
  const primaryDomain = `app.${rootDomain}`;
  const netA = 10 + (seed % 80);
  const netB = 20 + ((seed >> 4) % 120);
  const baseIp = `${netA}.${netB}`;
  const adminUser = `${slug.replace(/-/g, '.')}.admin`;
  const standardUser = `${slug.replace(/-/g, '.')}.member`;
  const serviceAccount = `svc_${slug.replace(/-/g, '_')}_api`;

  const ips = {
    web: `${baseIp}.10.${octet(seed, 1)}`,
    api: `${baseIp}.20.${octet(seed, 2)}`,
    admin: `${baseIp}.30.${octet(seed, 3)}`,
    db: `${baseIp}.40.${octet(seed, 4)}`,
    vpn: `${baseIp}.50.${octet(seed, 5)}`,
    backup: `${baseIp}.60.${octet(seed, 6)}`,
    mail: `${baseIp}.70.${octet(seed, 7)}`,
    vendor: `${baseIp}.80.${octet(seed, 8)}`,
    resolver: `${baseIp}.90.${octet(seed, 9)}`,
    client: `${baseIp}.5.${octet(seed, 10)}`,
    attacker: `198.51.100.${20 + (seed % 70)}`,
  };

  const hosts = {
    www: `www.${rootDomain}`,
    app: primaryDomain,
    api: `api.${rootDomain}`,
    admin: `admin.${rootDomain}`,
    db: `db.${rootDomain}`,
    vpn: `vpn.${rootDomain}`,
    backup: `backup.${rootDomain}`,
    mail: `mail.${rootDomain}`,
    vendor: `vendor.${rootDomain}`,
    old: `old.${rootDomain}`,
    cdn: `cdn.${rootDomain}`,
    auth: `auth.${rootDomain}`,
    resolver: `ns1.${rootDomain}`,
  };

  const services: OpsServiceProfile[] = [
    {
      key: 'web',
      label: `${orgBase} Web`,
      host: hosts.app,
      ip: ips.web,
      port: 443,
      service: 'HTTPS',
      version: `${orgBase} Frontend 4.${target.level}`,
      role: 'public app',
    },
    {
      key: 'api',
      label: `${orgBase} API`,
      host: hosts.api,
      ip: ips.api,
      port: 8443,
      service: 'HTTPS-Alt',
      version: `${orgBase} API Gateway ${target.level}.2`,
      role: 'api gateway',
    },
    {
      key: 'admin',
      label: `${orgBase} Admin`,
      host: hosts.admin,
      ip: ips.admin,
      port: 443,
      service: 'HTTPS',
      version: `${orgBase} Admin Console`,
      role: 'admin portal',
    },
    {
      key: 'db',
      label: `${orgBase} Database`,
      host: hosts.db,
      ip: ips.db,
      port: 5432,
      service: 'PostgreSQL',
      version: `PostgreSQL 14.${target.level}`,
      role: 'data layer',
    },
    {
      key: 'vpn',
      label: `${orgBase} VPN`,
      host: hosts.vpn,
      ip: ips.vpn,
      port: 1194,
      service: 'OpenVPN',
      version: `OpenVPN lab gateway`,
      role: 'remote access',
    },
    {
      key: 'backup',
      label: `${orgBase} Backup`,
      host: hosts.backup,
      ip: ips.backup,
      port: 9443,
      service: 'Backup API',
      version: `${orgBase} Snapshot Vault`,
      role: 'backup index',
    },
    {
      key: 'mail',
      label: `${orgBase} Mail`,
      host: hosts.mail,
      ip: ips.mail,
      port: 587,
      service: 'SMTP-SSL',
      version: `${orgBase} Mail Relay`,
      role: 'mail relay',
    },
    {
      key: 'vendor',
      label: `${orgBase} Vendor Widget`,
      host: hosts.vendor,
      ip: ips.vendor,
      port: 443,
      service: 'HTTPS',
      version: `${orgBase} Partner Widget`,
      role: 'third-party widget',
    },
  ];

  const certificate = {
    host: hosts.app,
    subject: `CN=${hosts.app}, O=${orgBase} Labs, C=US`,
    issuer: `${orgBase} Trust Lab CA`,
    serialNumber: `${(seed % 90) + 10}:${((seed >> 2) % 90) + 10}:${((seed >> 5) % 90) + 10}:AA`,
    fingerprint: fingerprint(seed),
    validFrom: '2026-02-01',
    validTo: '2027-02-01',
    staleHost: hosts.old,
    staleSubject: `CN=${hosts.old}, O=${orgBase} Legacy, C=US`,
    staleIssuer: `${orgBase} Legacy CA`,
    staleValidTo: '2024-02-01',
  };

  return {
    targetId: String(target.userId),
    targetName: target.displayName,
    orgName: `${orgBase} Labs`,
    platformName: `${orgBase} Portal`,
    primaryDomain,
    rootDomain,
    adminPath: `/ops/${slug}/admin`,
    databaseName: `${slug.replace(/-/g, '_')}_customer_vault`,
    apiName: `${orgBase} Ops API`,
    vendorName: `${orgBase} Partner Mesh`,
    widgetName: `${orgBase} Trust Widget`,
    backupName: `${slug}-clean-snapshot-index`,
    sessionCookieName: `${slug.replace(/-/g, '_')}_sid`,
    apiKeyName: `${slug.replace(/-/g, '_').toUpperCase()}_LAB_KEY`,
    supportEmail: `support@${rootDomain}`,
    adminEmail: `${adminUser}@${rootDomain}`,
    engineerEmail: `engineer@${rootDomain}`,
    userEmail: `${standardUser}@${rootDomain}`,
    adminUser,
    standardUser,
    serviceAccount,
    safePayloadName: `${slug}-lab-payload`,
    repoName: `${slug}-portal-config`,
    cmsPath: `/cms/${slug}/media`,
    uploadPath: `/uploads/${slug}/review`,
    xorKey: `${slug.slice(0, 4).toUpperCase()}${target.level}`,
    proofPhrase: `${orgBase} proof ${target.level}`,
    hosts,
    ips,
    networkCidr: `${baseIp}.0.0/16`,
    services,
    certificate,
    logs: {
      loginEvent: `${adminUser} login challenge on ${hosts.admin}`,
      dnsEvent: `${hosts.app} resolved by ${hosts.resolver} to ${ips.web}`,
      webEvent: `${hosts.app}${`/login`} forwarded to ${hosts.api}`,
      endpointEvent: `${serviceAccount} lab process touched ${hosts.db}`,
      backupEvent: `${slug}-clean-snapshot-index verified from ${hosts.backup}`,
      vendorEvent: `${orgBase} Trust Widget loaded from ${hosts.vendor}`,
    },
  };
}

function effectArtifact(target: OpsTargetProfile, effect: OpsEffect) {
  const map: Record<OpsEffect, string> = {
    recon: `${target.primaryDomain} surface map`,
    osint: `${target.adminEmail} identity clue`,
    dns: `${target.hosts.resolver} -> ${target.ips.web}`,
    network: `${target.networkCidr} service path`,
    traffic: `${target.ips.client} -> ${target.hosts.app}:443 flow`,
    web: `${target.hosts.app}${target.cmsPath}`,
    sql: `${target.databaseName} proof row`,
    xss: `${target.widgetName} sandbox field`,
    credential: `${target.adminUser} reset clue`,
    session: `${target.sessionCookieName} revocable token`,
    social: `${target.supportEmail} consent trail`,
    crypto: `${target.apiKeyName} integrity check`,
    malware: `${target.safePayloadName} contained sample`,
    payload: `${target.safePayloadName} sandbox payload`,
    endpoint: `${target.serviceAccount} endpoint context`,
    persistence: `${target.safePayloadName} startup check`,
    exfil: `${target.backupName} sanitized proof`,
    defense: `${target.platformName} defense receipt`,
    patch: `${target.platformName} scoped fix`,
    waf: `${target.hosts.app} WAF rule`,
    firewall: `${target.hosts.vpn} firewall lane`,
    edr: `${target.serviceAccount} EDR trace`,
    log: `${target.logs.loginEvent}`,
    backup: `${target.backupName}`,
    cert: `${target.certificate.host} cert ${target.certificate.fingerprint.slice(0, 14)}`,
    proxy: `${target.hosts.app} proxy route`,
    stealth: `${target.hosts.vendor} low-noise route`,
  };
  return map[effect];
}

function makeDecoyOptions(target: OpsTargetProfile, correctLabels: Set<string>) {
  return [
    `${target.hosts.old} legacy note`,
    `${target.hosts.cdn} static asset`,
    `${target.standardUser} profile hint`,
    `${target.vendorName} marketing page`,
    `${target.apiName} health ping`,
    `${target.hosts.mail} delivery receipt`,
  ].filter((label) => !correctLabels.has(label));
}

function rotate<T>(values: T[], seed: string) {
  if (values.length === 0) return values;
  const offset = hashSeed(seed) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

export function createOpsStepContract(
  target: OpsTargetProfile,
  objective: Pick<OpsObjective, 'id' | 'title' | 'result' | 'surface'>,
  step: OpsStep,
): OpsStepContract {
  const required = [...new Set([...step.accepts.slice(0, 2), ...step.creates.slice(0, 1)])]
    .slice(0, 3)
    .map((effect) => effectArtifact(target, effect));
  const correctLabels = new Set(required);
  const decoys = makeDecoyOptions(target, correctLabels).slice(0, Math.max(2, 4 - required.length));
  const options = rotate(
    [
      ...required.map((label, index) => ({
        id: `proof-${index}`,
        label,
        detail: `Matches ${target.platformName} / ${objective.title} / ${step.title}.`,
        correct: true,
      })),
      ...decoys.map((label, index) => ({
        id: `decoy-${index}`,
        label,
        detail: `Belongs to ${target.platformName}, but it does not prove this step.`,
        correct: false,
      })),
    ],
    `${target.targetId}-${objective.id}-${step.id}`,
  );

  return {
    headline: `${target.platformName} operation proof`,
    instruction: `Pick the artifacts that belong to "${step.title}" on ${target.primaryDomain}.`,
    expectedProof: required.join(' + '),
    createdArtifact: step.creates.length > 0
      ? effectArtifact(target, step.creates[0])
      : `${target.platformName} step receipt`,
    options,
  };
}

const TOOL_CARRY_NEEDS: Record<string, OpsCarryKind[]> = {
  'advanced-port-scan': ['host', 'domain'],
  'nmap-scanner': ['route', 'host', 'domain'],
  'port-scanner': ['host', 'domain'],
  'dns-lookup-gui': ['domain', 'identity'],
  'dns-resolver': ['payload', 'endpoint', 'route'],
  'sql-safari': ['service', 'route', 'host'],
  'sql-injector-gui': ['table', 'route', 'credential'],
  'encryption-pipeline': ['query', 'secret', 'session', 'backup', 'payload', 'proof'],
  'hash-cracker-gui': ['key', 'identity', 'credential'],
  'hash-hacker': ['key', 'identity', 'credential'],
  'xor-tool': ['domain', 'route', 'log'],
  'proxy-server': ['session', 'route', 'traffic', 'key'],
  'vpn-tunnel': ['route', 'service', 'session'],
  'network-navigator': ['host', 'domain', 'traffic'],
  'network-packet-tracer': ['session', 'route', 'traffic'],
  'packet-tracer': ['session', 'route', 'traffic'],
  'cert-viewer-gui': ['traffic', 'host', 'route', 'web'],
  'ssl-handshake': ['credential', 'identity', 'cert'],
  'cert-champion': ['policy', 'log', 'cert'],
  'xss-tester-gui': ['route', 'web', 'service'],
  'xss-xpert': ['cert', 'web', 'session'],
  'trojan-builder': ['payload', 'endpoint', 'web'],
  'keylogger-sim': ['endpoint', 'payload', 'session'],
  'log-analyzer': ['endpoint', 'session', 'traffic'],
  'access-ace': ['credential', 'session', 'web'],
  'phishing-detective': ['identity', 'domain', 'web'],
  'phishing-sim-gui': ['identity', 'web', 'payload'],
  'load-balancer': ['payload', 'traffic', 'route'],
  'firewall-defender': ['log', 'traffic', 'policy'],
};

function serviceForStep(target: OpsTargetProfile, step: OpsStep) {
  const accepts = new Set(step.accepts);
  const creates = new Set(step.creates);
  const id = step.id.toLowerCase();
  const serviceKey = id.includes('backup') || accepts.has('backup')
    ? 'backup'
    : id.includes('vendor') || id.includes('widget')
      ? 'vendor'
      : accepts.has('sql') || creates.has('sql')
        ? 'db'
        : accepts.has('proxy') || accepts.has('session')
          ? 'api'
          : accepts.has('cert') || accepts.has('web') || creates.has('web')
            ? 'web'
            : accepts.has('network')
              ? 'api'
              : 'web';
  return target.services.find((service) => service.key === serviceKey) ?? target.services[0];
}

function addUniqueArtifact(artifacts: OpsCarryArtifact[], artifact: OpsCarryArtifact) {
  if (!artifacts.some((item) => item.kind === artifact.kind && item.value === artifact.value)) {
    artifacts.push(artifact);
  }
}

function makeCarryArtifact({
  target,
  objective,
  step,
  tool,
  opsToolId,
  chainPosition,
  kind,
  label,
  value,
  detail,
}: {
  target: OpsTargetProfile;
  objective: Pick<OpsObjective, 'id'>;
  step: OpsStep;
  tool?: AttackTool;
  opsToolId?: string;
  chainPosition: number;
  kind: OpsCarryKind;
  label: string;
  value: string;
  detail: string;
}): OpsCarryArtifact {
  const sourceToolId = opsToolId ?? slugify(tool?.name ?? 'simuletool');
  const sourceToolName = tool?.name ?? sourceToolId;
  const seed = `${target.targetId}-${objective.id}-${step.id}-${sourceToolId}-${kind}-${value}-${chainPosition}`;
  return {
    id: `carry-${hashSeed(seed).toString(16)}-${kind}`,
    kind,
    label,
    value,
    detail,
    sourceToolId,
    sourceToolName,
    sourceStepId: step.id,
    targetId: target.targetId,
    objectiveId: objective.id,
    chainPosition,
  };
}

export function createOpsCarryArtifacts({
  target,
  objective,
  step,
  tool,
  opsToolId,
  chainPosition,
}: {
  target: OpsTargetProfile;
  objective: Pick<OpsObjective, 'id'>;
  step: OpsStep;
  tool?: AttackTool;
  opsToolId?: string;
  chainPosition: number;
}): OpsCarryArtifact[] {
  const artifacts: OpsCarryArtifact[] = [];
  const toolKey = (opsToolId ?? tool?.name ?? '').toLowerCase();
  const service = serviceForStep(target, step);
  const push = (kind: OpsCarryKind, label: string, value: string | number, detail: string) => {
    addUniqueArtifact(artifacts, makeCarryArtifact({
      target,
      objective,
      step,
      tool,
      opsToolId,
      chainPosition,
      kind,
      label,
      value: String(value),
      detail,
    }));
  };

  if (toolKey.includes('whois')) {
    push('domain', 'Registered root domain', target.rootDomain, `WHOIS scope for ${target.orgName}.`);
    push('identity', 'Responsible contact', target.adminEmail, `Identity clue tied to ${target.platformName}.`);
  }
  if (toolKey.includes('dns')) {
    push('host', 'Resolved app host', target.primaryDomain, `${target.hosts.resolver} resolves the active app host.`);
    push('domain', 'Resolved root domain', target.rootDomain, `DNS zone remains inside ${target.orgName}.`);
  }
  if (toolKey.includes('nmap') || toolKey.includes('port-scan') || toolKey.includes('port-scanner')) {
    push('service', 'Open service endpoint', `${service.host}:${service.port}`, `${service.service} on ${service.role}.`);
    push('port', 'Open port', service.port, `${service.label} exposes ${service.service}.`);
  }
  if (toolKey.includes('packet') || toolKey.includes('tracer')) {
    push('traffic', 'Observed traffic path', `${target.ips.client} -> ${target.primaryDomain}:443`, `Traffic observed inside ${target.platformName}.`);
  }
  if (toolKey.includes('sql-safari')) {
    push('table', 'Candidate data table', `${target.databaseName}.customers`, `Table route found from ${target.apiName}.`);
    push('route', 'Data API route', `${target.hosts.api}/reports/customer-proof`, `Route belongs to ${target.apiName}.`);
  }
  if (toolKey.includes('sql-injector')) {
    push('query', 'Controlled query window', `readonly:${target.databaseName}:customer_id`, `Safe query window for sanitized proof only.`);
  }
  if (toolKey.includes('xor')) {
    push('key', 'Derived XOR key', target.xorKey, `Key pattern bound to ${target.repoName}.`);
    push('secret', 'Simulated API key name', target.apiKeyName, `Secret label from ${target.apiName}.`);
  }
  if (toolKey.includes('hash') || toolKey.includes('access')) {
    push('credential', 'Validated account clue', target.serviceAccount, `Credential clue scoped to ${target.platformName}.`);
  }
  if (toolKey.includes('proxy') || toolKey.includes('vpn') || toolKey.includes('load-balancer') || toolKey.includes('network-navigator')) {
    push('route', 'Approved route', `${service.host}:${service.port}`, `Route follows ${service.label}.`);
    push('session', 'Scoped session lane', target.sessionCookieName, `Session lane is revocable on ${target.platformName}.`);
  }
  if (toolKey.includes('cert') || toolKey.includes('ssl')) {
    push('cert', 'Certificate fingerprint', target.certificate.fingerprint, `Certificate fingerprint for ${target.certificate.host}.`);
  }
  if (toolKey.includes('phishing')) {
    push('identity', 'User journey identity', target.userEmail, `Social clue stays inside ${target.orgName}.`);
  }
  if (toolKey.includes('xss')) {
    push('payload', 'Sandbox payload route', `${target.hosts.app}${target.uploadPath}`, `Sandbox-only payload route for ${target.platformName}.`);
    push('route', 'Web interaction route', `${target.hosts.app}${target.cmsPath}`, `Web route belongs to ${target.platformName}.`);
  }
  if (toolKey.includes('trojan') || toolKey.includes('malware') || toolKey.includes('keylogger')) {
    push('payload', 'Contained lab payload', target.safePayloadName, `Contained sample for ${target.platformName}.`);
    push('endpoint', 'Endpoint process context', target.serviceAccount, `Endpoint context produced by ${target.orgName}.`);
  }
  if (toolKey.includes('log')) {
    push('log', 'Relevant log event', target.logs.loginEvent, `Event belongs to ${target.platformName}.`);
  }
  if (toolKey.includes('encryption') || toolKey.includes('crypto') || toolKey.includes('stego')) {
    push('proof', 'Sanitized proof bundle', step.result, `Proof bundle generated for ${target.platformName}.`);
  }
  if (toolKey.includes('firewall') || toolKey.includes('defender')) {
    push('policy', 'Applied control policy', `${target.platformName} scoped control`, `Policy applies only to this VS target.`);
  }

  if (step.creates.includes('web')) push('route', 'Created web route', `${target.hosts.app}${target.cmsPath}`, `Created by ${step.title}.`);
  if (step.creates.includes('sql')) push('table', 'Created data route', `${target.databaseName}.customers`, `Created by ${step.title}.`);
  if (step.creates.includes('session')) push('session', 'Created session artifact', target.sessionCookieName, `Created by ${step.title}.`);
  if (step.creates.includes('credential')) push('credential', 'Created credential clue', target.serviceAccount, `Created by ${step.title}.`);
  if (step.creates.includes('payload')) push('payload', 'Created payload route', target.safePayloadName, `Created by ${step.title}.`);
  if (step.creates.includes('endpoint')) push('endpoint', 'Created endpoint context', target.serviceAccount, `Created by ${step.title}.`);
  if (step.creates.includes('exfil')) push('proof', 'Created proof artifact', step.result, `Created by ${step.title}.`);
  if (step.creates.includes('backup')) push('backup', 'Created backup artifact', target.backupName, `Created by ${step.title}.`);
  if (step.creates.includes('cert')) push('cert', 'Created trust artifact', target.certificate.fingerprint, `Created by ${step.title}.`);
  if (step.creates.includes('log')) push('log', 'Created log artifact', target.logs.loginEvent, `Created by ${step.title}.`);
  if (step.creates.includes('defense')) push('policy', 'Created defense artifact', `${target.platformName} defense receipt`, `Created by ${step.title}.`);

  return artifacts;
}

function carryDecoyOptions(target: OpsTargetProfile, correctValue: string): OpsCarryOption[] {
  const decoys: Omit<OpsCarryOption, 'id' | 'correct'>[] = [
    { label: target.hosts.old, value: target.hosts.old, detail: 'Legacy host from the same lab, but not the chained output.' },
    { label: target.hosts.cdn, value: target.hosts.cdn, detail: 'Static asset host, not the operation handoff.' },
    { label: `${target.hosts.mail}:587`, value: `${target.hosts.mail}:587`, detail: 'Mail relay path, not this tool chain.' },
    { label: target.standardUser, value: target.standardUser, detail: 'Normal user clue, not the artifact requested here.' },
    { label: target.certificate.staleHost, value: target.certificate.staleHost, detail: 'Stale certificate host, not the active handoff.' },
  ].filter((option) => option.value !== correctValue && option.label !== correctValue);

  return decoys.slice(0, 3).map((option, index) => ({
    ...option,
    id: `carry-decoy-${index}`,
    correct: false,
  }));
}

export function createOpsCarryRequirement({
  target,
  objective,
  step,
  tool,
  opsToolId,
  chainPosition,
  carryArtifacts,
}: {
  target: OpsTargetProfile;
  objective: Pick<OpsObjective, 'id' | 'title'>;
  step: OpsStep;
  tool?: AttackTool;
  opsToolId?: string;
  chainPosition: number;
  carryArtifacts: OpsCarryArtifact[];
}): OpsCarryRequirement | undefined {
  const needs = TOOL_CARRY_NEEDS[opsToolId ?? ''] ?? [];
  if (needs.length === 0 || carryArtifacts.length === 0) return undefined;

  const scopedArtifacts = carryArtifacts.filter((artifact) => (
    artifact.targetId === target.targetId &&
    artifact.objectiveId === objective.id &&
    artifact.sourceToolId !== (opsToolId ?? '')
  ));
  const reversedArtifacts = [...scopedArtifacts].reverse();
  const artifact = needs
    .map((kind) => reversedArtifacts.find((candidate) => candidate.kind === kind))
    .find((candidate): candidate is OpsCarryArtifact => Boolean(candidate));

  if (!artifact) return undefined;

  const correct: OpsCarryOption = {
    id: 'carry-correct',
    label: artifact.value,
    value: artifact.value,
    detail: `From ${artifact.sourceToolName}: ${artifact.label}.`,
    correct: true,
  };
  const options = rotate([
    correct,
    ...carryDecoyOptions(target, artifact.value),
  ], `${target.targetId}-${objective.id}-${step.id}-${opsToolId ?? 'tool'}-${artifact.id}`);

  return {
    id: `need-${artifact.id}-${opsToolId ?? slugify(tool?.name ?? 'tool')}-${chainPosition}`,
    label: artifact.label,
    prompt: `Use the ${artifact.label.toLowerCase()} from ${artifact.sourceToolName} before running ${tool?.name ?? 'this simuletool'} on ${target.platformName}.`,
    expectedValue: artifact.value,
    expectedLabel: artifact.label,
    sourceArtifactId: artifact.id,
    sourceToolId: artifact.sourceToolId,
    sourceToolName: artifact.sourceToolName,
    sourceStepId: artifact.sourceStepId,
    options,
  };
}
export function createOpsToolContext({
  target,
  objective,
  step,
  tool,
  chainPosition,
  chainTotal,
  carryArtifacts = [],
  opsToolId,
}: {
  target: BattleTarget;
  objective: OpsObjective;
  step: OpsStep;
  tool?: AttackTool;
  chainPosition: number;
  chainTotal: number;
  carryArtifacts?: OpsCarryArtifact[];
  opsToolId?: string;
}): OpsToolContext {
  const profile = createOpsTargetProfile(target);
  const scopedCarryArtifacts = carryArtifacts.filter((artifact) => (
    artifact.targetId === profile.targetId && artifact.objectiveId === objective.id
  ));
  const emittedArtifacts = createOpsCarryArtifacts({
    target: profile,
    objective,
    step,
    tool,
    opsToolId,
    chainPosition,
  });
  const carryRequirement = createOpsCarryRequirement({
    target: profile,
    objective,
    step,
    tool,
    opsToolId,
    chainPosition,
    carryArtifacts: scopedCarryArtifacts,
  });

  return {
    target: profile,
    objective: {
      id: objective.id,
      title: objective.title,
      result: objective.result,
      surface: objective.surface,
    },
    step: {
      id: step.id,
      title: step.title,
      role: step.role,
      result: step.result,
      accepts: step.accepts,
      creates: step.creates,
    },
    tool: tool
      ? {
          id: tool.id,
          name: tool.name,
          category: tool.category,
        }
      : undefined,
    chainPosition,
    chainTotal,
    carryArtifacts: scopedCarryArtifacts,
    carryRequirement,
    emittedArtifacts,
    contract: createOpsStepContract(profile, objective, step),
  };
}

export type OpsContextProps = {
  opsContext?: OpsToolContext;
};
