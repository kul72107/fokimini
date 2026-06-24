/* ═══════════════════════════════════════════════════════════════
   BATTLE ENGINE — Pure localStorage, zero backend
   ═══════════════════════════════════════════════════════════════ */

import { localAuth, type LocalUser } from './localAuth';

/* ─── Types ─── */

export interface BattleResult {
  result: 'full_breach' | 'breach' | 'partial' | 'defended' | 'blocked';
  damageDealt: number;
  damageBlocked: number;
  xpGained: number;
  toolsUsed: number[];
  attackType: string;
  replay: BattleReplay;
  won: boolean;
  timestamp: string;
}

export interface BattleReplay {
  rounds: BattleRound[];
  attackerName: string;
  defenderName: string;
  finalAttackerHp: number;
  finalDefenderHp: number;
}

export interface BattleRound {
  round: number;
  attackerTool: string;
  defenderLayer: string;
  damage: number;
  blocked: number;
  message: string;
  attackerRoll: number;
  defenderRoll: number;
}

export interface BattleTarget {
  userId: number;
  displayName: string;
  level: number;
  defensePower: number;
  wins: number;
  losses: number;
  isBot: boolean;
  avatar?: string;
}

export interface BattleLog {
  id: string;
  attackerId: number;
  attackerName: string;
  defenderId: number;
  defenderName: string;
  result: string;
  damageDealt: number;
  damageBlocked: number;
  xpGained: number;
  attackType: string;
  createdAt: string;
  replay: BattleReplay;
}

export interface DefenseState {
  firewallLevel: number;
  idsLevel: number;
  wafLevel: number;
  honeypotLevel: number;
  encryptionLevel: number;
  antiVirusLevel: number;
  backupLevel: number;
  totalDefensePower: number;
}

export interface AttackTool {
  id: number;
  name: string;
  power: number;
  tier: number;
  stealthLevel: number;
  cooldown: number;
  defenseBreak: number;
  category: string;
  icon: string;
  description: string;
}

export interface CooldownEntry {
  toolId: number;
  availableAt: number;
}

export interface ShieldEntry {
  userId: number;
  expiresAt: number;
}

/* ─── Tool Database ─── */

export const ALL_TOOLS: AttackTool[] = [
  { id: 1, name: 'Port Scanner', power: 15, tier: 1, stealthLevel: 1, cooldown: 10, defenseBreak: 5, category: 'recon', icon: 'Search', description: 'Scan for open ports and services' },
  { id: 2, name: 'DNS Lookup', power: 10, tier: 1, stealthLevel: 2, cooldown: 8, defenseBreak: 3, category: 'network', icon: 'Globe', description: 'Query DNS records and subdomains' },
  { id: 3, name: 'Firewall Probe', power: 12, tier: 1, stealthLevel: 2, cooldown: 12, defenseBreak: 8, category: 'network', icon: 'Shield', description: 'Test firewall rule configurations' },
  { id: 4, name: 'SQL Injector', power: 35, tier: 2, stealthLevel: 2, cooldown: 30, defenseBreak: 15, category: 'web', icon: 'Database', description: 'Inject malicious SQL payloads' },
  { id: 5, name: 'XSS Launcher', power: 28, tier: 2, stealthLevel: 3, cooldown: 25, defenseBreak: 12, category: 'web', icon: 'Code', description: 'Deploy cross-site scripting attacks' },
  { id: 6, name: 'Packet Sniffer', power: 20, tier: 2, stealthLevel: 4, cooldown: 20, defenseBreak: 8, category: 'network', icon: 'Wifi', description: 'Intercept and analyze network traffic' },
  { id: 7, name: 'Brute Forcer', power: 40, tier: 2, stealthLevel: 1, cooldown: 45, defenseBreak: 20, category: 'crypto', icon: 'Lock', description: 'Crack passwords via brute force' },
  { id: 8, name: 'Trojan Horse', power: 38, tier: 3, stealthLevel: 5, cooldown: 60, defenseBreak: 18, category: 'malware', icon: 'Bug', description: 'Sneaky malware infiltration' },
  { id: 9, name: 'Metasploit', power: 55, tier: 3, stealthLevel: 3, cooldown: 90, defenseBreak: 25, category: 'advanced', icon: 'Zap', description: 'Full exploit framework' },
  { id: 10, name: 'Zero Day', power: 70, tier: 3, stealthLevel: 5, cooldown: 120, defenseBreak: 35, category: 'advanced', icon: 'Sparkles', description: 'Unknown vulnerability exploit' },
  { id: 11, name: 'Phishing Kit', power: 25, tier: 2, stealthLevel: 4, cooldown: 35, defenseBreak: 10, category: 'social', icon: 'Mail', description: 'Deceptive credential harvesting' },
  { id: 12, name: 'Wireshark Pro', power: 30, tier: 2, stealthLevel: 3, cooldown: 28, defenseBreak: 12, category: 'network', icon: 'Activity', description: 'Advanced packet analysis' },
  { id: 13, name: 'Burp Suite', power: 45, tier: 3, stealthLevel: 3, cooldown: 50, defenseBreak: 22, category: 'web', icon: 'Globe', description: 'Web vulnerability scanner' },
  { id: 14, name: 'Aircrack-ng', power: 32, tier: 2, stealthLevel: 2, cooldown: 40, defenseBreak: 15, category: 'network', icon: 'Wifi', description: 'WiFi network cracking' },
  { id: 15, name: 'Hydra', power: 42, tier: 3, stealthLevel: 2, cooldown: 55, defenseBreak: 25, category: 'crypto', icon: 'Fingerprint', description: 'Parallelized login cracker' },
];

