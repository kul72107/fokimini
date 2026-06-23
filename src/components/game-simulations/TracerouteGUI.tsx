import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, MapPin, Zap, Clock, Server, Router, Flag,
  ChevronRight, Star, Play, RotateCcw, Shield, Activity,
  Crosshair, AlertTriangle, CheckCircle, XCircle, Info, PawPrint
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  onScoreChange: (score: number) => void;
}

interface Hop {
  id: number;
  ip: string;
  host: string;
  location: string;
  country: string;
  flag: string;
  latency: number;
  status: 'pending' | 'reached' | 'timeout';
  x: number; // percentage position on map
  y: number;
}

interface TargetProfile {
  domain: string;
  ip: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  hops: Hop[];
}

/* ------------------------------------------------------------------ */
/*  Pre-defined traceroute data                                        */
/* ------------------------------------------------------------------ */
const TARGETS: TargetProfile[] = [
  {
    domain: 'google.com',
    ip: '142.250.80.46',
    color: '#4ADE80',
    icon: <Globe size={20} strokeWidth={3} />,
    description: 'Google\'s global network',
    hops: [
      { id: 1, ip: '192.168.1.1', host: 'router.local', location: 'Your Home', country: 'Local', flag: '🏠', latency: 1, status: 'pending', x: 15, y: 55 },
      { id: 2, ip: '10.0.0.1', host: 'isp-gateway.net', location: 'Local ISP', country: 'ISP', flag: '🌐', latency: 5, status: 'pending', x: 20, y: 50 },
      { id: 3, ip: '72.14.221.34', host: 'core1.isp.net', location: 'New York, USA', country: 'US', flag: '🇺🇸', latency: 12, status: 'pending', x: 25, y: 42 },
      { id: 4, ip: '108.170.246.1', host: 'google-peering.net', location: 'Ashburn, USA', country: 'US', flag: '🇺🇸', latency: 18, status: 'pending', x: 28, y: 40 },
      { id: 5, ip: '142.251.60.129', host: 'core1.google.com', location: 'Chicago, USA', country: 'US', flag: '🇺🇸', latency: 25, status: 'pending', x: 22, y: 38 },
      { id: 6, ip: '142.251.77.165', host: 'edge2.google.com', location: 'Dallas, USA', country: 'US', flag: '🇺🇸', latency: 35, status: 'pending', x: 18, y: 45 },
      { id: 7, ip: '142.250.239.1', host: 'cache.google.com', location: 'Los Angeles, USA', country: 'US', flag: '🇺🇸', latency: 42, status: 'pending', x: 12, y: 40 },
      { id: 8, ip: '142.250.80.46', host: 'google.com', location: 'Mountain View, USA', country: 'US', flag: '🇺🇸', latency: 48, status: 'pending', x: 10, y: 38 },
    ],
  },
  {
    domain: 'github.com',
    ip: '140.82.121.4',
    color: '#A78BFA',
    icon: <Shield size={20} strokeWidth={3} />,
    description: 'GitHub code hosting platform',
    hops: [
      { id: 1, ip: '192.168.1.1', host: 'router.local', location: 'Your Home', country: 'Local', flag: '🏠', latency: 1, status: 'pending', x: 15, y: 55 },
      { id: 2, ip: '10.0.0.1', host: 'isp-gateway.net', location: 'Local ISP', country: 'ISP', flag: '🌐', latency: 5, status: 'pending', x: 20, y: 50 },
      { id: 3, ip: '62.115.13.29', host: 'telxius-1.net', location: 'London, UK', country: 'UK', flag: '🇬🇧', latency: 78, status: 'pending', x: 48, y: 32 },
      { id: 4, ip: '62.115.138.128', host: 'transatlantic1.net', location: 'Atlantic Ocean', country: 'Atlantic', flag: '🌊', latency: 95, status: 'pending', x: 42, y: 38 },
      { id: 5, ip: '4.68.111.21', host: 'level3-wash.net', location: 'Washington DC, USA', country: 'US', flag: '🇺🇸', latency: 110, status: 'pending', x: 30, y: 40 },
      { id: 6, ip: '4.35.83.2', host: 'level3-chi.net', location: 'Chicago, USA', country: 'US', flag: '🇺🇸', latency: 125, status: 'pending', x: 22, y: 38 },
      { id: 7, ip: '140.82.65.1', host: 'github-edge-1.net', location: 'Seattle, USA', country: 'US', flag: '🇺🇸', latency: 140, status: 'pending', x: 8, y: 32 },
      { id: 8, ip: '*.*.*.*', host: 'Timeout', location: 'Unknown', country: '??', flag: '❓', latency: 0, status: 'timeout', x: 12, y: 30 },
      { id: 9, ip: '140.82.70.1', host: 'github-core.net', location: 'San Francisco, USA', country: 'US', flag: '🇺🇸', latency: 155, status: 'pending', x: 10, y: 36 },
      { id: 10, ip: '140.82.80.2', host: 'github-cdn.net', location: 'Portland, USA', country: 'US', flag: '🇺🇸', latency: 148, status: 'pending', x: 9, y: 33 },
      { id: 11, ip: '140.82.90.5', host: 'lb1.github.com', location: 'Ashburn, USA', country: 'US', flag: '🇺🇸', latency: 135, status: 'pending', x: 28, y: 40 },
      { id: 12, ip: '140.82.121.4', host: 'github.com', location: 'Virginia, USA', country: 'US', flag: '🇺🇸', latency: 130, status: 'pending', x: 27, y: 41 },
    ],
  },
  {
    domain: 'cyberpaws.kids',
    ip: '203.0.113.77',
    color: '#F472B6',
    icon: <PawPrint size={20} strokeWidth={3} />,
    description: 'CyberPaw Arena learning platform',
    hops: [
      { id: 1, ip: '192.168.1.1', host: 'router.local', location: 'Your Home', country: 'Local', flag: '🏠', latency: 1, status: 'pending', x: 15, y: 55 },
      { id: 2, ip: '10.0.0.1', host: 'isp-gateway.net', location: 'Local ISP', country: 'ISP', flag: '🌐', latency: 5, status: 'pending', x: 20, y: 50 },
      { id: 3, ip: '203.0.113.1', host: 'ns1.cyberpaws.kids', location: 'CyberPaw DC', country: 'CP', flag: '🐾', latency: 15, status: 'pending', x: 50, y: 30 },
      { id: 4, ip: '203.0.113.77', host: 'cyberpaws.kids', location: 'CyberPaw Cloud', country: 'CP', flag: '🐾', latency: 22, status: 'pending', x: 52, y: 28 },
    ],
  },
];

