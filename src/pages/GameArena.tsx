import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Heart,
  Settings,
  Wrench,
  BookOpen,
  Lightbulb,
  HelpCircle,
  RotateCcw,
  Maximize,
  Volume2,
  VolumeX,
  Home,
  Check,
  ChevronRight,
  Trophy,
  Zap,
  Lock,
  Timer,
} from 'lucide-react';
import { getGameById, games } from '@/data/games';
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
import ComingSoon from '@/components/game-simulations/ComingSoon';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type SidebarTab = 'tools' | 'learn' | 'hints';

interface GameState {
  score: number;
  lives: number;
  streak: number;
  timeElapsed: number;
  xpEarned: number;
}

/* ------------------------------------------------------------------ */
/*  Game Renderer                                                     */
/* ------------------------------------------------------------------ */

function GameSimulation({
  gameId,
  onScoreChange,
}: {
  gameId: string;
  onScoreChange: (score: number) => void;
}) {
  switch (gameId) {
    case 'password-quest':
      return <PasswordQuest onScoreChange={onScoreChange} />;
    case 'phishing-detective':
      return <PhishingDetective onScoreChange={onScoreChange} />;
    case 'firewall-defender':
      return <FirewallDefender onScoreChange={onScoreChange} />;
    case 'crypto-cat':
      return <CryptoCat onScoreChange={onScoreChange} />;
    case 'malware-hunter':
      return <MalwareHunter onScoreChange={onScoreChange} />;
    case 'network-navigator':
      return <NetworkNavigator onScoreChange={onScoreChange} />;
    case 'ssl-handshake':
      return <SSLHandshake onScoreChange={onScoreChange} />;
    case 'dns-resolver':
      return <DNSResolver onScoreChange={onScoreChange} />;
    case 'packet-tracer':
      return <PacketTracer onScoreChange={onScoreChange} />;
    case 'subnet-calculator':
      return <SubnetCalculator onScoreChange={onScoreChange} />;
    case 'vpn-tunnel':
      return <VPNTunnel onScoreChange={onScoreChange} />;
    case 'load-balancer':
      return <LoadBalancer onScoreChange={onScoreChange} />;
    case 'ids-alert':
      return <IDSAlert onScoreChange={onScoreChange} />;
    case 'certificate-chain':
      return <CertificateChain onScoreChange={onScoreChange} />;
    case 'proxy-server':
      return <ProxyServer onScoreChange={onScoreChange} />;
    case 'port-scanner':
      return <PortScanner onScoreChange={onScoreChange} />;
    case 'encryption-pipeline':
      return <EncryptionPipeline onScoreChange={onScoreChange} />;
    case 'sql-safari':
      return <SQLSafari onScoreChange={onScoreChange} />;
    case 'stego-spy':
      return <StegoSpy onScoreChange={onScoreChange} />;
    case 'xss-xpert':
      return <XSSXpert onScoreChange={onScoreChange} />;
    case 'cert-champion':
      return <CertChampion onScoreChange={onScoreChange} />;
    case 'hash-hacker':
      return <HashHacker onScoreChange={onScoreChange} />;
    case 'access-ace':
      return <AccessAce onScoreChange={onScoreChange} />;
    case 'log-analyzer':
      return <LogAnalyzer onScoreChange={onScoreChange} />;
    case 'nmap-scanner':
      return <NmapScanner onScoreChange={onScoreChange} />;
    case 'dns-lookup-gui':
      return <DNSLookup onScoreChange={onScoreChange} />;
    case 'whois-lookup':
      return <WhoisLookup onScoreChange={onScoreChange} />;
    case 'sql-injector-gui':
      return <SQLInjector onScoreChange={onScoreChange} />;
    case 'xss-tester-gui':
      return <XSSTester onScoreChange={onScoreChange} />;
    case 'hash-cracker-gui':
      return <HashCracker onScoreChange={onScoreChange} />;
    case 'phishing-sim-gui':
      return <PhishingSim onScoreChange={onScoreChange} />;
    case 'cert-viewer-gui':
      return <CertViewer onScoreChange={onScoreChange} />;
    case 'advanced-port-scan': {
      const g = getGameById(gameId);
      if (!g) return null;
      return <ComingSoon gameTitle={g.title} gameDescription={g.description} category={g.category} difficulty={g.difficulty} />;
    }
    case 'network-packet-tracer': {
      const g = getGameById(gameId);
      if (!g) return null;
      return <ComingSoon gameTitle={g.title} gameDescription={g.description} category={g.category} difficulty={g.difficulty} />;
    }
    case 'xor-tool':
      return <XORTool onScoreChange={onScoreChange} />;
    case 'trojan-builder':
      return <TrojanBuilder onScoreChange={onScoreChange} />;
    case 'keylogger-sim':
      return <KeyloggerSim onScoreChange={onScoreChange} />;
    default:
      return (
        <ComingSoon
          gameTitle="Unknown Mission"
          gameDescription="This mission is being prepared."
          category="Mixed"
          difficulty={1}
        />
      );
  }
}

