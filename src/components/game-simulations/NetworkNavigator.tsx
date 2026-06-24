import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network, Heart, Star, Lock, Key, Shield, ShieldAlert, Check,
  Skull, Router, ArrowRight, RotateCcw, ChevronRight, Trophy, Zap
} from 'lucide-react';
import SimuleToolTrainingPanel from './SimuleToolTrainingPanel';

interface Props {
  onScoreChange: (score: number) => void;
}

type NodeType = 'start' | 'end' | 'router' | 'firewall' | 'malware' | 'locked' | 'key';

interface LevelNode {
  id: string;
  x: number;
  y: number;
  label: string;
  type: NodeType;
  connections: string[];
}

interface LevelData {
  id: number;
  name: string;
  description: string;
  nodes: LevelNode[];
  startNode: string;
  endNode: string;
  requiredNodes: string[];
}

const LEVELS: LevelData[] = [
  {
    id: 1,
    name: 'The Basics',
    description: 'Learn the basics! Go through the Firewall (FW) to reach the End.',
    startNode: 'S',
    endNode: 'E',
    requiredNodes: ['FW1'],
    nodes: [
      { id: 'S', x: 15, y: 50, label: 'START', type: 'start', connections: ['R1'] },
      { id: 'R1', x: 35, y: 50, label: 'R1', type: 'router', connections: ['S', 'FW1'] },
      { id: 'FW1', x: 55, y: 50, label: 'FW', type: 'firewall', connections: ['R1', 'R2'] },
      { id: 'R2', x: 75, y: 50, label: 'R2', type: 'router', connections: ['FW1', 'E'] },
      { id: 'E', x: 90, y: 50, label: 'END', type: 'end', connections: ['R2'] },
    ],
  },
  {
    id: 2,
    name: 'Choose Wisely',
    description: 'Two paths! One leads to safety, the other to malware. Choose carefully!',
    startNode: 'S',
    endNode: 'E',
    requiredNodes: ['FW1'],
    nodes: [
      { id: 'S', x: 10, y: 50, label: 'START', type: 'start', connections: ['R1', 'R2'] },
      { id: 'R1', x: 35, y: 20, label: 'R1', type: 'router', connections: ['S', 'M1'] },
      { id: 'R2', x: 35, y: 80, label: 'R2', type: 'router', connections: ['S', 'FW1'] },
      { id: 'M1', x: 60, y: 20, label: 'M1', type: 'malware', connections: ['R1'] },
      { id: 'FW1', x: 60, y: 80, label: 'FW', type: 'firewall', connections: ['R2', 'E'] },
      { id: 'E', x: 90, y: 50, label: 'END', type: 'end', connections: ['FW1'] },
    ],
  },
  {
    id: 3,
    name: 'The Maze',
    description: 'Watch out! A shortcut skips the Firewall. You MUST pass through FW!',
    startNode: 'S',
    endNode: 'E',
    requiredNodes: ['FW1'],
    nodes: [
      { id: 'S', x: 10, y: 50, label: 'START', type: 'start', connections: ['R1', 'R2'] },
      { id: 'R1', x: 30, y: 25, label: 'R1', type: 'router', connections: ['S', 'R3'] },
      { id: 'R2', x: 30, y: 75, label: 'R2', type: 'router', connections: ['S', 'FW1'] },
      { id: 'R3', x: 50, y: 25, label: 'R3', type: 'router', connections: ['R1', 'M1', 'R4'] },
      { id: 'M1', x: 50, y: 5, label: 'M1', type: 'malware', connections: ['R3'] },
      { id: 'FW1', x: 50, y: 75, label: 'FW', type: 'firewall', connections: ['R2', 'R4'] },
      { id: 'R4', x: 75, y: 50, label: 'R4', type: 'router', connections: ['FW1', 'R3', 'E'] },
      { id: 'E', x: 92, y: 50, label: 'END', type: 'end', connections: ['R4'] },
    ],
  },
  {
    id: 4,
    name: 'Double Firewall',
    description: 'Two firewalls! You must pass through BOTH to secure the connection.',
    startNode: 'S',
    endNode: 'E',
    requiredNodes: ['FW1', 'FW2'],
    nodes: [
      { id: 'S', x: 8, y: 50, label: 'START', type: 'start', connections: ['R1'] },
      { id: 'R1', x: 25, y: 50, label: 'R1', type: 'router', connections: ['S', 'FW1'] },
      { id: 'FW1', x: 42, y: 50, label: 'FW1', type: 'firewall', connections: ['R1', 'R2'] },
      { id: 'R2', x: 58, y: 30, label: 'R2', type: 'router', connections: ['FW1', 'M1'] },
      { id: 'M1', x: 75, y: 15, label: 'M1', type: 'malware', connections: ['R2'] },
      { id: 'R3', x: 58, y: 70, label: 'R3', type: 'router', connections: ['FW1', 'FW2'] },
      { id: 'FW2', x: 78, y: 70, label: 'FW2', type: 'firewall', connections: ['R3', 'E'] },
      { id: 'E', x: 94, y: 50, label: 'END', type: 'end', connections: ['FW2', 'M1'] },
    ],
  },
  {
    id: 5,
    name: 'The Trap Field',
    description: 'Navigate the grid! Many malware traps lurk. Find the safe path through both Firewalls.',
    startNode: 'S',
    endNode: 'E',
    requiredNodes: ['FW1', 'FW2'],
    nodes: [
      { id: 'S', x: 10, y: 15, label: 'START', type: 'start', connections: ['R1', 'R2'] },
      { id: 'R1', x: 35, y: 15, label: 'R1', type: 'router', connections: ['S', 'M1'] },
      { id: 'R2', x: 10, y: 45, label: 'R2', type: 'router', connections: ['S', 'FW1'] },
      { id: 'M1', x: 60, y: 15, label: 'M1', type: 'malware', connections: ['R1', 'M2'] },
      { id: 'FW1', x: 10, y: 75, label: 'FW1', type: 'firewall', connections: ['R2', 'R3'] },
      { id: 'M2', x: 60, y: 45, label: 'M2', type: 'malware', connections: ['M1', 'R4'] },
      { id: 'R3', x: 35, y: 75, label: 'R3', type: 'router', connections: ['FW1', 'R5'] },
      { id: 'R4', x: 85, y: 45, label: 'R4', type: 'router', connections: ['M2', 'M3'] },
      { id: 'R5', x: 60, y: 75, label: 'R5', type: 'router', connections: ['R3', 'FW2'] },
      { id: 'M3', x: 85, y: 75, label: 'M3', type: 'malware', connections: ['R4', 'FW2'] },
      { id: 'FW2', x: 85, y: 90, label: 'FW2', type: 'firewall', connections: ['R5', 'M3', 'E'] },
      { id: 'E', x: 95, y: 90, label: 'END', type: 'end', connections: ['FW2'] },
    ],
  },
  {
    id: 6,
    name: 'Key Required',
    description: 'Find the Key first! The Locked Door blocks your path without it.',
    startNode: 'S',
    endNode: 'E',
    requiredNodes: ['FW1'],
    nodes: [
      { id: 'S', x: 10, y: 50, label: 'START', type: 'start', connections: ['R1', 'R2'] },
      { id: 'R1', x: 30, y: 20, label: 'R1', type: 'router', connections: ['S', 'K1'] },
      { id: 'K1', x: 30, y: 5, label: 'KEY', type: 'key', connections: ['R1'] },
      { id: 'R2', x: 30, y: 80, label: 'R2', type: 'router', connections: ['S', 'L1'] },
      { id: 'L1', x: 50, y: 80, label: 'LOCK', type: 'locked', connections: ['R2', 'FW1'] },
      { id: 'FW1', x: 70, y: 80, label: 'FW', type: 'firewall', connections: ['L1', 'E'] },
      { id: 'E', x: 92, y: 50, label: 'END', type: 'end', connections: ['FW1'] },
    ],
  },
  {
    id: 7,
    name: 'The Decoy',
    description: 'Three paths! Only one is safe. Look for the Firewalls!',
    startNode: 'S',
    endNode: 'E',
    requiredNodes: ['FW1'],
    nodes: [
      { id: 'S', x: 10, y: 50, label: 'START', type: 'start', connections: ['R1', 'R2', 'R3'] },
      { id: 'R1', x: 35, y: 15, label: 'R1', type: 'router', connections: ['S', 'R4'] },
      { id: 'R2', x: 35, y: 50, label: 'R2', type: 'router', connections: ['S', 'FW1'] },
      { id: 'R3', x: 35, y: 85, label: 'R3', type: 'router', connections: ['S', 'M1'] },
      { id: 'R4', x: 60, y: 15, label: 'R4', type: 'router', connections: ['R1', 'E'] },
      { id: 'FW1', x: 60, y: 50, label: 'FW', type: 'firewall', connections: ['R2', 'R5'] },
      { id: 'M1', x: 55, y: 85, label: 'M1', type: 'malware', connections: ['R3'] },
      { id: 'R5', x: 85, y: 50, label: 'R5', type: 'router', connections: ['FW1', 'E'] },
      { id: 'E', x: 94, y: 50, label: 'END', type: 'end', connections: ['R4', 'R5'] },
    ],
  },
  {
    id: 8,
    name: 'Master Network',
    description: 'The ultimate challenge! Multiple firewalls, keys, traps. Only one true path.',
    startNode: 'S',
    endNode: 'E',
    requiredNodes: ['FW1', 'FW2'],
    nodes: [
      { id: 'S', x: 5, y: 50, label: 'START', type: 'start', connections: ['R1', 'R2'] },
      { id: 'R1', x: 20, y: 20, label: 'R1', type: 'router', connections: ['S', 'K1', 'M1'] },
      { id: 'R2', x: 20, y: 80, label: 'R2', type: 'router', connections: ['S', 'FW1'] },
      { id: 'K1', x: 20, y: 5, label: 'KEY', type: 'key', connections: ['R1'] },
      { id: 'M1', x: 38, y: 10, label: 'M1', type: 'malware', connections: ['R1', 'R3'] },
      { id: 'FW1', x: 38, y: 80, label: 'FW1', type: 'firewall', connections: ['R2', 'R4'] },
      { id: 'R3', x: 55, y: 25, label: 'R3', type: 'router', connections: ['M1', 'M2'] },
      { id: 'R4', x: 55, y: 65, label: 'R4', type: 'router', connections: ['FW1', 'L1', 'R5'] },
      { id: 'M2', x: 55, y: 5, label: 'M2', type: 'malware', connections: ['R3'] },
      { id: 'L1', x: 70, y: 65, label: 'LOCK', type: 'locked', connections: ['R4', 'FW2'] },
      { id: 'R5', x: 55, y: 90, label: 'R5', type: 'router', connections: ['R4', 'M3'] },
      { id: 'M3', x: 70, y: 90, label: 'M3', type: 'malware', connections: ['R5', 'E'] },
      { id: 'FW2', x: 82, y: 65, label: 'FW2', type: 'firewall', connections: ['L1', 'R6'] },
      { id: 'R6', x: 82, y: 35, label: 'R6', type: 'router', connections: ['FW2', 'E'] },
      { id: 'E', x: 95, y: 50, label: 'END', type: 'end', connections: ['R6', 'M3'] },
    ],
  },
];