const EDU_TIPS = [
  '💡 Each "hop" is a router that your packet passes through!',
  '💡 Lower latency (ping time) means a faster connection!',
  '💡 Some hops may timeout with *** — this is normal for security!',
  '💡 The internet routes packets through the fastest path!',
  '💡 More hops usually mean more distance!',
  '💡 Traceroute helps diagnose network problems!',
];

/* ------------------------------------------------------------------ */
/*  Helper: simplified world map SVG                                 */
/* ------------------------------------------------------------------ */
function WorldMapSVG({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full aspect-[2/1] rounded-2xl border-4 border-black overflow-hidden bg-[#60A5FA]">
      {/* Ocean background */}
      <div className="absolute inset-0 bg-blue-info" />

      {/* Simplified continent shapes (SVG) */}
      <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.2" />
          </pattern>
        </defs>
        <rect width="100" height="50" fill="url(#grid)" />

        {/* North America */}
        <path d="M5,8 L15,5 L25,8 L28,18 L22,28 L18,32 L15,30 L12,25 L8,20 L5,15 Z"
          fill="#4ADE80" stroke="#000" strokeWidth="0.5" />
        {/* South America */}
        <path d="M20,32 L28,30 L30,38 L28,48 L22,46 L18,38 Z"
          fill="#4ADE80" stroke="#000" strokeWidth="0.5" />
        {/* Europe */}
        <path d="M45,8 L55,6 L58,12 L56,18 L52,20 L48,18 L44,14 Z"
          fill="#4ADE80" stroke="#000" strokeWidth="0.5" />
        {/* Africa */}
        <path d="M48,20 L56,18 L60,28 L58,38 L52,42 L48,36 L46,28 Z"
          fill="#4ADE80" stroke="#000" strokeWidth="0.5" />
        {/* Asia */}
        <path d="M58,8 L75,6 L85,10 L88,18 L85,28 L78,32 L70,30 L65,25 L60,20 L58,14 Z"
          fill="#4ADE80" stroke="#000" strokeWidth="0.5" />
        {/* Australia */}
        <path d="M78,38 L88,36 L90,42 L86,46 L78,44 Z"
          fill="#4ADE80" stroke="#000" strokeWidth="0.5" />
        {/* Japan */}
        <path d="M88,16 L90,14 L91,20 L89,22 Z"
          fill="#4ADE80" stroke="#000" strokeWidth="0.5" />
        {/* UK */}
        <path d="M44,10 L46,9 L47,13 L45,14 Z"
          fill="#4ADE80" stroke="#000" strokeWidth="0.5" />
      </svg>

      {/* Decorative paw prints on ocean */}
      <div className="absolute top-[10%] left-[35%] text-white/20 text-2xl rotate-12">🐾</div>
      <div className="absolute top-[60%] left-[65%] text-white/20 text-2xl -rotate-12">🐾</div>
      <div className="absolute top-[25%] left-[92%] text-white/20 text-lg rotate-45">🐾</div>
      <div className="absolute bottom-[15%] left-[5%] text-white/20 text-lg -rotate-12">🐾</div>

      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function TracerouteGUI({ onScoreChange }: Props) {
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [currentHop, setCurrentHop] = useState(-1);
  const [completed, setCompleted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [targetInput, setTargetInput] = useState('');
  const [eduTip, setEduTip] = useState(EDU_TIPS[0]);
  const [selectedHop, setSelectedHop] = useState<Hop | null>(null);
  const [packetPos, setPacketPos] = useState({ x: 0, y: 0 });
  const [scanCount, setScanCount] = useState(0);

  const target = TARGETS[selectedTarget];
  const hops = target.hops;

  const startTraceroute = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);
    setCurrentHop(-1);
    setCompleted(false);
    setSelectedHop(null);
    setEduTip(EDU_TIPS[Math.floor(Math.random() * EDU_TIPS.length)]);
  }, [isScanning]);

  const resetTraceroute = useCallback(() => {
    setIsScanning(false);
    setCurrentHop(-1);
    setCompleted(false);
    setSelectedHop(null);
  }, []);

  // Animate through hops
  useEffect(() => {
    if (!isScanning) return;

    if (currentHop < hops.length - 1) {
      const timer = setTimeout(() => {
        const nextHop = currentHop + 1;
        setCurrentHop(nextHop);

        // Update score for each discovered hop
        if (hops[nextHop].status !== 'timeout') {
          const newScore = totalScore + 10;
          setTotalScore(newScore);
          onScoreChange(Math.min(100, newScore));
        }

        // Move packet to this hop position
        setPacketPos({ x: hops[nextHop].x, y: hops[nextHop].y });
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setCompleted(true);
      setIsScanning(false);
      setScanCount(c => c + 1);
    }
  }, [isScanning, currentHop, hops, totalScore, onScoreChange]);

  // Handle target input
  const handleCustomTarget = () => {
    const input = targetInput.toLowerCase().trim();
    if (input === 'google.com') setSelectedTarget(0);
    else if (input === 'github.com') setSelectedTarget(1);
    else if (input === 'cyberpaws.kids') setSelectedTarget(2);
    setTargetInput('');
    resetTraceroute();
  };

  const reachedHops = hops.filter((_, i) => i <= currentHop && hops[i].status !== 'timeout');
  const timeoutHops = hops.filter((_, i) => i <= currentHop && hops[i].status === 'timeout');
  const avgLatency = reachedHops.length > 0
    ? Math.round(reachedHops.reduce((s, h) => s + h.latency, 0) / reachedHops.length)
    : 0;

  return (
    <div className="flex flex-col gap-3 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <MapPin size={28} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Traceroute Explorer</h2>
      </div>
      <p className="text-center text-sm text-purple-darker font-nunito -mt-2 mb-1">
        Watch packets travel across the internet through router hops!
      </p>

      {/* Target Selection */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border-4 border-black p-3 card-shadow">
        <Router size={20} strokeWidth={3} className="text-purple-primary shrink-0" />
        <span className="font-fredoka text-sm text-purple-darker">Target:</span>

        {TARGETS.map((t, i) => (
          <button
            key={t.domain}
            onClick={() => { setSelectedTarget(i); resetTraceroute(); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-4 font-fredoka text-xs transition-transform ${
              selectedTarget === i
                ? 'bg-purple-primary text-white border-black shadow-solid-sm scale-105'
                : 'bg-purple-pale text-purple-darker border-purple-light hover:scale-105'
            }`}
          >
            {t.icon}
            {t.domain}
          </button>
        ))}

        <div className="flex items-center gap-1 ml-auto">
          <input
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomTarget()}
            placeholder="Enter domain..."
            className="px-3 py-1.5 rounded-xl border-4 border-black bg-purple-pale text-purple-darker font-jetbrains text-xs w-36 focus:outline-none focus:ring-2 focus:ring-purple-primary"
          />
          <button
            onClick={handleCustomTarget}
            className="p-1.5 rounded-xl border-4 border-black bg-green-success hover:scale-110 transition-transform"
          >
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white rounded-2xl border-4 border-black p-2 text-center card-shadow-sm">
          <div className="text-xs font-nunito text-gray-500">Target</div>
          <div className="font-fredoka text-sm text-purple-darker truncate">{target.domain}</div>
        </div>
        <div className="bg-white rounded-2xl border-4 border-black p-2 text-center card-shadow-sm">
          <div className="text-xs font-nunito text-gray-500">Hops</div>
          <div className="font-fredoka text-sm text-purple-darker">{reachedHops.length}/{hops.length}</div>
        </div>
        <div className="bg-white rounded-2xl border-4 border-black p-2 text-center card-shadow-sm">
          <div className="text-xs font-nunito text-gray-500">Avg Latency</div>
          <div className="font-fredoka text-sm text-purple-darker">{avgLatency}ms</div>
        </div>
        <div className="bg-white rounded-2xl border-4 border-black p-2 text-center card-shadow-sm">
          <div className="text-xs font-nunito text-gray-500">Score</div>
          <div className="font-fredoka text-sm text-yellow-accent text-outline-sm">{totalScore}</div>
        </div>
      </div>

      {/* World Map */}
      <WorldMapSVG>
        {/* Connection lines between reached hops */}
        <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          {/* Draw lines from home to each reached hop in sequence */}
          {currentHop >= 0 &&
            Array.from({ length: currentHop }, (_, i) => {
              if (i >= hops.length - 1) return null;
              const from = hops[i];
              const to = hops[i + 1];
              if (from.status === 'timeout' || to.status === 'timeout') return null;
              return (
                <line
                  key={`line-${i}`}
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke="#FACC15"
                  strokeWidth="0.5"
                  strokeDasharray="1,0.5"
                />
              );
            })}
        </svg>

        {/* Hop nodes */}
        {hops.map((hop, i) => {
          const isReached = i <= currentHop;
          const isCurrent = i === currentHop;
          const isTimeout = hop.status === 'timeout' && isReached;

          return (
            <motion.div
              key={hop.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${hop.x}%`, top: `${hop.y}%` }}
              initial={false}
              animate={{
                scale: isCurrent ? 1.3 : isReached ? 1.1 : 0.8,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={() => isReached && setSelectedHop(hop)}
            >
              <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-4 border-black ${
                isTimeout ? 'bg-red-alert' :
                isCurrent ? 'bg-yellow-accent' :
                isReached ? 'bg-green-success' :
                'bg-gray-300'
              }`}>
                {isTimeout ? (
                  <XCircle size={14} strokeWidth={3} className="text-white" />
                ) : isCurrent ? (
                  <Zap size={14} strokeWidth={3} className="text-black" />
                ) : isReached ? (
                  <CheckCircle size={14} strokeWidth={3} className="text-white" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                )}

                {/* Pulse ring for current */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-yellow-accent"
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                )}
              </div>

              {/* Hop label */}
              {isReached && (
                <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-white rounded-lg border-2 border-black px-1.5 py-0.5 text-center">
                    <div className="text-[8px] font-fredoka text-purple-darker">#{hop.id} {hop.flag}</div>
                    <div className="text-[7px] font-jetbrains text-gray-500">{hop.latency > 0 ? `${hop.latency}ms` : '***'}</div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Home starting point */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: '8%', top: '58%' }}
        >
          <div className="w-10 h-10 rounded-full bg-purple-primary border-4 border-black flex items-center justify-center">
            <Server size={18} strokeWidth={3} className="text-white" />
          </div>
          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-purple-dark text-white rounded-lg px-2 py-0.5 text-[9px] font-fredoka whitespace-nowrap border-2 border-black">
            Your Computer
          </div>
        </div>

        {/* Animated packet */}
        {isScanning && currentHop >= 0 && (
          <motion.div
            className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 z-20"
            animate={{
              left: `${packetPos}%`,
              top: `${packetPos.y}%`,
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ left: `${packetPos.x}%`, top: `${packetPos.y}%` }}
          >
            <div className="w-4 h-4 rounded-full bg-yellow-accent border-3 border-black flex items-center justify-center">
              <Zap size={10} strokeWidth={3} className="text-black" />
            </div>
          </motion.div>
        )}

        {/* Destination flag */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${hops[hops.length - 1].x}%`, top: `${hops[hops.length - 1].y - 6}%` }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Flag size={24} strokeWidth={3} className="text-pink-accent" />
          </motion.div>
        </div>
      </WorldMapSVG>

      {/* Hop Details Panel */}
      <AnimatePresence>
        {selectedHop && (
          <motion.div
            initial={{ height: 0, opacity: 1 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-primary border-4 border-black flex items-center justify-center text-white font-fredoka text-sm">
                    {selectedHop.id}
                  </div>
                  <div>
                    <div className="font-fredoka text-sm text-purple-darker">{selectedHop.host}</div>
                    <div className="text-xs font-jetbrains text-gray-500">{selectedHop.ip}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedHop(null)} className="text-gray-400 hover:text-red-alert">
                  <XCircle size={20} strokeWidth={3} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-purple-pale rounded-xl p-2 text-center border-2 border-purple-light">
                  <MapPin size={16} className="text-purple-primary mx-auto mb-0.5" />
                  <div className="text-[10px] text-gray-500">Location</div>
                  <div className="text-xs font-fredoka text-purple-darker">{selectedHop.location}</div>
                </div>
                <div className="bg-purple-pale rounded-xl p-2 text-center border-2 border-purple-light">
                  <Clock size={16} className="text-purple-primary mx-auto mb-0.5" />
                  <div className="text-[10px] text-gray-500">Latency</div>
                  <div className="text-xs font-fredoka text-purple-darker">{selectedHop.latency > 0 ? `${selectedHop.latency}ms` : 'Timeout'}</div>
                </div>
                <div className="bg-purple-pale rounded-xl p-2 text-center border-2 border-purple-light">
                  <Activity size={16} className="text-purple-primary mx-auto mb-0.5" />
                  <div className="text-[10px] text-gray-500">Status</div>
                  <div className="text-xs font-fredoka text-purple-darker">{selectedHop.status === 'timeout' ? 'Timeout' : 'Reached'}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hop List Table */}
      <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow max-h-60 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <Server size={18} strokeWidth={3} className="text-purple-primary" />
          <span className="font-fredoka text-sm text-purple-darker">Hop Details</span>
          <span className="ml-auto text-xs font-nunito text-gray-400">Click a hop for info</span>
        </div>

        <div className="space-y-1">
          {hops.map((hop, i) => {
            const isReached = i <= currentHop;
            const isTimeout = hop.status === 'timeout' && isReached;

            return (
              <motion.div
                key={hop.id}
                initial={false}
                animate={{
                  scale: isReached ? 1 : 0.97,
                  x: isReached ? 0 : -10,
                }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-2 p-2 rounded-xl border-4 transition-colors cursor-pointer ${
                  isReached
                    ? isTimeout ? 'bg-red-alert/10 border-red-alert' : 'bg-green-success/10 border-green-success'
                    : 'bg-gray-50 border-gray-200'
                }`}
                onClick={() => isReached && setSelectedHop(hop)}
              >
                <div className={`w-7 h-7 rounded-full border-3 border-black flex items-center justify-center text-[10px] font-fredoka shrink-0 ${
                  isTimeout ? 'bg-red-alert text-white' :
                  isReached ? 'bg-green-success text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {hop.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-jetbrains text-xs text-purple-darker truncate">{hop.host}</span>
                    <span className="text-xs">{hop.flag}</span>
                  </div>
                  <div className="font-jetbrains text-[10px] text-gray-400">{hop.ip}</div>
                </div>
                <div className="text-xs font-nunito text-gray-500 text-right shrink-0">
                  <div>{hop.location}</div>
                  <div className={isTimeout ? 'text-red-alert' : isReached ? 'text-green-success' : ''}>
                    {hop.latency > 0 ? `${hop.latency}ms` : isTimeout ? '***' : '...'}
                  </div>
                </div>
                {isReached && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="shrink-0"
                  >
                    {isTimeout ? (
                      <AlertTriangle size={16} strokeWidth={3} className="text-red-alert" />
                    ) : (
                      <CheckCircle size={16} strokeWidth={3} className="text-green-success" />
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Educational Tip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={eduTip}
          initial={{ y: 10, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 1 }}
          className="bg-blue-info/10 rounded-2xl border-4 border-blue-info p-3 flex items-start gap-2"
        >
          <Info size={18} strokeWidth={3} className="text-blue-info shrink-0 mt-0.5" />
          <span className="text-xs font-nunito text-purple-darker">{eduTip}</span>
        </motion.div>
      </AnimatePresence>

      {/* Control Buttons */}
      <div className="flex gap-3 justify-center">
        {!isScanning && !completed && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startTraceroute}
            className="flex items-center gap-2 px-6 py-3 bg-green-success rounded-2xl border-4 border-black font-fredoka text-sm card-shadow-sm hover:shadow-solid transition-shadow"
          >
            <Play size={18} strokeWidth={3} />
            Start Traceroute
          </motion.button>
        )}
        {isScanning && (
          <div className="flex items-center gap-2 px-6 py-3 bg-yellow-accent rounded-2xl border-4 border-black font-fredoka text-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <Activity size={18} strokeWidth={3} />
            </motion.div>
            Tracing... Hop {currentHop + 1}/{hops.length}
          </div>
        )}
        {completed && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-6 py-3 bg-purple-primary text-white rounded-2xl border-4 border-black font-fredoka text-sm card-shadow-sm"
          >
            <Star size={18} strokeWidth={3} className="text-yellow-accent" />
            Complete! +{reachedHops.length * 10} pts
          </motion.div>
        )}
        {(completed || currentHop >= 0) && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetTraceroute}
            className="flex items-center gap-2 px-4 py-3 bg-gray-200 rounded-2xl border-4 border-black font-fredoka text-sm hover:bg-gray-300 transition-colors"
          >
            <RotateCcw size={18} strokeWidth={3} />
            Reset
          </motion.button>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-purple-pale rounded-2xl border-4 border-purple-light p-2 text-center">
          <Router size={20} strokeWidth={3} className="text-purple-primary mx-auto mb-1" />
          <div className="text-[10px] font-fredoka text-purple-darker">Routers</div>
          <div className="text-[9px] font-nunito text-gray-500">Each hop is a router forwarding your packet</div>
        </div>
        <div className="bg-purple-pale rounded-2xl border-4 border-purple-light p-2 text-center">
          <Clock size={20} strokeWidth={3} className="text-purple-primary mx-auto mb-1" />
          <div className="text-[10px] font-fredoka text-purple-darker">Latency</div>
          <div className="text-[9px] font-nunito text-gray-500">Round-trip time in milliseconds (ms)</div>
        </div>
        <div className="bg-purple-pale rounded-2xl border-4 border-purple-light p-2 text-center">
          <Crosshair size={20} strokeWidth={3} className="text-purple-primary mx-auto mb-1" />
          <div className="text-[10px] font-fredoka text-purple-darker">Path</div>
          <div className="text-[9px] font-nunito text-gray-500">The route your data takes across the net</div>
        </div>
      </div>
    </div>
  );
}