export const ATTACK_TYPES = [
  { key: 'port_scan', label: 'Port Scan', description: 'Scan for open ports' },
  { key: 'sql_injection', label: 'SQL Injection', description: 'Inject malicious SQL' },
  { key: 'xss', label: 'XSS', description: 'Cross-site scripting' },
  { key: 'ddos', label: 'DDoS', description: 'Flood with traffic' },
  { key: 'phishing', label: 'Phishing', description: 'Deceptive bait' },
  { key: 'brute_force', label: 'Brute Force', description: 'Crack passwords' },
  { key: 'trojan', label: 'Trojan', description: 'Sneaky infiltration' },
  { key: 'ransomware', label: 'Ransomware', description: 'Encrypt and demand' },
  { key: 'social_engineering', label: 'Social Eng.', description: 'Manipulate humans' },
  { key: 'mitm', label: 'MITM', description: 'Man-in-the-middle' },
  { key: 'zero_day', label: 'Zero Day', description: 'Unknown exploit' },
  { key: 'custom', label: 'Custom', description: 'Mixed approach' },
];

/* ─── Defense layer mapping ─── */

const DEFENSE_LAYERS = [
  { key: 'firewallLevel', name: 'FIREWALL', weight: 5 },
  { key: 'idsLevel', name: 'IDS', weight: 4 },
  { key: 'wafLevel', name: 'WAF', weight: 3 },
  { key: 'honeypotLevel', name: 'HONEYPOT', weight: 3 },
  { key: 'encryptionLevel', name: 'ENCRYPTION', weight: 2 },
  { key: 'antiVirusLevel', name: 'ANTI-VIRUS', weight: 2 },
  { key: 'backupLevel', name: 'BACKUP', weight: 1 },
];

const BATTLE_LOG_KEY = 'cyberpaw_battle_logs';
const COOLDOWN_KEY = 'cyberpaw_cooldowns';
const SHIELD_KEY = 'cyberpaw_shields';
const BOT_COUNT = 8;

/* ─── Helpers ─── */

function getBattleLogs(): BattleLog[] {
  try { return JSON.parse(localStorage.getItem(BATTLE_LOG_KEY) || '[]'); }
  catch { return []; }
}