const NETWORK_SIMULETOOLS = [
  'network_map',
  'dependency_graph',
  'access_policy',
  'circuit_breaker',
  'service_restart',
] as const;

const NODE_COLORS: Record<NodeType, string> = {
  start: '#4ADE80',
  end: '#FACC15',
  router: '#7C3AED',
  firewall: '#60A5FA',
  malware: '#F87171',
  locked: '#9CA3AF',
  key: '#FACC15',
};

const NODE_SHAPE: Record<NodeType, 'circle' | 'square' | 'diamond'> = {
  start: 'circle',
  end: 'circle',
  router: 'circle',
  firewall: 'square',
  malware: 'circle',
  locked: 'circle',
  key: 'diamond',
};

function NodeIcon({ type, size = 16 }: { type: NodeType; size?: number }) {
  const color = '#FFFFFF';
  switch (type) {
    case 'start': return <Zap size={size} strokeWidth={3} color={color} />;
    case 'end': return <Star size={size} strokeWidth={3} color={color} />;
    case 'router': return <Router size={size} strokeWidth={3} color={color} />;
    case 'firewall': return <Shield size={size} strokeWidth={3} color={color} />;
    case 'malware': return <Skull size={size} strokeWidth={3} color={color} />;
    case 'locked': return <Lock size={size} strokeWidth={3} color={color} />;
    case 'key': return <Key size={size} strokeWidth={3} color="#5B21B6" />;
    default: return <Router size={size} strokeWidth={3} color={color} />;
  }
}

