import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Server, ArrowRight, Check, X, RotateCcw, ChevronRight,
  Trophy, Star, Search, Database, HardDrive, Monitor, Cpu, Wifi, BookOpen
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type ServerType = 'user' | 'browser' | 'resolver' | 'root' | 'tld' | 'authoritative' | 'ip';

interface DNSServer {
  id: ServerType;
  label: string;
  x: number;
  y: number;
  color: string;
  icon: 'user' | 'browser' | 'resolver' | 'root' | 'tld' | 'authoritative' | 'ip';
  description: string;
}

interface DNSQuery {
  from: ServerType;
  to: ServerType;
}

interface DomainLevel {
  id: number;
  name: string;
  domain: string;
  recordType: string;
  correctPath: ServerType[];
  serverResponses: Record<string, string>;
  finalIp: string;
}

const SERVERS: DNSServer[] = [
  {
    id: 'user', label: 'You', x: 50, y: 10, color: '#4ADE80',
    icon: 'user', description: 'The person who wants to visit a website',
  },
  {
    id: 'browser', label: 'Browser', x: 50, y: 22, color: '#A78BFA',
    icon: 'browser', description: 'Checks its cache first, then asks the resolver',
  },
  {
    id: 'resolver', label: 'Resolver', x: 50, y: 38, color: '#60A5FA',
    icon: 'resolver', description: 'Your ISP\'s recursive DNS resolver',
  },
  {
    id: 'root', label: 'Root Server', x: 15, y: 55, color: '#F472B6',
    icon: 'root', description: 'Knows where all TLD servers are (.com, .org, etc.)',
  },
  {
    id: 'tld', label: 'TLD Server', x: 50, y: 55, color: '#FACC15',
    icon: 'tld', description: 'Knows where all domains in its TLD are registered',
  },
  {
    id: 'authoritative', label: 'Auth Server', x: 85, y: 55, color: '#7C3AED',
    icon: 'authoritative', description: 'The domain\'s own DNS server with the final answer',
  },
  {
    id: 'ip', label: 'IP Address', x: 50, y: 72, color: '#4ADE80',
    icon: 'ip', description: 'The final destination - the server\'s IP address!',
  },
];

const LEVELS: DomainLevel[] = [
  {
    id: 1,
    name: 'Simple Lookup',
    domain: 'www.cyberpaws.kids',
    recordType: 'A',
    correctPath: ['user', 'browser', 'resolver', 'root', 'tld', 'authoritative', 'ip'],
    finalIp: '192.168.42.100',
    serverResponses: {
      user: 'I want to visit www.cyberpaws.kids',
      browser: 'Checking cache... not found. Asking resolver.',
      resolver: 'I do not know the IP. Let me ask the Root Server.',
      root: 'I know .kids TLD servers. Ask the TLD server!',
      tld: 'I know cyberpaws.kids is at Auth Server ns1.cyberpaws.',
      authoritative: 'www.cyberpaws.kids has IP 192.168.42.100!',
      ip: 'Here! IP: 192.168.42.100',
    },
  },
  {
    id: 2,
    name: 'Cached Query',
    domain: 'games.cyberpaws.kids',
    recordType: 'A',
    correctPath: ['user', 'browser', 'resolver', 'tld', 'authoritative', 'ip'],
    finalIp: '192.168.42.101',
    serverResponses: {
      user: 'Let me visit games.cyberpaws.kids',
      browser: 'Cache miss. Asking resolver...',
      resolver: 'The .kids TLD is already cached! Skip Root!',
      root: '',
      tld: 'games.cyberpaws.kids is at Auth ns1.cyberpaws.',
      authoritative: 'games.cyberpaws.kids -> 192.168.42.101!',
      ip: 'IP Found: 192.168.42.101',
    },
  },
  {
    id: 3,
    name: 'MX Record',
    domain: 'mail.cyberpaws.kids',
    recordType: 'MX',
    correctPath: ['user', 'browser', 'resolver', 'root', 'tld', 'authoritative', 'ip'],
    finalIp: '10 mail.cyberpaws.kids',
    serverResponses: {
      user: 'Where is the mail server for cyberpaws.kids?',
      browser: 'Need MX record. Forwarding to resolver.',
      resolver: 'Looking up MX record. Starting at Root.',
      root: '.kids TLD servers are here: a.nic.kids',
      tld: 'cyberpaws.kids auth server: ns1.cyberpaws.kids',
      authoritative: 'MX record: 10 mail.cyberpaws.kits (192.168.42.250)',
      ip: 'Mail server IP: 192.168.42.250',
    },
  },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  user: <Monitor size={20} strokeWidth={3} className="text-white" />,
  browser: <Globe size={20} strokeWidth={3} className="text-white" />,
  resolver: <Search size={20} strokeWidth={3} className="text-white" />,
  root: <Database size={20} strokeWidth={3} className="text-white" />,
  tld: <HardDrive size={20} strokeWidth={3} className="text-white" />,
  authoritative: <Server size={20} strokeWidth={3} className="text-white" />,
  ip: <Wifi size={20} strokeWidth={3} className="text-white" />,
};