function saveBattleLogs(logs: BattleLog[]) {
  localStorage.setItem(BATTLE_LOG_KEY, JSON.stringify(logs.slice(0, 200)));
}

function getCooldowns(): CooldownEntry[] {
  try { return JSON.parse(localStorage.getItem(COOLDOWN_KEY) || '[]'); }
  catch { return []; }
}

function saveCooldowns(cds: CooldownEntry[]) {
  // Clean expired
  const now = Date.now();
  localStorage.setItem(COOLDOWN_KEY, JSON.stringify(cds.filter(c => c.availableAt > now)));
}

function getShields(): ShieldEntry[] {
  try { return JSON.parse(localStorage.getItem(SHIELD_KEY) || '[]'); }
  catch { return []; }
}

function saveShields(shields: ShieldEntry[]) {
  const now = Date.now();
  localStorage.setItem(SHIELD_KEY, JSON.stringify(shields.filter(s => s.expiresAt > now)));
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function generateBotName(): string {
  const prefixes = ['Cyber', 'Net', 'Hack', 'Code', 'Data', 'Pixel', 'Byte', 'Bit', 'Matrix', 'Shadow', 'Ghost', 'Neon', 'Dark', 'Null', 'Void'];
  const suffixes = ['Bot', 'Drone', 'Claw', 'Paw', 'Whisker', 'Feline', 'Kitten', 'Mew', 'Hiss', 'Purr', 'Tail', 'Fang', 'Fang', 'Wing', 'Core'];
  return prefixes[Math.floor(Math.random() * prefixes.length)] + '_' + suffixes[Math.floor(Math.random() * suffixes.length)];
}

/* ═════════════════════════════════════════════
   CORE FUNCTIONS
   ═════════════════════════════════════════════ */

/**
 * Get available targets: real users + AI bots
 */
export function getAvailableTargets(userId: number): BattleTarget[] {
  const targets: BattleTarget[] = [];

  // Get real users from localStorage
  try {
    const usersRaw = localStorage.getItem('cyberpaw_users');
    if (usersRaw) {
      const users = JSON.parse(usersRaw);
      for (const username of Object.keys(users)) {
        const record = users[username];
        if (!record?.user) continue;
        const u = record.user as LocalUser;
        if (u.id === userId) continue; // exclude self

        const defenses = getPlayerDefenses(u.id);
        const stats = getPlayerStats(u.id);

        targets.push({
          userId: u.id,
          displayName: u.displayName || username,
          level: u.level || 1,
          defensePower: defenses.totalDefensePower || 35,
          wins: stats.duelsWon || 0,
          losses: stats.duelsLost || 0,
          isBot: false,
          avatar: u.avatar || 'cat',
        });
      }
    }
  } catch { /* ignore */ }

  // Add AI bots
  const botNames = new Set<string>();
  while (botNames.size < BOT_COUNT) {
    botNames.add(generateBotName());
  }

  let botId = -1;
  for (const name of botNames) {
    const level = rand(1, 20);
    const defensePower = 10 + level * 10 + rand(-5, 15);
    const wins = rand(0, 50);
    const losses = rand(0, 40);
    targets.push({
      userId: botId,
      displayName: name,
      level,
      defensePower: clamp(defensePower, 10, 200),
      wins,
      losses,
      isBot: true,
    });
    botId--;
  }

  // Shuffle
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }

  return targets;
}

