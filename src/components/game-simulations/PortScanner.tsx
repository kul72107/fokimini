import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair, Play, Pause, Square, Zap, Activity, Server,
  Clock, ChevronRight, Star, Gauge, Target, Wifi, Shield, X
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

interface PortResult {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service: string;
  banner: string;
  responseTime: number;
}

interface TargetProfile {
  name: string;
  ip: string;
  personality: string;
  color: string;
  openPorts: number[];
  filteredPorts: number[];
  responsePattern: 'fast' | 'normal' | 'slow' | 'jittery';
}

const TARGETS: TargetProfile[] = [
  {
    name: 'Friendly Server',
    ip: '192.168.1.10',
    personality: 'Responds quickly to all scans',
    color: '#4ADE80',
    openPorts: [22, 80, 443],
    filteredPorts: [3306],
    responsePattern: 'fast',
  },
  {
    name: 'Stealth Firewall',
    ip: '10.0.0.50',
    personality: 'Drops packets silently, slow responses',
    color: '#F87171',
    openPorts: [22, 443, 8080],
    filteredPorts: [80, 443, 3389, 5900],
    responsePattern: 'slow',
  },
  {
    name: 'Honeypot Trap',
    ip: '172.16.0.99',
    personality: 'Responds to everything! All ports seem open',
    color: '#FACC15',
    openPorts: [21, 22, 23, 25, 80, 110, 143, 443, 445, 3389],
    filteredPorts: [],
    responsePattern: 'jittery',
  },
];

const SERVICES: Record<number, string> = {
  21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
  80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 445: 'SMB',
  3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL', 5900: 'VNC',
  6379: 'Redis', 8080: 'HTTP-Alt', 8443: 'HTTPS-Alt',
};

const SPEED_MAP: Record<string, number> = { slow: 400, normal: 200, fast: 80, turbo: 30 };

interface Packet {
  id: number;
  port: number;
  state: 'open' | 'closed' | 'filtered';
  x: number;
  y: number;
}

