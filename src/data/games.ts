export type GameCategory =
  | 'All'
  | 'Passwords'
  | 'Phishing'
  | 'Firewall'
  | 'Encryption'
  | 'Malware'
  | 'Networking'
  | 'Cryptography'
  | 'Web Security'
  | 'Forensics'
  | 'Tools';

export type GameId =
  | 'password-quest'
  | 'phishing-detective'
  | 'firewall-defender'
  | 'crypto-cat'
  | 'malware-hunter'
  | 'network-navigator'
  | 'ssl-handshake'
  | 'dns-resolver'
  | 'packet-tracer'
  | 'subnet-calculator'
  | 'vpn-tunnel'
  | 'load-balancer'
  | 'ids-alert'
  | 'certificate-chain'
  | 'proxy-server'
  | 'port-scanner'
  | 'encryption-pipeline'
  | 'sql-safari'
  | 'stego-spy'
  | 'xss-xpert'
  | 'cert-champion'
  | 'hash-hacker'
  | 'access-ace'
  | 'log-analyzer'
  | 'nmap-scanner'
  | 'dns-lookup-gui'
  | 'whois-lookup'
  | 'sql-injector-gui'
  | 'xss-tester-gui'
  | 'hash-cracker-gui'
  | 'phishing-sim-gui'
  | 'cert-viewer-gui'
  | 'advanced-port-scan'
  | 'network-packet-tracer'
  | 'xor-tool'
  | 'trojan-builder'
  | 'keylogger-sim'
  | 'cyber-duel-arena';

export interface Game {
  id: GameId;
  title: string;
  description: string;
  category: GameCategory;
  difficulty: 1 | 2 | 3;
  iconType: 'password' | 'phishing' | 'firewall' | 'encryption' | 'network' | 'malware' | 'terminal' | 'web' | 'crypto' | 'forensics' | 'mixed' | 'tools';
  thumbnail: string;
  isLocked: boolean;
  xpReward: number;
  unlockRequirement?: string;
  playerCount: number;
}

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const categories: GameCategory[] = [
  'All',
  'Passwords',
  'Phishing',
  'Firewall',
  'Encryption',
  'Malware',
  'Networking',
  'Cryptography',
  'Web Security',
  'Forensics',
  'Tools',
];

/* ═══════════════════════════════════════════════════════════════════════
   24 GAMES — 17 with playable simulations, 7 Coming Soon placeholders
   All games are UNLOCKED (isLocked: false)
   ═══════════════════════════════════════════════════════════════════════ */

