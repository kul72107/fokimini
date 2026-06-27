import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radar, Zap, Shield, Globe, Server, Lock, Unlock,
  Crosshair, Activity, ChevronRight, Star, Download
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

interface PortInfo {
  port: number;
  state: 'open' | 'closed' | 'filtered' | 'unknown';
  service: string;
  version?: string;
}

interface TargetProfile {
  name: string;
  ip: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  ports: PortInfo[];
  osGuess: string;
}

const COMMON_SERVICES: Record<number, { service: string; version: string }> = {
  21: { service: 'FTP', version: 'vsftpd 3.0.3' },
  22: { service: 'SSH', version: 'OpenSSH 8.9p1' },
  23: { service: 'Telnet', version: 'Linux telnetd' },
  25: { service: 'SMTP', version: 'Postfix 3.6.4' },
  53: { service: 'DNS', version: 'BIND 9.16.1' },
  80: { service: 'HTTP', version: 'Apache 2.4.52' },
  88: { service: 'Kerberos', version: 'Microsoft AD' },
  110: { service: 'POP3', version: 'Dovecot 2.3.13' },
  111: { service: 'RPCbind', version: '2-4' },
  135: { service: 'MSRPC', version: 'Microsoft Windows RPC' },
  139: { service: 'NetBIOS', version: 'Samba 4.14.2' },
  143: { service: 'IMAP', version: 'Dovecot 2.3.13' },
  389: { service: 'LDAP', version: 'OpenLDAP 2.5.6' },
  443: { service: 'HTTPS', version: 'nginx 1.18.0' },
  445: { service: 'SMB', version: 'Samba 4.14.2' },
  587: { service: 'SMTP-SSL', version: 'Postfix 3.6.4' },
  631: { service: 'IPP', version: 'CUPS 2.3.3' },
  636: { service: 'LDAPS', version: 'OpenLDAP 2.5.6' },
  993: { service: 'IMAPS', version: 'Dovecot 2.3.13' },
  995: { service: 'POP3S', version: 'Dovecot 2.3.13' },
  1433: { service: 'MSSQL', version: 'Microsoft SQL 2019' },
  1723: { service: 'PPTP', version: 'Linux pptpd' },
  3306: { service: 'MySQL', version: 'MySQL 8.0.29' },
  3268: { service: 'MS-GC', version: 'Microsoft Global Catalog' },
  3389: { service: 'RDP', version: 'Microsoft Terminal Services' },
  5432: { service: 'PostgreSQL', version: 'PostgreSQL 14.2' },
  5900: { service: 'VNC', version: 'VNC Server 6.9' },
  6379: { service: 'Redis', version: 'Redis 6.2.6' },
  8080: { service: 'HTTP-Proxy', version: 'squid 4.14' },
  8443: { service: 'HTTPS-Alt', version: 'Apache Tomcat 9.0' },
};

