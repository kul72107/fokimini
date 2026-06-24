import { getDb } from "./queries/connection";
import { cyberTools, achievements } from "./schema";

/* ═══════════════════════════════════════════════════════════════════════
   SEED: Cyber Tools (Arsenal)
   ═══════════════════════════════════════════════════════════════════════ */

const TOOLS = [
  // ─── RECON ───
  { toolId: "port_scanner", name: "Port Scanner", description: "Scan target systems to discover open ports and services", category: "recon" as const, power: 15, cooldown: 30, defenseBreak: 5, stealthLevel: 3, unlockLevel: 1, icon: "scan", tier: 1 },
  { toolId: "dns_lookup", name: "DNS Lookup", description: "Query DNS records to map target infrastructure", category: "recon" as const, power: 10, cooldown: 20, defenseBreak: 2, stealthLevel: 4, unlockLevel: 1, icon: "search", tier: 1 },
  { toolId: "whois_lookup", name: "Whois Lookup", description: "Gather domain registration and ownership information", category: "recon" as const, power: 8, cooldown: 15, defenseBreak: 0, stealthLevel: 5, unlockLevel: 2, icon: "globe", tier: 1 },
  { toolId: "subdomain_finder", name: "Subdomain Finder", description: "Discover hidden subdomains of a target", category: "recon" as const, power: 12, cooldown: 45, defenseBreak: 3, stealthLevel: 3, unlockLevel: 3, icon: "sitemap", tier: 1 },
  { toolId: "osint_scanner", name: "OSINT Scanner", description: "Aggregate publicly available intelligence on targets", category: "recon" as const, power: 18, cooldown: 60, defenseBreak: 4, stealthLevel: 4, unlockLevel: 4, icon: "eye", tier: 1 },
  // ─── NETWORK ───
  { toolId: "packet_sniffer", name: "Packet Sniffer", description: "Intercept and analyze network traffic", category: "network" as const, power: 20, cooldown: 40, defenseBreak: 8, stealthLevel: 2, unlockLevel: 3, icon: "wifi", tier: 1 },
  { toolId: "traceroute", name: "Traceroute", description: "Map the network path to a target", category: "network" as const, power: 10, cooldown: 25, defenseBreak: 2, stealthLevel: 4, unlockLevel: 1, icon: "route", tier: 1 },
  { toolId: "netstat", name: "Netstat Pro", description: "Analyze active network connections", category: "network" as const, power: 12, cooldown: 20, defenseBreak: 3, stealthLevel: 3, unlockLevel: 2, icon: "activity", tier: 1 },
  { toolId: "arp_spoofer", name: "ARP Spoofer", description: "Redirect network traffic through your system", category: "network" as const, power: 25, cooldown: 90, defenseBreak: 12, stealthLevel: 1, unlockLevel: 5, icon: "shuffle", tier: 1 },
  // ─── WEB ───
  { toolId: "sql_injector", name: "SQL Injector", description: "Inject malicious SQL to extract or manipulate database data", category: "web" as const, power: 30, cooldown: 60, defenseBreak: 15, stealthLevel: 2, unlockLevel: 5, icon: "database", tier: 1 },
  { toolId: "xss_payload", name: "XSS Payload", description: "Inject scripts into web pages to steal session data", category: "web" as const, power: 25, cooldown: 50, defenseBreak: 10, stealthLevel: 2, unlockLevel: 5, icon: "code", tier: 1 },
  { toolId: "dir_buster", name: "Directory Buster", description: "Brute force hidden directories and files on web servers", category: "web" as const, power: 18, cooldown: 45, defenseBreak: 6, stealthLevel: 1, unlockLevel: 3, icon: "folder-open", tier: 1 },
  { toolId: "waf_tester", name: "WAF Tester", description: "Test and bypass Web Application Firewall rules", category: "web" as const, power: 22, cooldown: 55, defenseBreak: 12, stealthLevel: 2, unlockLevel: 6, icon: "shield-off", tier: 1 },
  // ─── CRYPTO ───
  { toolId: "hash_cracker", name: "Hash Cracker", description: "Crack password hashes using dictionary and brute force", category: "crypto" as const, power: 20, cooldown: 120, defenseBreak: 15, stealthLevel: 1, unlockLevel: 4, icon: "unlock", tier: 1 },
  { toolId: "caesar_decoder", name: "Caesar Decoder", description: "Break Caesar cipher and ROT encryption", category: "crypto" as const, power: 8, cooldown: 15, defenseBreak: 0, stealthLevel: 5, unlockLevel: 1, icon: "key", tier: 1 },
  { toolId: "base64_tool", name: "Base64 Tool", description: "Encode/decode Base64 and analyze encoded data", category: "crypto" as const, power: 5, cooldown: 10, defenseBreak: 0, stealthLevel: 5, unlockLevel: 1, icon: "file-code", tier: 1 },
  { toolId: "xor_tool", name: "XOR Cipher Tool", description: "Break XOR encryption with known-plaintext attacks", category: "crypto" as const, power: 15, cooldown: 40, defenseBreak: 5, stealthLevel: 3, unlockLevel: 3, icon: "binary", tier: 1 },
  // ─── MALWARE ───
  { toolId: "trojan_builder", name: "Trojan Builder", description: "Create trojan horses disguised as legitimate software", category: "malware" as const, power: 35, cooldown: 100, defenseBreak: 18, stealthLevel: 4, unlockLevel: 8, icon: "bug", tier: 1 },
  { toolId: "keylogger_sim", name: "Keylogger Sim", description: "Simulate keystroke capture on target systems", category: "malware" as const, power: 28, cooldown: 80, defenseBreak: 14, stealthLevel: 3, unlockLevel: 7, icon: "keyboard", tier: 1 },
  { toolId: "ransomware_sim", name: "Ransomware Sim", description: "Simulate file encryption and ransom demands", category: "malware" as const, power: 40, cooldown: 150, defenseBreak: 25, stealthLevel: 1, unlockLevel: 10, icon: "lock", tier: 1 },
  // ─── SOCIAL ───
  { toolId: "phishing_kit", name: "Phishing Kit", description: "Craft deceptive emails and landing pages", category: "social" as const, power: 22, cooldown: 50, defenseBreak: 10, stealthLevel: 3, unlockLevel: 4, icon: "mail", tier: 1 },
  { toolId: "social_profiler", name: "Social Profiler", description: "Build psychological profiles from social media data", category: "social" as const, power: 18, cooldown: 60, defenseBreak: 8, stealthLevel: 4, unlockLevel: 5, icon: "users", tier: 1 },
  { toolId: "pretext_engine", name: "Pretext Engine", description: "Create convincing social engineering scenarios", category: "social" as const, power: 25, cooldown: 70, defenseBreak: 12, stealthLevel: 4, unlockLevel: 6, icon: "message-circle", tier: 1 },
  // ─── DEFENSE ───
  { toolId: "firewall_config", name: "Firewall Config", description: "Configure advanced firewall rules to block attacks", category: "defense" as const, power: 20, cooldown: 30, defenseBreak: 0, stealthLevel: 5, unlockLevel: 1, icon: "shield", tier: 1 },
  { toolId: "ids_setup", name: "IDS Setup", description: "Deploy Intrusion Detection System with custom rules", category: "defense" as const, power: 25, cooldown: 45, defenseBreak: 0, stealthLevel: 5, unlockLevel: 2, icon: "radar", tier: 1 },
  { toolId: "honeypot_deploy", name: "Honeypot Deploy", description: "Deploy decoy systems to trap attackers", category: "defense" as const, power: 30, cooldown: 60, defenseBreak: 0, stealthLevel: 5, unlockLevel: 4, icon: "bot", tier: 1 },
  { toolId: "anti_virus", name: "Anti-Virus Suite", description: "Scan and neutralize malware infections", category: "defense" as const, power: 22, cooldown: 35, defenseBreak: 0, stealthLevel: 5, unlockLevel: 1, icon: "shield-check", tier: 1 },
  { toolId: "encrypt_vault", name: "Encryption Vault", description: "Military-grade encryption for sensitive data", category: "defense" as const, power: 28, cooldown: 40, defenseBreak: 0, stealthLevel: 5, unlockLevel: 3, icon: "lock", tier: 1 },
  { toolId: "backup_system", name: "Backup System", description: "Create redundant backups to survive ransomware", category: "defense" as const, power: 18, cooldown: 50, defenseBreak: 0, stealthLevel: 5, unlockLevel: 2, icon: "save", tier: 1 },
  // ─── ADVANCED ───
  { toolId: "zero_day", name: "Zero-Day Exploit", description: "Use unknown vulnerabilities — the ultimate weapon", category: "advanced" as const, power: 60, cooldown: 300, defenseBreak: 40, stealthLevel: 2, unlockLevel: 15, icon: "zap", tier: 1 },
  { toolId: "apt_sim", name: "APT Simulator", description: "Advanced Persistent Threat — long-term infiltration", category: "advanced" as const, power: 45, cooldown: 200, defenseBreak: 30, stealthLevel: 5, unlockLevel: 12, icon: "ghost", tier: 1 },
  { toolId: "botnet_control", name: "Botnet Control", description: "Command a network of compromised devices", category: "advanced" as const, power: 50, cooldown: 240, defenseBreak: 35, stealthLevel: 1, unlockLevel: 14, icon: "network", tier: 1 },
  { toolId: "rootkit_builder", name: "Rootkit Builder", description: "Deep system-level backdoor for total control", category: "advanced" as const, power: 55, cooldown: 280, defenseBreak: 38, stealthLevel: 3, unlockLevel: 16, icon: "terminal", tier: 1 },
];