function getPlayerDefenses(userId: number): DefenseState {
  // For bots, generate defenses based on level
  if (userId < 0) {
    const level = Math.abs(userId) % 20 + 1;
    return {
      firewallLevel: clamp(Math.floor(level * 0.7), 1, 20),
      idsLevel: clamp(Math.floor(level * 0.6), 1, 20),
      wafLevel: clamp(Math.floor(level * 0.5), 0, 20),
      honeypotLevel: clamp(Math.floor(level * 0.4), 0, 20),
      encryptionLevel: clamp(Math.floor(level * 0.6), 1, 20),
      antiVirusLevel: clamp(Math.floor(level * 0.5), 1, 20),
      backupLevel: clamp(Math.floor(level * 0.3), 0, 20),
      totalDefensePower: level * 10 + 10,
    };
  }

  // For real users, read from localStorage
  try {
    const key = `cyberpaw_defenses_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }

  // Fallback to current user's defenses
  return localAuth.getDefenses();
}

function getPlayerStats(userId: number) {
  if (userId < 0) {
    return { duelsWon: rand(0, 50), duelsLost: rand(0, 40) };
  }
  return localAuth.getStats();
}

/**
 * Calculate defense power from defense state
 */
export function calculateDefensePower(defenses: DefenseState): number {
  return (defenses.firewallLevel * 5) +
    (defenses.idsLevel * 4) +
    (defenses.wafLevel * 3) +
    (defenses.honeypotLevel * 3) +
    (defenses.encryptionLevel * 2) +
    (defenses.antiVirusLevel * 2) +
    (defenses.backupLevel * 1);
}

/**
 * Get tools from a user's inventory
 */
export function getUserTools(userId?: number): AttackTool[] {
  const inventory = localAuth.getInventory();
  return ALL_TOOLS.filter(t => inventory.includes(t.id));
}

/**
 * Check if a tool is on cooldown
 */
export function isToolOnCooldown(toolId: number): boolean {
  const cds = getCooldowns();
  const now = Date.now();
  return cds.some(c => c.toolId === toolId && c.availableAt > now);
}

/**
 * Get remaining cooldown seconds for a tool
 */
export function getToolCooldownRemaining(toolId: number): number {
  const cds = getCooldowns();
  const now = Date.now();
  const entry = cds.find(c => c.toolId === toolId && c.availableAt > now);
  return entry ? Math.ceil((entry.availableAt - now) / 1000) : 0;
}

/**
 * Check if a target has an active shield
 */
export function hasShield(userId: number): boolean {
  const shields = getShields();
  const now = Date.now();
  return shields.some(s => s.userId === userId && s.expiresAt > now);
}

/**
 * Get shield time remaining in seconds
 */
export function getShieldRemaining(userId: number): number {
  const shields = getShields();
  const now = Date.now();
  const entry = shields.find(s => s.userId === userId && s.expiresAt > now);
  return entry ? Math.ceil((entry.expiresAt - now) / 1000) : 0;
}

/**
 * Activate a shield for a user (30 min protection after being attacked)
 */
function activateShield(userId: number) {
  const shields = getShields().filter(s => s.userId !== userId);
  shields.push({ userId, expiresAt: Date.now() + 30 * 60 * 1000 });
  saveShields(shields);
}

/**
 * Put tools on cooldown after battle
 */
function setCooldowns(toolIds: number[]) {
  const cds = getCooldowns();
  const now = Date.now();
  for (const tid of toolIds) {
    const tool = ALL_TOOLS.find(t => t.id === tid);
    if (!tool) continue;
    // Remove existing entry
    const filtered = cds.filter(c => c.toolId !== tid);
    filtered.push({ toolId: tid, availableAt: now + tool.cooldown * 1000 });
    // Update cds reference for next iteration
    cds.length = 0;
    cds.push(...filtered);
  }
  saveCooldowns(cds);
}

/**
 * Get battle history for a user
 */
export function getBattleHistory(userId: number): BattleLog[] {
  const logs = getBattleLogs();
  return logs.filter(
    l => l.attackerId === userId || l.defenderId === userId
  );
}

/**
 * Get recent attacks against a user (for fortress page)
 */
export function getRecentAttacks(userId: number): BattleLog[] {
  const logs = getBattleLogs();
  return logs
    .filter(l => l.defenderId === userId)
    .slice(0, 10);
}

/**
 * Upgrade a defense layer
 */
export function upgradeDefense(
  userId: number,
  layer: keyof DefenseState
): { success: boolean; newLevel: number; cost: number; error?: string } {
  if (layer === 'totalDefensePower') {
    return { success: false, newLevel: 0, cost: 0, error: 'Cannot upgrade total' };
  }

  // Get current defenses
  let defenses: DefenseState;
  try {
    const key = `cyberpaw_defenses_${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) { defenses = JSON.parse(raw); }
    else { defenses = localAuth.getDefenses(); }
  } catch { defenses = localAuth.getDefenses(); }

  const currentLevel = (defenses[layer] as number) || 0;
  if (currentLevel >= 20) {
    return { success: false, newLevel: currentLevel, cost: 0, error: 'Max level reached' };
  }

  const cost = 50 + currentLevel * 25;

  // Check if user has enough XP
  const user = localAuth.me();
  if (!user) {
    return { success: false, newLevel: currentLevel, cost, error: 'Not logged in' };
  }

  const userTotalXp = user.totalXp || 0;
  if (userTotalXp < cost) {
    return { success: false, newLevel: currentLevel, cost, error: 'Not enough XP' };
  }

  // Deduct XP and upgrade
  const newLevel = currentLevel + 1;
  const newDefenses = { ...defenses, [layer]: newLevel };
  newDefenses.totalDefensePower = calculateDefensePower(newDefenses);

  // Save to user-specific key
  localStorage.setItem(`cyberpaw_defenses_${userId}`, JSON.stringify(newDefenses));

  // Also save as default for backward compat
  localStorage.setItem('cyberpaw_defenses', JSON.stringify(newDefenses));

  // Deduct XP
  localAuth.addXp(-cost);

  return { success: true, newLevel, cost };
}

