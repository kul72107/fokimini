import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, Check, X } from 'lucide-react';
import SimuleToolTrainingPanel from './SimuleToolTrainingPanel';
import type { OpsContextProps } from '@/lib/opsContext';

interface FirewallDefenderProps extends OpsContextProps {
  onScoreChange: (score: number) => void;
}

interface Packet {
  id: number;
  type: 'good' | 'bad';
  color: string;
  label: string;
  detail?: string;
  x: number;
  y: number;
  speed: number;
}

interface PacketTemplate {
  type: 'good' | 'bad';
  color: string;
  label: string;
  detail?: string;
}

const PACKET_TYPES: PacketTemplate[] = [
  { type: 'good' as const, color: '#4ADE80', label: 'HTTPS' },
  { type: 'good' as const, color: '#60A5FA', label: 'DNS' },
  { type: 'good' as const, color: '#A78BFA', label: 'SSH' },
  { type: 'bad' as const, color: '#F87171', label: 'MALWARE' },
  { type: 'bad' as const, color: '#FB923C', label: 'INTRUSION' },
  { type: 'bad' as const, color: '#EF4444', label: 'DDOS' },
];

function buildOpsPackets(opsContext?: OpsContextProps['opsContext']): PacketTemplate[] {
  if (!opsContext) return PACKET_TYPES;
  const { target } = opsContext;
  return [
    { ...PACKET_TYPES[0], detail: target.hosts.app },
    { ...PACKET_TYPES[1], detail: target.hosts.resolver },
    { ...PACKET_TYPES[2], detail: target.hosts.admin },
    { ...PACKET_TYPES[3], detail: target.safePayloadName },
    { ...PACKET_TYPES[4], detail: target.ips.attacker },
    { ...PACKET_TYPES[5], detail: target.networkCidr },
  ];
}

const FIREWALL_SIMULETOOLS = [
  'packet-tracer',
  'firewall-defender',
  'load-balancer',
  'access-ace',
  'ids-alert',
] as const;