/* ═══════════════════════════════════════════════════════════════════════
   SEED: Achievements
   ═══════════════════════════════════════════════════════════════════════ */

const ACHIEVEMENTS = [
  { achievementId: "first_login", name: "Script Kitten", description: "Log in for the first time", category: "beginner" as const, xpReward: 25, rarity: "common" as const, icon: "cat", requirement: "Complete first login" },
  { achievementId: "first_game", name: "Hello World", description: "Complete your first training game", category: "beginner" as const, xpReward: 50, rarity: "common" as const, icon: "play", requirement: "Complete 1 training game" },
  { achievementId: "all_beginner", name: "Padawan", description: "Complete all beginner-level training games", category: "beginner" as const, xpReward: 200, rarity: "rare" as const, icon: "star", requirement: "Complete 8 beginner games" },
  { achievementId: "all_training", name: "Cyber Graduate", description: "Complete all 24 training games", category: "explorer" as const, xpReward: 1000, rarity: "epic" as const, icon: "graduation-cap", requirement: "Complete all 24 training games" },
  { achievementId: "level_5", name: "Script Kitty", description: "Reach level 5", category: "beginner" as const, xpReward: 100, rarity: "common" as const, icon: "trending-up", requirement: "Reach level 5" },
  { achievementId: "level_10", name: "Code Monkey", description: "Reach level 10", category: "explorer" as const, xpReward: 250, rarity: "rare" as const, icon: "code", requirement: "Reach level 10" },
  { achievementId: "level_20", name: "Elite Hacker", description: "Reach level 20", category: "hacker" as const, xpReward: 500, rarity: "epic" as const, icon: "crown", requirement: "Reach level 20" },
  { achievementId: "level_30", name: "Cyber Lord", description: "Reach level 30", category: "master" as const, xpReward: 1000, rarity: "legendary" as const, icon: "king", requirement: "Reach level 30" },
  { achievementId: "first_attack", name: "First Blood", description: "Launch your first attack", category: "combat" as const, xpReward: 100, rarity: "common" as const, icon: "sword", requirement: "Launch 1 attack" },
  { achievementId: "attacks_10", name: "Script Runner", description: "Launch 10 successful attacks", category: "combat" as const, xpReward: 200, rarity: "rare" as const, icon: "zap", requirement: "Win 10 attacks" },
  { achievementId: "attacks_50", name: "Digital Assassin", description: "Launch 50 successful attacks", category: "combat" as const, xpReward: 500, rarity: "epic" as const, icon: "skull", requirement: "Win 50 attacks" },
  { achievementId: "attacks_100", name: "Cyber Warlord", description: "Launch 100 successful attacks", category: "combat" as const, xpReward: 1000, rarity: "legendary" as const, icon: "flame", requirement: "Win 100 attacks" },
  { achievementId: "first_defense", name: "Shield Up", description: "Successfully defend against an attack", category: "defense" as const, xpReward: 100, rarity: "common" as const, icon: "shield", requirement: "Defend 1 attack" },
  { achievementId: "defenses_10", name: "Iron Wall", description: "Defend against 10 attacks", category: "defense" as const, xpReward: 200, rarity: "rare" as const, icon: "castle", requirement: "Defend 10 attacks" },
  { achievementId: "defenses_50", name: "Fort Knox", description: "Defend against 50 attacks", category: "defense" as const, xpReward: 500, rarity: "epic" as const, icon: "gem", requirement: "Defend 50 attacks" },
  { achievementId: "streak_7", name: "Week Warrior", description: "Maintain a 7-day streak", category: "explorer" as const, xpReward: 150, rarity: "rare" as const, icon: "calendar", requirement: "7-day streak" },
  { achievementId: "streak_30", name: "Dedicated Hacker", description: "Maintain a 30-day streak", category: "master" as const, xpReward: 500, rarity: "epic" as const, icon: "award", requirement: "30-day streak" },
  { achievementId: "tools_10", name: "Arsenal Builder", description: "Unlock 10 different tools", category: "explorer" as const, xpReward: 150, rarity: "rare" as const, icon: "tool", requirement: "Own 10 tools" },
  { achievementId: "tools_all", name: "Weapon Master", description: "Unlock all tools", category: "legend" as const, xpReward: 1000, rarity: "legendary" as const, icon: "briefcase", requirement: "Own all 30 tools" },
  { achievementId: "first_duel", name: "Duelist", description: "Win your first 1v1 duel", category: "combat" as const, xpReward: 150, rarity: "common" as const, icon: "crosshair", requirement: "Win 1 duel" },
  { achievementId: "duels_10", name: "Gladiator", description: "Win 10 duels", category: "combat" as const, xpReward: 300, rarity: "rare" as const, icon: "trophy", requirement: "Win 10 duels" },
  { achievementId: "zero_day_use", name: "Zero-Day Pioneer", description: "Use a Zero-Day exploit successfully", category: "hacker" as const, xpReward: 500, rarity: "legendary" as const, icon: "sparkles", requirement: "Use zero_day tool once" },
  { achievementId: "perfect_score", name: "Perfect Hacker", description: "Get 100% score on any training game", category: "explorer" as const, xpReward: 200, rarity: "epic" as const, icon: "target", requirement: "100% on any game" },
  { achievementId: "revenge", name: "Revenge Served", description: "Successfully revenge an attack", category: "combat" as const, xpReward: 200, rarity: "rare" as const, icon: "rotate-ccw", requirement: "Win 1 revenge attack" },
  { achievementId: "first_place", name: "Top of the World", description: "Reach #1 on the weekly leaderboard", category: "legend" as const, xpReward: 1000, rarity: "legendary" as const, icon: "medal", requirement: "Weekly rank #1" },
  { achievementId: "social_engineer", name: "Master Manipulator", description: "Win using only social engineering tools", category: "social" as const, xpReward: 300, rarity: "epic" as const, icon: "smile", requirement: "Win with social tools only" },
  { achievementId: "night_owl", name: "Night Owl", description: "Play at 3 AM", category: "special" as const, xpReward: 50, rarity: "common" as const, icon: "moon", requirement: "Login at 3 AM" },
  { achievementId: "speed_run", name: "Speed Demon", description: "Complete a training game in under 30 seconds", category: "special" as const, xpReward: 100, rarity: "rare" as const, icon: "timer", requirement: "Any game < 30s" },
  { achievementId: "all_stars", name: "Star Collector", description: "Earn 3 stars on all training games", category: "master" as const, xpReward: 2000, rarity: "legendary" as const, icon: "sparkle", requirement: "3 stars on all 24 games" },
  { achievementId: "combo_5", name: "Combo King", description: "Win 5 attacks in a row", category: "combat" as const, xpReward: 300, rarity: "epic" as const, icon: "flame", requirement: "5-attack win streak" },
  { achievementId: "welcome", name: "Welcome to CyberPaw", description: "Join the CyberPaw Arena", category: "beginner" as const, xpReward: 25, rarity: "common" as const, icon: "paw", requirement: "Join the platform" },
];

/* ═══════════════════════════════════════════════════════════════════════
   SEED FUNCTION
   ═══════════════════════════════════════════════════════════════════════ */

export async function seed() {
  const db = getDb();

  // Seed cyber tools
  for (const tool of TOOLS) {
    await db.insert(cyberTools).values(tool).onDuplicateKeyUpdate({ set: tool });
  }
  console.log(`Seeded ${TOOLS.length} cyber tools`);

  // Seed achievements
  for (const ach of ACHIEVEMENTS) {
    await db.insert(achievements).values(ach).onDuplicateKeyUpdate({ set: ach });
  }
  console.log(`Seeded ${ACHIEVEMENTS.length} achievements`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