/**
 * Add a tool to the user's inventory
 */
export function addToolToInventory(userId: number, toolId: number): boolean {
  if (userId < 0) return false;
  const inv = localAuth.getInventory();
  if (inv.includes(toolId)) return false;
  if (!ALL_TOOLS.find(t => t.id === toolId)) return false;
  inv.push(toolId);
  localStorage.setItem('cyberpaw_inventory', JSON.stringify(inv));
  return true;
}

/**
 * Get attack type label
 */
export function getAttackTypeLabel(key: string): string {
  return ATTACK_TYPES.find(t => t.key === key)?.label || key;
}

/**
 * Calculate estimated success chance
 */
export function estimateSuccessChance(
  attackerLevel: number,
  toolIds: number[],
  defensePower: number
): number {
  if (toolIds.length === 0 || defensePower <= 0) return 0;

  let totalPower = 0;
  for (const tid of toolIds) {
    const tool = ALL_TOOLS.find(t => t.id === tid);
    if (tool) {
      totalPower += tool.power * tool.tier;
    }
  }
  totalPower += attackerLevel * 2 * toolIds.length;

  const avgPower = totalPower / toolIds.length;
  const ratio = avgPower / defensePower;

  let chance = 0;
  if (ratio > 2.0) chance = 90;
  else if (ratio > 1.3) chance = 70;
  else if (ratio > 0.8) chance = 50;
  else if (ratio > 0.5) chance = 30;
  else chance = 15;

  // Adjust for tool count
  chance += (toolIds.length - 1) * 5;

  return clamp(chance, 5, 95);
}

/* ═════════════════════════════════════════════
   BATTLE CORE
   ═════════════════════════════════════════════ */

/**
 * Launch an attack! The main battle function.
 */
