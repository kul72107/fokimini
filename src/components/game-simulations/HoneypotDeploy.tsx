import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Shield,
  Terminal,
  Database,
  Globe,
  AlertTriangle,
  Eye,
  Bug,
  Play,
  RotateCcw,
  Lock,
  Unlock,
  FileText,
  Activity,
  PawPrint,
} from 'lucide-react';

interface HoneypotDeployProps {
  onScoreChange: (score: number) => void;
}

interface NetworkNode {
  id: number;
  x: number;
  y: number;
  label: string;
  type: 'real' | 'honeypot';
  honeypotType?: 'ssh' | 'web' | 'database';
  hasAttacker: boolean;
  trappedAttackers: number;
}

interface Attacker {
  id: number;
  nodeId: number;
  name: string;
  actions: string[];
  trapped: boolean;
  timestamp: number;
}

interface LogEntry {
  id: number;
  time: string;
  attacker: string;
  action: string;
  node: string;
  severity: 'low' | 'medium' | 'high';
}

const INITIAL_NODES: NetworkNode[] = [
  { id: 1, x: 15, y: 20, label: 'Web Server', type: 'real', hasAttacker: false, trappedAttackers: 0 },
  { id: 2, x: 50, y: 10, label: 'File Server', type: 'real', hasAttacker: false, trappedAttackers: 0 },
  { id: 3, x: 85, y: 20, label: 'Mail Server', type: 'real', hasAttacker: false, trappedAttackers: 0 },
  { id: 4, x: 25, y: 55, label: 'DB Server', type: 'real', hasAttacker: false, trappedAttackers: 0 },
  { id: 5, x: 75, y: 55, label: 'App Server', type: 'real', hasAttacker: false, trappedAttackers: 0 },
  { id: 6, x: 50, y: 80, label: 'Auth Server', type: 'real', hasAttacker: false, trappedAttackers: 0 },
  { id: 7, x: 50, y: 45, label: 'Router', type: 'real', hasAttacker: false, trappedAttackers: 0 },
];

const ATTACKER_NAMES = [
  'ShadowPaw', 'WhiskerHack', 'MeowBot', 'FurStorm', 'ClawByte',
  'NightCat', 'PurrLooter', 'TabbyTrap', 'KittyCrawler', 'CyberFeline',
];

const ACTION_TEMPLATES = [
  { action: 'Attempted port scan on port {port}', severity: 'low' as const },
  { action: 'Tried default password "admin123"', severity: 'medium' as const },
  { action: 'SQL injection attempt on login', severity: 'high' as const },
  { action: 'Tried to download /etc/passwd', severity: 'high' as const },
  { action: 'Brute force attack detected', severity: 'medium' as const },
  { action: 'Reverse shell payload detected', severity: 'high' as const },
  { action: 'Tried to access /admin panel', severity: 'medium' as const },
  { action: 'Credential stuffing attack', severity: 'high' as const },
  { action: 'Tried exploit CVE-2024-{num}', severity: 'high' as const },
  { action: 'Directory traversal attempt', severity: 'medium' as const },
];

const HONEYPOT_CONFIGS = [
  { type: 'ssh' as const, label: 'SSH Honeypot', icon: Terminal, color: '#4ADE80', desc: 'Fake SSH server' },
  { type: 'web' as const, label: 'Web Honeypot', icon: Globe, color: '#60A5FA', desc: 'Fake web server' },
  { type: 'database' as const, label: 'DB Honeypot', icon: Database, color: '#F472B6', desc: 'Fake database' },
];

