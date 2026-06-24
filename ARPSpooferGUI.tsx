import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server, Smartphone, Laptop, Router, Shield, ShieldAlert, Zap,
  ArrowRight, ArrowLeft, Star, Play, RotateCcw, Lock, Unlock,
  AlertTriangle, CheckCircle, XCircle, Info, Eye, EyeOff, Wifi,
  Activity, Globe, Crosshair, Target, PawPrint, Skull
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  onScoreChange: (score: number) => void;
}

type DeviceType = 'router' | 'pc' | 'phone' | 'attacker';
type Phase = 'select' | 'spoof' | 'mitm' | 'detect';

interface Device {
  id: string;
  name: string;
  type: DeviceType;
  ip: string;
  mac: string;
  x: number;
  y: number;
  icon: React.ReactNode;
  color: string;
}

interface ARPPacket {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response';
  animate: boolean;
}

interface InterceptedPacket {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
const DEVICES: Device[] = [
  {
    id: 'router', name: 'Router', type: 'router',
    ip: '192.168.1.1', mac: 'AA:BB:CC:11:22:33',
    x: 50, y: 15, color: '#FACC15',
    icon: <Router size={28} strokeWidth={3} />,
  },
  {
    id: 'attacker', name: 'Your Machine', type: 'attacker',
    ip: '192.168.1.50', mac: 'DE:AD:BE:EF:00:01',
    x: 50, y: 80, color: '#7C3AED',
    icon: <Laptop size={28} strokeWidth={3} />,
  },
  {
    id: 'pc1', name: 'Alice PC', type: 'pc',
    ip: '192.168.1.10', mac: '11:22:33:44:55:66',
    x: 15, y: 45, color: '#4ADE80',
    icon: <Laptop size={24} strokeWidth={3} />,
  },
  {
    id: 'pc2', name: 'Bob PC', type: 'pc',
    ip: '192.168.1.20', mac: '22:33:44:55:66:77',
    x: 35, y: 50, color: '#60A5FA',
    icon: <Laptop size={24} strokeWidth={3} />,
  },
  {
    id: 'phone1', name: 'Carol Phone', type: 'phone',
    ip: '192.168.1.30', mac: '33:44:55:66:77:88',
    x: 65, y: 50, color: '#F472B6',
    icon: <Smartphone size={24} strokeWidth={3} />,
  },
  {
    id: 'phone2', name: 'Dave Phone', type: 'phone',
    ip: '192.168.1.40', mac: '44:55:66:77:88:99',
    x: 85, y: 45, color: '#F472B6',
    icon: <Smartphone size={24} strokeWidth={3} />,
  },
];

const INTERCEPT_CONTENTS = [
  'HTTP GET /login.html',
  'POST /api/auth {user: "alice", pass: "****"}',
  'DNS Query: google.com',
  'HTTPS handshake [encrypted]',
  'GET /images/cat.png',
  'Cookie: session=abc123',
  'ARP Reply: 192.168.1.1 is at DE:AD:BE:EF:00:01',
  'Ping request to 8.8.8.8',
  'TCP SYN to port 443',
  'UDP Packet to 53',
];

const EDU_STEPS = [
  { title: 'What is ARP?', text: 'ARP (Address Resolution Protocol) maps IP addresses to MAC addresses on a local network.' },
  { title: 'How it Works', text: 'Devices send ARP requests asking "Who has this IP?" and receive ARP replies with MAC addresses.' },
  { title: 'The Cache', text: 'Each device stores IP→MAC mappings in an ARP cache to avoid repeated lookups.' },
  { title: 'The Vulnerability', text: 'ARP has no authentication! Anyone can send fake ARP replies.' },
  { title: 'ARP Spoofing', text: 'An attacker sends fake ARP replies claiming to be the router. Traffic gets redirected!' },
  { title: 'Man in the Middle', text: 'The attacker sits between victim and router, intercepting all traffic!' },
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function ARPSpooferGUI({ onScoreChange }: Props) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedVictim, setSelectedVictim] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [mitmActive, setMitmActive] = useState(false);
  const [intercepted, setIntercepted] = useState<InterceptedPacket[]>([]);
  const [arpPackets, setArpPackets] = useState<ARPPacket[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [mitmPositionScore, setMitmPositionScore] = useState(false);
  const [eduStep, setEduStep] = useState(0);
  const [detectionMode, setDetectionMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spoofIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalScoreRef = useRef(0);

  const attacker = DEVICES.find(d => d.type === 'attacker')!;
  const victim = DEVICES.find(d => d.id === selectedVictim);
  const target = DEVICES.find(d => d.id === selectedTarget);

  // Keep ref in sync with state
  useEffect(() => {
    totalScoreRef.current = totalScore;
  }, [totalScore]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (spoofIntervalRef.current) clearInterval(spoofIntervalRef.current);
    };
  }, []);