export default function PortScanner({ onScoreChange }: Props) {
  const [targetIdx, setTargetIdx] = useState(0);
  const [portStart, setPortStart] = useState(1);
  const [portEnd, setPortEnd] = useState(100);
  const [speed, setSpeed] = useState('normal');
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPort, setCurrentPort] = useState(0);
  const [results, setResults] = useState<PortResult[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedResult, setSelectedResult] = useState<PortResult | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const packetIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const target = TARGETS[targetIdx];
  const speedMs = SPEED_MAP[speed];

  const getPortState = useCallback((port: number): 'open' | 'closed' | 'filtered' => {
    if (target.openPorts.includes(port)) return 'open';
    if (target.filteredPorts.includes(port)) return 'filtered';
    return 'closed';
  }, [target]);

  const getResponseTime = useCallback((): number => {
    switch (target.responsePattern) {
      case 'fast': return 10 + Math.random() * 20;
      case 'slow': return 100 + Math.random() * 300;
      case 'jittery': return 5 + Math.random() * 500;
      default: return 30 + Math.random() * 80;
    }
  }, [target]);

  useEffect(() => {
    if (!isScanning || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + speedMs);
    }, speedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isScanning, isPaused, speedMs]);

  useEffect(() => {
    if (!isScanning || isPaused) return;

    if (currentPort > portEnd) {
      setIsScanning(false);
      setScanComplete(true);
      setScanCount(c => c + 1);
      const openCount = results.filter(r => r.state === 'open').length;
      const filteredCount = results.filter(r => r.state === 'filtered').length;
      const timeBonus = speed === 'turbo' ? 50 : speed === 'fast' ? 20 : 0;
      const newScore = totalScore + openCount * 10 + filteredCount * 5 + timeBonus;
      setTotalScore(newScore);
      onScoreChange(Math.min(100, newScore));
      return;
    }

    const timeout = setTimeout(() => {
      const state = getPortState(currentPort);
      const service = SERVICES[currentPort] || `Service-${currentPort}`;
      const banner = state === 'open'
        ? `${service} server ready - ${target.ip}`
        : state === 'filtered'
        ? 'No response (filtered by firewall)'
        : 'Connection refused';
      const responseTime = getResponseTime();

      const result: PortResult = {
        port: currentPort,
        state,
        service,
        banner,
        responseTime,
      };

      setResults(prev => [...prev, result]);

      // Add visual packet
      packetIdRef.current += 1;
      const newPacket: Packet = {
        id: packetIdRef.current,
        port: currentPort,
        state,
        x: 0,
        y: 20 + Math.random() * 60,
      };
      setPackets(prev => [...prev.slice(-15), newPacket]);

      setCurrentPort(prev => prev + 1);
    }, speedMs);

    return () => clearTimeout(timeout);
  }, [isScanning, isPaused, currentPort, portEnd, getPortState, getResponseTime, speed, totalScore, results, onScoreChange, target.ip]);

  // Animate packets
  useEffect(() => {
    if (packets.length === 0) return;
    const interval = setInterval(() => {
      setPackets(prev =>
        prev.map(p => ({ ...p, x: p.x + 8 })).filter(p => p.x < 110)
      );
    }, 30);
    return () => clearInterval(interval);
  }, [packets.length]);

  const startScan = () => {
    setIsScanning(true);
    setIsPaused(false);
    setCurrentPort(portStart);
    setResults([]);
    setPackets([]);
    setScanComplete(false);
    setElapsedTime(0);
    setSelectedResult(null);
    packetIdRef.current = 0;
  };

  const stopScan = () => {
    setIsScanning(false);
    setIsPaused(false);
    setCurrentPort(0);
  };

  const progress = Math.max(0, Math.min(100, ((currentPort - portStart) / (portEnd - portStart + 1)) * 100));
  const openCount = results.filter(r => r.state === 'open').length;
  const closedCount = results.filter(r => r.state === 'closed').length;
  const filteredCount = results.filter(r => r.state === 'filtered').length;

  const getPacketColor = (state: string) => {
    switch (state) {
      case 'open': return '#4ADE80';
      case 'closed': return '#F87171';
      case 'filtered': return '#FACC15';
      default: return '#A78BFA';
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <Crosshair size={28} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Advanced Port Scanner</h2>
      </div>

      {/* Top Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border-4 border-black p-4 card-shadow">
        {/* Target */}
        <div className="flex items-center gap-2">
          <Target size={16} strokeWidth={3} className="text-purple-primary" />
          <select
            value={targetIdx}
            onChange={(e) => { setTargetIdx(Number(e.target.value)); stopScan(); }}
            className="px-3 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-nunito text-xs font-bold text-purple-dark focus:outline-none"
          >
            {TARGETS.map((t, i) => (
              <option key={i} value={i}>{t.name} ({t.ip})</option>
            ))}
          </select>
        </div>

        {/* Port Range */}
        <div className="flex items-center gap-2">
          <Server size={16} strokeWidth={3} className="text-purple-primary" />
          <span className="font-nunito text-xs font-bold text-purple-dark">Ports:</span>
          <input
            type="number"
            value={portStart}
            onChange={(e) => setPortStart(Math.max(1, Math.min(65535, Number(e.target.value))))}
            className="w-16 px-2 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-xs text-purple-dark focus:outline-none"
            min={1}
            max={65535}
          />
          <span className="font-nunito text-xs text-purple-dark">-</span>
          <input
            type="number"
            value={portEnd}
            onChange={(e) => setPortEnd(Math.max(1, Math.min(65535, Number(e.target.value))))}
            className="w-16 px-2 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-xs text-purple-dark focus:outline-none"
            min={1}
            max={65535}
          />
        </div>

        {/* Speed */}
        <div className="flex items-center gap-2">
          <Gauge size={16} strokeWidth={3} className="text-purple-primary" />
          <span className="font-nunito text-xs font-bold text-purple-dark">Speed:</span>
          <div className="flex gap-1">
            {['slow', 'normal', 'fast', 'turbo'].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded-lg border-[3px] border-black font-nunito text-[10px] font-bold uppercase transition-all hover:scale-105 ${
                  speed === s ? 'bg-purple-primary text-white' : 'bg-purple-pale text-purple-dark'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scan Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isScanning ? (
          <button
            onClick={startScan}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-success border-[3px] border-black rounded-full font-nunito font-bold text-sm text-black hover:scale-105 transition-transform card-shadow"
          >
            <Play size={16} strokeWidth={3} />
            START SCAN
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-2 px-4 py-2 border-[3px] border-black rounded-full font-nunito font-bold text-xs transition-all hover:scale-105 ${
                isPaused ? 'bg-green-success text-black' : 'bg-yellow-accent text-black'
              }`}
            >
              {isPaused ? <Play size={14} strokeWidth={3} /> : <Pause size={14} strokeWidth={3} />}
              {isPaused ? 'RESUME' : 'PAUSE'}
            </button>
            <button
              onClick={stopScan}
              className="flex items-center gap-2 px-4 py-2 bg-red-alert border-[3px] border-black rounded-full font-nunito font-bold text-xs text-white hover:scale-105 transition-transform"
            >
              <Square size={14} strokeWidth={3} />
              STOP
            </button>
          </>
        )}

        <button
          onClick={() => setShowSignature(!showSignature)}
          className={`flex items-center gap-1 px-3 py-2 border-[3px] border-black rounded-full font-nunito font-bold text-xs transition-all hover:scale-105 ${
            showSignature ? 'bg-purple-primary text-white' : 'bg-purple-pale text-purple-dark'
          }`}
        >
          <Shield size={12} strokeWidth={3} />
          Signature
        </button>
      </div>

      {/* Visualization Area */}
      <div className="relative bg-purple-darker rounded-2xl border-4 border-black overflow-hidden" style={{ height: 220 }}>
        {/* Attacker */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
          <motion.div
            animate={isScanning ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="w-16 h-16 bg-purple-primary border-[3px] border-black rounded-2xl flex flex-col items-center justify-center"
          >
            <Wifi size={24} strokeWidth={3} className="text-white" />
            <span className="font-nunito text-[8px] font-bold text-white mt-0.5">YOU</span>
          </motion.div>
        </div>

        {/* Target Server */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
          <motion.div
            animate={isScanning ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-20 h-20 border-[3px] border-black rounded-2xl flex flex-col items-center justify-center"
            style={{ backgroundColor: target.color }}
          >
            <Server size={28} strokeWidth={3} className="text-white" />
            <span className="font-nunito text-[8px] font-bold text-white mt-0.5">{target.name}</span>
          </motion.div>
        </div>

        {/* Flying Packets */}
        <AnimatePresence>
          {packets.map((p) => (
            <motion.div
              key={p.id}
              className="absolute z-10 w-4 h-4 rounded-full border-2 border-black"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                backgroundColor: getPacketColor(p.state),
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <span className="font-mono text-[6px] font-bold text-black absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white border border-black rounded px-0.5">
                {p.port}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Path lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line
            x1="12%" y1="50%" x2="88%" y2="50%"
            stroke="#7C3AED" strokeWidth={2} strokeDasharray="8,4" opacity={0.3}
          />
          {/* Scan sweep line */}
          {isScanning && !isPaused && (
            <motion.line
              x1="12%" y1="50%" x2="88%" y2="50%"
              stroke="#FACC15" strokeWidth={3} strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress / 100 }}
            />
          )}
        </svg>

        {/* Target personality badge */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white border-[3px] border-black rounded-full px-3 py-1 z-20">
          <span className="font-nunito text-[10px] font-bold text-purple-dark">{target.personality}</span>
        </div>

        {/* Stats overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black/80 border border-black rounded-lg px-2 py-1">
              <span className="font-mono text-[10px] text-green-success">{openCount} open</span>
            </div>
            <div className="bg-black/80 border border-black rounded-lg px-2 py-1">
              <span className="font-mono text-[10px] text-red-alert">{closedCount} closed</span>
            </div>
            <div className="bg-black/80 border border-black rounded-lg px-2 py-1">
              <span className="font-mono text-[10px] text-yellow-accent">{filteredCount} filtered</span>
            </div>
          </div>
          <div className="bg-black/80 border border-black rounded-lg px-2 py-1 flex items-center gap-1">
            <Clock size={10} strokeWidth={3} className="text-purple-light" />
            <span className="font-mono text-[10px] text-purple-light">{(elapsedTime / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {(isScanning || scanComplete) && (
        <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
          <div className="flex items-center justify-between mb-1">
            <span className="font-nunito text-xs font-bold text-purple-dark">Progress</span>
            <span className="font-mono text-xs text-purple-primary">{progress.toFixed(1)}% ({currentPort - portStart}/{portEnd - portStart + 1})</span>
          </div>
          <div className="h-4 bg-purple-pale rounded-full border-2 border-black overflow-hidden">
            <motion.div
              className="h-full bg-purple-primary rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      )}

      {/* Scan Signature */}
      <AnimatePresence>
        {showSignature && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
              <h3 className="font-fredoka text-sm text-purple-dark mb-2 flex items-center gap-2">
                <Shield size={16} strokeWidth={3} className="text-purple-primary" />
                Scan Signature (What the target sees)
              </h3>
              <div className="bg-purple-pale rounded-xl border-[3px] border-black p-3 font-mono text-xs text-purple-dark space-y-1">
                <p>Source IP: 192.168.1.5 (YOUR IP)</p>
                <p>Scan Type: {speed === 'turbo' ? 'Aggressive - possible attack!' : speed === 'fast' ? 'Fast scan detected' : 'Normal reconnaissance'}</p>
                <p>Pattern: Sequential port sweep {portStart}-{portEnd}</p>
                <p>Signature: {speed === 'turbo' ? 'HIGH RISK - IDS Alert triggered!' : speed === 'slow' ? 'Low and slow - stealthy' : 'Standard port scan'}</p>
                <p>Detected as: {target.responsePattern === 'jittery' ? 'Potential scanner - no action taken' : 'Nmap-style scan detected'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Table */}
      {results.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
        >
          <h3 className="font-fredoka text-sm text-purple-dark mb-2">Scan Results ({results.length} ports scanned)</h3>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="font-nunito text-[10px] font-bold text-purple-dark text-left py-1">Port</th>
                  <th className="font-nunito text-[10px] font-bold text-purple-dark text-left py-1">State</th>
                  <th className="font-nunito text-[10px] font-bold text-purple-dark text-left py-1">Service</th>
                  <th className="font-nunito text-[10px] font-bold text-purple-dark text-left py-1 hidden sm:table-cell">Response</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <motion.tr
                    key={r.port}
                    initial={{ backgroundColor: '#F5F3FF' }}
                    animate={{ backgroundColor: 'transparent' }}
                    transition={{ duration: 0.5 }}
                    onClick={() => setSelectedResult(r)}
                    className="border-b border-purple-lighter cursor-pointer hover:bg-purple-pale transition-colors"
                  >
                    <td className="font-mono text-xs py-1">{r.port}</td>
                    <td className="py-1">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-black font-nunito text-[9px] font-bold ${
                        r.state === 'open' ? 'bg-green-success text-green-800' :
                        r.state === 'filtered' ? 'bg-yellow-accent text-yellow-800' :
                        'bg-red-alert/20 text-red-700'
                      }`}>
                        {r.state === 'open' ? <Activity size={8} strokeWidth={3} /> : r.state === 'filtered' ? <Shield size={8} strokeWidth={3} /> : <X size={8} strokeWidth={3} />}
                        {r.state}
                      </span>
                    </td>
                    <td className="font-nunito text-xs py-1">{r.service}</td>
                    <td className="font-mono text-[9px] py-1 hidden sm:table-cell">{r.responseTime.toFixed(1)}ms</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Port Detail Modal */}
      <AnimatePresence>
        {selectedResult && (
          <motion.div
            initial={{ y: 20, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.9 }}
            className="fixed inset-x-0 bottom-4 z-50 flex justify-center"
          >
            <div className="bg-white rounded-2xl border-4 border-black p-4 mx-4 max-w-md w-full card-shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center ${
                    selectedResult.state === 'open' ? 'bg-green-success' : selectedResult.state === 'filtered' ? 'bg-yellow-accent' : 'bg-red-alert'
                  }`}>
                    <Server size={14} strokeWidth={3} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-fredoka text-lg text-purple-dark">Port {selectedResult.port}</h4>
                    <span className="font-nunito text-xs font-bold uppercase" style={{ color: getPacketColor(selectedResult.state) }}>
                      {selectedResult.state}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="w-8 h-8 rounded-full bg-red-alert border-[3px] border-black flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <span className="text-white font-bold text-sm">X</span>
                </button>
              </div>

              <div className="bg-purple-pale rounded-xl border-[3px] border-black p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <ChevronRight size={12} strokeWidth={3} className="text-purple-primary" />
                  <span className="font-nunito text-xs font-bold text-purple-dark">Service: {selectedResult.service}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight size={12} strokeWidth={3} className="text-purple-primary" />
                  <span className="font-nunito text-xs text-purple-dark">Banner: {selectedResult.banner}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight size={12} strokeWidth={3} className="text-purple-primary" />
                  <span className="font-mono text-xs text-purple-dark">Response time: {selectedResult.responseTime.toFixed(1)}ms</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-success border-2 border-black" />
          <span className="font-nunito text-xs font-semibold text-purple-dark">Open</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-alert border-2 border-black" />
          <span className="font-nunito text-xs font-semibold text-purple-dark">Closed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-accent border-2 border-black" />
          <span className="font-nunito text-xs font-semibold text-purple-dark">Filtered</span>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center justify-center">
        <div className="bg-purple-dark rounded-2xl border-4 border-black px-6 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star size={16} strokeWidth={3} className="text-yellow-accent" />
            <span className="font-nunito text-xs font-bold text-purple-lighter">Score:</span>
            <span className="font-mono text-xl font-bold text-yellow-accent">{totalScore}</span>
          </div>
          <div className="w-px h-6 bg-purple-light" />
          <span className="font-nunito text-xs text-purple-lighter">Scans: {scanCount}</span>
          {speed === 'turbo' && scanComplete && (
            <>
              <div className="w-px h-6 bg-purple-light" />
              <span className="font-nunito text-[10px] text-yellow-accent font-bold">SPEED BONUS!</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