export function launchAttack(
  attackerId: number,
  defenderId: number,
  attackType: string,
  toolIds: number[]
): BattleResult {
  const attacker = localAuth.me();
  if (!attacker) {
    throw new Error('Not authenticated');
  }

  // Resolve defender
  let defenderName: string;
  if (defenderId < 0) {
    const targets = getAvailableTargets(attackerId);
    const bot = targets.find(t => t.userId === defenderId);
    defenderName = bot?.displayName || `Bot_${Math.abs(defenderId)}`;
  } else {
    try {
      const usersRaw = localStorage.getItem('cyberpaw_users');
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        for (const username of Object.keys(users)) {
          if (users[username]?.user?.id === defenderId) {
            defenderName = users[username].user.displayName || username;
            break;
          }
        }
      }
    } catch { /* */ }
    defenderName = defenderName || `Player_${defenderId}`;
  }

  // Get attacker tools
  const attackerTools = toolIds
    .map(id => ALL_TOOLS.find(t => t.id === id))
    .filter((t): t is AttackTool => t !== undefined);

  if (attackerTools.length === 0) {
    throw new Error('No valid tools selected');
  }

  // Get defender defenses
  const defenderDefenses = getPlayerDefenses(defenderId);
  const defensePower = calculateDefensePower(defenderDefenses);

  // Build rounds
  const rounds: BattleRound[] = [];
  let totalDamageDealt = 0;
  let totalDamageBlocked = 0;
  let attackerHp = 100;
  let defenderHp = 100;

  const roundCount = rand(3, 5);

  for (let roundNum = 1; roundNum <= roundCount; roundNum++) {
    const tool = attackerTools[(roundNum - 1) % attackerTools.length];

    // Check cooldown penalty
    const onCooldown = isToolOnCooldown(tool.id);
    const cooldownPenalty = onCooldown ? 0.5 : 1.0;

    // Base power
    const basePower = (tool.power * tool.tier) + (attacker.level * 2);

    // Defense power roll
    const defenderLayer = DEFENSE_LAYERS[rand(0, DEFENSE_LAYERS.length - 1)];
    const layerValue = (defenderDefenses[defenderLayer.key as keyof DefenseState] as number) || 0;
    const layerDefense = defenderLayer.weight * layerValue;

    // Rolls
    const attackerRoll = basePower * (0.8 + Math.random() * 0.4) * cooldownPenalty;
    const defenderRoll = Math.max(1, defensePower * (0.8 + Math.random() * 0.4) * (0.7 + Math.random() * 0.3));

    // Stealth bonus
    let ratio = attackerRoll / defenderRoll;
    if (tool.stealthLevel > 3) {
      ratio *= 1.2;
    }

    // Determine result for this round
    let damage = 0;
    let blocked = 0;
    let message = '';

    if (ratio > 2.0) {
      damage = rand(50, 80);
      blocked = rand(0, 5);
      message = `${tool.name} CRUSHED the ${defenderLayer.name}!`;
    } else if (ratio > 1.3) {
      damage = rand(25, 50);
      blocked = rand(5, 15);
      message = `${tool.name} breached the ${defenderLayer.name}!`;
    } else if (ratio > 0.8) {
      damage = rand(10, 25);
      blocked = rand(10, 25);
      message = `${tool.name} partially got through ${defenderLayer.name}`;
    } else if (ratio > 0.5) {
      damage = rand(0, 10);
      blocked = rand(20, 40);
      message = `${defenderLayer.name} defended against ${tool.name}`;
    } else {
      damage = 0;
      blocked = rand(30, 50);
      message = `${defenderLayer.name} completely blocked ${tool.name}!`;
    }

    // Apply attack type bonus
    const attackTypeBonus = ['zero_day', 'ransomware', 'mitm'].includes(attackType) ? 1.15 :
      ['sql_injection', 'trojan'].includes(attackType) ? 1.1 : 1.0;
    damage = Math.floor(damage * attackTypeBonus);

    totalDamageDealt += damage;
    totalDamageBlocked += blocked;

    // Apply to HP
    defenderHp = clamp(defenderHp - damage, 0, 100);
    // Attacker takes some counter-damage on failed rounds
    if (damage === 0) {
      const counterDamage = rand(2, 8);
      attackerHp = clamp(attackerHp - counterDamage, 0, 100);
    }

    rounds.push({
      round: roundNum,
      attackerTool: tool.name,
      defenderLayer: defenderLayer.name,
      damage,
      blocked,
      message,
      attackerRoll: Math.round(attackerRoll),
      defenderRoll: Math.round(defenderRoll),
    });

    // Early termination
    if (defenderHp <= 0 || attackerHp <= 0) break;
  }

  // Determine final result
  const won = defenderHp < attackerHp;
  let result: BattleResult['result'];

  if (totalDamageDealt >= 120) result = 'full_breach';
  else if (totalDamageDealt >= 60) result = 'breach';
  else if (totalDamageDealt >= 25) result = 'partial';
  else if (totalDamageDealt >= 5) result = 'defended';
  else result = 'blocked';

  // Calculate XP
  let xpGained = 0;
  if (result === 'full_breach') xpGained = rand(80, 120);
  else if (result === 'breach') xpGained = rand(40, 80);
  else if (result === 'partial') xpGained = rand(15, 40);
  else if (result === 'defended') xpGained = rand(5, 15);
  else xpGained = rand(1, 5);

  // Level difference bonus/penalty
  const defenderLevel = defenderId < 0 ? Math.abs(defenderId) % 20 + 1 : 1;
  const levelDiff = defenderLevel - attacker.level;
  if (levelDiff > 0) {
    xpGained = Math.floor(xpGained * (1 + levelDiff * 0.1));
  }

  // Apply XP
  localAuth.addXp(xpGained);

  // Set cooldowns
  setCooldowns(toolIds);

  // Activate defender shield
  activateShield(defenderId);

  // Update stats
  const stats = localAuth.getStats();
  const newStats: Record<string, number> = {
    attacksLaunched: (stats.attacksLaunched || 0) + 1,
  };
  if (won) {
    newStats.duelsWon = (stats.duelsWon || 0) + 1;
    newStats.currentStreak = (stats.currentStreak || 0) + 1;
    newStats.bestStreak = Math.max(stats.bestStreak || 0, newStats.currentStreak);
    newStats.rankPoints = (stats.rankPoints || 100) + 10;
  } else {
    newStats.duelsLost = (stats.duelsLost || 0) + 1;
    newStats.currentStreak = 0;
    newStats.rankPoints = Math.max(0, (stats.rankPoints || 100) - 5);
  }
  localAuth.updateStats(newStats);

  // Save battle log
  const battleLog: BattleLog = {
    id: `battle_${Date.now()}_${rand(1000, 9999)}`,
    attackerId,
    attackerName: attacker.displayName || attacker.username,
    defenderId,
    defenderName: defenderName!,
    result,
    damageDealt: totalDamageDealt,
    damageBlocked: totalDamageBlocked,
    xpGained,
    attackType,
    createdAt: new Date().toISOString(),
    replay: {
      rounds,
      attackerName: attacker.displayName || attacker.username,
      defenderName: defenderName!,
      finalAttackerHp: attackerHp,
      finalDefenderHp: defenderHp,
    },
  };

  const logs = getBattleLogs();
  logs.unshift(battleLog);
  saveBattleLogs(logs);

  return {
    result,
    damageDealt: totalDamageDealt,
    damageBlocked: totalDamageBlocked,
    xpGained,
    toolsUsed: toolIds,
    attackType,
    replay: battleLog.replay,
    won,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Initialize a player's defense data properly
 */
export function initPlayerDefenses(userId: number) {
  const key = `cyberpaw_defenses_${userId}`;
  if (!localStorage.getItem(key)) {
    const defaults = localAuth.getDefenses();
    localStorage.setItem(key, JSON.stringify(defaults));
  }
}

/**
 * Get a user's defenses
 */
export function getUserDefenses(userId: number): DefenseState {
  return getPlayerDefenses(userId);
}

/**
 * Get win/loss ratio for display
 */
export function getWinLossRatio(wins: number, losses: number): string {
  if (wins + losses === 0) return '0.0';
  return (wins / Math.max(losses, 1)).toFixed(1);
}
