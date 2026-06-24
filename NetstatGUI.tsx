import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Shield, ShieldAlert, Server, RefreshCw, X, Filter,
  ArrowDownUp, Lock, Unlock, AlertTriangle, CheckCircle, Zap,
  Globe, Wifi, WifiOff, Clock, Layers, Star, RotateCcw, Eye,
  EyeOff, ChevronDown, ChevronUp, Search, Terminal, Bug
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  onScoreChange: (score: number) => void;
}

type ConnState = 'ESTABLISHED' | 'LISTENING' | 'TIME_WAIT' | 'SYN_SENT' | 'CLOSE_WAIT' | 'CLOSED';
type Protocol = 'TCP' | 'UDP';
type SortKey = 'localPort' | 'remotePort' | 'state' | 'protocol' | 'process';

interface NetConnection {
  id: string;
  protocol: Protocol;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  state: ConnState;
  process: string;
  pid: number;
  bytesSent: number;
  bytesRecv: number;
  suspicious: boolean;
  suspiciousReason?: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data generators                                               */
/* ------------------------------------------------------------------ */
const PROCESS_NAMES = [
  { name: 'chrome.exe', suspicious: false },
  { name: 'firefox.exe', suspicious: false },
  { name: 'node.exe', suspicious: false },
  { name: 'sshd.exe', suspicious: false },
  { name: 'docker.exe', suspicious: false },
  { name: 'spotify.exe', suspicious: false },
  { name: 'svchost.exe', suspicious: false },
  { name: 'discord.exe', suspicious: false },
  { name: 'teams.exe', suspicious: false },
  { name: 'mystery_proc.exe', suspicious: true, reason: 'Unknown process with no publisher' },
  { name: 'data_miner.exe', suspicious: true, reason: 'Sending data to unknown server' },
  { name: 'backdoor.exe', suspicious: true, reason: 'HIGH RISK: Listening on unusual port' },
  { name: 'keylogger.dll', suspicious: true, reason: 'CRITICAL: Possible keylogger detected' },
  { name: 'updater.exe', suspicious: false },
  { name: 'systemd', suspicious: false },
];

const REMOTE_ADDRESSES = [
  '142.250.80.46', '140.82.121.4', '13.107.42.14', '31.13.71.36',
  '104.244.42.193', '192.0.66.2', '198.35.26.96', '91.198.174.192',
  '185.199.108.153', '151.101.1.140', '52.94.236.248', '203.0.113.77',
  '198.51.100.15', '192.0.2.99', '0.0.0.0',
];

const CONN_STATES: ConnState[] = ['ESTABLISHED', 'LISTENING', 'TIME_WAIT', 'SYN_SENT', 'CLOSE_WAIT'];

let idCounter = 0;
function generateConnections(count: number): NetConnection[] {
  const conns: NetConnection[] = [];
  for (let i = 0; i < count; i++) {
    const proc = PROCESS_NAMES[Math.floor(Math.random() * PROCESS_NAMES.length)];
    const state = CONN_STATES[Math.floor(Math.random() * CONN_STATES.length)];
    const isSuspicious = proc.suspicious || (state === 'ESTABLISHED' && Math.random() > 0.92);
    conns.push({
      id: `conn-${++idCounter}-${i}`,
      protocol: Math.random() > 0.3 ? 'TCP' : 'UDP',
      localAddress: '192.168.1.' + (100 + Math.floor(Math.random() * 50)),
      localPort: 1000 + Math.floor(Math.random() * 55000),
      remoteAddress: REMOTE_ADDRESSES[Math.floor(Math.random() * REMOTE_ADDRESSES.length)],
      remotePort: [80, 443, 22, 53, 3389, 8080, 22, 443, 1935, 6667][Math.floor(Math.random() * 10)],
      state,
      process: proc.name,
      pid: 1000 + Math.floor(Math.random() * 9000),
      bytesSent: Math.floor(Math.random() * 10000000),
      bytesRecv: Math.floor(Math.random() * 10000000),
      suspicious: isSuspicious,
      suspiciousReason: isSuspicious ? (proc.suspicious ? proc.reason : 'Unusual connection pattern detected') : undefined,
    });
  }
  return conns;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatBytes(b: number): string {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1024 / 1024).toFixed(1)}MB`;
}

function getStateColor(state: ConnState): string {
  switch (state) {
    case 'ESTABLISHED': return 'bg-green-success';
    case 'LISTENING': return 'bg-blue-info';
    case 'TIME_WAIT': return 'bg-yellow-accent';
    case 'SYN_SENT': return 'bg-purple-light';
    case 'CLOSE_WAIT': return 'bg-red-alert';
    default: return 'bg-gray-300';
  }
}

function getStateTextColor(state: ConnState): string {
  switch (state) {
    case 'ESTABLISHED': return 'text-green-success';
    case 'LISTENING': return 'text-blue-info';
    case 'TIME_WAIT': return 'text-yellow-accent';
    case 'SYN_SENT': return 'text-purple-primary';
    case 'CLOSE_WAIT': return 'text-red-alert';
    default: return 'text-gray-400';
  }
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function NetstatGUI({ onScoreChange }: Props) {
  const [connections, setConnections] = useState<NetConnection[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedConn, setSelectedConn] = useState<NetConnection | null>(null);
  const [filterState, setFilterState] = useState<ConnState | 'ALL'>('ALL');
  const [filterProtocol, setFilterProtocol] = useState<Protocol | 'ALL'>('ALL');
  const [filterSuspicious, setFilterSuspicious] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('localPort');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [totalScore, setTotalScore] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [killedConns, setKilledConns] = useState<Set<string>>(new Set());
  const [educationalAlert, setEducationalAlert] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalScoreRef = useRef(0);

  // Keep ref in sync
  useEffect(() => {
    totalScoreRef.current = totalScore;
  }, [totalScore]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const allConnections = useMemo(() => generateConnections(25), []);

  const refreshConnections = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);
    setConnections([]);
    setKilledConns(new Set());
    setSelectedConn(null);

    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Stagger reveal
    const batchSize = 5;
    let idx = 0;
    intervalRef.current = setInterval(() => {
      const batch = allConnections.slice(idx, idx + batchSize);
      if (batch.length === 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsScanning(false);
        setScanCount(c => c + 1);
        const suspiciousCount = allConnections.filter(c => c.suspicious).length;
        // Use ref for latest score
        const newScore = Math.min(100, totalScoreRef.current + allConnections.length * 2 + suspiciousCount * 10);
        totalScoreRef.current = newScore;
        setTotalScore(newScore);
        onScoreChange(newScore);
        setEducationalAlert(`Scan complete! Found ${allConnections.length} connections including ${suspiciousCount} suspicious ones!`);
        setTimeout(() => setEducationalAlert(null), 4000);
        return;
      }
      setConnections(prev => [...prev, ...batch]);
      idx += batchSize;
    }, 300);
  }, [isScanning, allConnections, onScoreChange]);

  const killConnection = useCallback((conn: NetConnection) => {
    setKilledConns(prev => new Set(prev).add(conn.id));
    setEducationalAlert(`Connection to ${conn.remoteAddress}:${conn.remotePort} terminated! (+5 pts for cleanup)`);
    // Use functional update for score
    setTotalScore(prev => {
      const newScore = Math.min(100, prev + 5);
      totalScoreRef.current = newScore;
      onScoreChange(newScore);
      return newScore;
    });
    setTimeout(() => setEducationalAlert(null), 3000);
  }, [onScoreChange]);

  const resetGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setConnections([]);
    setIsScanning(false);
    setSelectedConn(null);
    setFilterState('ALL');
    setFilterProtocol('ALL');
    setFilterSuspicious(false);
    setSortKey('localPort');
    setSortDir('asc');
    setTotalScore(0);
    totalScoreRef.current = 0;
    setScanCount(0);
    setKilledConns(new Set());
    setEducationalAlert(null);
    setSearchTerm('');
    onScoreChange(0);
  }, [onScoreChange]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Filtered & sorted
  const filteredConns = useMemo(() => {
    let result = connections.filter(c => !killedConns.has(c.id));
    if (filterState !== 'ALL') result = result.filter(c => c.state === filterState);
    if (filterProtocol !== 'ALL') result = result.filter(c => c.protocol === filterProtocol);
    if (filterSuspicious) result = result.filter(c => c.suspicious);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.process.toLowerCase().includes(s) ||
        c.remoteAddress.includes(s) ||
        c.localAddress.includes(s) ||
        String(c.localPort).includes(s)
      );
    }
    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'localPort': return (a.localPort - b.localPort) * dir;
        case 'remotePort': return (a.remotePort - b.remotePort) * dir;
        case 'state': return a.state.localeCompare(b.state) * dir;
        case 'protocol': return a.protocol.localeCompare(b.protocol) * dir;
        case 'process': return a.process.localeCompare(b.process) * dir;
        default: return 0;
      }
    });
    return result;
  }, [connections, killedConns, filterState, filterProtocol, filterSuspicious, searchTerm, sortKey, sortDir]);

  const stats = useMemo(() => {
    const active = connections.filter(c => c.state === 'ESTABLISHED' && !killedConns.has(c.id)).length;
    const listening = connections.filter(c => c.state === 'LISTENING' && !killedConns.has(c.id)).length;
    const timeWait = connections.filter(c => c.state === 'TIME_WAIT' && !killedConns.has(c.id)).length;
    const suspicious = connections.filter(c => c.suspicious && !killedConns.has(c.id)).length;
    return { active, listening, timeWait, suspicious, total: connections.length - killedConns.size };
  }, [connections, killedConns]);

  return (
    <div className="flex flex-col gap-3 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <Activity size={28} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Netstat Monitor</h2>
      </div>
      <p className="text-center text-sm text-purple-darker font-nunito -mt-2 mb-1">
        Inspect active network connections and spot suspicious activity!
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-2">
        <div className="bg-white rounded-2xl border-4 border-black p-2 text-center card-shadow-sm">
          <div className="text-[10px] font-nunito text-gray-500">Total</div>
          <div className="font-fredoka text-lg text-purple-darker">{stats.total}</div>
          <Server size={16} strokeWidth={3} className="text-purple-primary mx-auto" />
        </div>
        <div className="bg-green-success/20 rounded-2xl border-4 border-green-success p-2 text-center card-shadow-sm">
          <div className="text-[10px] font-nunito text-gray-600">Active</div>
          <div className="font-fredoka text-lg text-green-success text-outline-sm">{stats.active}</div>
          <Wifi size={16} strokeWidth={3} className="text-green-success mx-auto" />
        </div>
        <div className="bg-blue-info/20 rounded-2xl border-4 border-blue-info p-2 text-center card-shadow-sm">
          <div className="text-[10px] font-nunito text-gray-600">Listening</div>
          <div className="font-fredoka text-lg text-blue-info">{stats.listening}</div>
          <EarIcon />
        </div>
        <div className="bg-yellow-accent/20 rounded-2xl border-4 border-yellow-accent p-2 text-center card-shadow-sm">
          <div className="text-[10px] font-nunito text-gray-600">Time Wait</div>
          <div className="font-fredoka text-lg text-yellow-accent">{stats.timeWait}</div>
          <Clock size={16} strokeWidth={3} className="text-yellow-accent mx-auto" />
        </div>
        <div className="bg-red-alert/20 rounded-2xl border-4 border-red-alert p-2 text-center card-shadow-sm">
          <div className="text-[10px] font-nunito text-gray-600">Suspicious</div>
          <div className="font-fredoka text-lg text-red-alert text-outline-sm">{stats.suspicious}</div>
          <ShieldAlert size={16} strokeWidth={3} className="text-red-alert mx-auto" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border-4 border-black p-3 card-shadow">
        {/* Refresh */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={refreshConnections}
          disabled={isScanning}
          className={`flex items-center gap-1 px-4 py-2 rounded-xl border-4 border-black font-fredoka text-xs transition-colors ${
            isScanning ? 'bg-gray-200 text-gray-400' : 'bg-green-success hover:shadow-solid-sm'
          }`}
        >
          <motion.div animate={isScanning ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <RefreshCw size={16} strokeWidth={3} />
          </motion.div>
          {isScanning ? 'Scanning...' : 'Refresh'}
        </motion.button>

        {/* Search */}
        <div className="flex items-center gap-1 bg-purple-pale rounded-xl border-4 border-purple-light px-2 py-1">
          <Search size={14} strokeWidth={3} className="text-purple-primary" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="bg-transparent font-jetbrains text-xs text-purple-darker w-28 focus:outline-none placeholder:text-purple-light"
          />
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {/* Protocol filter */}
        {(['ALL', 'TCP', 'UDP'] as const).map(p => (
          <button
            key={p}
            onClick={() => setFilterProtocol(p)}
            className={`px-2 py-1 rounded-lg border-3 font-fredoka text-[10px] transition-colors ${
              filterProtocol === p
                ? 'bg-purple-primary text-white border-black'
                : 'bg-purple-pale text-purple-darker border-purple-light hover:bg-purple-light'
            }`}
          >
            {p}
          </button>
        ))}

        <div className="w-px h-6 bg-gray-200" />

        {/* State filter */}
        <div className="flex items-center gap-1">
          <Filter size={14} strokeWidth={3} className="text-purple-primary" />
          <select
            value={filterState}
            onChange={e => setFilterState(e.target.value as ConnState | 'ALL')}
            className="bg-purple-pale rounded-lg border-3 border-purple-light px-2 py-1 font-fredoka text-[10px] text-purple-darker focus:outline-none"
          >
            <option value="ALL">All States</option>
            <option value="ESTABLISHED">Established</option>
            <option value="LISTENING">Listening</option>
            <option value="TIME_WAIT">Time Wait</option>
            <option value="SYN_SENT">SYN Sent</option>
            <option value="CLOSE_WAIT">Close Wait</option>
          </select>
        </div>

        {/* Suspicious toggle */}
        <button
          onClick={() => setFilterSuspicious(s => !s)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg border-3 font-fredoka text-[10px] transition-colors ${
            filterSuspicious
              ? 'bg-red-alert text-white border-black'
              : 'bg-red-alert/10 text-red-alert border-red-alert hover:bg-red-alert/20'
          }`}
        >
          <ShieldAlert size={12} strokeWidth={3} />
          Suspicious Only
        </button>

        <div className="ml-auto flex items-center gap-1">
          <Star size={14} strokeWidth={3} className="text-yellow-accent" />
          <span className="font-fredoka text-xs text-purple-darker">{totalScore} pts</span>
        </div>

        {/* Reset */}
        <button
          onClick={resetGame}
          className="flex items-center gap-1 px-2 py-1 rounded-lg border-3 border-purple-light font-fredoka text-[10px] text-purple-darker hover:bg-purple-pale transition-colors"
        >
          <RotateCcw size={12} strokeWidth={3} />
          Reset
        </button>
      </div>

      {/* Educational Alert */}
      <AnimatePresence>
        {educationalAlert && (
          <motion.div
            initial={{ height: 0, opacity: 1 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="bg-yellow-accent/20 rounded-2xl border-4 border-yellow-accent p-2 flex items-center gap-2">
              <AlertTriangle size={18} strokeWidth={3} className="text-yellow-accent shrink-0" />
              <span className="text-xs font-nunito text-purple-darker">{educationalAlert}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Table */}
      <div className="bg-white rounded-2xl border-4 border-black card-shadow overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[60px_80px_1fr_1fr_100px_100px_80px] gap-1 p-2 bg-purple-pale border-b-4 border-black">
          {[
            { key: 'protocol' as SortKey, label: 'Proto', width: '60px' },
            { key: 'state' as SortKey, label: 'State', width: '80px' },
            { key: 'localPort' as SortKey, label: 'Local', width: '1fr' },
            { key: 'remotePort' as SortKey, label: 'Remote', width: '1fr' },
            { key: 'process' as SortKey, label: 'Process', width: '100px' },
          ].map(col => (
            <button
              key={col.key}
              onClick={() => handleSort(col.key)}
              className="flex items-center gap-0.5 font-fredoka text-[10px] text-purple-darker hover:text-purple-primary text-left"
            >
              {col.label}
              {sortKey === col.key && (
                sortDir === 'asc' ? <ChevronUp size={10} strokeWidth={3} /> : <ChevronDown size={10} strokeWidth={3} />
              )}
            </button>
          ))}
          <div className="font-fredoka text-[10px] text-purple-darker">Traffic</div>
          <div className="font-fredoka text-[10px] text-purple-darker text-center">Action</div>
        </div>

        {/* Table Rows */}
        <div className="max-h-64 overflow-y-auto">
          <AnimatePresence>
            {filteredConns.map((conn) => (
              <motion.div
                key={conn.id}
                initial={{ x: -20, opacity: 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0, backgroundColor: '#F87171' }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedConn(conn)}
                className={`grid grid-cols-[60px_80px_1fr_1fr_100px_100px_80px] gap-1 p-2 border-b-2 border-purple-pale/50 cursor-pointer hover:bg-purple-pale/30 transition-colors items-center ${
                  conn.suspicious ? 'bg-red-alert/5' : ''
                } ${selectedConn?.id === conn.id ? 'bg-purple-pale/50 border-l-4 border-l-purple-primary' : ''}`}
              >
                {/* Protocol badge */}
                <div className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg border-2 border-black font-jetbrains text-[9px] font-bold w-fit ${
                  conn.protocol === 'TCP' ? 'bg-blue-info text-white' : 'bg-purple-light text-purple-darker'
                }`}>
                  {conn.protocol}
                </div>

                {/* State badge */}
                <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg border-2 border-black font-fredoka text-[8px] text-white w-fit ${getStateColor(conn.state)}`}>
                  {conn.state === 'ESTABLISHED' && <Wifi size={8} strokeWidth={3} />}
                  {conn.state === 'LISTENING' && <EarIcon small />}
                  {conn.state === 'TIME_WAIT' && <Clock size={8} strokeWidth={3} />}
                  {conn.state === 'CLOSE_WAIT' && <WifiOff size={8} strokeWidth={3} />}
                  {conn.state === 'SYN_SENT' && <Zap size={8} strokeWidth={3} />}
                  {conn.state.slice(0, 4)}
                </div>

                {/* Local */}
                <div className="font-jetbrains text-[9px] text-purple-darker truncate">
                  {conn.localAddress}:{conn.localPort}
                </div>

                {/* Remote */}
                <div className="flex items-center gap-0.5">
                  <span className="font-jetbrains text-[9px] text-purple-darker truncate">
                    {conn.remoteAddress}:{conn.remotePort}
                  </span>
                  {conn.suspicious && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Bug size={10} strokeWidth={3} className="text-red-alert" />
                    </motion.div>
                  )}
                </div>

                {/* Process */}
                <div className="font-jetbrains text-[9px] text-purple-darker truncate">{conn.process}</div>

                {/* Traffic */}
                <div className="text-[8px] font-jetbrains text-gray-400">
                  <span className="text-green-success">&#8593;{formatBytes(conn.bytesSent)}</span>{' '}
                  <span className="text-blue-info">&#8595;{formatBytes(conn.bytesRecv)}</span>
                </div>

                {/* Kill button */}
                <div className="flex justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); killConnection(conn); }}
                    className="p-1 rounded-lg border-2 border-red-alert text-red-alert hover:bg-red-alert hover:text-white transition-colors"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredConns.length === 0 && !isScanning && (
            <div className="p-8 text-center text-gray-400 font-nunito text-sm">
              <Layers size={32} strokeWidth={2} className="mx-auto mb-2" />
              No connections found. Click Refresh to scan!
            </div>
          )}

          {isScanning && connections.length === 0 && (
            <div className="p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="inline-block"
              >
                <RefreshCw size={32} strokeWidth={3} className="text-purple-primary" />
              </motion.div>
              <p className="mt-2 text-sm font-nunito text-purple-darker">Scanning connections...</p>
            </div>
          )}
        </div>
      </div>

      {/* Connection Detail Panel */}
      <AnimatePresence>
        {selectedConn && (
          <motion.div
            initial={{ height: 0, opacity: 1 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 1 }}
            className="overflow-hidden"
          >
            <div className={`bg-white rounded-2xl border-4 p-3 card-shadow ${
              selectedConn.suspicious ? 'border-red-alert' : 'border-black'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full border-4 border-black flex items-center justify-center ${
                    selectedConn.suspicious ? 'bg-red-alert' : 'bg-purple-primary'
                  }`}>
                    {selectedConn.suspicious ? (
                      <ShieldAlert size={16} strokeWidth={3} className="text-white" />
                    ) : (
                      <Activity size={16} strokeWidth={3} className="text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-fredoka text-sm text-purple-darker">{selectedConn.process}</div>
                    <div className="font-jetbrains text-[10px] text-gray-400">PID: {selectedConn.pid}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConn(null)}
                  className="p-1 rounded-lg border-2 border-black hover:bg-gray-100"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-purple-pale rounded-xl p-2 border-2 border-purple-light">
                  <div className="text-[9px] text-gray-500 mb-0.5">Local Endpoint</div>
                  <div className="font-jetbrains text-xs text-purple-darker">{selectedConn.localAddress}:{selectedConn.localPort}</div>
                </div>
                <div className={`rounded-xl p-2 border-2 ${
                  selectedConn.suspicious ? 'bg-red-alert/10 border-red-alert' : 'bg-blue-info/10 border-blue-info'
                }`}>
                  <div className="text-[9px] text-gray-500 mb-0.5">Remote Endpoint</div>
                  <div className="font-jetbrains text-xs text-purple-darker">{selectedConn.remoteAddress}:{selectedConn.remotePort}</div>
                </div>
                <div className="bg-green-success/10 rounded-xl p-2 border-2 border-green-success">
                  <div className="text-[9px] text-gray-500 mb-0.5">Sent</div>
                  <div className="font-jetbrains text-xs text-green-success">{formatBytes(selectedConn.bytesSent)}</div>
                </div>
                <div className="bg-blue-info/10 rounded-xl p-2 border-2 border-blue-info">
                  <div className="text-[9px] text-gray-500 mb-0.5">Received</div>
                  <div className="font-jetbrains text-xs text-blue-info">{formatBytes(selectedConn.bytesRecv)}</div>
                </div>
              </div>

              {selectedConn.suspicious && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="bg-red-alert/20 rounded-xl border-4 border-red-alert p-2 flex items-start gap-2"
                >
                  <AlertTriangle size={18} strokeWidth={3} className="text-red-alert shrink-0" />
                  <div>
                    <div className="font-fredoka text-xs text-red-alert">Suspicious Connection Detected!</div>
                    <div className="text-[10px] font-nunito text-purple-darker">{selectedConn.suspiciousReason}</div>
                  </div>
                </motion.div>
              )}

              <button
                onClick={() => killConnection(selectedConn)}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-alert text-white rounded-xl border-4 border-black font-fredoka text-xs hover:brightness-110 transition-all"
              >
                <X size={14} strokeWidth={3} />
                Terminate Connection (+5 pts)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-purple-pale rounded-2xl border-4 border-purple-light p-2 text-center">
          <CheckCircle size={20} strokeWidth={3} className="text-green-success mx-auto mb-1" />
          <div className="text-[10px] font-fredoka text-purple-darker">ESTABLISHED</div>
          <div className="text-[9px] font-nunito text-gray-500">Active connection with data flowing</div>
        </div>
        <div className="bg-purple-pale rounded-2xl border-4 border-purple-light p-2 text-center">
          <EarIcon />
          <div className="text-[10px] font-fredoka text-purple-darker">LISTENING</div>
          <div className="text-[9px] font-nunito text-gray-500">Waiting for incoming connections</div>
        </div>
        <div className="bg-purple-pale rounded-2xl border-4 border-purple-light p-2 text-center">
          <ShieldAlert size={20} strokeWidth={3} className="text-red-alert mx-auto mb-1" />
          <div className="text-[10px] font-fredoka text-purple-darker">Suspicious?</div>
          <div className="text-[9px] font-nunito text-gray-500">Unknown processes may be malware!</div>
        </div>
      </div>
    </div>
  );
}

/* Small helper icon component */
function EarIcon({ small }: { small?: boolean }) {
  const s = small ? 8 : 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={small ? 'inline text-white' : 'text-blue-info mx-auto mb-1'}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