export const games: Game[] = [
  // ═══════════════════ 17 PLAYABLE SIMULATIONS ═══════════════════
  {
    id: 'password-quest',
    title: 'Password Quest',
    description: 'Build the strongest password to protect the castle! Learn what makes passwords secure.',
    category: 'Passwords',
    difficulty: 1,
    iconType: 'password',
    thumbnail: asset('thumb-password-quest.jpg'),
    isLocked: false,
    xpReward: 100,
    playerCount: 12450,
  },
  {
    id: 'phishing-detective',
    title: 'Phishing Detective',
    description: 'Spot the fake emails before they trick you! Analyze emails for suspicious signs.',
    category: 'Phishing',
    difficulty: 1,
    iconType: 'phishing',
    thumbnail: asset('thumb-phishing-detective.jpg'),
    isLocked: false,
    xpReward: 100,
    playerCount: 11200,
  },
  {
    id: 'firewall-defender',
    title: 'Firewall Defender',
    description: 'Stop evil packets from breaching your wall! Allow good traffic, block the bad.',
    category: 'Firewall',
    difficulty: 2,
    iconType: 'firewall',
    thumbnail: asset('thumb-firewall-defender.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 8900,
  },
  {
    id: 'crypto-cat',
    title: 'Crypto Cat',
    description: 'Crack secret codes and learn how encryption works! Decode Caesar cipher messages.',
    category: 'Encryption',
    difficulty: 1,
    iconType: 'encryption',
    thumbnail: asset('thumb-crypto-cat.jpg'),
    isLocked: false,
    xpReward: 100,
    playerCount: 9800,
  },
  {
    id: 'malware-hunter',
    title: 'Malware Hunter',
    description: 'Hunt down and remove nasty viruses from the system! Click fast to catch them all.',
    category: 'Malware',
    difficulty: 1,
    iconType: 'malware',
    thumbnail: asset('thumb-malware-hunter.jpg'),
    isLocked: false,
    xpReward: 100,
    playerCount: 13500,
  },
  {
    id: 'network-navigator',
    title: 'Network Navigator',
    description: 'Guide data packets safely through the network maze! 8 puzzle levels with firewalls and malware traps.',
    category: 'Networking',
    difficulty: 2,
    iconType: 'network',
    thumbnail: asset('thumb-network-navigator.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 7600,
  },
  {
    id: 'cyber-duel-arena',
    title: 'Cyber Duel Arena',
    description: 'Build a six-slot simuletool loadout, read live service evidence, and defend uptime in a safe service-defense duel.',
    category: 'Firewall',
    difficulty: 3,
    iconType: 'firewall',
    thumbnail: asset('thumb-firewall-defender.jpg'),
    isLocked: false,
    xpReward: 220,
    playerCount: 4200,
  },
  // ─── 12 NEW v2 SIMULATIONS ───
  {
    id: 'ssl-handshake',
    title: 'SSL Handshake',
    description: 'Step through the TLS handshake between Client and Server! Learn how HTTPS secures connections.',
    category: 'Encryption',
    difficulty: 1,
    iconType: 'encryption',
    thumbnail: asset('thumb-cert-champion.jpg'),
    isLocked: false,
    xpReward: 120,
    playerCount: 6200,
  },
  {
    id: 'dns-resolver',
    title: 'DNS Resolver',
    description: 'Follow a domain name through the DNS resolution chain! From browser to IP address.',
    category: 'Networking',
    difficulty: 1,
    iconType: 'network',
    thumbnail: asset('thumb-network-navigator.jpg'),
    isLocked: false,
    xpReward: 120,
    playerCount: 5800,
  },
  {
    id: 'packet-tracer',
    title: 'Packet Tracer',
    description: 'Build and send a packet through the network! Watch it hop from device to device.',
    category: 'Networking',
    difficulty: 2,
    iconType: 'network',
    thumbnail: asset('thumb-network-navigator.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 5100,
  },
  {
    id: 'subnet-calculator',
    title: 'Subnet Calculator',
    description: 'Divide networks into subnets like a real network admin! IP and subnet mask puzzle.',
    category: 'Networking',
    difficulty: 2,
    iconType: 'network',
    thumbnail: asset('thumb-network-navigator.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 4300,
  },
  {
    id: 'vpn-tunnel',
    title: 'VPN Tunnel',
    description: 'Create a secure VPN tunnel between networks! Authenticate, exchange keys, encrypt traffic.',
    category: 'Networking',
    difficulty: 2,
    iconType: 'network',
    thumbnail: asset('thumb-network-navigator.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 4900,
  },
  {
    id: 'load-balancer',
    title: 'Load Balancer',
    description: 'Distribute incoming traffic across servers! Use algorithms to keep all servers healthy.',
    category: 'Networking',
    difficulty: 2,
    iconType: 'network',
    thumbnail: asset('thumb-network-navigator.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 4600,
  },
  {
    id: 'ids-alert',
    title: 'IDS Alert Analyzer',
    description: 'Analyze Intrusion Detection alerts and choose the right response! Spot real attacks.',
    category: 'Firewall',
    difficulty: 3,
    iconType: 'firewall',
    thumbnail: asset('thumb-firewall-defender.jpg'),
    isLocked: false,
    xpReward: 180,
    playerCount: 4100,
  },
  {
    id: 'certificate-chain',
    title: 'Certificate Chain',
    description: 'Validate a chain of digital certificates from Root CA to server! Learn PKI.',
    category: 'Encryption',
    difficulty: 3,
    iconType: 'encryption',
    thumbnail: asset('thumb-cert-champion.jpg'),
    isLocked: false,
    xpReward: 180,
    playerCount: 3900,
  },
  {
    id: 'proxy-server',
    title: 'Proxy Server',
    description: 'Configure a proxy server! Cache content, filter sites, and anonymize traffic.',
    category: 'Web Security',
    difficulty: 2,
    iconType: 'web',
    thumbnail: asset('thumb-xss-xpert.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 4500,
  },
  {
    id: 'port-scanner',
    title: 'Port Scanner',
    description: 'Scan a target server and discover open ports! Identify services like a security pro.',
    category: 'Networking',
    difficulty: 1,
    iconType: 'network',
    thumbnail: asset('thumb-network-navigator.jpg'),
    isLocked: false,
    xpReward: 120,
    playerCount: 6700,
  },
  {
    id: 'encryption-pipeline',
    title: 'Encryption Pipeline',
    description: 'Watch data transform through encryption! Plain text to cipher text step by step.',
    category: 'Encryption',
    difficulty: 1,
    iconType: 'encryption',
    thumbnail: asset('thumb-crypto-cat.jpg'),
    isLocked: false,
    xpReward: 120,
    playerCount: 5400,
  },
  // ═══════════════════ 7 COMING SOON PLACEHOLDERS ═══════════════════
  {
    id: 'sql-safari',
    title: 'SQL Safari',
    description: 'Explore the database jungle and find hidden treasures! Learn SQL injection safety.',
    category: 'Web Security',
    difficulty: 2,
    iconType: 'crypto',
    thumbnail: asset('thumb-sql-safari.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 6400,
  },
  {
    id: 'stego-spy',
    title: 'Stego Spy',
    description: 'Find secret messages hidden inside images! Uncover the art of steganography.',
    category: 'Forensics',
    difficulty: 3,
    iconType: 'forensics',
    thumbnail: asset('thumb-stego-spy.jpg'),
    isLocked: false,
    xpReward: 200,
    playerCount: 5200,
  },
  {
    id: 'xss-xpert',
    title: 'XSS Xpert',
    description: 'Defend websites from sneaky script attacks! Sanitize inputs to keep sites safe.',
    category: 'Web Security',
    difficulty: 2,
    iconType: 'web',
    thumbnail: asset('thumb-xss-xpert.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 5800,
  },
  {
    id: 'cert-champion',
    title: 'Cert Champion',
    description: 'Assemble digital certificates to prove identity! Learn how HTTPS really works.',
    category: 'Encryption',
    difficulty: 3,
    iconType: 'encryption',
    thumbnail: asset('thumb-cert-champion.jpg'),
    isLocked: false,
    xpReward: 200,
    playerCount: 4100,
  },
  {
    id: 'hash-hacker',
    title: 'Hash Hacker',
    description: 'Learn how hashing keeps passwords super safe! Match hashes to crack the code.',
    category: 'Cryptography',
    difficulty: 2,
    iconType: 'crypto',
    thumbnail: asset('thumb-sql-safari.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 5300,
  },
  {
    id: 'access-ace',
    title: 'Access Ace',
    description: 'Master access control and permissions! Learn who gets access to what and why.',
    category: 'Passwords',
    difficulty: 2,
    iconType: 'password',
    thumbnail: asset('thumb-password-quest.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 5600,
  },
  {
    id: 'log-analyzer',
    title: 'Log Analyzer',
    description: 'Read system logs like a detective solving a case! Find evidence of intrusions.',
    category: 'Forensics',
    difficulty: 3,
    iconType: 'forensics',
    thumbnail: asset('thumb-phishing-detective.jpg'),
    isLocked: false,
    xpReward: 200,
    playerCount: 3400,
  },
  /* ═══════════════════ 10 GUI CYBER TOOLS ═══════════════════ */
  {
    id: 'nmap-scanner',
    title: 'Nmap Scanner Pro',
    description: 'Interactive GUI port scanner! Select target, choose scan type, and watch the laser sweep across the port grid in real-time.',
    category: 'Tools',
    difficulty: 1,
    iconType: 'tools',
    thumbnail: asset('thumb-network-navigator.jpg'),
    isLocked: false,
    xpReward: 120,
    playerCount: 5200,
  },
  {
    id: 'dns-lookup-gui',
    title: 'DNS Lookup',
    description: 'Visual DNS resolver! Trace the query path from your device through Root, TLD, and Authoritative servers. See animated packet journey!',
    category: 'Tools',
    difficulty: 1,
    iconType: 'tools',
    thumbnail: asset('thumb-network-navigator.jpg'),
    isLocked: false,
    xpReward: 100,
    playerCount: 4800,
  },
  {
    id: 'whois-lookup',
    title: 'Whois Lookup',
    description: 'Domain intelligence explorer! Look up any domain and see registrar info, ownership, expiry dates, and name servers in beautiful cards.',
    category: 'Tools',
    difficulty: 1,
    iconType: 'tools',
    thumbnail: asset('thumb-cert-champion.jpg'),
    isLocked: false,
    xpReward: 100,
    playerCount: 4100,
  },
  {
    id: 'sql-injector-gui',
    title: 'SQL Injector',
    description: 'Test SQL injection vulnerabilities! Pick payloads, see live query visualization with pulsing red injection, and learn how to fix with parameterized queries.',
    category: 'Tools',
    difficulty: 2,
    iconType: 'tools',
    thumbnail: asset('thumb-sql-safari.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 5500,
  },
  {
    id: 'xss-tester-gui',
    title: 'XSS Tester',
    description: 'Find cross-site scripting vulnerabilities! Use the X-Ray mode to reveal hidden scripts, see cookie theft animations, and learn proper sanitization.',
    category: 'Tools',
    difficulty: 2,
    iconType: 'tools',
    thumbnail: asset('thumb-xss-xpert.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 4900,
  },
  {
    id: 'hash-cracker-gui',
    title: 'Hash Cracker',
    description: 'Crack password hashes with style! Watch the animated gear machine, use 4 attack methods, and see real-time attempt counter. MD5, SHA-1, SHA-256!',
    category: 'Tools',
    difficulty: 2,
    iconType: 'tools',
    thumbnail: asset('thumb-crypto-cat.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 4600,
  },
  {
    id: 'phishing-sim-gui',
    title: 'Phishing Simulator',
    description: 'Build phishing emails and learn to spot them! 10 real vs fake emails to analyze. Learn the indicators: urgency, spoofed domains, suspicious links!',
    category: 'Tools',
    difficulty: 1,
    iconType: 'tools',
    thumbnail: asset('thumb-phishing-detective.jpg'),
    isLocked: false,
    xpReward: 120,
    playerCount: 5100,
  },
  {
    id: 'cert-viewer-gui',
    title: 'SSL Certificate Inspector',
    description: 'Inspect SSL certificates visually! See the chain from Root CA to Server Cert, get a security grade (A+ to F), and identify expired or self-signed certs.',
    category: 'Tools',
    difficulty: 1,
    iconType: 'tools',
    thumbnail: asset('thumb-cert-champion.jpg'),
    isLocked: false,
    xpReward: 100,
    playerCount: 4300,
  },
  {
    id: 'advanced-port-scan',
    title: 'Advanced Port Scanner',
    description: 'Visual packet attack simulation! Colored dots fly from attacker to target server. Control speed, pause/resume, and see live results with service banners.',
    category: 'Tools',
    difficulty: 2,
    iconType: 'tools',
    thumbnail: asset('thumb-network-navigator.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 4400,
  },
  {
    id: 'network-packet-tracer',
    title: 'Network Packet Tracer',
    description: 'Build a packet and trace its journey! Set source/dest IPs, choose protocol, and watch the packet travel through Router, Firewall, Switch to the target server.',
    category: 'Tools',
    difficulty: 2,
    iconType: 'tools',
    thumbnail: asset('thumb-network-navigator.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 4700,
  },
  {
    id: 'xor-tool',
    title: 'XOR Crypto Lab',
    description: 'Visualize XOR encryption in real-time! See bit-level operations with color-coded 0s and 1s, toggle between hex/binary/ASCII output, and launch a key reuse attack with crib dragging.',
    category: 'Cryptography',
    difficulty: 2,
    iconType: 'crypto',
    thumbnail: asset('thumb-crypto-cat.jpg'),
    isLocked: false,
    xpReward: 150,
    playerCount: 5200,
  },
  {
    id: 'trojan-builder',
    title: 'Trojan Builder Lab',
    description: 'Build a trojan step-by-step! Assemble Dropper, Payload, Persistence, and Communication components. Test against 4 defense systems and learn detection strategies. Educational malware analysis!',
    category: 'Malware',
    difficulty: 2,
    iconType: 'malware',
    thumbnail: asset('thumb-malware-hunter.jpg'),
    isLocked: false,
    xpReward: 180,
    playerCount: 4800,
  },
  {
    id: 'keylogger-sim',
    title: 'Keylogger Simulator',
    description: 'See how keyloggers steal your passwords! Split-view attacker/victim interface with virtual keyboard, 4 capture modes, password detection, and clipboard monitoring. Learn defense strategies!',
    category: 'Malware',
    difficulty: 1,
    iconType: 'malware',
    thumbnail: asset('thumb-malware-hunter.jpg'),
    isLocked: false,
    xpReward: 140,
    playerCount: 5500,
  },
];

export const featuredGame = games[0];

export function getGameById(id: string): Game | undefined {
  return games.find((g) => g.id === id);
}

export function getGamesByCategory(category: GameCategory): Game[] {
  if (category === 'All') return games;
  return games.filter((g) => g.category === category);
}