export default function DNSResolver({ onScoreChange }: Props) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [path, setPath] = useState<ServerType[]>([]);
  const [completedPaths, setCompletedPaths] = useState<DNSQuery[]>([]);
  const [activeServer, setActiveServer] = useState<ServerType | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [message, setMessage] = useState('');
  const [shakeServer, setShakeServer] = useState<ServerType | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [levelScores, setLevelScores] = useState<(number | null)[]>([null, null, null]);
  const [levelStars, setLevelStars] = useState<(number | null)[]>([null, null, null]);
  const [packetPos, setPacketPos] = useState<{ x: number; y: number } | null>(null);
  const [showResponse, setShowResponse] = useState(false);

  const level = LEVELS[currentLevel];

  const getServer = (id: ServerType) => SERVERS.find((s) => s.id === id)!;

  // Initialize message on mount
  useEffect(() => {
    if (message === '') {
      setMessage(`Level 1: ${LEVELS[0].name} - Resolving ${LEVELS[0].domain}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleServerClick = useCallback(
    (serverId: ServerType) => {
      if (levelComplete || allComplete) return;

      const correctPath = level.correctPath;
      const nextIndex = path.length;
      const expected = correctPath[nextIndex];

      if (serverId !== expected) {
        setShakeServer(serverId);
        setAttempts((a) => a + 1);
        setMessage(`Not quite! Try a different server.`);
        setTimeout(() => setShakeServer(null), 600);
        return;
      }

      // Correct!
      const newPath = [...path, serverId];
      setPath(newPath);

      // Animate packet
      const server = getServer(serverId);
      setPacketPos({ x: server.x, y: server.y });
      setActiveServer(serverId);
      setShowResponse(true);

      const response = level.serverResponses[serverId];
      setMessage(`${server.label}: "${response}"`);

      if (newPath.length === correctPath.length) {
        // Level complete!
        const baseScore = 100;
        const penalty = attempts * 10;
        const finalScore = Math.max(20, baseScore - penalty);
        const stars = finalScore >= 90 ? 3 : finalScore >= 60 ? 2 : 1;

        setTimeout(() => {
          setLevelComplete(true);
          setTotalScore((prev) => {
            const newTotal = prev + finalScore;
            onScoreChange(Math.min(100, newTotal));
            return newTotal;
          });
          setLevelScores((prev) => {
            const u = [...prev];
            u[currentLevel] = finalScore;
            return u;
          });
          setLevelStars((prev) => {
            const u = [...prev];
            u[currentLevel] = stars;
            return u;
          });

          if (currentLevel >= LEVELS.length - 1) {
            setAllComplete(true);
            setMessage(`Domain resolved! IP: ${level.finalIp}`);
          } else {
            setMessage(`Domain resolved! IP: ${level.finalIp}`);
          }
        }, 800);
      } else {
        // Add edge
        if (nextIndex > 0) {
          setCompletedPaths((prev) => [...prev, { from: correctPath[nextIndex - 1], to: serverId }]);
        }
      }

      setTimeout(() => {
        setPacketPos(null);
      }, 600);
    },
    [levelComplete, allComplete, path, level, attempts, currentLevel, onScoreChange]
  );

  const handleNextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      const next = currentLevel + 1;
      setCurrentLevel(next);
      setPath([]);
      setCompletedPaths([]);
      setActiveServer(null);
      setLevelComplete(false);
      setAttempts(0);
      setShowResponse(false);
      setMessage(`Level ${next + 1}: ${LEVELS[next].name} - Resolving ${LEVELS[next].domain}`);
    }
  };

  const handleRetry = () => {
    setPath([]);
    setCompletedPaths([]);
    setActiveServer(null);
    setLevelComplete(false);
    setAttempts(0);
    setShowResponse(false);
    setMessage(`Level ${level.id}: ${level.name} - Resolving ${level.domain}`);
  };

  const handleResetAll = () => {
    setCurrentLevel(0);
    setPath([]);
    setCompletedPaths([]);
    setActiveServer(null);
    setLevelComplete(false);
    setAllComplete(false);
    setAttempts(0);
    setTotalScore(0);
    setLevelScores([null, null, null]);
    setLevelStars([null, null, null]);
    setShowResponse(false);
    setMessage(`Level 1: ${LEVELS[0].name} - Resolving ${LEVELS[0].domain}`);
    onScoreChange(0);
  };

  const currentServer = activeServer ? getServer(activeServer) : null;
  const isNextServer = (id: ServerType) => {
    if (levelComplete) return false;
    const nextIdx = path.length;
    return level.correctPath[nextIdx] === id;
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Title */}
      <div className="text-center">
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">DNS Resolver</h2>
        <p className="font-nunito text-xs text-purple-dark mt-1">
          Trace the DNS lookup path for each domain!
        </p>
      </div>

      {/* HUD */}
      <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-nunito text-xs font-bold text-purple-lighter">Lvl {level.id}</span>
          <span className="font-nunito text-xs font-bold text-white">{level.name}</span>
        </div>
        <div className="font-nunito text-xs font-bold text-yellow-accent">Score: {totalScore}</div>
        <div className="font-nunito text-xs text-purple-lighter">
          {path.length}/{level.correctPath.length}
        </div>
      </div>

      {/* Domain Display */}
      <div className="w-full max-w-lg bg-blue-info rounded-xl border-[3px] border-black px-4 py-2 flex items-center justify-center gap-2">
        <Globe size={18} strokeWidth={3} className="text-white" />
        <span className="font-mono text-sm font-bold text-white">
          {level.domain}
        </span>
        <span className="font-nunito text-xs text-white bg-purple-dark px-2 py-0.5 rounded-full border-2 border-black">
          {level.recordType} Record
        </span>
      </div>

      {/* Message */}
      <div
        className={`w-full max-w-lg rounded-xl border-[3px] border-black px-3 py-2 ${
          levelComplete ? 'bg-green-success' : shakeServer ? 'bg-red-alert' : 'bg-purple-pale'
        }`}
      >
        <p className={`font-nunito text-xs text-center font-bold ${shakeServer ? 'text-white' : levelComplete ? 'text-white' : 'text-purple-dark'}`}>
          {message}
        </p>
      </div>

      {/* DNS Diagram */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl border-4 border-black overflow-hidden" style={{ height: 400 }}>
        <svg className="absolute inset-0 w-full h-full">
          {/* Connection lines between all servers */}
          {[
            ['user', 'browser'],
            ['browser', 'resolver'],
            ['resolver', 'root'],
            ['resolver', 'tld'],
            ['resolver', 'authoritative'],
            ['tld', 'authoritative'],
            ['root', 'tld'],
            ['authoritative', 'ip'],
          ].map(([from, to], i) => {
            const fromS = getServer(from as ServerType);
            const toS = getServer(to as ServerType);
            const isActive = completedPaths.some(
              (p) => p.from === from && p.to === to
            ) || (path.includes(from as ServerType) && path.includes(to as ServerType) &&
              Math.abs(path.indexOf(from as ServerType) - path.indexOf(to as ServerType)) === 1);
            return (
              <line
                key={i}
                x1={`${fromS.x}%`}
                y1={`${fromS.y}%`}
                x2={`${toS.x}%`}
                y2={`${toS.y}%`}
                stroke={isActive ? '#FACC15' : '#E5E7EB'}
                strokeWidth={isActive ? 4 : 2}
                strokeDasharray={isActive ? 'none' : '4,4'}
                strokeLinecap="round"
              />
            );
          })}

          {/* Animated packet */}
          {packetPos && (
            <motion.circle
              cx={`${packetPos.x}%`}
              cy={`${packetPos.y}%`}
              r={8}
              fill="#FACC15"
              stroke="#000000"
              strokeWidth={2}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 1.5, 1], opacity: [1, 1, 0] }}
              transition={{ duration: 0.6 }}
            />
          )}
        </svg>

        {/* Server Nodes */}
        {SERVERS.map((server) => {
          const isInPath = path.includes(server.id);
          const isShaking = shakeServer === server.id;
          const isClickable = isNextServer(server.id);
          const isActive = activeServer === server.id;

          return (
            <motion.button
              key={server.id}
              onClick={() => handleServerClick(server.id)}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${
                !levelComplete && isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
              style={{ left: `${server.x}%`, top: `${server.y}%` }}
              animate={
                isShaking
                  ? { x: [0, -5, 5, -5, 5, 0] }
                  : isClickable && !levelComplete
                  ? { scale: [1, 1.1, 1] }
                  : isInPath
                  ? { scale: 1 }
                  : { scale: 1 }
              }
              transition={
                isShaking
                  ? { duration: 0.4 }
                  : isClickable && !levelComplete
                  ? { duration: 1, repeat: Infinity }
                  : { duration: 0.2 }
              }
              whileHover={!levelComplete && isClickable ? { scale: 1.2 } : {}}
              whileTap={!levelComplete && isClickable ? { scale: 0.9 } : {}}
            >
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-2xl border-[3px] border-black flex items-center justify-center ${
                    isInPath ? 'ring-2 ring-yellow-accent ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: isInPath ? server.color : isClickable ? server.color : '#E5E7EB' }}
                >
                  {isInPath || isClickable ? ICON_MAP[server.icon] : (
                    <Server size={20} strokeWidth={3} className="text-gray-400" />
                  )}
                </div>
                <span
                  className={`font-nunito text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-full border-2 border-black ${
                    isInPath ? 'text-white' : 'text-purple-dark bg-white'
                  }`}
                  style={isInPath ? { backgroundColor: server.color } : {}}
                >
                  {server.label}
                </span>

                {/* Step number */}
                {isInPath && (
                  <div
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-accent border-2 border-black flex items-center justify-center"
                  >
                    <span className="font-nunito text-[9px] font-bold text-black">
                      {path.indexOf(server.id) + 1}
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}

        {/* Response popup */}
        <AnimatePresence>
          {showResponse && currentServer && !levelComplete && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute bottom-2 left-2 right-2 bg-white rounded-xl border-[3px] border-black p-2 z-20"
              style={{ boxShadow: '4px 4px 0px 0px #000000' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: currentServer.color }}
                >
                  {ICON_MAP[currentServer.icon]}
                </div>
                <div>
                  <p className="font-nunito text-xs font-bold text-purple-dark">{currentServer.label}</p>
                  <p className="font-nunito text-[10px] text-purple-dark">
                    {currentServer.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Level Complete */}
      <AnimatePresence>
        {levelComplete && (
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg bg-green-success rounded-2xl border-4 border-black p-4 flex flex-col items-center gap-2"
            style={{ boxShadow: '8px 8px 0px 0px #000000' }}
          >
            <Trophy size={32} strokeWidth={3} className="text-yellow-accent" />
            <h3 className="font-fredoka text-xl text-black text-outline-sm">
              {allComplete ? 'All Domains Resolved!' : `Level ${level.id} Complete!`}
            </h3>
            <div className="flex items-center gap-2">
              <Wifi size={20} strokeWidth={3} className="text-white" />
              <span className="font-mono text-sm font-bold text-white">
                {level.domain} = {level.finalIp}
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  size={24}
                  strokeWidth={2}
                  className={s <= (levelStars[currentLevel] || 0) ? 'text-yellow-accent' : 'text-black/20'}
                  fill={s <= (levelStars[currentLevel] || 0) ? '#FACC15' : 'transparent'}
                />
              ))}
            </div>
            <p className="font-nunito text-sm font-bold text-black">
              Score: {levelScores[currentLevel]}
            </p>
            {!allComplete ? (
              <button
                onClick={handleNextLevel}
                className="flex items-center gap-1 px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark transition-colors hover:scale-105"
              >
                Next Domain
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            ) : (
              <button
                onClick={handleResetAll}
                className="flex items-center gap-1 px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark transition-colors hover:scale-105"
              >
                <RotateCcw size={16} strokeWidth={3} />
                Play Again
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleRetry}
          disabled={levelComplete}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light transition-colors hover:scale-105 disabled:opacity-50"
        >
          <RotateCcw size={14} strokeWidth={3} />
          Retry
        </button>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light transition-colors hover:scale-105"
        >
          <RotateCcw size={14} strokeWidth={3} />
          Reset All
        </button>
      </div>

      {/* Legend */}
      <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-3">
        <p className="font-nunito text-xs font-bold text-purple-dark mb-2 text-center">DNS Server Types</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SERVERS.map((s) => (
            <div key={s.id} className="flex items-center gap-1">
              <div
                className="w-5 h-5 rounded-lg border-2 border-black flex items-center justify-center"
                style={{ backgroundColor: s.color }}
              >
                <div className="scale-50">{ICON_MAP[s.icon]}</div>
              </div>
              <span className="font-nunito text-[9px] text-purple-dark">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
