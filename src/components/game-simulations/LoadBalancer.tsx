import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { OpsContextProps } from '@/lib/opsContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Activity,
  AlertTriangle,
  Check,
  Play,
  RotateCcw,
  ChevronDown,
  Zap,
  ArrowDown,
} from 'lucide-react';

interface LoadBalancerProps extends OpsContextProps {
  onScoreChange: (score: number) => void;
}

interface ServerNode {
  id: number;
  name: string;
  connections: number;
  maxCapacity: number;
  health: number; // 0-100
  active: boolean;
  weight: number;
  color: string;
}

interface Packet {
  id: number;
  color: string;
  serverId: number | null;
  arrived: boolean;
  clientIp: string;
}

type Algorithm = 'round-robin' | 'least-connections' | 'weighted' | 'health-check';

const CLIENT_IPS = ['192.168.1.10', '192.168.1.20', '192.168.1.30', '192.168.1.40', '10.0.0.5', '10.0.0.15'];
const PACKET_COLORS = ['#4ADE80', '#60A5FA', '#FACC15', '#F472B6', '#A78BFA', '#FB923C'];

const INITIAL_SERVERS: ServerNode[] = [
  { id: 0, name: 'Server A', connections: 0, maxCapacity: 8, health: 100, active: true, weight: 3, color: '#4ADE80' },
  { id: 1, name: 'Server B', connections: 0, maxCapacity: 8, health: 100, active: true, weight: 2, color: '#60A5FA' },
  { id: 2, name: 'Server C', connections: 0, maxCapacity: 6, health: 100, active: true, weight: 1, color: '#F472B6' },
  { id: 3, name: 'Server D', connections: 0, maxCapacity: 8, health: 100, active: true, weight: 2, color: '#FACC15' },
];