  const sendARPPacket = useCallback((from: string, to: string, type: 'request' | 'response') => {
    const id = `arp-${Date.now()}-${Math.random()}`;
    setArpPackets(prev => [...prev, { id, from, to, type, animate: true }]);
    setTimeout(() => {
      setArpPackets(prev => prev.filter(p => p.id !== id));
    }, 2000);
  }, []);

  const startSpoof = useCallback(() => {
    if (!selectedVictim || !selectedTarget) return;
    setPhase('spoof');
    setEduStep(4);

    // Clear any existing spoof interval
    if (spoofIntervalRef.current) clearInterval(spoofIntervalRef.current);

    // Send ARP packets in sequence
    let step = 0;
    spoofIntervalRef.current = setInterval(() => {
      switch (step) {
        case 0:
          sendARPPacket(selectedVictim, selectedTarget, 'request');
          break;
        case 1:
          sendARPPacket('attacker', selectedVictim, 'response');
          break;
        case 2:
          sendARPPacket(selectedTarget, 'attacker', 'request');
          break;
        case 3:
          sendARPPacket('attacker', selectedTarget, 'response');
          break;
        case 4:
          if (spoofIntervalRef.current) clearInterval(spoofIntervalRef.current);
          setPhase('mitm');
          setMitmActive(true);
          setEduStep(5);
          // MITM position bonus - use ref for latest score
          if (!mitmPositionScore) {
            setMitmPositionScore(true);
            const newScore = Math.min(100, totalScoreRef.current + 50);
            totalScoreRef.current = newScore;
            setTotalScore(newScore);
            onScoreChange(newScore);
          }
          return;
      }
      step++;
    }, 1200);
  }, [selectedVictim, selectedTarget, sendARPPacket, onScoreChange, mitmPositionScore]);