export default function HoneypotDeploy({ onScoreChange }: HoneypotDeployProps) {
  const [nodes, setNodes] = useState<NetworkNode[]>(INITIAL_NODES);
  const [attackers, setAttackers] = useState<Attacker[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [trappedCount, setTrappedCount] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const [attackerIdCounter, setAttackerIdCounter] = useState(0);
  const [logIdCounter, setLogIdCounter] = useState(0);
  const [educationalTip, setEducationalTip] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const spawnAttacker = useCallback(() => {
    if (!gameActive) return;

    const honeypotNodes = nodes.filter((n) => n.type === 'honeypot');
    const realNodes = nodes.filter((n) => n.type === 'real');
    const allNodes = [...honeypotNodes, ...realNodes];

    if (allNodes.length === 0) return;

    const targetNode = allNodes[Math.floor(Math.random() * allNodes.length)];
    const attackerName = ATTACKER_NAMES[Math.floor(Math.random() * ATTACKER_NAMES.length)];

    const newAttacker: Attacker = {
      id: attackerIdCounter,
      nodeId: targetNode.id,
      name: attackerName,
      actions: [],
      trapped: targetNode.type === 'honeypot',
      timestamp: Date.now(),
    };

    setAttackerIdCounter((prev) => prev + 1);
    setAttackers((prev) => [...prev.slice(-15), newAttacker]);

    setNodes((prev) =>
      prev.map((n) =>
        n.id === targetNode.id
          ? { ...n, hasAttacker: true, trappedAttackers: n.type === 'honeypot' ? n.trappedAttackers + 1 : n.trappedAttackers }
          : n
      )
    );

    // Generate log entries for this attacker
    const numActions = Math.floor(Math.random() * 3) + 1;
    const newLogs: LogEntry[] = [];
    for (let i = 0; i < numActions; i++) {
      const template = ACTION_TEMPLATES[Math.floor(Math.random() * ACTION_TEMPLATES.length)];
      const action = template.action
        .replace('{port}', Math.floor(Math.random() * 65535).toString())
        .replace('{num}', Math.floor(Math.random() * 9999).toString());

      newLogs.push({
        id: logIdCounter + i,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        attacker: attackerName,
        action,
        node: targetNode.label,
        severity: template.severity,
      });
    }

    setLogIdCounter((prev) => prev + numActions);
    setLogs((prev) => [...prev, ...newLogs]);
    setActionCount((prev) => prev + numActions);

    // Score: +50 per trapped attacker, +20 per logged action
    if (targetNode.type === 'honeypot') {
      const trapScore = 50 + numActions * 20;
      setScore((prev) => {
        const newScore = prev + trapScore;
        onScoreChange(Math.min(500, newScore));
        return newScore;
      });
      setTrappedCount((prev) => prev + 1);
    }

    // Clear attacker after delay
    setTimeout(() => {
      setAttackers((prev) => prev.filter((a) => a.id !== newAttacker.id));
      setNodes((prev) =>
        prev.map((n) =>
          n.id === targetNode.id ? { ...n, hasAttacker: false } : n
        )
      );
    }, 4000);
  }, [gameActive, nodes, attackerIdCounter, logIdCounter, onScoreChange]);

  useEffect(() => {
    if (!gameActive) return;

    const interval = setInterval(() => {
      spawnAttacker();
    }, 2500);

    return () => clearInterval(interval);
  }, [gameActive, spawnAttacker]);

  const deployHoneypot = (nodeId: number, honeypotType: 'ssh' | 'web' | 'database') => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, type: 'honeypot', honeypotType: honeypotType, trappedAttackers: 0 }
          : n
      )
    );
    setShowConfig(false);
    setSelectedNode(null);

    const typeLabels: Record<string, string> = { ssh: 'SSH', web: 'Web', database: 'Database' };
    setEducationalTip(`🍯 ${typeLabels[honeypotType]} Honeypot deployed! It looks like a real server but traps attackers!`);
    setTimeout(() => setEducationalTip(''), 4000);
  };

  const removeHoneypot = (nodeId: number) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, type: 'real', honeypotType: undefined, trappedAttackers: 0 }
          : n
      )
    );
  };

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setAttackers([]);
    setLogs([]);
    setTrappedCount(0);
    setActionCount(0);
    setAttackerIdCounter(0);
    setLogIdCounter(0);
    setEducationalTip('💡 A honeypot is a fake system that tricks attackers. Deploy them to trap hackers!');
    setTimeout(() => setEducationalTip(''), 5000);
    onScoreChange(0);
  };

  const resetGame = () => {
    setGameActive(false);
    setNodes(INITIAL_NODES);
    setAttackers([]);
    setLogs([]);
    setScore(0);
    setTrappedCount(0);
    setActionCount(0);
    setShowConfig(false);
    setSelectedNode(null);
    setEducationalTip('');
    onScoreChange(0);
  };

  const getNodeColor = (node: NetworkNode) => {
    if (node.type === 'honeypot') {
      switch (node.honeypotType) {
        case 'ssh': return '#4ADE80';
        case 'web': return '#60A5FA';
        case 'database': return '#F472B6';
        default: return '#A78BFA';
      }
    }
    return node.hasAttacker ? '#F87171' : '#7C3AED';
  };

  const getNodeIcon = (node: NetworkNode) => {
    if (node.type === 'honeypot') {
      switch (node.honeypotType) {
        case 'ssh': return Terminal;
        case 'web': return Globe;
        case 'database': return Database;
        default: return Server;
      }
    }
    return Server;
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* HUD */}
      <div className="w-full max-w-2xl flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <PawPrint size={18} strokeWidth={3} className="text-yellow-accent" />
          <span className="font-nunito text-sm font-bold text-yellow-accent">Score: {score}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-nunito text-xs text-green-success">Trapped: {trappedCount}</span>
          <span className="font-nunito text-xs text-blue-info">Actions Logged: {actionCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-nunito text-xs text-purple-lighter">
            Honeypots: {nodes.filter((n) => n.type === 'honeypot').length}
          </span>
        </div>
      </div>

      {/* Educational Tip */}
      <AnimatePresence>
        {educationalTip && (
          <motion.div
            initial={{ scale: 0.8, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: -10 }}
            className="w-full max-w-2xl bg-yellow-accent border-[3px] border-black rounded-xl px-4 py-2"
          >
            <p className="font-nunito text-sm font-bold text-black text-center">{educationalTip}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Area */}
      <div className="w-full max-w-2xl flex gap-3 flex-col lg:flex-row">
        {/* Network Map */}
        <div className="relative flex-1 h-80 bg-purple-pale rounded-2xl border-4 border-black overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="netgrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="15" cy="15" r="1" fill="#7C3AED" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#netgrid)" />
            </svg>
          </div>

          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {nodes.map((node) => {
              const connected = nodes.filter((n) => n.id !== node.id).slice(0, 2);
              return connected.map((target) => (
                <line
                  key={`${node.id}-${target.id}`}
                  x1={`${node.x}%`}
                  y1={`${node.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke="#A78BFA"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              ));
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const Icon = getNodeIcon(node);
            const isSelected = selectedNode === node.id;
            return (
              <motion.button
                key={node.id}
                onClick={() => {
                  if (node.type === 'real') {
                    setSelectedNode(node.id);
                    setShowConfig(true);
                  } else {
                    removeHoneypot(node.id);
                  }
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className="absolute z-10 flex flex-col items-center"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <motion.div
                  animate={node.hasAttacker ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="w-14 h-14 rounded-2xl border-[3px] border-black flex items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: getNodeColor(node),
                    boxShadow: isSelected ? '0 0 0 3px #FACC15' : undefined,
                  }}
                >
                  <Icon size={24} strokeWidth={3} className="text-white" />
                </motion.div>
                <span className="font-nunito text-[10px] font-bold text-purple-darker mt-1 bg-white border-2 border-black rounded-full px-2 py-0.5 whitespace-nowrap">
                  {node.label}
                </span>
                {node.type === 'honeypot' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-accent border-2 border-black rounded-full flex items-center justify-center"
                  >
                    <Lock size={10} strokeWidth={3} className="text-black" />
                  </motion.div>
                )}
                {node.hasAttacker && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="absolute -bottom-1 -right-1"
                  >
                    <Bug size={16} strokeWidth={3} className="text-red-alert" />
                  </motion.div>
                )}
                {node.trappedAttackers > 0 && (
                  <span className="absolute -top-2 -left-2 bg-red-alert border-2 border-black rounded-full w-5 h-5 flex items-center justify-center font-nunito text-[9px] font-bold text-white">
                    {node.trappedAttackers}
                  </span>
                )}
              </motion.button>
            );
          })}

          {/* Attacker animations */}
          <AnimatePresence>
            {attackers.map((attacker) => {
              const node = nodes.find((n) => n.id === attacker.nodeId);
              if (!node) return null;
              return (
                <motion.div
                  key={attacker.id}
                  initial={{ scale: 0, x: 0, y: -50 }}
                  animate={{ scale: 1, x: 0, y: 0 }}
                  exit={{ scale: 0 }}
                  className="absolute z-20 pointer-events-none"
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y - 18}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="bg-red-alert border-[3px] border-black rounded-full px-2 py-1 flex items-center gap-1">
                    <AlertTriangle size={12} strokeWidth={3} className="text-white" />
                    <span className="font-nunito text-[9px] font-bold text-white whitespace-nowrap">
                      {attacker.name}
                    </span>
                  </div>
                  {attacker.trapped && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-success border-2 border-black rounded-full px-2 py-0.5"
                    >
                      <span className="font-nunito text-[8px] font-bold text-black">TRAPPED!</span>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Start / Game Over Overlay */}
          {!gameActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-dark/90 z-30">
              <Shield size={48} strokeWidth={3} className="text-yellow-accent mb-2" />
              <h3 className="font-fredoka font-bold text-2xl text-white mb-1">
                Honeypot Deploy
              </h3>
              <p className="font-nunito text-xs text-purple-lighter text-center px-8 mb-3">
                Deploy fake servers to trick attackers! Click nodes to add honeypots.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-5 py-2 bg-green-success border-[3px] border-black rounded-full font-nunito font-bold text-sm hover:scale-105 transition-transform"
                >
                  <Play size={16} strokeWidth={3} />
                  Start Defense
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Honeypot Config + Logs */}
        <div className="w-full lg:w-64 flex flex-col gap-3">
          {/* Honeypot Config */}
          <div className="bg-white rounded-2xl border-4 border-black p-3">
            <h4 className="font-fredoka font-bold text-sm text-purple-dark mb-2 flex items-center gap-1">
              <Shield size={16} strokeWidth={3} className="text-purple-primary" />
              Honeypot Types
            </h4>
            <div className="flex flex-col gap-2">
              {HONEYPOT_CONFIGS.map((config) => {
                const Icon = config.icon;
                const isSelectedNodeReal = selectedNode !== null && nodes.find((n) => n.id === selectedNode)?.type === 'real';
                return (
                  <motion.button
                    key={config.type}
                    whileHover={{ scale: 1.03, x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (selectedNode !== null && isSelectedNodeReal) {
                        deployHoneypot(selectedNode, config.type);
                      }
                    }}
                    disabled={!isSelectedNodeReal}
                    className="flex items-center gap-2 p-2 rounded-xl border-[3px] border-black transition-colors disabled:opacity-40"
                    style={{ backgroundColor: config.color }}
                  >
                    <Icon size={18} strokeWidth={3} className="text-white" />
                    <div className="text-left">
                      <span className="font-nunito text-xs font-bold text-white block">{config.label}</span>
                      <span className="font-nunito text-[9px] text-white/80">{config.desc}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <p className="font-nunito text-[10px] text-purple-dark mt-2 text-center">
              {selectedNode !== null
                ? 'Select a type above to deploy'
                : 'Click a network node to deploy'}
            </p>
          </div>

          {/* Intrusion Log */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 flex-1 max-h-40 overflow-hidden flex flex-col">
            <h4 className="font-fredoka font-bold text-sm text-purple-dark mb-1 flex items-center gap-1">
              <FileText size={16} strokeWidth={3} className="text-purple-primary" />
              Intrusion Log
            </h4>
            <div className="flex-1 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <p className="font-nunito text-[10px] text-purple-light text-center py-2">
                  <Activity size={14} className="mx-auto mb-1 text-purple-light" />
                  No activity yet...
                </p>
              ) : (
                logs.slice(-20).map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ x: 20 }}
                    animate={{ x: 0 }}
                    className="p-1.5 rounded-lg border-2 border-black"
                    style={{
                      backgroundColor:
                        log.severity === 'high'
                          ? '#FEF2F2'
                          : log.severity === 'medium'
                          ? '#FFFBEB'
                          : '#F0FDF4',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-nunito text-[9px] font-bold text-purple-dark">
                        {log.attacker}
                      </span>
                      <span className="font-nunito text-[8px] text-purple-light">{log.time}</span>
                    </div>
                    <p className="font-nunito text-[9px] text-purple-darker">{log.action}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Eye size={8} strokeWidth={3} className="text-purple-light" />
                      <span className="font-nunito text-[8px] text-purple-light">{log.node}</span>
                      <span
                        className="font-nunito text-[8px] font-bold ml-auto px-1 rounded"
                        style={{
                          backgroundColor:
                            log.severity === 'high'
                              ? '#F87171'
                              : log.severity === 'medium'
                              ? '#FACC15'
                              : '#4ADE80',
                          color: log.severity === 'medium' ? '#000' : '#fff',
                        }}
                      >
                        {log.severity}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Legend & Controls */}
      <div className="w-full max-w-2xl flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-purple-primary border-2 border-black" />
            <span className="font-nunito text-[10px] font-semibold text-purple-dark">Real Server</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-success border-2 border-black" />
            <span className="font-nunito text-[10px] font-semibold text-purple-dark">SSH Honeypot</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-blue-info border-2 border-black" />
            <span className="font-nunito text-[10px] font-semibold text-purple-dark">Web Honeypot</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-pink-accent border-2 border-black" />
            <span className="font-nunito text-[10px] font-semibold text-purple-dark">DB Honeypot</span>
          </div>
        </div>
        {gameActive && (
          <button
            onClick={resetGame}
            className="flex items-center gap-1 px-3 py-1 bg-red-alert border-[3px] border-black rounded-full font-nunito text-xs font-bold text-white hover:scale-105 transition-transform"
          >
            <RotateCcw size={12} strokeWidth={3} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
