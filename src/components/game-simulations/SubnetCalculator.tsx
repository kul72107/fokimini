import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, Check, X, RotateCcw, ChevronRight, Trophy, Star,
  Lock, Unlock, Binary, Network, ArrowRight, Zap, BookOpen
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

interface SubnetLevel {
  id: number;
  name: string;
  description: string;
  network: string;
  prefix: number;
  targetPrefix: number;
  subnetsNeeded: number;
  hostsPerSubnet: number;
  hint: string;
}

const LEVELS: SubnetLevel[] = [
  {
    id: 1,
    name: 'Basic Subnetting',
    description: 'Divide a /24 network into /26 subnets.',
    network: '192.168.1.0',
    prefix: 24,
    targetPrefix: 26,
    subnetsNeeded: 4,
    hostsPerSubnet: 62,
    hint: 'Borrow 2 bits from the host portion. /24 + 2 = /26. This gives you 4 subnets!',
  },
  {
    id: 2,
    name: 'VLSM Challenge',
    description: 'A company needs subnets of different sizes.',
    network: '10.0.0.0',
    prefix: 22,
    targetPrefix: 24,
    subnetsNeeded: 4,
    hostsPerSubnet: 254,
    hint: 'Use /24 for 256 IPs each. /22 to /24 borrows 2 bits, giving 4 equal subnets.',
  },
  {
    id: 3,
    name: 'Enterprise Plan',
    description: 'Design a network for multiple departments.',
    network: '172.16.0.0',
    prefix: 20,
    targetPrefix: 23,
    subnetsNeeded: 8,
    hostsPerSubnet: 510,
    hint: 'Borrow 3 bits: /20 to /23 gives 8 subnets with 510 usable hosts each.',
  },
];

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

function longToIp(long: number): string {
  return [
    (long >>> 24) & 0xff,
    (long >>> 16) & 0xff,
    (long >>> 8) & 0xff,
    long & 0xff,
  ].join('.');
}

function getSubnetMask(prefix: number): string {
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return longToIp(mask);
}

function getNetworkAddress(ip: string, prefix: number): string {
  const long = ipToLong(ip);
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return longToIp(long & mask);
}

function getBroadcast(ip: string, prefix: number): string {
  const long = ipToLong(ip);
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return longToIp(long | (~mask >>> 0));
}

function getUsableHosts(prefix: number): number {
  return Math.pow(2, 32 - prefix) - 2;
}

function getSubnetCount(originalPrefix: number, newPrefix: number): number {
  return Math.pow(2, newPrefix - originalPrefix);
}

function prefixToBinary(prefix: number): string {
  const bits = '1'.repeat(prefix) + '0'.repeat(32 - prefix);
  const octets = [];
  for (let i = 0; i < 32; i += 8) {
    octets.push(bits.slice(i, i + 8));
  }
  return octets.join('.');
}