  // Generate intercepted packets during MITM
  useEffect(() => {
    if (!mitmActive) return;

    intervalRef.current = setInterval(() => {
      const content = INTERCEPT_CONTENTS[Math.floor(Math.random() * INTERCEPT_CONTENTS.length)];
      const fromDev = DEVICES.find(d => d.id === selectedVictim);
      const toDev = DEVICES.find(d => d.id === selectedTarget);
      if (!fromDev || !toDev) return;

      const pkt: InterceptedPacket = {
        id: `pkt-${Date.now()}-${Math.random()}`,
        from: fromDev.name,
        to: toDev.name,
        content,
        timestamp: Date.now(),
      };

      setIntercepted(prev => {
        const next = [pkt, ...prev];
        if (next.length > 15) next.pop();
        return next;
      });

      // Use functional update to avoid stale closure
      setTotalScore(prev => {
        const newScore = Math.min(100, prev + 10);
        totalScoreRef.current = newScore;
        onScoreChange(newScore);
        return newScore;
      });
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // Only depend on mitmActive - use refs for changing values
  }, [mitmActive, selectedVictim, selectedTarget, onScoreChange]);

  const resetAll = () => {
    setPhase('select');
    setSelectedVictim(null);
    setSelectedTarget(null);
    setMitmActive(false);
    setIntercepted([]);
    setArpPackets([]);
    setMitmPositionScore(false);
    setEduStep(0);
    setDetectionMode(false);
    setTotalScore(0);
    totalScoreRef.current = 0;
    onScoreChange(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (spoofIntervalRef.current) {
      clearInterval(spoofIntervalRef.current);
      spoofIntervalRef.current = null;
    }
  };

  const toggleDetection = () => {
    setDetectionMode(d => !d);
    setPhase('detect');
    setEduStep(5);
    // Stop MITM packet generation when detection is activated
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setMitmActive(false);
  };

  const canStart = selectedVictim && selectedTarget && phase === 'select';

  return (
    <div className="flex flex-col gap-3 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <Wifi size={28} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">ARP Spoofer</h2>
      </div>
      <p className="text-center text-sm text-purple-darker font-nunito -mt-2 mb-1">
        Learn how ARP works and how Man-in-the-Middle attacks happen!
      </p>

      {/* Score & Phase */}
      <div className="flex items-center justify-between bg-white rounded-2xl border-4 border-black p-3 card-shadow">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full border-2 border-black ${
            phase === 'select' ? 'bg-purple-primary' :
            phase === 'spoof' ? 'bg-yellow-accent' :
            phase === 'mitm' ? 'bg-red-alert' :
            'bg-green-success'
          }`} />
          <span className="font-fredoka text-xs text-purple-darker">
            Phase: {phase === 'select' ? 'Select Targets' : phase === 'spoof' ? 'ARP Spoofing' : phase === 'mitm' ? 'MITM Active' : 'Detection Mode'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Eye size={14} strokeWidth={3} className="text-red-alert" />
            <span className="font-fredoka text-xs text-purple-darker">Intercepted: {intercepted.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={14} strokeWidth={3} className="text-yellow-accent" />
            <span className="font-fredoka text-xs text-purple-darker">{totalScore} pts</span>
          </div>
        </div>
      </div>

      {/* Educational Step Indicator */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {EDU_STEPS.map((step, i) => (
          <button
            key={i}
            onClick={() => setEduStep(i)}
            className={`flex-shrink-0 px-2 py-1 rounded-xl border-3 font-fredoka text-[9px] transition-colors ${
              eduStep === i
                ? 'bg-purple-primary text-white border-black'
                : i < eduStep ? 'bg-green-success/20 text-green-success border-green-success' : 'bg-gray-100 text-gray-400 border-gray-200'
            }`}
          >
            {i + 1}. {step.title}
          </button>
        ))}
      </div>

      {/* Educational Info Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={eduStep}
          initial={{ y: 5, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -5, opacity: 1 }}
          className="bg-blue-info/10 rounded-2xl border-4 border-blue-info p-3 flex items-start gap-2"
        >
          <Info size={18} strokeWidth={3} className="text-blue-info shrink-0 mt-0.5" />
          <div>
            <div className="font-fredoka text-xs text-purple-darker">{EDU_STEPS[eduStep].title}</div>
            <div className="text-[10px] font-nunito text-purple-darker">{EDU_STEPS[eduStep].text}</div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Network Diagram */}
      <div className="relative bg-white rounded-2xl border-4 border-black p-4 card-shadow" style={{ minHeight: 320 }}>
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {/* Router to all devices */}
          {DEVICES.filter(d => d.id !== 'router').map(d => (
            <line
              key={`line-${d.id}`}
              x1={`${DEVICES[0].x}%`} y1={`${DEVICES[0].y + 5}%`}
              x2={`${d.x}%`} y2={`${d.y - 5}%`}
              stroke={mitmActive && (d.id === selectedVictim || d.id === 'attacker')
                ? '#F87171'
                : selectedVictim === d.id || selectedTarget === d.id
                  ? '#7C3AED'
                  : '#E5E7EB'
              }
              strokeWidth={mitmActive && (d.id === selectedVictim || d.id === 'attacker') ? 3 : 1}
              strokeDasharray={mitmActive && d.id === selectedVictim ? '8,4' : 'none'}
            />
          ))}

          {/* Attacker to target router line (MITM) */}
          {mitmActive && (
            <>
              <motion.line
                x1={`${attacker.x}%`} y1={`${attacker.y - 5}%`}
                x2={`${target?.x}%`} y2={`${target ? target.y + 5 : 0}%`}
                stroke="#F87171"
                strokeWidth="3"
                strokeDasharray="6,3"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              {/* Victim to attacker line */}
              <motion.line
                x1={`${victim?.x}%`} y1={`${victim ? victim.y + 5 : 0}%`}
                x2={`${attacker.x}%`} y2={`${attacker.y - 5}%`}
                stroke="#F87171"
                strokeWidth="3"
                strokeDasharray="6,3"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1, delay: 0.5 }}
              />
            </>
          )}
        </svg>

        {/* ARP Packet Animations */}
        <AnimatePresence>
          {arpPackets.map(pkt => {
            const fromDev = DEVICES.find(d => d.id === pkt.from);
            const toDev = DEVICES.find(d => d.id === pkt.to);
            if (!fromDev || !toDev) return null;
            return (
              <motion.div
                key={pkt.id}
                className="absolute z-20 pointer-events-none"
                initial={{ left: `${fromDev.x}%`, top: `${fromDev.y}%` }}
                animate={{ left: `${toDev.x}%`, top: `${toDev.y}%` }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                <div className={`w-6 h-6 rounded-full border-3 border-black flex items-center justify-center ${
                  pkt.type === 'request' ? 'bg-yellow-accent' : 'bg-green-success'
                }`}>
                  {pkt.type === 'request' ? (
                    <ArrowRight size={12} strokeWidth={3} className="text-black" />
                  ) : (
                    <ArrowLeft size={12} strokeWidth={3} className="text-white" />
                  )}
                </div>
                <div className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 bg-black text-white rounded px-1 py-0.5 text-[7px] font-fredoka whitespace-nowrap">
                  ARP {pkt.type}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Device Nodes */}
        {DEVICES.map(device => {
          const isVictim = selectedVictim === device.id;
          const isTarget = selectedTarget === device.id;
          const isAttacker = device.type === 'attacker';
          const isRouter = device.type === 'router';
          const isMitmActive = mitmActive && (isVictim || (isRouter && selectedTarget === 'router'));

          return (
            <motion.div
              key={device.id}
              className="absolute z-10"
              style={{ left: `${device.x}%`, top: `${device.y}%`, transform: 'translate(-50%, -50%)' }}
              whileHover={{ scale: 1.1 }}
              animate={{
                scale: isMitmActive ? [1, 1.08, 1] : 1,
              }}
              transition={isMitmActive ? { repeat: Infinity, duration: 1.5 } : {}}
            >
              <button
                onClick={() => {
                  if (phase !== 'select' || isAttacker || isRouter) return;
                  if (!selectedVictim) setSelectedVictim(device.id);
                  else if (!selectedTarget && device.id !== selectedVictim) setSelectedTarget(device.id);
                  else { setSelectedVictim(device.id); setSelectedTarget(null); }
                }}
                disabled={phase !== 'select' && !isAttacker && !isRouter}
                className={`relative flex flex-col items-center gap-0.5 p-2 rounded-2xl border-4 transition-all ${
                  isVictim
                    ? 'bg-red-alert/20 border-red-alert shadow-lg'
                    : isTarget
                      ? 'bg-green-success/20 border-green-success shadow-lg'
                      : isAttacker
                        ? 'bg-purple-primary/20 border-purple-primary'
                        : 'bg-white border-gray-200 hover:border-purple-light'
                } ${phase === 'select' && !isAttacker && !isRouter ? 'cursor-pointer hover:shadow-solid-sm' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl border-4 border-black flex items-center justify-center ${
                  isVictim ? 'bg-red-alert text-white' :
                  isTarget ? 'bg-green-success text-white' :
                  isAttacker ? 'bg-purple-primary text-white' :
                  'bg-white'
                }`} style={{ color: isVictim || isTarget || isAttacker ? undefined : device.color }}>
                  {device.icon}
                </div>

                {/* Labels */}
                <div className="bg-white rounded-lg border-2 border-black px-1.5 py-0.5 text-center">
                  <div className="text-[9px] font-fredoka text-purple-darker whitespace-nowrap">{device.name}</div>
                  <div className="text-[7px] font-jetbrains text-gray-400">{device.ip}</div>
                </div>

                {/* Selection badges */}
                {isVictim && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-alert text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-black"
                  >
                    <Crosshair size={10} strokeWidth={3} />
                  </motion.div>
                )}
                {isTarget && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-green-success text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-black"
                  >
                    <Target size={10} strokeWidth={3} />
                  </motion.div>
                )}

                {/* MITM indicator */}
                {isMitmActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute -bottom-2 -right-2 bg-red-alert text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-black"
                  >
                    <Eye size={10} strokeWidth={3} />
                  </motion.div>
                )}
              </button>
            </motion.div>
          );
        })}

        {/* MITM Banner */}
        {mitmActive && (
          <motion.div
            initial={{ y: -20, scale: 0.8 }}
            animate={{ y: 0, scale: 1 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-red-alert text-white px-4 py-1 rounded-xl border-4 border-black font-fredoka text-xs flex items-center gap-1"
          >
            <Skull size={14} strokeWidth={3} />
            MAN-IN-THE-MIDDLE POSITION ACTIVE
            <Eye size={14} strokeWidth={3} className="ml-1" />
          </motion.div>
        )}
      </div>

      {/* Selection status */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-2xl border-4 p-2 text-center transition-colors ${
          selectedVictim ? 'bg-red-alert/10 border-red-alert' : 'bg-gray-100 border-gray-200'
        }`}>
          <div className="text-[10px] font-nunito text-gray-500">Victim</div>
          <div className="font-fredoka text-xs text-purple-darker">
            {victim ? `${victim.name} (${victim.ip})` : 'Click a device above'}
          </div>
        </div>
        <div className={`rounded-2xl border-4 p-2 text-center transition-colors ${
          selectedTarget ? 'bg-green-success/10 border-green-success' : 'bg-gray-100 border-gray-200'
        }`}>
          <div className="text-[10px] font-nunito text-gray-500">Target (Router)</div>
          <div className="font-fredoka text-xs text-purple-darker">
            {target ? `${target.name} (${target.ip})` : 'Router is auto-selected'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center flex-wrap">
        {phase === 'select' && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (selectedVictim) {
                  setSelectedTarget('router');
                  startSpoof();
                }
              }}
              disabled={!canStart}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-4 border-black font-fredoka text-sm transition-all ${
                canStart
                  ? 'bg-red-alert text-white card-shadow-sm hover:shadow-solid'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Zap size={18} strokeWidth={3} />
              Launch ARP Spoof
            </motion.button>
            {!selectedVictim && (
              <div className="w-full text-center text-xs font-nunito text-gray-400 mt-1">
                Select a victim device to begin the attack simulation
              </div>
            )}
          </>
        )}

        {phase === 'spoof' && (
          <div className="flex items-center gap-2 px-6 py-3 bg-yellow-accent rounded-2xl border-4 border-black font-fredoka text-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Activity size={18} strokeWidth={3} />
            </motion.div>
            Sending ARP packets...
          </div>
        )}

        {phase === 'mitm' && (
          <>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-3 bg-red-alert text-white rounded-2xl border-4 border-black font-fredoka text-sm"
            >
              <Eye size={18} strokeWidth={3} />
              Intercepting traffic!
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDetection}
              className="flex items-center gap-2 px-4 py-3 bg-green-success rounded-2xl border-4 border-black font-fredoka text-sm card-shadow-sm"
            >
              <Shield size={18} strokeWidth={3} />
              Detect & Defend
            </motion.button>
          </>
        )}

        {phase === 'detect' && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-4 py-3 bg-green-success text-white rounded-2xl border-4 border-black font-fredoka text-sm"
          >
            <Shield size={18} strokeWidth={3} />
            Static ARP entry set! Attack blocked!
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetAll}
          className="flex items-center gap-2 px-4 py-3 bg-gray-200 rounded-2xl border-4 border-black font-fredoka text-sm hover:bg-gray-300 transition-colors"
        >
          <RotateCcw size={18} strokeWidth={3} />
          Reset
        </motion.button>
      </div>

      {/* Intercepted Packets Panel */}
      {mitmActive && (
        <motion.div
          initial={{ height: 0, opacity: 1 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="overflow-hidden"
        >
          <div className="bg-white rounded-2xl border-4 border-red-alert p-3 card-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={18} strokeWidth={3} className="text-red-alert" />
              <span className="font-fredoka text-sm text-purple-darker">Intercepted Packets</span>
              <span className="ml-auto font-fredoka text-xs text-red-alert">+10 pts each</span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1">
              <AnimatePresence>
                {intercepted.map((pkt, i) => (
                  <motion.div
                    key={pkt.id}
                    initial={{ x: -20, opacity: 1 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="flex items-center gap-2 p-2 rounded-xl border-2 border-purple-pale bg-purple-pale/30"
                  >
                    <div className="w-6 h-6 rounded-full bg-red-alert/20 border-2 border-red-alert flex items-center justify-center shrink-0">
                      <ArrowRight size={10} strokeWidth={3} className="text-red-alert" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-jetbrains text-[9px] text-purple-darker truncate">{pkt.content}</div>
                      <div className="text-[8px] text-gray-400">{pkt.from} → {pkt.to}</div>
                    </div>
                    <div className="text-[8px] font-fredoka text-green-success shrink-0">+10</div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {intercepted.length === 0 && (
                <div className="text-center text-gray-400 font-nunito text-xs py-4">
                  <Eye size={24} strokeWidth={2} className="mx-auto mb-1" />
                  Waiting for packets...
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ARP Cache Table */}
      {phase !== 'select' && (
        <motion.div
          initial={{ height: 0, opacity: 1 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="overflow-hidden"
        >
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <div className="flex items-center gap-2 mb-2">
              <LayersIcon />
              <span className="font-fredoka text-sm text-purple-darker">ARP Cache (Victim&apos;s View)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-purple-pale">
                    <th className="text-[9px] font-fredoka text-gray-500 py-1">IP Address</th>
                    <th className="text-[9px] font-fredoka text-gray-500 py-1">MAC Address</th>
                    <th className="text-[9px] font-fredoka text-gray-500 py-1">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {victim && (
                    <>
                      <tr className="border-b border-purple-pale/50">
                        <td className="text-[9px] font-jetbrains text-purple-darker py-1">{attacker.ip}</td>
                        <td className={`text-[9px] font-jetbrains py-1 ${mitmActive ? 'text-red-alert font-bold' : ''}`}>
                          {mitmActive ? attacker.mac : '??'}
                        </td>
                        <td className="text-[9px] font-fredoka py-1">
                          <span className={`px-1.5 py-0.5 rounded-lg border-2 border-black text-white ${mitmActive ? 'bg-red-alert' : 'bg-gray-400'}`}>
                            {mitmActive ? 'SPOOFED!' : 'dynamic'}
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-purple-pale/50">
                        <td className="text-[9px] font-jetbrains text-purple-darker py-1">{DEVICES[0].ip}</td>
                        <td className={`text-[9px] font-jetbrains py-1 ${mitmActive ? 'text-red-alert font-bold' : ''}`}>
                          {mitmActive ? attacker.mac : DEVICES[0].mac}
                        </td>
                        <td className="text-[9px] font-fredoka py-1">
                          <span className={`px-1.5 py-0.5 rounded-lg border-2 border-black text-white ${mitmActive ? 'bg-red-alert' : 'bg-green-success'}`}>
                            {mitmActive ? 'POISONED!' : 'static'}
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                  {!victim && (
                    <tr>
                      <td colSpan={3} className="text-center text-gray-400 text-xs py-2">No victim selected</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {mitmActive && (
              <div className="mt-2 text-[9px] font-nunito text-red-alert bg-red-alert/10 rounded-lg p-1.5 border-2 border-red-alert">
                <AlertTriangle size={12} strokeWidth={3} className="inline mr-1" />
                The victim now thinks the attacker MAC ({attacker.mac}) belongs to both the router AND the attacker!
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Defense info */}
      {detectionMode && (
        <motion.div
          initial={{ y: 10 }}
          animate={{ y: 0 }}
          className="bg-green-success/10 rounded-2xl border-4 border-green-success p-3"
        >
          <div className="flex items-start gap-2">
            <Shield size={18} strokeWidth={3} className="text-green-success shrink-0 mt-0.5" />
            <div>
              <div className="font-fredoka text-xs text-purple-darker">Defense: Static ARP Entries</div>
              <div className="text-[10px] font-nunito text-purple-darker">
                Set static ARP entries for critical devices so they can&apos;t be overwritten by spoofed packets.
                Use: <code className="bg-purple-pale px-1 rounded text-[9px] font-jetbrains">arp -s 192.168.1.1 AA:BB:CC:11:22:33</code>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-purple-pale rounded-2xl border-4 border-purple-light p-2 text-center">
          <Server size={20} strokeWidth={3} className="text-purple-primary mx-auto mb-1" />
          <div className="text-[10px] font-fredoka text-purple-darker">MAC Address</div>
          <div className="text-[9px] font-nunito text-gray-500">Unique hardware ID for network devices</div>
        </div>
        <div className="bg-purple-pale rounded-2xl border-4 border-purple-light p-2 text-center">
          <ShieldAlert size={20} strokeWidth={3} className="text-red-alert mx-auto mb-1" />
          <div className="text-[10px] font-fredoka text-purple-darker">ARP Poisoning</div>
          <div className="text-[9px] font-nunito text-gray-500">Faking MAC address mappings to intercept traffic</div>
        </div>
        <div className="bg-purple-pale rounded-2xl border-4 border-purple-light p-2 text-center">
          <Eye size={20} strokeWidth={3} className="text-purple-primary mx-auto mb-1" />
          <div className="text-[10px] font-fredoka text-purple-darker">MITM Attack</div>
          <div className="text-[9px] font-nunito text-gray-500">Secretly relaying messages between two parties</div>
        </div>
      </div>
    </div>
  );
}

/* Small helper icon for ARP cache */
function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