function hasSimulation(gameId: string): boolean {
  return [
    'password-quest',
    'phishing-detective',
    'firewall-defender',
    'crypto-cat',
    'malware-hunter',
    'network-navigator',
    'ssl-handshake',
    'dns-resolver',
    'packet-tracer',
    'subnet-calculator',
    'vpn-tunnel',
    'load-balancer',
    'ids-alert',
    'certificate-chain',
    'proxy-server',
    'port-scanner',
    'encryption-pipeline',
    'sql-safari',
    'stego-spy',
    'xss-xpert',
    'cert-champion',
    'hash-hacker',
    'access-ace',
    'log-analyzer',
    'nmap-scanner',
    'dns-lookup-gui',
    'whois-lookup',
    'sql-injector-gui',
    'xss-tester-gui',
    'hash-cracker-gui',
    'phishing-sim-gui',
    'cert-viewer-gui',
    'advanced-port-scan',
    'network-packet-tracer',
    'xor-tool',
    'trojan-builder',
    'keylogger-sim',
  ].includes(gameId);
}

/* ------------------------------------------------------------------ */
/*  Sidebar Content                                                   */
/* ------------------------------------------------------------------ */

function ToolsPanel({ gameId }: { gameId: string }) {
  const toolContent: Record<string, { title: string; items: string[] }[]> = {
    'password-quest': [
      { title: 'Character Counter', items: ['Track uppercase, lowercase, numbers, and symbols'] },
      { title: 'Common Passwords', items: ['123456', 'password', 'qwerty', 'admin'] },
      { title: 'Strength Tips', items: ['Use 12+ characters', 'Mix character types', 'Avoid dictionary words', 'Use a passphrase'] },
    ],
    'phishing-detective': [
      { title: 'Phishing Checklist', items: ['Check sender email domain', 'Look for urgency language', 'Verify links before clicking', 'Watch for spelling errors', 'Be suspicious of attachments'] },
      { title: 'Red Flags', items: ['Generic greetings', 'Requests for passwords', 'Too-good-to-be-true offers', 'Threats or deadlines'] },
    ],
    'firewall-defender': [
      { title: 'Packet Types', items: ['HTTPS (port 443) - Safe', 'HTTP (port 80) - Safe', 'SSH (port 22) - Safe', 'Unknown ports - Check', 'High port numbers - Caution'] },
      { title: 'Defense Tools', items: ['Packet Filter - Basic', 'Stateful Inspection - Advanced', 'Proxy Firewall - Application'] },
    ],
    'crypto-cat': [
      { title: 'Alphabet Reference', items: ['A=0 B=1 C=2 D=3 E=4 F=5', 'G=6 H=7 I=8 J=9 K=10 L=11', 'M=12 N=13 O=14 P=15 Q=16', 'R=17 S=18 T=19 U=20 V=21', 'W=22 X=23 Y=24 Z=25'] },
      { title: 'Common Shifts', items: ['Caesar used shift of 3', 'ROT13 is shift of 13', 'Try common shifts first: 1-7'] },
    ],
    'malware-hunter': [
      { title: 'Virus Types', items: ['Trojan - Disguised as safe', 'Worm - Spreads itself', 'Ransomware - Encrypts files', 'Spyware - Steals data'] },
      { title: 'Removal Tools', items: ['Antivirus scan', 'Safe mode boot', 'System restore', 'Malwarebytes'] },
    ],
    'network-navigator': [
      { title: 'Network Devices', items: ['Router - Directs traffic', 'Switch - Connects devices', 'Firewall - Blocks threats', 'Modem - Internet access'] },
      { title: 'Common Ports', items: ['22 - SSH', '80 - HTTP', '443 - HTTPS', '53 - DNS'] },
    ],
  };

  const content = toolContent[gameId] || [
    { title: 'General Tools', items: ['Notebook for tracking clues', 'Timer for speed challenges', 'Hint system for when stuck'] },
  ];

  return (
    <div className="space-y-3">
      {content.map((section, i) => (
        <motion.div
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-xl border-[3px] border-black p-4"
        >
          <h4 className="font-nunito font-bold text-sm text-purple-dark mb-2 flex items-center gap-2">
            <Wrench size={14} strokeWidth={3} className="text-purple-primary" />
            {section.title}
          </h4>
          <ul className="space-y-1.5">
            {section.items.map((item, j) => (
              <li key={j} className="font-nunito text-xs text-purple-dark flex items-start gap-2">
                <Check size={12} strokeWidth={3} className="text-green-success mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}

function LearnPanel({ gameId }: { gameId: string }) {
  const learnContent: Record<string, { fact: string; concepts: string[]; realWorld: string }> = {
    'password-quest': {
      fact: 'The most common password is still "123456", used by millions of people worldwide!',
      concepts: ['Password entropy and length', 'Character variety importance', 'Dictionary attacks', 'Brute force protection'],
      realWorld: 'When you create an account on a website, it should never store your actual password. Instead, it stores a "hash" - a scrambled version that cannot be reversed.',
    },
    'phishing-detective': {
      fact: 'Phishing attacks account for over 80% of reported security incidents!',
      concepts: ['Email spoofing techniques', 'Social engineering psychology', 'Domain spoofing', 'Multi-factor authentication defense'],
      realWorld: 'Banks will never ask for your password via email. If you get an email claiming to be from your bank asking for login details, it is definitely a phishing attempt!',
    },
    'firewall-defender': {
      fact: 'The first firewall was developed in the late 1980s by Digital Equipment Corporation!',
      concepts: ['Packet filtering rules', 'Stateful vs stateless inspection', 'Application layer gateways', 'Intrusion Detection Systems'],
      realWorld: 'Your home router has a built-in firewall that blocks incoming connections from the internet, protecting all devices on your Wi-Fi network.',
    },
    'crypto-cat': {
      fact: 'Julius Caesar used a shift cipher with a key of 3 to send secret military messages!',
      concepts: ['Substitution ciphers', 'Modular arithmetic', 'Frequency analysis', 'Key-based encryption'],
      realWorld: 'Modern encryption used by messaging apps like Signal is based on the same principles, but with math so complex that even supercomputers cannot break it!',
    },
    'malware-hunter': {
      fact: 'The first computer virus, "Creeper", was created in 1971 as an experiment!',
      concepts: ['Virus signatures', 'Heuristic analysis', 'Sandboxing', 'Behavioral detection'],
      realWorld: 'When you download a file, your antivirus checks it against a database of known virus signatures. It also watches how the program behaves to catch new threats.',
    },
    'network-navigator': {
      fact: 'The internet is basically a giant network of networks, connecting billions of devices!',
      concepts: ['IP addressing', 'Routing protocols', 'Network topology', 'Packet switching'],
      realWorld: 'When you send a message, it is broken into packets that travel through multiple routers. Each router reads the destination address and decides the best path forward.',
    },
  };

  const content = learnContent[gameId] || {
    fact: 'Cybersecurity is one of the fastest-growing career fields, with millions of job openings!',
    concepts: ['Confidentiality, Integrity, Availability', 'Defense in depth', 'Zero trust architecture', 'Incident response'],
    realWorld: 'Every time you use the internet, hundreds of security mechanisms work behind the scenes to protect your data from attackers.',
  };

  return (
    <div className="space-y-3">
      {/* Did You Know */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-blue-info/10 rounded-xl border-l-4 border-blue-info p-4"
      >
        <h4 className="font-nunito font-bold text-sm text-purple-dark mb-2 flex items-center gap-2">
          <Zap size={14} strokeWidth={3} className="text-blue-info" />
          Did You Know?
        </h4>
        <p className="font-nunito text-xs text-purple-dark leading-relaxed">{content.fact}</p>
      </motion.div>

      {/* Key Concepts */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border-[3px] border-black p-4"
      >
        <h4 className="font-nunito font-bold text-sm text-purple-dark mb-2">Key Concepts</h4>
        <div className="flex flex-wrap gap-2">
          {content.concepts.map((concept, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-purple-lighter border-[2px] border-black rounded-full font-nunito text-xs font-semibold text-purple-dark"
            >
              {concept}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Real World */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-yellow-accent/20 rounded-xl border-l-4 border-yellow-accent p-4"
      >
        <h4 className="font-nunito font-bold text-sm text-purple-dark mb-2">Real World Example</h4>
        <p className="font-nunito text-xs text-purple-dark leading-relaxed">{content.realWorld}</p>
      </motion.div>
    </div>
  );
}

function HintsPanel({ gameId }: { gameId: string }) {
  const hintsContent: Record<string, string[]> = {
    'password-quest': [
      'Longer passwords are always stronger - aim for 12+ characters.',
      'Use a mix of uppercase, lowercase, numbers, and special characters.',
      'Try using a passphrase: combine 4 random words with symbols.',
    ],
    'phishing-detective': [
      'Always check the sender email address carefully for misspellings.',
      'Hover over links to see the real destination before clicking.',
      'Legitimate companies never ask for your password via email.',
    ],
    'firewall-defender': [
      'Green and blue packets are usually safe - allow them through.',
      'Red and orange packets are threats - block them immediately!',
      'Watch out for packets on unusual port numbers.',
    ],
    'crypto-cat': [
      'Start by trying small shift values like 1, 2, or 3.',
      'Look for common short words like "THE" or "AND".',
      'The Caesar cipher shifts every letter by the same amount.',
    ],
    'malware-hunter': [
      'Click quickly - viruses disappear fast!',
      'Boss viruses need multiple hits to eliminate.',
      'Focus on the faster yellow viruses first for bonus points.',
    ],
    'network-navigator': [
      'Start from the Start node and follow the connections.',
      'You need to visit connected nodes - no jumping!',
      'The shortest path is not always the only valid path.',
    ],
  };

  const hints = hintsContent[gameId] || [
    'Read the instructions carefully before starting.',
    'Use the Tools tab for reference materials.',
    'Take your time - accuracy is more important than speed!',
  ];

  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const [xpSpent, setXpSpent] = useState(0);

  const revealHint = (index: number) => {
    if (revealed[index]) return;
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);
    setXpSpent((prev) => prev + 10);
  };

  return (
    <div className="space-y-3">
      {hints.map((hint, i) => (
        <motion.div
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <AnimatePresence mode="wait">
            {!revealed[i] ? (
              <motion.button
                key="locked"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 0 }}
                exit={{ rotateY: 90 }}
                onClick={() => revealHint(i)}
                className="w-full bg-purple-primary rounded-xl border-[3px] border-black p-4 flex items-center gap-3 hover:bg-purple-dark transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-purple-darker border-[3px] border-black flex items-center justify-center flex-shrink-0">
                  <Lock size={18} strokeWidth={3} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-nunito text-sm font-bold text-white">Hint {i + 1}</p>
                  <p className="font-nunito text-xs text-purple-lighter">
                    Use 10 XP to reveal
                  </p>
                </div>
              </motion.button>
            ) : (
              <motion.div
                key="unlocked"
                initial={{ rotateY: 90 }}
                animate={{ rotateY: 0 }}
                className="bg-white rounded-xl border-[3px] border-black p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-accent border-[3px] border-black flex items-center justify-center flex-shrink-0">
                  <Lightbulb size={18} strokeWidth={3} className="text-black" />
                </div>
                <div>
                  <p className="font-nunito text-sm font-bold text-purple-dark mb-1">
                    Hint {i + 1}
                  </p>
                  <p className="font-nunito text-xs text-purple-dark leading-relaxed">
                    {hint}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {xpSpent > 0 && (
        <p className="font-nunito text-xs text-purple-light text-center">
          XP spent on hints: {xpSpent}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings Dropdown                                                 */
/* ------------------------------------------------------------------ */

function SettingsDropdown({
  open,
  onClose,
  onRestart,
}: {
  open: boolean;
  onClose: () => void;
  onRestart: () => void;
}) {
  const [soundOn, setSoundOn] = useState(true);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border-[4px] border-black shadow-solid z-50 overflow-hidden"
      >
        <div className="p-2 space-y-1">
          <button
            onClick={() => setSoundOn(!soundOn)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-lighter transition-colors font-nunito text-sm text-purple-dark"
          >
            {soundOn ? <Volume2 size={18} strokeWidth={3} /> : <VolumeX size={18} strokeWidth={3} />}
            Sound: {soundOn ? 'On' : 'Off'}
          </button>
          <button
            onClick={() => {
              onRestart();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-lighter transition-colors font-nunito text-sm text-purple-dark"
          >
            <RotateCcw size={18} strokeWidth={3} />
            Restart Mission
          </button>
          <button
            onClick={() => {
              document.documentElement.requestFullscreen?.();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-lighter transition-colors font-nunito text-sm text-purple-dark"
          >
            <Maximize size={18} strokeWidth={3} />
            Fullscreen
          </button>
          <Link
            to="/games"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-lighter transition-colors font-nunito text-sm text-purple-dark border-t-[2px] border-purple-lighter mt-1 pt-2"
          >
            <Home size={18} strokeWidth={3} />
            Quit to Menu
          </Link>
        </div>
      </motion.div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function GameArena() {
  const { id } = useParams<{ id: string }>();
  const game = getGameById(id || '');

  const [activeTab, setActiveTab] = useState<SidebarTab>('tools');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    streak: 0,
    timeElapsed: 0,
    xpEarned: 0,
  });
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    if (!game) return;
    // Reset state when game changes
    setGameState({
      score: 0,
      lives: 3,
      streak: 0,
      timeElapsed: 0,
      xpEarned: 0,
    });
    setActiveTab('tools');
    setShowHelp(false);
  }, [id, game]);

  useEffect(() => {
    if (!game) return;
    const timer = setInterval(() => {
      setGameState((prev) => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [game]);

  const handleScoreChange = (score: number) => {
    setGameState((prev) => ({
      ...prev,
      score: Math.round(score),
      xpEarned: Math.round((score / 100) * (game?.xpReward || 100)),
    }));
  };

  const handleRestart = () => {
    setGameState({
      score: 0,
      lives: 3,
      streak: 0,
      timeElapsed: 0,
      xpEarned: 0,
    });
    setGameKey((k) => k + 1);
  };

  if (!game) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-purple-pale">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <HelpCircle size={64} strokeWidth={3} className="text-purple-light mx-auto mb-4" />
          <h1 className="font-fredoka font-bold text-3xl text-purple-dark text-outline-sm mb-2">
            Game Not Found
          </h1>
          <p className="font-nunito text-base text-purple-dark mb-6">
            This mission does not exist in our database.
          </p>
          <Link
            to="/games"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark transition-colors hover:scale-105"
          >
            <ArrowLeft size={18} strokeWidth={3} />
            Back to Missions
          </Link>
        </motion.div>
      </div>
    );
  }

  const hasSim = hasSimulation(game.id);
  const progressPercent = gameState.score;
  const minutes = Math.floor(gameState.timeElapsed / 60);
  const seconds = gameState.timeElapsed % 60;

  const difficultyColor = game.difficulty === 1 ? '#4ADE80' : game.difficulty === 2 ? '#FACC15' : '#F87171';

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* ============================================================ */}
      {/*  Game Header Bar                                             */}
      {/* ============================================================ */}
      <motion.header
        initial={{ y: -56 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        className="sticky top-[72px] z-40 h-14 bg-purple-dark border-b-4 border-black flex items-center justify-between px-4"
      >
        {/* Back Button */}
        <Link
          to="/games"
          className="flex items-center gap-2 hover:-translate-x-1 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={3} className="text-white" />
          <span className="font-nunito font-semibold text-sm text-white hidden sm:inline">
            Missions
          </span>
        </Link>

        {/* Game Title */}
        <h1 className="font-fredoka font-semibold text-lg md:text-xl text-white text-outline-sm truncate max-w-[200px] md:max-w-md">
          {game.title}
        </h1>

        {/* Right Side: Progress + Score + Lives + Settings */}
        <div className="flex items-center gap-3">
          {/* Progress Bar */}
          <div className="hidden sm:block w-32 md:w-48">
            <div className="h-3 bg-purple-darker rounded-full border-2 border-black overflow-hidden">
              <motion.div
                className="h-full bg-green-success rounded-full"
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </div>
            <p className="font-nunito text-[10px] font-semibold text-white text-center mt-0.5">
              {Math.round(progressPercent)}%
            </p>
          </div>

          {/* Score */}
          <motion.div
            key={gameState.score}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="flex items-center gap-1"
          >
            <Star size={18} fill="#FACC15" strokeWidth={0} />
            <span className="font-fredoka font-semibold text-base text-yellow-accent">
              {gameState.score}
            </span>
          </motion.div>

          {/* Lives */}
          <div className="hidden sm:flex items-center gap-0.5">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={
                  i > gameState.lives
                    ? { rotate: [0, -10, 10, -10, 0], scale: [1, 0.8, 1] }
                    : {}
                }
                transition={{ duration: 0.3 }}
              >
                <Heart
                  size={18}
                  strokeWidth={3}
                  className={i <= gameState.lives ? 'text-pink-accent' : 'text-purple-lighter'}
                  fill={i <= gameState.lives ? '#F472B6' : '#DDD6FE'}
                />
              </motion.div>
            ))}
          </div>

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-1.5 rounded-lg hover:bg-purple-darker transition-colors"
            >
              <Settings size={20} strokeWidth={3} className="text-white" />
            </button>
            <SettingsDropdown
              open={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              onRestart={handleRestart}
            />
          </div>
        </div>
      </motion.header>

      {/* ============================================================ */}
      {/*  Main Game Area                                              */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Game Canvas */}
        <div className="flex-1 lg:w-[65%] bg-white relative overflow-y-auto">
          {/* Canvas Bezel */}
          <div className="m-4 rounded-2xl border-4 border-black overflow-hidden bg-white min-h-[400px] lg:min-h-0">
            {/* HUD Overlay */}
            <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
              <div className="bg-purple-dark rounded-full border-[3px] border-black px-3 py-1 flex items-center gap-2">
                <Trophy size={12} strokeWidth={3} className="text-yellow-accent" />
                <span className="font-nunito text-xs font-bold text-white">
                  {gameState.xpEarned} / {game.xpReward} XP
                </span>
              </div>
              <div className="bg-purple-dark rounded-full border-[3px] border-black px-3 py-1 flex items-center gap-2">
                <Timer size={12} strokeWidth={3} className="text-blue-info" />
                <span className="font-nunito text-xs font-bold text-white">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Game Content */}
            <motion.div
              key={gameKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="pt-12"
            >
              {hasSim ? (
                <GameSimulation
                  gameId={game.id}
                  onScoreChange={handleScoreChange}
                />
              ) : (
                <ComingSoon
                  gameTitle={game.title}
                  gameDescription={game.description}
                  category={game.category}
                  difficulty={game.difficulty}
                />
              )}
            </motion.div>
          </div>

          {/* Help Floating Button */}
          <motion.button
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            onClick={() => setShowHelp(!showHelp)}
            className="absolute bottom-6 left-6 w-14 h-14 bg-blue-info rounded-full border-[4px] border-black flex items-center justify-center shadow-solid hover:bg-blue-400 transition-colors z-10"
          >
            <HelpCircle size={28} strokeWidth={3} className="text-white" />
          </motion.button>

          {/* Help Panel */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ x: -360, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -360, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="absolute bottom-0 left-0 top-0 w-80 bg-white border-r-4 border-black z-20 overflow-y-auto"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-fredoka font-bold text-lg text-purple-dark">
                      Help & Tips
                    </h3>
                    <button
                      onClick={() => setShowHelp(false)}
                      className="w-8 h-8 rounded-lg bg-red-alert border-[3px] border-black flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <span className="text-white font-bold text-sm">X</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-purple-lighter rounded-xl border-[3px] border-black p-4">
                      <h4 className="font-nunito font-bold text-sm text-purple-dark mb-2">
                        How to Play
                      </h4>
                      <p className="font-nunito text-xs text-purple-dark leading-relaxed">
                        Each game teaches real cybersecurity concepts through interactive challenges.
                        Complete the objectives to earn XP and unlock new missions!
                      </p>
                    </div>

                    <div className="bg-purple-lighter rounded-xl border-[3px] border-black p-4">
                      <h4 className="font-nunito font-bold text-sm text-purple-dark mb-2">
                        Controls
                      </h4>
                      <ul className="space-y-1">
                        <li className="font-nunito text-xs text-purple-dark flex items-start gap-2">
                          <ChevronRight size={12} strokeWidth={3} className="text-purple-primary mt-0.5" />
                          Click/tap to interact with game elements
                        </li>
                        <li className="font-nunito text-xs text-purple-dark flex items-start gap-2">
                          <ChevronRight size={12} strokeWidth={3} className="text-purple-primary mt-0.5" />
                          Use the sidebar for tools and hints
                        </li>
                        <li className="font-nunito text-xs text-purple-dark flex items-start gap-2">
                          <ChevronRight size={12} strokeWidth={3} className="text-purple-primary mt-0.5" />
                          Check the settings menu for options
                        </li>
                      </ul>
                    </div>

                    <div className="bg-yellow-accent/20 rounded-xl border-[3px] border-black p-4">
                      <h4 className="font-nunito font-bold text-sm text-purple-dark mb-2">
                        Glossary
                      </h4>
                      <div className="space-y-2">
                        {[
                          { term: 'Firewall', def: 'A digital wall that blocks bad traffic.' },
                          { term: 'Phishing', def: 'Fake emails or websites that steal information.' },
                          { term: 'Encryption', def: 'Scrambling data so only authorized parties can read it.' },
                          { term: 'Malware', def: 'Malicious software designed to harm systems.' },
                        ].map((item, i) => (
                          <div key={i} className="border-b border-purple-lighter pb-1 last:border-0">
                            <span className="font-nunito text-xs font-bold text-purple-dark">{item.term}:</span>{' '}
                            <span className="font-nunito text-xs text-purple-dark">{item.def}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-1 bg-black" />

        {/* Right: Sidebar */}
        <div className="lg:w-[35%] bg-purple-lighter border-t-4 lg:border-t-0 lg:border-l-4 border-black flex flex-col">
          {/* Sidebar Tabs */}
          <div className="flex border-b-[3px] border-black">
            {[
              { id: 'tools' as const, label: 'Tools', icon: Wrench },
              { id: 'learn' as const, label: 'Learn', icon: BookOpen },
              { id: 'hints' as const, label: 'Hints', icon: Lightbulb },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 h-11 flex items-center justify-center gap-2 font-nunito font-semibold text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-dark border-b-[3px] border-purple-dark'
                    : 'bg-purple-lighter text-purple-light/60 hover:text-purple-dark'
                }`}
              >
                <tab.icon size={14} strokeWidth={3} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              >
                {activeTab === 'tools' && <ToolsPanel gameId={game.id} />}
                {activeTab === 'learn' && <LearnPanel gameId={game.id} />}
                {activeTab === 'hints' && <HintsPanel gameId={game.id} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Game Info Footer */}
          <div className="border-t-[3px] border-black bg-purple-pale p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-nunito text-xs font-bold text-purple-dark">
                {game.category}
              </span>
              <span
                className="px-2 py-0.5 rounded-full border-[2px] border-black font-nunito text-[10px] font-bold text-white"
                style={{ backgroundColor: difficultyColor }}
              >
                {game.difficulty === 1 ? 'Easy' : game.difficulty === 2 ? 'Medium' : 'Hard'}
              </span>
            </div>
            <p className="font-nunito text-xs text-purple-dark leading-relaxed mb-3">
              {game.description}
            </p>

            {/* Next/Related Games */}
            <div className="space-y-1">
              <p className="font-nunito text-[10px] font-bold text-purple-light uppercase tracking-wider">
                Related Missions
              </p>
              {games
                .filter((g) => g.category === game.category && g.id !== game.id)
                .slice(0, 2)
                .map((related) => (
                  <Link
                    key={related.id}
                    to={`/games/${related.id}`}
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border-[2px] border-black hover:bg-yellow-accent transition-colors group"
                  >
                    <ChevronRight size={12} strokeWidth={3} className="text-purple-light group-hover:text-black" />
                    <span className="font-nunito text-xs font-semibold text-purple-dark group-hover:text-black">
                      {related.title}
                    </span>
                    {related.isLocked && (
                      <Lock size={10} strokeWidth={3} className="text-purple-light ml-auto" />
                    )}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