export default function NetworkNavigator({ onScoreChange }: Props) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [lives, setLives] = useState(3);
  const [path, setPath] = useState<string[]>([]);
  const [collectedKeys, setCollectedKeys] = useState<string[]>([]);
  const [levelComplete, setLevelComplete] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [shakeNode, setShakeNode] = useState<string | null>(null);
  const [wrongPathFlash, setWrongPathFlash] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [levelScores, setLevelScores] = useState<(number | null)[]>(new Array(8).fill(null));
  const [levelStars, setLevelStars] = useState<(number | null)[]>(new Array(8).fill(null));
  const [attemptsThisLevel, setAttemptsThisLevel] = useState(0);
  const [showLevelSelect, setShowLevelSelect] = useState(true);
  const [pathEdges, setPathEdges] = useState<[string, string][]>([]);
  const [confetti, setConfetti] = useState(false);

  // Use ref for lives to avoid stale closure in setTimeout callbacks
  const livesRef = useRef(lives);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  const level = LEVELS[currentLevel];

  const resetLevel = useCallback(() => {
    const startNode = level.startNode;
    setPath([startNode]);
    setPathEdges([]);
    setCollectedKeys([]);
    setLevelComplete(false);
    setGameOver(false);
    setShakeNode(null);
    setWrongPathFlash(false);
    setConfetti(false);
    setMessage(`Level ${level.id}: ${level.name} - ${level.description}`);
  }, [level]);

  useEffect(() => {
    if (!showLevelSelect) {
      resetLevel();
    }
  }, [currentLevel, showLevelSelect, resetLevel]);

  const getNode = useCallback((id: string) => level.nodes.find((n) => n.id === id)!, [level]);

  const getConnected = useCallback(
    (nodeId: string): string[] => {
      const node = getNode(nodeId);
      return node ? node.connections : [];
    },
    [getNode]
  );

  const isConnected = useCallback(
    (from: string, to: string): boolean => {
      const node = getNode(from);
      return node ? node.connections.includes(to) : false;
    },
    [getNode]
  );

  const loseLife = useCallback(() => {
    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameOver(true);
        setMessage('Connection Compromised! Game Over!');
      }
      return newLives;
    });
  }, []);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (levelComplete || gameOver) return;

      const lastNode = path[path.length - 1];
      if (nodeId === lastNode) return;
      if (path.includes(nodeId)) {
        setMessage('You already visited that node! Try a different route.');
        return;
      }
      if (!isConnected(lastNode, nodeId)) {
        setMessage('Those nodes are not connected! Follow the lines.');
        return;
      }

      const node = getNode(nodeId);

      // Handle key collection
      if (node.type === 'key') {
        setCollectedKeys((prev) => [...prev, nodeId]);
        setMessage('Key collected! You can now unlock locked doors.');
        const newPath = [...path, nodeId];
        setPath(newPath);
        setPathEdges((prev) => [...prev, [lastNode, nodeId]]);
        return;
      }

      // Handle locked node
      if (node.type === 'locked') {
        // Check if we have a key
        const hasKey = collectedKeys.length > 0;
        if (!hasKey) {
          setShakeNode(nodeId);
          setMessage('This node is LOCKED! Find a Key first!');
          loseLife();
          setTimeout(() => setShakeNode(null), 800);
          return;
        }
        setMessage('Lock opened with your Key!');
      }

      // Handle malware trap
      if (node.type === 'malware') {
        setShakeNode(nodeId);
        setWrongPathFlash(true);
        setMessage('MALWARE DETECTED! You lost a life!');
        loseLife();
        setAttemptsThisLevel((a) => a + 1);
        setTimeout(() => {
          setShakeNode(null);
          setWrongPathFlash(false);
          // Use ref to get current lives value
          if (livesRef.current > 0) {
            resetLevel();
          }
        }, 1200);
        return;
      }

      const newPath = [...path, nodeId];
      setPath(newPath);
      setPathEdges((prev) => [...prev, [lastNode, nodeId]]);

      // Check if reached end
      if (nodeId === level.endNode) {
        const hasAllRequired = level.requiredNodes.every((rn) => newPath.includes(rn));
        if (!hasAllRequired) {
          setWrongPathFlash(true);
          setMessage('You reached the End but missed required Firewalls! Try again!');
          loseLife();
          setAttemptsThisLevel((a) => a + 1);
          setTimeout(() => {
            setWrongPathFlash(false);
            // Use ref to get current lives value
            if (livesRef.current > 0) {
              resetLevel();
            }
          }, 1800);
          return;
        }

        // Level complete!
        const baseScore = 100;
        const penalty = attemptsThisLevel * 10;
        const finalScore = Math.max(20, baseScore - penalty);
        const stars = finalScore >= 90 ? 3 : finalScore >= 60 ? 2 : 1;

        setLevelComplete(true);
        setConfetti(true);
        setTotalScore((prev) => {
          const newTotal = prev + finalScore;
          onScoreChange(Math.min(100, newTotal));
          return newTotal;
        });

        setLevelScores((prev) => {
          const updated = [...prev];
          updated[currentLevel] = finalScore;
          return updated;
        });
        setLevelStars((prev) => {
          const updated = [...prev];
          updated[currentLevel] = stars;
          return updated;
        });
        setMessage(`Level ${level.id} Complete! Score: ${finalScore}`);
        setTimeout(() => setConfetti(false), 3000);
        return;
      }

      setMessage(`Good! Keep going to reach the End node. ${level.requiredNodes.filter((r) => !newPath.includes(r)).length} firewall(s) remaining.`);
    },
    [levelComplete, gameOver, path, isConnected, getNode, level, collectedKeys, loseLife, resetLevel, attemptsThisLevel, currentLevel, onScoreChange]
  );

  const handleNextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel((prev) => prev + 1);
      setAttemptsThisLevel(0);
      setShowLevelSelect(true);
    } else {
      setShowLevelSelect(true);
    }
  };

  const handleRetry = () => {
    setLives(3);
    setTotalScore(0);
    setLevelScores(new Array(8).fill(null));
    setLevelStars(new Array(8).fill(null));
    setAttemptsThisLevel(0);
    setCurrentLevel(0);
    setShowLevelSelect(true);
    onScoreChange(0);
  };

  const handleLevelSelect = (idx: number) => {
    const isUnlocked = idx === 0 || levelScores[idx - 1] !== null;
    if (!isUnlocked) return;
    setCurrentLevel(idx);
    setAttemptsThisLevel(0);
    setShowLevelSelect(false);
  };

  const currentNodeId = path[path.length - 1];
  const availableNodes = getConnected(currentNodeId).filter((n) => !path.includes(n));

  // Calculate node position on SVG
  const nodePos = (id: string) => {
    const n = getNode(id);
    return { cx: `${n.x}%`, cy: `${n.y}%` };
  };

  // SVG edge from connection data
  const allEdges = useCallback(() => {
    const edges: [string, string][] = [];
    const seen = new Set<string>();
    level.nodes.forEach((node) => {
      node.connections.forEach((conn) => {
        const key = [node.id, conn].sort().join('-');
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([node.id, conn]);
        }
      });
    });
    return edges;
  }, [level]);

  const edges = allEdges();

  // Render shape based on node type
  const renderNodeShape = (node: LevelNode, isInPath: boolean, isCurrent: boolean, isShaking: boolean, size: number) => {
    const color = NODE_COLORS[node.type];
    const shape = NODE_SHAPE[node.type];
    const pos = nodePos(node.id);
    const cxNum = node.x;
    const cyNum = node.y;

    const baseProps = {
      fill: color,
      stroke: '#000000',
      strokeWidth: 3,
      style: { filter: isInPath ? 'drop-shadow(0 0 6px ' + color + ')' : 'none' },
    };

    if (shape === 'square') {
      return (
        <rect
          {...baseProps}
          x={`${cxNum - size / 2}%`}
          y={`${cyNum - size / 2 * 0.6}%`}
          width={`${size}%`}
          height={`${size * 0.6}%`}
          rx={4}
        />
      );
    }
    if (shape === 'diamond') {
      return (
        <polygon
          points={`${cxNum},${cyNum - size * 0.5} ${cxNum + size * 0.5},${cyNum} ${cxNum},${cyNum + size * 0.5} ${cxNum - size * 0.5},${cyNum}`}
          fill={color}
          stroke="#000000"
          strokeWidth={3}
        />
      );
    }
    return (
      <circle
        {...baseProps}
        cx={pos.cx}
        cy={pos.cy}
        r={`${size / 2}%`}
      />
    );
  };

  // Level Select Screen
  if (showLevelSelect) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="text-center mb-2">
          <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Network Navigator</h2>
          <p className="font-nunito text-sm text-purple-dark mt-1">
            Build paths through network diagrams. Pass through Firewalls to win!
          </p>
        </div>

        {/* HUD Summary */}
        <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
          <div className="flex items-center gap-1">
            <Heart size={16} strokeWidth={3} className="text-red-alert" fill="#F87171" />
            <span className="font-nunito text-xs font-bold text-white">{lives}</span>
          </div>
          <div className="font-nunito text-xs font-bold text-yellow-accent">
            Score: {totalScore}
          </div>
          <div className="font-nunito text-xs text-purple-lighter">
            Level: {currentLevel + 1}/8
          </div>
        </div>

        {/* Level Grid */}
        <div className="w-full max-w-lg grid grid-cols-4 gap-3">
          {LEVELS.map((lvl, idx) => {
            const isUnlocked = idx === 0 || levelScores[idx - 1] !== null;
            const isCompleted = levelScores[idx] !== null;
            const stars = levelStars[idx];

            return (
              <motion.button
                key={lvl.id}
                whileHover={isUnlocked ? { scale: 1.05 } : {}}
                whileTap={isUnlocked ? { scale: 0.95 } : {}}
                onClick={() => handleLevelSelect(idx)}
                className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl border-4 border-black transition-colors ${
                  isCompleted
                    ? 'bg-green-success'
                    : isUnlocked
                    ? 'bg-white hover:bg-purple-pale'
                    : 'bg-gray-200 cursor-not-allowed'
                }`}
                style={{ opacity: isUnlocked ? 1 : 0.5 }}
              >
                {!isUnlocked && (
                  <Lock size={20} strokeWidth={3} className="text-gray-500" />
                )}
                {isCompleted && (
                  <Trophy size={20} strokeWidth={3} className="text-yellow-accent" />
                )}
                {isUnlocked && !isCompleted && (
                  <Network size={20} strokeWidth={3} className="text-purple-primary" />
                )}
                <span className={`font-nunito text-xs font-bold ${isUnlocked ? 'text-purple-dark' : 'text-gray-400'}`}>
                  {lvl.id}
                </span>
                {isCompleted && stars !== null && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        size={10}
                        strokeWidth={2}
                        className={s <= stars ? 'text-yellow-accent' : 'text-gray-400'}
                        fill={s <= stars ? '#FACC15' : '#9CA3AF'}
                      />
                    ))}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-3 mt-2">
          <p className="font-nunito text-xs font-bold text-purple-dark mb-2 text-center">Node Guide</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(
              [
                ['start', 'Start'],
                ['end', 'End'],
                ['router', 'Safe'],
                ['firewall', 'Required'],
                ['malware', 'Trap'],
                ['locked', 'Locked'],
                ['key', 'Key'],
              ] as [NodeType, string][]
            ).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center"
                  style={{ backgroundColor: NODE_COLORS[type] }}
                >
                  <div className="scale-50">
                    <NodeIcon type={type} size={10} />
                  </div>
                </div>
                <span className="font-nunito text-[10px] text-purple-dark">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Top HUD */}
      <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-nunito text-xs font-bold text-purple-lighter">Lvl {level.id}</span>
          <span className="font-nunito text-xs font-bold text-white">{level.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((i) => (
            <Heart
              key={i}
              size={16}
              strokeWidth={3}
              className={i <= lives ? 'text-red-alert' : 'text-purple-lighter'}
              fill={i <= lives ? '#F87171' : '#DDD6FE'}
            />
          ))}
        </div>
        <div className="font-nunito text-xs font-bold text-yellow-accent">Score: {totalScore}</div>
      </div>

      {/* Message Area */}
      <div
        className={`w-full max-w-lg rounded-xl border-[3px] border-black px-3 py-2 transition-colors ${
          wrongPathFlash ? 'bg-red-alert' : 'bg-blue-info'
        }`}
      >
        <p className={`font-nunito text-xs text-center font-bold ${wrongPathFlash ? 'text-white' : 'text-white'}`}>
          {message}
        </p>
      </div>

      {/* Network Diagram */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl border-4 border-black overflow-hidden" style={{ height: 340 }}>
        <svg className="absolute inset-0 w-full h-full">
          {/* Edges */}
          {edges.map(([from, to], i) => {
            const fromNode = getNode(from);
            const toNode = getNode(to);
            const isActive = pathEdges.some(
              ([a, b]) => (a === from && b === to) || (a === to && b === from)
            );
            return (
              <line
                key={i}
                x1={`${fromNode.x}%`}
                y1={`${fromNode.y}%`}
                x2={`${toNode.x}%`}
                y2={`${toNode.y}%`}
                stroke={isActive ? '#FACC15' : '#DDD6FE'}
                strokeWidth={isActive ? 4 : 2}
                strokeDasharray={isActive ? 'none' : '6,4'}
                strokeLinecap="round"
              />
            );
          })}

          {/* Path highlight overlay */}
          {pathEdges.map(([from, to], i) => {
            const fromNode = getNode(from);
            const toNode = getNode(to);
            return (
              <motion.line
                key={`path-${i}`}
                x1={`${fromNode.x}%`}
                y1={`${fromNode.y}%`}
                x2={`${toNode.x}%`}
                y2={`${toNode.y}%`}
                stroke="#FACC15"
                strokeWidth={5}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {level.nodes.map((node) => {
          const isInPath = path.includes(node.id);
          const isCurrent = node.id === currentNodeId;
          const isAvailable = availableNodes.includes(node.id);
          const isShaking = shakeNode === node.id;
          const isCollectedKey = node.type === 'key' && collectedKeys.includes(node.id);

          return (
            <motion.button
              key={node.id}
              onClick={() => handleNodeClick(node.id)}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${
                !levelComplete && !gameOver && (isAvailable || (node.type === 'key' && isAvailable)) && !isCollectedKey
                  ? 'cursor-pointer'
                  : 'cursor-default'
              }`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              animate={
                isShaking
                  ? { x: [0, -6, 6, -6, 6, 0] }
                  : isCurrent
                  ? { scale: [1, 1.12, 1] }
                  : isInPath
                  ? { scale: 1 }
                  : isAvailable && !isCollectedKey
                  ? { scale: [1, 1.06, 1] }
                  : { scale: 1 }
              }
              transition={
                isShaking
                  ? { duration: 0.4 }
                  : isCurrent || (isAvailable && !isCollectedKey)
                  ? { duration: 1, repeat: Infinity }
                  : { duration: 0.2 }
              }
              whileHover={
                !levelComplete && !gameOver && isAvailable && !isCollectedKey ? { scale: 1.2 } : {}
              }
              whileTap={
                !levelComplete && !gameOver && isAvailable && !isCollectedKey ? { scale: 0.9 } : {}
              }
            >
              <div className="relative">
                {/* Node shape SVG overlay */}
                <svg width={56} height={56} viewBox="0 0 56 56" className="overflow-visible">
                  {node.type === 'firewall' ? (
                    <rect
                      x={6}
                      y={10}
                      width={44}
                      height={36}
                      rx={6}
                      fill={isCollectedKey ? '#E5E7EB' : NODE_COLORS[node.type]}
                      stroke="#000000"
                      strokeWidth={3}
                      style={{
                        filter: isInPath ? 'drop-shadow(0 0 4px ' + NODE_COLORS[node.type] + ')' : 'none',
                      }}
                    />
                  ) : node.type === 'key' ? (
                    <polygon
                      points="28,6 50,28 28,50 6,28"
                      fill={isCollectedKey ? '#E5E7EB' : NODE_COLORS[node.type]}
                      stroke="#000000"
                      strokeWidth={3}
                      style={{
                        filter: isInPath && !isCollectedKey ? 'drop-shadow(0 0 4px ' + NODE_COLORS[node.type] + ')' : 'none',
                      }}
                    />
                  ) : (
                    <circle
                      cx={28}
                      cy={28}
                      r={24}
                      fill={isCollectedKey ? '#E5E7EB' : NODE_COLORS[node.type]}
                      stroke="#000000"
                      strokeWidth={3}
                      style={{
                        filter: isInPath ? 'drop-shadow(0 0 4px ' + NODE_COLORS[node.type] + ')' : 'none',
                      }}
                    />
                  )}
                </svg>

                {/* Icon */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isCollectedKey ? (
                    <Check size={14} strokeWidth={4} className="text-gray-400" />
                  ) : (
                    <>
                      <NodeIcon type={node.type} size={node.type === 'firewall' ? 14 : 14} />
                      <span className="font-nunito text-[7px] font-bold text-white leading-none mt-0.5">
                        {node.label}
                      </span>
                    </>
                  )}
                </div>

                {/* Current indicator */}
                {isCurrent && !levelComplete && (
                  <motion.div
                    className="absolute -inset-2 rounded-full border-2 border-yellow-accent"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}

                {/* Required label */}
                {node.type === 'firewall' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-info border-2 border-black rounded-full px-1.5 py-0">
                    <span className="font-nunito text-[6px] font-bold text-white">REQ</span>
                  </div>
                )}

                {/* Trap label */}
                {node.type === 'malware' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-alert border-2 border-black rounded-full px-1.5 py-0">
                    <span className="font-nunito text-[6px] font-bold text-white">TRAP</span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}

        {/* Confetti */}
        <AnimatePresence>
          {confetti && (
            <>
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full border-2 border-black"
                  style={{
                    backgroundColor: ['#4ADE80', '#FACC15', '#60A5FA', '#F472B6', '#7C3AED'][i % 5],
                    left: `${10 + (i % 10) * 9}%`,
                    top: '20%',
                  }}
                  initial={{ y: 0, opacity: 1, scale: 0 }}
                  animate={{
                    y: [0, -80 - Math.random() * 60, 200],
                    x: [0, (Math.random() - 0.5) * 120],
                    rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                    opacity: [1, 1, 0],
                    scale: [0, 1.2, 0.5],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Path indicator at bottom */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 flex-wrap">
          <ArrowRight size={12} strokeWidth={3} className="text-purple-light flex-shrink-0" />
          {path.map((nodeId, i) => {
            const n = getNode(nodeId);
            return (
              <div key={i} className="flex items-center gap-0.5">
                <span
                  className="font-nunito text-[9px] font-bold text-white border-[2px] border-black rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: NODE_COLORS[n.type] }}
                >
                  {n.label.slice(0, 2)}
                </span>
                {i < path.length - 1 && <span className="text-purple-light text-xs">&rsaquo;</span>}
              </div>
            );
          })}
        </div>
      </div>

      <SimuleToolTrainingPanel
        mission="Topology routing, dependency impact, least-privilege paths, and failure containment."
        toolIds={NETWORK_SIMULETOOLS}
      />

      {/* Available Nodes */}
      {!levelComplete && !gameOver && availableNodes.length > 0 && (
        <div className="w-full max-w-lg bg-purple-pale rounded-xl border-[3px] border-purple-light p-3">
          <p className="font-nunito text-xs font-semibold text-purple-dark mb-2">
            Available next nodes:
          </p>
          <div className="flex gap-2 flex-wrap">
            {availableNodes.map((nodeId) => {
              const node = getNode(nodeId);
              return (
                <button
                  key={nodeId}
                  onClick={() => handleNodeClick(nodeId)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border-[3px] border-black rounded-full font-nunito text-xs font-bold text-purple-dark hover:scale-105 transition-transform"
                  style={{ boxShadow: '3px 3px 0px 0px #3B0764' }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-black flex items-center justify-center"
                    style={{ backgroundColor: NODE_COLORS[node.type] }}
                  >
                    <div className="scale-40">
                      <NodeIcon type={node.type} size={8} />
                    </div>
                  </div>
                  {node.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Level Complete Modal */}
      <AnimatePresence>
        {levelComplete && (
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="w-full max-w-lg bg-green-success rounded-2xl border-4 border-black p-4 flex flex-col items-center gap-2"
            style={{ boxShadow: '8px 8px 0px 0px #000000' }}
          >
            <Trophy size={32} strokeWidth={3} className="text-yellow-accent" />
            <h3 className="font-fredoka text-xl text-black text-outline-sm">
              Level {level.id} Complete!
            </h3>
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
            <div className="flex gap-2 mt-1">
              {currentLevel < LEVELS.length - 1 ? (
                <button
                  onClick={handleNextLevel}
                  className="flex items-center gap-1 px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark transition-colors hover:scale-105"
                >
                  Next Level
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              ) : (
                <button
                  onClick={() => setShowLevelSelect(true)}
                  className="flex items-center gap-1 px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark transition-colors hover:scale-105"
                >
                  All Levels Complete!
                  <Trophy size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="w-full max-w-lg bg-red-alert rounded-2xl border-4 border-black p-4 flex flex-col items-center gap-2"
            style={{ boxShadow: '8px 8px 0px 0px #000000' }}
          >
            <ShieldAlert size={32} strokeWidth={3} className="text-white" />
            <h3 className="font-fredoka text-xl text-white text-outline-sm">
              Connection Compromised!
            </h3>
            <p className="font-nunito text-sm text-white">
              Final Score: {totalScore}
            </p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-5 py-2 bg-purple-dark border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-darker transition-colors hover:scale-105 mt-1"
            >
              <RotateCcw size={16} strokeWidth={3} />
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            resetLevel();
            setAttemptsThisLevel((a) => a + 1);
          }}
          disabled={levelComplete || gameOver}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light transition-colors hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} strokeWidth={3} />
          Restart Level
        </button>
        <button
          onClick={() => setShowLevelSelect(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light transition-colors hover:scale-105"
        >
          <Network size={14} strokeWidth={3} />
          Level Select
        </button>
      </div>
    </div>
  );
}