export default function SubnetCalculator({ onScoreChange }: Props) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [sliderValue, setSliderValue] = useState(24);
  const [showBinary, setShowBinary] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [message, setMessage] = useState('');
  const [shakeWrong, setShakeWrong] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [levelScores, setLevelScores] = useState<(number | null)[]>([null, null, null]);
  const [levelStars, setLevelStars] = useState<(number | null)[]>([null, null, null]);

  const level = LEVELS[currentLevel];

  useEffect(() => {
    setSliderValue(level.prefix);
    setMessage(`Level ${level.id}: ${level.name} - ${level.description}`);
  }, [currentLevel, level]);

  const currentMask = getSubnetMask(sliderValue);
  const networkAddr = getNetworkAddress(level.network, sliderValue);
  const broadcastAddr = getBroadcast(level.network, sliderValue);
  const usableHosts = getUsableHosts(sliderValue);
  const subnetCount = getSubnetCount(level.prefix, sliderValue);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (levelComplete) return;
    setSliderValue(parseInt(e.target.value));
  };

  const handleCheckAnswer = () => {
    if (levelComplete) return;

    if (sliderValue === level.targetPrefix) {
      const baseScore = 100;
      const penalty = attempts * 10;
      const finalScore = Math.max(20, baseScore - penalty);
      const stars = finalScore >= 90 ? 3 : finalScore >= 60 ? 2 : 1;

      setLevelComplete(true);
      setTotalScore((prev) => prev + finalScore);
      onScoreChange(totalScore + finalScore);
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
        setMessage('All subnetting challenges complete!');
      } else {
        setMessage(`Correct! /${sliderValue} is the right subnet mask!`);
      }
    } else {
      setAttempts((a) => a + 1);
      setShakeWrong(true);
      const diff = sliderValue - level.targetPrefix;
      if (diff < 0) {
        setMessage(`Need MORE subnets! Try a larger prefix (slide right).`);
      } else {
        setMessage(`Too many subnets! Try a smaller prefix (slide left).`);
      }
      setTimeout(() => setShakeWrong(false), 600);
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      const next = currentLevel + 1;
      setCurrentLevel(next);
      setLevelComplete(false);
      setAttempts(0);
      setShowBinary(false);
      setSliderValue(LEVELS[next].prefix);
    }
  };

  const handleRetry = () => {
    setSliderValue(level.prefix);
    setLevelComplete(false);
    setAttempts(0);
    setShowBinary(false);
    setMessage(`Level ${level.id}: ${level.name} - ${level.description}`);
  };

  const handleResetAll = () => {
    setCurrentLevel(0);
    setSliderValue(LEVELS[0].prefix);
    setLevelComplete(false);
    setAllComplete(false);
    setScore(0);
    setAttempts(0);
    setTotalScore(0);
    setLevelScores([null, null, null]);
    setLevelStars([null, null, null]);
    setShowBinary(false);
    setMessage(`Level 1: ${LEVELS[0].name} - ${LEVELS[0].description}`);
    onScoreChange(0);
  };

  // Generate subnet blocks visualization
  const subnetBlocks = [];
  const totalIPs = Math.pow(2, 32 - level.prefix);
  const ipsPerSubnet = Math.pow(2, 32 - sliderValue);
  const colors = ['#7C3AED', '#60A5FA', '#4ADE80', '#FACC15', '#F472B6', '#FB923C', '#A78BFA', '#34D399'];

  for (let i = 0; i < Math.min(subnetCount, 16); i++) {
    const startIp = ipToLong(getNetworkAddress(level.network, level.prefix)) + i * ipsPerSubnet;
    subnetBlocks.push({
      id: i,
      start: longToIp(startIp),
      end: longToIp(startIp + ipsPerSubnet - 1),
      color: colors[i % colors.length],
    });
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Title */}
      <div className="text-center">
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Subnet Calculator</h2>
        <p className="font-nunito text-xs text-purple-dark mt-1">
          Divide networks into subnets by adjusting the mask!
        </p>
      </div>

      {/* HUD */}
      <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-nunito text-xs font-bold text-purple-lighter">Lvl {level.id}</span>
          <span className="font-nunito text-xs font-bold text-white">{level.name}</span>
        </div>
        <div className="font-nunito text-xs font-bold text-yellow-accent">Score: {totalScore}</div>
      </div>

      {/* Goal */}
      <div className="w-full max-w-lg bg-blue-info rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network size={16} strokeWidth={3} className="text-white" />
            <span className="font-mono text-xs font-bold text-white">
              {level.network}/{level.prefix}
            </span>
          </div>
          <ArrowRight size={14} strokeWidth={3} className="text-white" />
          <div className="flex items-center gap-2">
            <span className="font-nunito text-xs text-white">
              Need: <strong>{level.subnetsNeeded} subnets</strong> with{' '}
              <strong>{level.hostsPerSubnet}+ hosts each</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Message */}
      <div
        className={`w-full max-w-lg rounded-xl border-[3px] border-black px-3 py-2 ${
          levelComplete ? 'bg-green-success' : shakeWrong ? 'bg-red-alert' : 'bg-purple-pale'
        }`}
      >
        <p className={`font-nunito text-xs text-center font-bold ${levelComplete || shakeWrong ? 'text-white' : 'text-purple-dark'}`}>
          {message}
        </p>
      </div>

      {/* Main Display */}
      <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4">
        {/* IP Address Display */}
        <div className="text-center mb-4">
          <p className="font-nunito text-xs text-purple-light mb-1">Network Address</p>
          <div className="inline-flex items-center gap-2 bg-purple-pale rounded-xl border-[3px] border-black px-6 py-3">
            <span className="font-mono text-2xl font-bold text-purple-dark">
              {level.network}/{sliderValue}
            </span>
          </div>
        </div>

        {/* Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-nunito text-xs text-purple-light">/{level.prefix}</span>
            <span className="font-mono text-sm font-bold text-purple-primary">/{sliderValue}</span>
            <span className="font-nunito text-xs text-purple-light">/30</span>
          </div>
          <input
            type="range"
            min={level.prefix}
            max={30}
            value={sliderValue}
            onChange={handleSliderChange}
            disabled={levelComplete}
            className="w-full h-3 bg-purple-lighter rounded-full appearance-none cursor-pointer border-2 border-black disabled:cursor-not-allowed"
            style={{
              accentColor: '#7C3AED',
              background: `linear-gradient(to right, #7C3AED 0%, #7C3AED ${((sliderValue - level.prefix) / (30 - level.prefix)) * 100}%, #DDD6FE ${((sliderValue - level.prefix) / (30 - level.prefix)) * 100}%, #DDD6FE 100%)`,
            }}
          />
          <p className="font-nunito text-[10px] text-purple-light text-center mt-1">
            Drag to adjust subnet mask
          </p>
        </div>

        {/* Binary Toggle */}
        <button
          onClick={() => setShowBinary(!showBinary)}
          className="flex items-center gap-1 mx-auto px-3 py-1 bg-purple-lighter border-[2px] border-black rounded-full font-nunito text-[10px] font-bold text-purple-dark hover:bg-purple-light transition-colors mb-3"
        >
          <BookOpen size={12} strokeWidth={3} />
          {showBinary ? 'Hide' : 'Show'} Binary
        </button>

        <AnimatePresence>
          {showBinary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-purple-pale rounded-xl border-[2px] border-purple-light p-2 mb-3 overflow-hidden"
            >
              <p className="font-nunito text-[10px] text-purple-dark mb-1 text-center">Subnet Mask in Binary</p>
              <p className="font-mono text-[10px] text-purple-dark text-center break-all">
                {prefixToBinary(sliderValue)}
              </p>
              <div className="flex justify-center gap-1 mt-1">
                <span className="font-nunito text-[9px] text-purple-light bg-purple-lighter px-1 rounded">
                  Network: {sliderValue} bits
                </span>
                <span className="font-nunito text-[9px] text-purple-light bg-purple-lighter px-1 rounded">
                  Host: {32 - sliderValue} bits
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-purple-pale rounded-xl border-[2px] border-purple-light p-2 text-center">
            <p className="font-nunito text-[10px] text-purple-light">Subnet Mask</p>
            <p className="font-mono text-sm font-bold text-purple-dark">{currentMask}</p>
          </div>
          <div className="bg-purple-pale rounded-xl border-[2px] border-purple-light p-2 text-center">
            <p className="font-nunito text-[10px] text-purple-light">Subnets Created</p>
            <p className="font-mono text-sm font-bold text-purple-dark">{subnetCount}</p>
          </div>
          <div className="bg-purple-pale rounded-xl border-[2px] border-purple-light p-2 text-center">
            <p className="font-nunito text-[10px] text-purple-light">Usable Hosts/Subnet</p>
            <p className="font-mono text-sm font-bold text-purple-dark">{usableHosts}</p>
          </div>
          <div className="bg-purple-pale rounded-xl border-[2px] border-purple-light p-2 text-center">
            <p className="font-nunito text-[10px] text-purple-light">Network / Broadcast</p>
            <p className="font-mono text-[9px] font-bold text-purple-dark">
              {networkAddr} / {broadcastAddr}
            </p>
          </div>
        </div>

        {/* Check Button */}
        {!levelComplete && (
          <button
            onClick={handleCheckAnswer}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-success border-[3px] border-black rounded-full font-nunito font-bold text-sm text-black hover:brightness-110 transition-all hover:scale-105"
          >
            <Check size={16} strokeWidth={3} />
            Check Answer
          </button>
        )}
      </div>

      {/* Subnet Visual */}
      <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-3">
        <p className="font-nunito text-xs font-bold text-purple-dark mb-2 text-center">
          Subnet Visualization ({Math.min(subnetCount, 16)} shown)
        </p>
        <div className="grid grid-cols-4 gap-1">
          {subnetBlocks.map((block) => (
            <motion.div
              key={block.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: block.id * 0.05 }}
              className="rounded-lg border-[2px] border-black p-1.5 text-center"
              style={{ backgroundColor: block.color }}
            >
              <p className="font-nunito text-[8px] font-bold text-white">Subnet {block.id + 1}</p>
              <p className="font-mono text-[7px] text-white">{block.start}</p>
            </motion.div>
          ))}
        </div>
        {subnetCount > 16 && (
          <p className="font-nunito text-[10px] text-purple-light text-center mt-1">
            +{subnetCount - 16} more subnets...
          </p>
        )}
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
              {allComplete ? 'All Challenges Complete!' : `Level ${level.id} Complete!`}
            </h3>
            <p className="font-mono text-xs text-black">
              {level.network}/{sliderValue} - {subnetCount} subnets, {usableHosts} hosts each
            </p>
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
                Next Level
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
        <p className="font-nunito text-xs font-bold text-purple-dark mb-2 text-center">Subnetting Quick Reference</p>
        <div className="grid grid-cols-2 gap-1 font-nunito text-[9px] text-purple-dark">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-primary border border-black" />
            <span>/24 = 256 IPs, 254 hosts</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-info border border-black" />
            <span>/25 = 128 IPs, 126 hosts</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-success border border-black" />
            <span>/26 = 64 IPs, 62 hosts</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-accent border border-black" />
            <span>/30 = 4 IPs, 2 hosts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