export default function LoadBalancer({ onScoreChange, opsContext }: LoadBalancerProps) {
  const clientIps = useMemo(() => opsContext ? [
    opsContext.target.ips.client,
    opsContext.target.ips.attacker,
    opsContext.target.ips.web,
    opsContext.target.ips.api,
    opsContext.target.ips.vendor,
    opsContext.target.ips.backup,
  ] : CLIENT_IPS, [opsContext]);
  const initialServers = useMemo(() => opsContext ? [
    { ...INITIAL_SERVERS[0], name: opsContext.target.services[0]?.label ?? opsContext.target.hosts.app },
    { ...INITIAL_SERVERS[1], name: opsContext.target.services[1]?.label ?? opsContext.target.hosts.api },
    { ...INITIAL_SERVERS[2], name: opsContext.target.services[7]?.label ?? opsContext.target.hosts.vendor },
    { ...INITIAL_SERVERS[3], name: opsContext.target.services[5]?.label ?? opsContext.target.hosts.backup },
  ] : INITIAL_SERVERS, [opsContext]);
  const [algorithm, setAlgorithm] = useState<Algorithm>('round-robin');
  const [servers, setServers] = useState<ServerNode[]>(initialServers);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState('Select an algorithm and start distributing traffic!');
  const [packetIdCounter, setPacketIdCounter] = useState(0);
  const [roundRobinIdx, setRoundRobinIdx] = useState(0);
  const [packetsProcessed, setPacketsProcessed] = useState(0);
  const [correctAssignments, setCorrectAssignments] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [overloadWarning, setOverloadWarning] = useState('');
  const packetQueueRef = useRef<Packet[]>([]);

  const algorithmLabels: Record<Algorithm, string> = {
    'round-robin': 'Round Robin',
    'least-connections': 'Least Connections',
    'weighted': 'Weighted',
    'health-check': 'Health Check',
  };

  const getTargetServer = useCallback(
    (algo: Algorithm, srvs: ServerNode[], packetClientIp: string): number => {
      const activeServers = srvs.filter((s) => s.active);
      if (activeServers.length === 0) return 0;

      switch (algo) {
        case 'round-robin': {
          const idx = roundRobinIdx % activeServers.length;
          setRoundRobinIdx((prev) => prev + 1);
          return activeServers[idx].id;
        }
        case 'least-connections': {
          return activeServers.reduce((min, s) => (s.connections < min.connections ? s : min)).id;
        }
        case 'weighted': {
          const totalWeight = activeServers.reduce((sum, s) => sum + s.weight, 0);
          let rand = Math.random() * totalWeight;
          for (const s of activeServers) {
            rand -= s.weight;
            if (rand <= 0) return s.id;
          }
          return activeServers[0].id;
        }
        case 'health-check': {
          const healthy = activeServers.filter((s) => s.health > 30);
          if (healthy.length === 0) return activeServers[0].id;
          return healthy.reduce((min, s) => (s.connections < min.connections ? s : min)).id;
        }
        default:
          return activeServers[0].id;
      }
    },
    [roundRobinIdx]
  );

  useEffect(() => {
    if (!gameActive) return;

    const interval = setInterval(() => {
      setServers((prevServers) => {
        const newServers = prevServers.map((s) => {
          if (s.connections > 0 && Math.random() < 0.3) {
            return { ...s, connections: s.connections - 1 };
          }
          return s;
        });
        return newServers;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive) return;

    const interval = setInterval(() => {
      setServers((prevServers) => {
        return prevServers.map((s) => {
          if (s.connections >= s.maxCapacity && s.health > 0) {
            return { ...s, health: Math.max(0, s.health - 10) };
          }
          if (s.connections < s.maxCapacity && s.health < 100) {
            return { ...s, health: Math.min(100, s.health + 5) };
          }
          return s;
        });
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.4) {
        setPacketIdCounter((prev) => {
          const newId = prev + 1;
          const clientIp = clientIps[Math.floor(Math.random() * clientIps.length)];
          const color = PACKET_COLORS[Math.floor(Math.random() * PACKET_COLORS.length)];
          const newPacket: Packet = {
            id: newId,
            color,
            serverId: null,
            arrived: false,
            clientIp,
          };
          setPackets((p) => [...p.slice(-15), newPacket]);
          return newId;
        });
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [gameActive]);

  useEffect(() => {
    if (overloadWarning) {
      const t = setTimeout(() => setOverloadWarning(''), 2000);
      return () => clearTimeout(t);
    }
  }, [overloadWarning]);

  useEffect(() => {
    const overloaded = servers.filter((s) => s.connections >= s.maxCapacity);
    if (overloaded.length > 0 && gameActive) {
      setOverloadWarning(`Server Overload! ${overloaded.map((s) => s.name).join(', ')} at capacity!`);
    }
  }, [servers.map((s) => s.connections).join(','), gameActive]);

  const handlePacketClick = (packet: Packet) => {
    if (!gameActive || packet.serverId !== null) return;

    const targetId = getTargetServer(algorithm, servers, packet.clientIp);

    setServers((prev) =>
      prev.map((s) => (s.id === targetId ? { ...s, connections: s.connections + 1 } : s))
    );

    setPackets((prev) =>
      prev.map((p) => (p.id === packet.id ? { ...p, serverId: targetId, arrived: true } : p))
    );

    setPacketsProcessed((prev) => prev + 1);

    let isCorrect = false;
    const target = servers.find((s) => s.id === targetId)!;
    if (algorithm === 'least-connections' && target.connections <= 2) isCorrect = true;
    else if (algorithm === 'round-robin') isCorrect = true;
    else if (algorithm === 'weighted') isCorrect = true;
    else if (algorithm === 'health-check' && target.health > 50) isCorrect = true;

    if (isCorrect) {
      const newCorrect = correctAssignments + 1;
      setCorrectAssignments(newCorrect);
      const newScore = Math.min(100, Math.floor((newCorrect / (packetsProcessed + 1)) * 100));
      setScore(newScore);
      onScoreChange(newScore);
      setMessage(`Sent to ${servers[targetId].name}! Good routing.`);
    }

    if (packetsProcessed + 1 >= 10) {
      if (level < 4) {
        setLevel((prev) => prev + 1);
        setPacketsProcessed(0);
        setCorrectAssignments(0);
        setPackets([]);
        setRoundRobinIdx(0);
        if (level === 3) {
          setServers((prev) =>
            prev.map((s, i) => (i === 2 ? { ...s, active: false, health: 0 } : s))
          );
        }
        setMessage(`Level ${level + 1}! Algorithm: ${algorithmLabels[algorithm]}`);
      }
    }
  };

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setLevel(1);
    setPackets([]);
    setPacketsProcessed(0);
    setCorrectAssignments(0);
    setRoundRobinIdx(0);
    setOverloadWarning('');
    setServers(initialServers.map((s) => ({ ...s, connections: 0, health: 100, active: true })));
    onScoreChange(0);
    setMessage(`Level 1: ${algorithmLabels[algorithm]} - route ${opsContext?.target.platformName ?? "target"} packets to the right service!`);
  };

  const resetGame = () => {
    setGameActive(false);
    setScore(0);
    setLevel(1);
    setPackets([]);
    setPacketsProcessed(0);
    setCorrectAssignments(0);
    setRoundRobinIdx(0);
    setOverloadWarning('');
    setServers(initialServers.map((s) => ({ ...s, connections: 0, health: 100, active: true })));
    onScoreChange(0);
    setMessage('Select an algorithm and start distributing traffic!');
  };

  const getHealthColor = (health: number) => {
    if (health > 60) return 'bg-green-success';
    if (health > 30) return 'bg-yellow-accent';
    return 'bg-red-alert';
  };

  const getHealthBorderColor = (health: number) => {
    if (health > 60) return 'border-green-success';
    if (health > 30) return 'border-yellow-accent';
    return 'border-red-alert';
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 max-w-2xl mx-auto">
      {/* HUD */}
      <div className="w-full flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <Activity size={18} strokeWidth={3} className="text-yellow-accent" />
          <span className="font-nunito text-sm font-bold text-white">Level {level}/4</span>
        </div>
        <div className="font-nunito text-sm font-bold text-yellow-accent">Score: {score}</div>
        <div className="font-nunito text-xs text-purple-lighter">Packets: {packetsProcessed}</div>
      </div>

      {/* Message */}
      <div className="w-full bg-blue-info/20 rounded-xl border-[3px] border-blue-info p-2 text-center">
        <p className="font-nunito text-sm text-purple-dark">{message}</p>
        {opsContext && <p className="font-mono text-[10px] font-bold text-purple-primary">{opsContext.target.primaryDomain} / {opsContext.target.networkCidr}</p>}
      </div>

      {/* Algorithm Selector */}
      <div className="w-full flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={gameActive}
            className="flex items-center gap-2 px-4 py-2 bg-white border-[3px] border-black rounded-xl font-nunito text-sm font-bold text-purple-dark hover:bg-purple-pale transition-colors disabled:opacity-60"
          >
            <Zap size={16} strokeWidth={3} className="text-purple-primary" />
            {algorithmLabels[algorithm]}
            <ChevronDown size={14} strokeWidth={3} />
          </button>
          {showDropdown && !gameActive && (
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              className="absolute top-full left-0 mt-1 bg-white border-[3px] border-black rounded-xl overflow-hidden z-30 origin-top"
            >
              {(Object.keys(algorithmLabels) as Algorithm[]).map((algo) => (
                <button
                  key={algo}
                  onClick={() => {
                    setAlgorithm(algo);
                    setShowDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-2 font-nunito text-sm text-purple-dark hover:bg-purple-pale transition-colors"
                >
                  {algorithmLabels[algo]}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {!gameActive ? (
          <button
            onClick={startGame}
            className="flex items-center gap-2 px-5 py-2 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark transition-colors hover:scale-105"
          >
            <Play size={16} strokeWidth={3} /> Start
          </button>
        ) : (
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-5 py-2 bg-red-alert text-white border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform"
          >
            <RotateCcw size={16} strokeWidth={3} /> Reset
          </button>
        )}
      </div>

      {/* Overload Warning */}
      <AnimatePresence>
        {overloadWarning && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="w-full bg-red-alert/20 border-[3px] border-red-alert rounded-xl p-2 flex items-center justify-center gap-2"
          >
            <AlertTriangle size={18} strokeWidth={3} className="text-red-alert" />
            <span className="font-nunito text-sm font-bold text-red-alert">{overloadWarning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagram Area */}
      <div className="w-full bg-white rounded-2xl border-4 border-black overflow-hidden relative min-h-[400px]">
        {/* Incoming Traffic Row */}
        <div className="p-3 border-b-[3px] border-black bg-purple-pale">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDown size={16} strokeWidth={3} className="text-purple-primary" />
            <span className="font-fredoka text-sm font-bold text-purple-dark">Incoming Traffic</span>
          </div>
          <div className="flex gap-2 flex-wrap min-h-[40px]">
            <AnimatePresence>
              {packets
                .filter((p) => p.serverId === null)
                .map((packet) => (
                  <motion.button
                    key={packet.id}
                    initial={{ scale: 0, x: -20 }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{ scale: 0, y: 30 }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePacketClick(packet)}
                    className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: packet.color }}
                    title={`From ${packet.clientIp}`}
                  >
                    <span className="font-mono text-[8px] font-bold text-white">
                      {packet.id}
                    </span>
                  </motion.button>
                ))}
            </AnimatePresence>
            {packets.filter((p) => p.serverId === null).length === 0 && (
              <span className="font-nunito text-xs text-purple-lighter italic">
                Waiting for packets...
              </span>
            )}
          </div>
        </div>

        {/* Load Balancer */}
        <div className="flex items-center justify-center py-4 bg-purple-lighter">
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-purple-primary border-4 border-black rounded-2xl px-8 py-3 flex items-center gap-3 card-shadow"
          >
            <Activity size={28} strokeWidth={3} className="text-yellow-accent" />
            <div>
              <span className="font-fredoka text-lg font-bold text-white block">Load Balancer</span>
              <span className="font-nunito text-[10px] text-purple-lighter">
                {algorithmLabels[algorithm]}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center py-1 bg-purple-lighter">
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ArrowDown size={24} strokeWidth={3} className="text-purple-dark" />
          </motion.div>
        </div>

        {/* Servers Row */}
        <div className="p-3 bg-white">
          <div className="grid grid-cols-4 gap-2">
            {servers.map((server) => (
              <motion.div
                key={server.id}
                animate={
                  server.connections >= server.maxCapacity
                    ? { x: [-2, 2, -2] }
                    : { x: 0 }
                }
                transition={
                  server.connections >= server.maxCapacity
                    ? { duration: 0.2, repeat: Infinity }
                    : {}
                }
                className={`rounded-xl border-[3px] p-2 ${
                  server.active ? 'border-black' : 'border-gray-400 bg-gray-100'
                } ${!server.active ? 'opacity-50' : ''}`}
                style={{ backgroundColor: server.active ? server.color + '20' : undefined }}
              >
                {/* Server Header */}
                <div className="flex items-center gap-1 mb-2">
                  <Server
                    size={16}
                    strokeWidth={3}
                    className={server.active ? 'text-purple-dark' : 'text-gray-400'}
                  />
                  <span
                    className={`font-nunito text-[10px] font-bold ${
                      server.active ? 'text-purple-dark' : 'text-gray-400'
                    }`}
                  >
                    {server.name}
                  </span>
                  {server.weight > 1 && algorithm === 'weighted' && (
                    <span className="ml-auto font-mono text-[8px] bg-yellow-accent border border-black rounded-full w-4 h-4 flex items-center justify-center">
                      {server.weight}x
                    </span>
                  )}
                </div>

                {/* Connection Count */}
                <div
                  className={`text-center mb-2 rounded-lg border-2 ${
                    server.connections >= server.maxCapacity
                      ? 'bg-red-alert border-red-alert'
                      : 'bg-white border-black'
                  }`}
                >
                  <span className="font-mono text-sm font-bold text-purple-dark">
                    {server.connections}/{server.maxCapacity}
                  </span>
                </div>

                {/* Health Bar */}
                {server.active && (
                  <div className="mb-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="font-nunito text-[8px] text-purple-dark">Health</span>
                      <span className="font-mono text-[8px] font-bold">{server.health}%</span>
                    </div>
                    <div className="w-full h-2 bg-purple-lighter rounded-full border border-black overflow-hidden">
                      <motion.div
                        className={`h-full ${getHealthColor(server.health)}`}
                        animate={{ width: `${server.health}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* Connection Dots */}
                <div className="flex gap-0.5 flex-wrap mt-1 min-h-[16px]">
                  {Array.from({ length: server.connections }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full border border-black"
                      style={{ backgroundColor: server.color }}
                    />
                  ))}
                </div>

                {!server.active && (
                  <div className="text-center mt-1">
                    <span className="font-nunito text-[9px] font-bold text-red-alert">DOWN</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Assigned Packets */}
        <div className="p-2 border-t-[3px] border-black bg-purple-pale">
          <span className="font-nunito text-[10px] font-bold text-purple-dark">Routed Packets:</span>
          <div className="flex gap-2 mt-1">
            {servers.map((server) => (
              <div key={server.id} className="flex-1">
                <div className="flex gap-0.5 flex-wrap">
                  {packets
                    .filter((p) => p.serverId === server.id)
                    .map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full border-[2px] border-black"
                        style={{ backgroundColor: p.color }}
                        title={`Packet #${p.id} from ${p.clientIp}`}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-success border border-black" />
          <span className="font-nunito text-[10px] text-purple-dark">Healthy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-accent border border-black" />
          <span className="font-nunito text-[10px] text-purple-dark">Warning</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-alert border border-black" />
          <span className="font-nunito text-[10px] text-purple-dark">Critical</span>
        </div>
        <div className="flex items-center gap-1">
          <Check size={12} strokeWidth={3} className="text-green-success" />
          <span className="font-nunito text-[10px] text-purple-dark">
            {correctAssignments} correct
          </span>
        </div>
      </div>
    </div>
  );
}