const TARGETS: TargetProfile[] = [
  {
    name: 'Practice Server',
    ip: '192.168.1.100',
    icon: <Shield size={20} strokeWidth={3} />,
    color: '#4ADE80',
    description: 'Beginner-friendly server with common ports open',
    osGuess: 'Ubuntu Linux 22.04',
    ports: [
      { port: 22, state: 'open', service: 'SSH', version: 'OpenSSH 8.9p1' },
      { port: 80, state: 'open', service: 'HTTP', version: 'Apache 2.4.52' },
      { port: 443, state: 'open', service: 'HTTPS', version: 'nginx 1.18.0' },
      { port: 3306, state: 'open', service: 'MySQL', version: 'MySQL 8.0.29' },
    ],
  },
  {
    name: 'Web Server',
    ip: '203.0.113.50',
    icon: <Globe size={20} strokeWidth={3} />,
    color: '#60A5FA',
    description: 'Mail + Web server with multiple services',
    osGuess: 'CentOS Linux 8',
    ports: [
      { port: 22, state: 'open', service: 'SSH', version: 'OpenSSH 8.9p1' },
      { port: 25, state: 'open', service: 'SMTP', version: 'Postfix 3.6.4' },
      { port: 80, state: 'open', service: 'HTTP', version: 'Apache 2.4.52' },
      { port: 110, state: 'open', service: 'POP3', version: 'Dovecot 2.3.13' },
      { port: 143, state: 'open', service: 'IMAP', version: 'Dovecot 2.3.13' },
      { port: 443, state: 'open', service: 'HTTPS', version: 'nginx 1.18.0' },
      { port: 587, state: 'open', service: 'SMTP-SSL', version: 'Postfix 3.6.4' },
      { port: 993, state: 'open', service: 'IMAPS', version: 'Dovecot 2.3.13' },
      { port: 995, state: 'open', service: 'POP3S', version: 'Dovecot 2.3.13' },
    ],
  },
  {
    name: 'Bank Server',
    ip: '10.0.0.99',
    icon: <Lock size={20} strokeWidth={3} />,
    color: '#FACC15',
    description: 'Enterprise Windows domain controller',
    osGuess: 'Windows Server 2019',
    ports: [
      { port: 22, state: 'open', service: 'SSH', version: 'OpenSSH 8.9p1' },
      { port: 53, state: 'open', service: 'DNS', version: 'BIND 9.16.1' },
      { port: 80, state: 'open', service: 'HTTP', version: 'Apache 2.4.52' },
      { port: 88, state: 'open', service: 'Kerberos', version: 'Microsoft AD' },
      { port: 135, state: 'open', service: 'MSRPC', version: 'Microsoft Windows RPC' },
      { port: 389, state: 'open', service: 'LDAP', version: 'OpenLDAP 2.5.6' },
      { port: 443, state: 'open', service: 'HTTPS', version: 'nginx 1.18.0' },
      { port: 445, state: 'open', service: 'SMB', version: 'Samba 4.14.2' },
      { port: 636, state: 'open', service: 'LDAPS', version: 'OpenLDAP 2.5.6' },
      { port: 3268, state: 'open', service: 'MS-GC', version: 'Microsoft Global Catalog' },
      { port: 3389, state: 'open', service: 'RDP', version: 'Microsoft Terminal Services' },
    ],
  },
];

const SCAN_TYPES = [
  { id: 'quick', name: 'Quick Scan', desc: 'Top 20 ports', icon: <Zap size={16} strokeWidth={3} />, duration: 800, portCount: 20 },
  { id: 'full', name: 'Full Scan', desc: 'All 100 ports', icon: <Radar size={16} strokeWidth={3} />, duration: 2500, portCount: 100 },
  { id: 'stealth', name: 'Stealth Scan', desc: 'SYN scan', icon: <Shield size={16} strokeWidth={3} />, duration: 1800, portCount: 50 },
  { id: 'udp', name: 'UDP Scan', desc: 'UDP ports', icon: <Activity size={16} strokeWidth={3} />, duration: 2000, portCount: 30 },
];