export default function FirewallDefender({ onScoreChange, opsContext }: FirewallDefenderProps) {
  const packetTypes = useMemo(() => buildOpsPackets(opsContext), [opsContext]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameActive, setGameActive] = useState(false);
  const [packetId, setPacketId] = useState(0);
  const [blocked, setBlocked] = useState(0);
  const [allowed, setAllowed] = useState(0);

  // Use ref to track latest score and lives for interval callbacks
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const gameActiveRef = useRef(gameActive);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { gameActiveRef.current = gameActive; }, [gameActive]);

  const spawnPacket = useCallback(() => {
    setPacketId((prevId) => {
      const template = packetTypes[Math.floor(Math.random() * packetTypes.length)];
      const newPacket: Packet = {
        id: prevId,
        ...template,
        x: Math.random() * 80 + 10,
        y: -10,
        speed: Math.random() * 2 + 2,
      };
      setPackets((prev) => [...prev.slice(-20), newPacket]);
      return prevId + 1;
    });
  }, [packetTypes]);

  useEffect(() => {
    if (!gameActive || lives <= 0) return;

    const interval = setInterval(() => {
      spawnPacket();
    }, 1500);

    return () => clearInterval(interval);
  }, [gameActive, lives, spawnPacket]);

  useEffect(() => {
    if (!gameActive || lives <= 0) return;

    const interval = setInterval(() => {
      setPackets((prev) => {
        const updated = prev.map((p) => ({ ...p, y: p.y + p.speed }));
        const escaped = updated.filter((p) => p.y > 100);

        escaped.forEach((p) => {
          if (p.type === 'bad') {
            setLives((l) => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameActive(false);
              }
              return newLives;
            });
          }
        });

        return updated.filter((p) => p.y <= 100);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameActive, lives]);

  const handlePacketAction = (packet: Packet, action: 'allow' | 'block') => {
    const correct =
      (packet.type === 'good' && action === 'allow') ||
      (packet.type === 'bad' && action === 'block');

    if (correct) {
      const newScore = Math.min(100, scoreRef.current + 10);
      scoreRef.current = newScore;
      setScore(newScore);
      onScoreChange(newScore);
      if (newScore >= 50) setGameActive(false);
      if (action === 'block') setBlocked((b) => b + 1);
      else setAllowed((a) => a + 1);
    } else {
      setLives((l) => {
        const newLives = l - 1;
        if (newLives <= 0) {
          setGameActive(false);
        }
        return newLives;
      });
    }

    setPackets((prev) => prev.filter((p) => p.id !== packet.id));
  };

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setLives(3);
    setPackets([]);
    setBlocked(0);
    setAllowed(0);
    setPacketId(0);
    onScoreChange(0);
  };

  const successfulDefense = score >= 40;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* HUD */}
      <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-nunito text-sm font-bold text-white">Lives:</span>
          {[1, 2, 3].map((i) => (
            <Shield
              key={i}
              size={18}
              strokeWidth={3}
              className={i <= lives ? 'text-pink-accent' : 'text-purple-lighter'}
              fill={i <= lives ? '#F472B6' : '#DDD6FE'}
            />
          ))}
        </div>
        <div className="font-nunito text-sm font-bold text-yellow-accent">
          Score: {score}
        </div>
        <div className="font-nunito text-xs text-purple-lighter">
          Blocked: {blocked} | Allowed: {allowed}
        </div>
      </div>

      {/* Game Area */}
      <div className="relative w-full max-w-lg h-80 bg-white rounded-2xl border-4 border-black overflow-hidden">
        {/* Firewall Wall */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-purple-dark border-t-[4px] border-black flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Shield size={24} strokeWidth={3} className="text-yellow-accent" fill="#FACC15" />
            <span className="font-fredoka font-bold text-lg text-white">{opsContext?.target.hosts.app ?? 'FIREWALL'}</span>
            <Shield size={24} strokeWidth={3} className="text-yellow-accent" fill="#FACC15" />
          </div>
        </div>

        {!gameActive && lives > 0 && score === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-pale/90 z-20">
            <Shield size={48} strokeWidth={3} className="text-purple-primary mb-3" />
            <h3 className="font-fredoka font-bold text-xl text-purple-dark mb-2">
              Firewall Defender
            </h3>
            <p className="font-nunito text-sm text-purple-dark text-center px-8 mb-4">
              Allow target service traffic and block hostile packets tied to this operation.
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark transition-colors hover:scale-105"
            >
              Start Defense
            </button>
          </div>
        )}

        {!gameActive && (lives <= 0 || (score > 0 && !gameActive)) && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 ${successfulDefense ? 'bg-green-success/20' : 'bg-red-alert/20'}`}>
            <ShieldAlert size={48} strokeWidth={3} className={successfulDefense ? 'text-green-success mb-3' : 'text-red-alert mb-3'} />
            <h3 className={`font-fredoka font-bold text-xl mb-2 ${successfulDefense ? 'text-green-success' : 'text-red-alert'}`}>
              {successfulDefense ? 'Defense Stabilized!' : lives <= 0 ? 'Firewall Breached!' : 'Game Over'}
            </h3>
            <p className="font-nunito text-sm text-purple-dark mb-4">
              Final Score: {score}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark transition-colors hover:scale-105"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Packets */}
        <AnimatePresence>
          {packets.map((packet) => (
            <motion.div
              key={packet.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1, y: `${packet.y}%` }}
              exit={{ scale: 0 }}
              style={{ left: `${packet.x}%` }}
              className="absolute top-0 -translate-x-1/2 z-10"
            >
              <div
                className="w-14 h-14 rounded-full border-[3px] border-black flex flex-col items-center justify-center cursor-pointer shadow-lg"
                style={{ backgroundColor: packet.color }}
              >
                <span className="font-nunito text-[9px] font-bold text-white leading-none">
                  {packet.label}
                </span>
                {packet.detail && (
                  <span className="font-nunito text-[6px] font-bold text-white/90 leading-none max-w-[48px] truncate">
                    {packet.detail}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-1 mt-1 justify-center">
                <button
                  onClick={() => handlePacketAction(packet, 'allow')}
                  className="w-7 h-7 rounded-full bg-green-success border-[2px] border-black flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Check size={12} strokeWidth={4} className="text-black" />
                </button>
                <button
                  onClick={() => handlePacketAction(packet, 'block')}
                  className="w-7 h-7 rounded-full bg-red-alert border-[2px] border-black flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <X size={12} strokeWidth={4} className="text-white" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <SimuleToolTrainingPanel
        mission="Traffic filtering, rule order, false-positive control, and safe decoy routing."
        toolIds={FIREWALL_SIMULETOOLS}
      />

      {/* Legend */}
      <div className="w-full max-w-lg flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-green-success border-2 border-black" />
          <span className="font-nunito text-xs font-semibold text-purple-dark">Allow</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-red-alert border-2 border-black" />
          <span className="font-nunito text-xs font-semibold text-purple-dark">Block</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full border-2 border-black" style={{ backgroundColor: '#60A5FA' }} />
          <span className="font-nunito text-xs text-purple-dark">Safe</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full border-2 border-black" style={{ backgroundColor: '#F87171' }} />
          <span className="font-nunito text-xs text-purple-dark">Threat</span>
        </div>
      </div>
    </div>
  );
}