export default function NmapScanner({ onScoreChange }: Props) {
  const onScoreChangeRef = useRef(onScoreChange);
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [scanType, setScanType] = useState('quick');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [discoveredPorts, setDiscoveredPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<PortInfo | null>(null);
  const [scannedPorts, setScannedPorts] = useState<Set<number>>(new Set());
  const [laserPosition, setLaserPosition] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [targetInput, setTargetInput] = useState('');

  const target = TARGETS[selectedTarget];
  const currentScan = SCAN_TYPES.find(s => s.id === scanType)!;

  useEffect(() => {
    onScoreChangeRef.current = onScoreChange;
  }, [onScoreChange]);

  const generatePortGrid = useCallback((): PortInfo[] => {
    const ports: PortInfo[] = [];
    const count = currentScan.portCount;
    const openPorts = new Set(target.ports.map(p => p.port));

    for (let i = 1; i <= count; i++) {
      if (openPorts.has(i)) {
        const tp = target.ports.find(p => p.port === i)!;
        ports.push({ ...tp, state: 'unknown' });
      } else {
        const svc = COMMON_SERVICES[i];
        if (i <= 20 || Math.random() > 0.7) {
          ports.push({
            port: i,
            state: 'unknown',
            service: svc?.service || `Unknown-${i}`,
            version: svc?.version || '',
          });
        } else {
          ports.push({
            port: i,
            state: 'unknown',
            service: svc?.service || '',
          });
        }
      }
    }
    return ports;
  }, [target, currentScan]);

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanComplete(false);
    setScanProgress(0);
    setDiscoveredPorts([]);
    setScannedPorts(new Set());
    setLaserPosition(0);
    setSelectedPort(null);
  };

  useEffect(() => {
    if (!isScanning) return;

    const ports = generatePortGrid();
    const totalPorts = ports.length;
    const scanDuration = currentScan.duration;
    const intervalMs = scanDuration / totalPorts;

    let currentIdx = 0;
    const safeIntervalMs = Math.max(intervalMs, 50);
    const interval = setInterval(() => {
      if (currentIdx >= totalPorts) {
        clearInterval(interval);
        setIsScanning(false);
        setScanComplete(true);
        setScanCount(c => c + 1);
        const openCount = ports.filter(p => target.ports.some(tp => tp.port === p.port)).length;
        setTotalScore(prev => {
          const newScore = prev + openCount * 10 + 5;
          onScoreChangeRef.current(Math.min(100, newScore));
          return newScore;
        });
        return;
      }

      const port = ports[currentIdx];
      const isOpen = target.ports.some(tp => tp.port === port.port);
      const updatedPort: PortInfo = {
        ...port,
        state: isOpen ? 'open' : (Math.random() > 0.85 ? 'filtered' : 'closed'),
      };

      setDiscoveredPorts(prev => [...prev, updatedPort]);
      setScannedPorts(prev => new Set(prev).add(port.port));
      setScanProgress(Math.round(((currentIdx + 1) / totalPorts) * 100));
      setLaserPosition(currentIdx % 100);
      currentIdx++;
    }, safeIntervalMs);

    return () => clearInterval(interval);
  }, [isScanning, target, currentScan, generatePortGrid]);

  const openCount = discoveredPorts.filter(p => p.state === 'open').length;
  const closedCount = discoveredPorts.filter(p => p.state === 'closed').length;
  const filteredCount = discoveredPorts.filter(p => p.state === 'filtered').length;

  const getPortColor = (port: PortInfo) => {
    switch (port.state) {
      case 'open': return 'bg-green-success';
      case 'closed': return 'bg-gray-300';
      case 'filtered': return 'bg-yellow-accent';
      default: return 'bg-purple-pale';
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <Radar size={28} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Nmap Port Scanner</h2>
      </div>

      {/* Top: Target Input + Scan Button */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border-4 border-black p-4 card-shadow">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Server size={20} strokeWidth={3} className="text-purple-primary" />
          <span className="font-nunito text-sm font-bold text-purple-dark">Target:</span>
          <input
            type="text"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder={target.ip}
            className="flex-1 min-w-[120px] px-3 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-sm text-purple-dark focus:outline-none focus:border-purple-primary"
          />
        </div>

        <button
          onClick={startScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-success border-[3px] border-black rounded-full font-nunito font-bold text-sm text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed card-shadow"
        >
          <Crosshair size={16} strokeWidth={3} />
          {isScanning ? 'SCANNING...' : 'LAUNCH SCAN'}
        </button>

        <button
          onClick={() => {
            const data = discoveredPorts.map(p => `${p.port}/${p.state}  ${p.service}`).join('\n');
            const blob = new Blob([`Nmap Scan Results\nTarget: ${target.ip}\n\n${data}`], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nmap-scan-${target.ip}.txt`;
            a.click();
          }}
          disabled={!scanComplete}
          className="flex items-center gap-1 px-3 py-2 bg-blue-info border-[3px] border-black rounded-full font-nunito font-bold text-xs text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} strokeWidth={3} />
          Export
        </button>
      </div>

      {/* Main Content: 3 columns */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Left Panel: Scan Options */}
        <div className="w-full lg:w-56 flex-shrink-0 flex flex-col gap-3">
          {/* Scan Types */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-dark mb-2">Scan Options</h3>
            <div className="flex flex-col gap-2">
              {SCAN_TYPES.map((scan) => (
                <button
                  key={scan.id}
                  onClick={() => !isScanning && setScanType(scan.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-[3px] border-black font-nunito text-xs font-bold transition-all hover:scale-105 ${
                    scanType === scan.id
                      ? 'bg-purple-primary text-white'
                      : 'bg-purple-pale text-purple-dark hover:bg-purple-lighter'
                  }`}
                >
                  {scan.icon}
                  <div className="text-left">
                    <div>{scan.name}</div>
                    <div className="font-nunito text-[9px] opacity-70">{scan.desc} ({scan.portCount} ports)</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Targets */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-dark mb-2">Targets</h3>
            <div className="flex flex-col gap-2">
              {TARGETS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => !isScanning && setSelectedTarget(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-[3px] border-black font-nunito text-xs font-bold transition-all hover:scale-105 ${
                    selectedTarget === i
                      ? 'text-white'
                      : 'bg-white text-purple-dark hover:bg-purple-pale'
                  }`}
                  style={selectedTarget === i ? { backgroundColor: t.color } : {}}
                >
                  {t.icon}
                  <div className="text-left">
                    <div>{t.name}</div>
                    <div className="font-mono text-[9px] opacity-70">{t.ip}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Port Grid */}
        <div className="flex-1 bg-white rounded-2xl border-4 border-black p-4 card-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-fredoka text-sm text-purple-dark">Port Grid (1-{currentScan.portCount})</h3>
            {isScanning && (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Activity size={16} strokeWidth={3} className="text-purple-primary" />
                </motion.div>
                <span className="font-mono text-xs text-purple-primary">{scanProgress}%</span>
              </div>
            )}
          </div>

          {/* Laser Line */}
          {isScanning && (
            <motion.div
              className="absolute top-10 bottom-4 w-1 bg-green-success z-10 pointer-events-none"
              style={{
                left: `${(laserPosition % 10) * 10 + 5}%`,
                top: `${Math.floor(laserPosition / 10) * 40 + 60}px`,
              }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.2, repeat: Infinity }}
            />
          )}

          {/* Port Grid */}
          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: currentScan.portCount }, (_, i) => i + 1).map((portNum) => {
              const discovered = discoveredPorts.find(p => p.port === portNum);
              const isScanned = scannedPorts.has(portNum);

              return (
                <motion.button
                  key={portNum}
                  onClick={() => discovered && setSelectedPort(discovered)}
                  className={`relative h-8 rounded-lg border-[2px] border-black font-mono text-[9px] font-bold flex items-center justify-center transition-colors ${
                    discovered
                      ? `${getPortColor(discovered)} text-black cursor-pointer hover:scale-110`
                      : 'bg-purple-pale text-purple-lighter'
                  } ${selectedPort?.port === portNum ? 'ring-2 ring-purple-primary ring-offset-1' : ''}`}
                  initial={isScanned ? { scale: 0.5 } : false}
                  animate={isScanned ? { scale: 1 } : {}}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  {portNum}
                  {discovered?.state === 'open' && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-success border border-black rounded-full" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Progress Bar */}
          {isScanning && (
            <div className="mt-3 h-3 bg-purple-pale rounded-full border-2 border-black overflow-hidden">
              <motion.div
                className="h-full bg-purple-primary rounded-full"
                style={{ width: `${scanProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}
        </div>

        {/* Right Panel: Results */}
        <div className="w-full lg:w-60 flex-shrink-0 flex flex-col gap-3">
          {/* Summary */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-dark mb-2">Scan Summary</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-3 py-2 bg-green-success/20 rounded-xl border-2 border-black">
                <span className="font-nunito text-xs font-bold text-green-700">Open</span>
                <span className="font-mono text-lg font-bold text-green-700">{openCount}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-xl border-2 border-black">
                <span className="font-nunito text-xs font-bold text-gray-600">Closed</span>
                <span className="font-mono text-lg font-bold text-gray-600">{closedCount}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-yellow-accent/30 rounded-xl border-2 border-black">
                <span className="font-nunito text-xs font-bold text-yellow-700">Filtered</span>
                <span className="font-mono text-lg font-bold text-yellow-700">{filteredCount}</span>
              </div>
            </div>
          </div>

          {/* OS Guess */}
          {scanComplete && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-purple-pale rounded-2xl border-4 border-black p-3 card-shadow"
            >
              <h3 className="font-fredoka text-sm text-purple-dark mb-1">OS Guess</h3>
              <div className="flex items-center gap-2">
                <Server size={16} strokeWidth={3} className="text-purple-primary" />
                <span className="font-nunito text-xs font-bold text-purple-dark">{target.osGuess}</span>
              </div>
              <div className="mt-2 h-2 bg-purple-lighter rounded-full border border-black overflow-hidden">
                <div className="h-full bg-purple-primary rounded-full" style={{ width: '92%' }} />
              </div>
              <span className="font-nunito text-[9px] text-purple-light">Confidence: 92%</span>
            </motion.div>
          )}

          {/* Found Services */}
          {openCount > 0 && (
            <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
              <h3 className="font-fredoka text-sm text-purple-dark mb-2">Services Found</h3>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {discoveredPorts
                  .filter(p => p.state === 'open')
                  .map((p) => (
                    <button
                      key={p.port}
                      onClick={() => setSelectedPort(p)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border-2 border-black font-nunito text-xs hover:scale-105 transition-transform ${
                        selectedPort?.port === p.port ? 'bg-purple-primary text-white' : 'bg-green-success/20 text-green-700'
                      }`}
                    >
                      <Unlock size={12} strokeWidth={3} />
                      <span className="font-mono font-bold">{p.port}</span>
                      <span className="font-bold">{p.service}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Score */}
          <div className="bg-purple-dark rounded-2xl border-4 border-black p-3">
            <div className="flex items-center justify-between">
              <span className="font-nunito text-xs font-bold text-purple-lighter">Total Score</span>
              <span className="font-mono text-xl font-bold text-yellow-accent">{totalScore}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-nunito text-[9px] text-purple-lighter">Scans: {scanCount}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3].map(s => (
                  <Star key={s} size={12} strokeWidth={2} className={scanCount >= s ? 'text-yellow-accent' : 'text-purple-light'} fill={scanCount >= s ? '#FACC15' : 'transparent'} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Port Detail Modal */}
      <AnimatePresence>
        {selectedPort && (
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
                    selectedPort.state === 'open' ? 'bg-green-success' : selectedPort.state === 'filtered' ? 'bg-yellow-accent' : 'bg-gray-300'
                  }`}>
                    {selectedPort.state === 'open' ? <Unlock size={16} strokeWidth={3} /> : <Lock size={16} strokeWidth={3} />}
                  </div>
                  <div>
                    <h4 className="font-fredoka text-lg text-purple-dark">Port {selectedPort.port}</h4>
                    <span className="font-nunito text-xs font-bold text-purple-light uppercase">{selectedPort.state}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPort(null)}
                  className="w-8 h-8 rounded-full bg-red-alert border-[3px] border-black flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <span className="text-white font-bold text-sm">X</span>
                </button>
              </div>

              <div className="bg-purple-pale rounded-xl border-[3px] border-black p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ChevronRight size={14} strokeWidth={3} className="text-purple-primary" />
                  <span className="font-nunito text-xs font-bold text-purple-dark">Service: {selectedPort.service}</span>
                </div>
                {selectedPort.version && (
                  <div className="flex items-center gap-2">
                    <ChevronRight size={14} strokeWidth={3} className="text-purple-primary" />
                    <span className="font-nunito text-xs text-purple-dark">Version: {selectedPort.version}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <ChevronRight size={14} strokeWidth={3} className="text-purple-primary" />
                  <span className="font-nunito text-xs text-purple-dark">
                    Banner: {selectedPort.state === 'open' ? `${selectedPort.service} ready` : 'No response'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-success border-2 border-black" />
          <span className="font-nunito text-xs font-semibold text-purple-dark">Open</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-300 border-2 border-black" />
          <span className="font-nunito text-xs font-semibold text-purple-dark">Closed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-accent border-2 border-black" />
          <span className="font-nunito text-xs font-semibold text-purple-dark">Filtered</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-purple-pale border-2 border-black" />
          <span className="font-nunito text-xs font-semibold text-purple-dark">Not Scanned</span>
        </div>
      </div>
    </div>
  );
}
