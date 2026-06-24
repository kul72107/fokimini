import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, Zap, ScanLine, Bug, CheckCircle, XCircle, AlertTriangle,
  TreePine, Star, ChevronRight, Info, Play, Download, Sparkles
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

interface Subdomain {
  name: string;
  status: 'live' | 'dead' | 'wildcard';
  ip: string;
  record: 'A' | 'CNAME' | 'MX' | 'TXT';
  depth: number;
}

interface TargetProfile {
  domain: string;
  description: string;
  color: string;
  subdomains: Subdomain[];
}

const WORDLIST_COMMON = ['www', 'mail', 'ftp', 'admin', 'blog', 'shop', 'api', 'dev', 'test', 'staging', 'portal', 'support', 'news', 'cdn', 'app'];
const WORDLIST_DEEP = [
  ...WORDLIST_COMMON,
  'secure', 'vpn', 'remote', 'git', 'docs', 'wiki', 'status', 'monitor', 'db', 'backup',
  'assets', 'static', 'media', 'images', 'download', 'careers', 'events', 'forum', 'chat',
  'login', 'signup', 'account', 'dashboard', 'console', 'panel', 'manage', 'internal',
  'private', 'beta', 'alpha', 'demo', 'sandbox', 'tmp', 'temp', 'old', 'new', 'v1', 'v2',
  'store', 'payment', 'checkout', 'billing', 'invoice', 'crm', 'erp', 'hr', 'finance',
  'api-v1', 'api-v2', 'graphql', 'rest', 'ws', 'socket', 'mqtt', 'grpc',
  'jenkins', 'gitlab', 'github', 'jira', 'confluence', 'nagios', 'zabbix',
  'smtp', 'pop', 'imap', 'webmail', 'mx', 'ns1', 'ns2', 'dns', 'dhcp',
  's3', 'storage', 'bucket', 'archive', 'logs', 'elastic', 'kibana', 'grafana',
  'k8s', 'kube', 'docker', 'registry', 'harbor', 'nexus', 'artifactory'
];
const WORDLIST_BRUTE = [
  ...WORDLIST_DEEP,
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21',
  '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '99',
  'adm', 'root', 'user', 'guest', 'service', 'system', 'host', 'server',
  'web1', 'web2', 'app1', 'app2', 'db1', 'db2', 'mail1', 'mail2',
  'us', 'eu', 'uk', 'asia', 'global', 'local', 'int', 'ext', 'intra',
  'corp', 'enterprise', 'business', 'partner', 'vendor', 'client',
  'autodiscover', 'lyncdiscover', 'sip', 'xmpp', 'turn', 'stun',
  'ca', 'pki', 'cert', 'ssl', 'tls', 'ocsp', 'crl',
  'owa', 'autoconfig', 'imap4', 'pop3', 'exchange', 'sharepoint',
  'ftp1', 'sftp', 'ftps', 'tftp', 'nfs', 'nas', 'iscsi',
  'print', 'printer', 'cups', 'lpd', 'ipp', 'scan', 'fax',
  'wifi', 'wlan', 'wireless', 'radius', 'ldap', 'ad', 'dc', 'dc1', 'dc2',
  'ntp', 'snmp', 'syslog', 'tacacs', 'radius', 'dhcp1', 'dhcp2',
];

const TARGETS: TargetProfile[] = [
  {
    domain: 'puppygames.com',
    description: 'A fun gaming site with lots of subdomains!',
    color: '#4ADE80',
    subdomains: [
      { name: 'www', status: 'live', ip: '203.0.113.10', record: 'A', depth: 1 },
      { name: 'mail', status: 'live', ip: '203.0.113.20', record: 'A', depth: 1 },
      { name: 'blog', status: 'live', ip: '203.0.113.30', record: 'CNAME', depth: 1 },
      { name: 'api', status: 'live', ip: '203.0.113.40', record: 'A', depth: 1 },
      { name: 'shop', status: 'live', ip: '203.0.113.50', record: 'A', depth: 1 },
      { name: 'cdn', status: 'live', ip: '198.51.100.5', record: 'CNAME', depth: 1 },
      { name: 'dev', status: 'dead', ip: '-', record: 'A', depth: 1 },
      { name: 'ftp', status: 'dead', ip: '-', record: 'A', depth: 1 },
      { name: 'admin', status: 'live', ip: '203.0.113.60', record: 'A', depth: 2 },
      { name: 'staging', status: 'wildcard', ip: '*.puppygames.com', record: 'CNAME', depth: 2 },
      { name: 'support', status: 'live', ip: '203.0.113.70', record: 'CNAME', depth: 1 },
      { name: 'portal', status: 'live', ip: '203.0.113.80', record: 'A', depth: 2 },
      { name: 'test', status: 'dead', ip: '-', record: 'A', depth: 2 },
    ],
  },
  {
    domain: 'cyberpaw.edu',
    description: 'Cybersecurity learning platform',
    color: '#60A5FA',
    subdomains: [
      { name: 'www', status: 'live', ip: '192.0.2.10', record: 'A', depth: 1 },
      { name: 'learn', status: 'live', ip: '192.0.2.20', record: 'A', depth: 1 },
      { name: 'labs', status: 'live', ip: '192.0.2.30', record: 'A', depth: 1 },
      { name: 'mail', status: 'live', ip: '192.0.2.40', record: 'A', depth: 1 },
      { name: 'api', status: 'live', ip: '192.0.2.50', record: 'CNAME', depth: 1 },
      { name: 'students', status: 'live', ip: '192.0.2.60', record: 'A', depth: 2 },
      { name: 'teachers', status: 'live', ip: '192.0.2.70', record: 'A', depth: 2 },
      { name: 'vpn', status: 'live', ip: '192.0.2.80', record: 'A', depth: 2 },
      { name: 'library', status: 'live', ip: '192.0.2.90', record: 'CNAME', depth: 2 },
      { name: 'git', status: 'live', ip: '192.0.2.100', record: 'A', depth: 2 },
      { name: 'news', status: 'dead', ip: '-', record: 'A', depth: 1 },
      { name: 'ftp', status: 'dead', ip: '-', record: 'A', depth: 1 },
      { name: 'dev', status: 'wildcard', ip: '*.cyberpaw.edu', record: 'CNAME', depth: 2 },
      { name: 'secure', status: 'live', ip: '192.0.2.110', record: 'A', depth: 2 },
      { name: 'dashboard', status: 'live', ip: '192.0.2.120', record: 'A', depth: 2 },
      { name: 'blog', status: 'live', ip: '192.0.2.130', record: 'CNAME', depth: 1 },
      { name: 'forum', status: 'live', ip: '192.0.2.140', record: 'A', depth: 2 },
      { name: 'help', status: 'live', ip: '192.0.2.150', record: 'A', depth: 1 },
      { name: 'portal', status: 'live', ip: '192.0.2.160', record: 'A', depth: 2 },
      { name: 'calendar', status: 'live', ip: '192.0.2.170', record: 'CNAME', depth: 2 },
    ],
  },
  {
    domain: 'kittycorp.net',
    description: 'A mysterious corporate network...',
    color: '#FACC15',
    subdomains: [
      { name: 'www', status: 'live', ip: '198.51.100.10', record: 'A', depth: 1 },
      { name: 'mail', status: 'live', ip: '198.51.100.20', record: 'A', depth: 1 },
      { name: 'remote', status: 'live', ip: '198.51.100.30', record: 'A', depth: 2 },
      { name: 'vpn', status: 'live', ip: '198.51.100.40', record: 'A', depth: 2 },
      { name: 'api', status: 'live', ip: '198.51.100.50', record: 'CNAME', depth: 1 },
      { name: 'ns1', status: 'live', ip: '198.51.100.60', record: 'A', depth: 1 },
      { name: 'ns2', status: 'live', ip: '198.51.100.70', record: 'A', depth: 1 },
      { name: 'webmail', status: 'live', ip: '198.51.100.80', record: 'CNAME', depth: 2 },
      { name: 'ftp', status: 'dead', ip: '-', record: 'A', depth: 1 },
      { name: 'admin', status: 'live', ip: '198.51.100.90', record: 'A', depth: 2 },
      { name: 'db', status: 'wildcard', ip: '*.kittycorp.net', record: 'CNAME', depth: 2 },
      { name: 'backup', status: 'live', ip: '198.51.100.100', record: 'A', depth: 2 },
      { name: 'monitor', status: 'live', ip: '198.51.100.110', record: 'A', depth: 2 },
      { name: 'git', status: 'live', ip: '198.51.100.120', record: 'A', depth: 2 },
      { name: 'jenkins', status: 'live', ip: '198.51.100.130', record: 'A', depth: 3 },
      { name: 'staging', status: 'live', ip: '198.51.100.140', record: 'A', depth: 2 },
      { name: 'beta', status: 'live', ip: '198.51.100.150', record: 'A', depth: 2 },
      { name: 'assets', status: 'live', ip: '198.51.100.160', record: 'CNAME', depth: 1 },
      { name: 'cdn', status: 'live', ip: '198.51.100.170', record: 'CNAME', depth: 1 },
      { name: 'shop', status: 'live', ip: '198.51.100.180', record: 'A', depth: 1 },
      { name: 'blog', status: 'dead', ip: '-', record: 'A', depth: 1 },
      { name: 'support', status: 'live', ip: '198.51.100.190', record: 'A', depth: 2 },
      { name: 'careers', status: 'live', ip: '198.51.100.200', record: 'CNAME', depth: 2 },
      { name: 'finance', status: 'wildcard', ip: '*.kittycorp.net', record: 'CNAME', depth: 3 },
      { name: 'hr', status: 'live', ip: '198.51.100.210', record: 'A', depth: 3 },
    ],
  },
];

const SCAN_MODES = [
  { id: 'quick', name: 'Quick Scan', desc: 'Common subdomains', icon: <Zap size={16} strokeWidth={3} />, wordlist: WORDLIST_COMMON, delay: 300 },
  { id: 'deep', name: 'Deep Scan', desc: 'Full wordlist', icon: <ScanLine size={16} strokeWidth={3} />, wordlist: WORDLIST_DEEP, delay: 150 },
  { id: 'brute', name: 'Brute Force', desc: 'All combinations', icon: <Bug size={16} strokeWidth={3} />, wordlist: WORDLIST_BRUTE, delay: 80 },
];

export default function SubdomainFinder({ onScoreChange }: Props) {
  const [domainInput, setDomainInput] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [scanMode, setScanMode] = useState('quick');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [foundSubs, setFoundSubs] = useState<Subdomain[]>([]);
  const [scanningSub, setScanningSub] = useState('');
  const [scanComplete, setScanComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [selectedSub, setSelectedSub] = useState<Subdomain | null>(null);
  const [showEducational, setShowEducational] = useState(true);

  // Use refs to avoid stale closures and effect restart storms
  const targetRef = useRef(TARGETS[0]);
  const currentModeRef = useRef(SCAN_MODES[0]);
  const isScanningRef = useRef(false);
  const currentIdxRef = useRef(0);
  const totalScoreRef = useRef(0);
  const onScoreChangeRef = useRef(onScoreChange);

  const target = TARGETS[selectedTarget];
  const currentMode = SCAN_MODES.find(m => m.id === scanMode)!;

  // Keep refs in sync
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { currentModeRef.current = currentMode; }, [currentMode]);
  useEffect(() => { isScanningRef.current = isScanning; }, [isScanning]);
  useEffect(() => { totalScoreRef.current = totalScore; }, [totalScore]);
  useEffect(() => { onScoreChangeRef.current = onScoreChange; }, [onScoreChange]);

  const getStatusColor = (status: Subdomain['status']) => {
    switch (status) {
      case 'live': return 'bg-green-success';
      case 'dead': return 'bg-red-alert';
      case 'wildcard': return 'bg-yellow-accent';
    }
  };

  const getStatusIcon = (status: Subdomain['status']) => {
    switch (status) {
      case 'live': return <CheckCircle size={14} strokeWidth={3} className="text-green-700" />;
      case 'dead': return <XCircle size={14} strokeWidth={3} className="text-red-700" />;
      case 'wildcard': return <AlertTriangle size={14} strokeWidth={3} className="text-yellow-700" />;
    }
  };

  const startScan = () => {
    if (isScanningRef.current) return;
    setIsScanning(true);
    isScanningRef.current = true;
    setScanComplete(false);
    setScanProgress(0);
    setFoundSubs([]);
    setSelectedSub(null);
    setScanningSub('');
    // Reset score for new scan
    setTotalScore(0);
    totalScoreRef.current = 0;
    currentIdxRef.current = 0;
    onScoreChangeRef.current(0);
  };

  // Single useEffect that handles scanning without restart storms
  // Uses refs for all mutable values to avoid dependency changes
  useEffect(() => {
    if (!isScanning) return;

    const wordlist = currentModeRef.current.wordlist;
    const targetSubs = targetRef.current.subdomains;
    const totalChecks = wordlist.length;

    const interval = setInterval(() => {
      const idx = currentIdxRef.current;

      if (idx >= totalChecks) {
        clearInterval(interval);
        setIsScanning(false);
        isScanningRef.current = false;
        setScanComplete(true);
        setScanCount(c => c + 1);
        // Calculate score from the final foundSubs length
        setFoundSubs(prevFound => {
          const foundCount = prevFound.length;
          // Use functional update with ref to avoid stale closure
          const newScore = foundCount * 10 + 5;
          const clampedScore = Math.max(0, Math.min(100, newScore));
          setTotalScore(clampedScore);
          totalScoreRef.current = clampedScore;
          onScoreChangeRef.current(clampedScore);
          return prevFound;
        });
        setScanningSub('');
        return;
      }

      const word = wordlist[idx];
      setScanningSub(word);
      setScanProgress(Math.round(((idx + 1) / totalChecks) * 100));

      const match = targetSubs.find(s => s.name === word);
      if (match) {
        setFoundSubs(prev => [...prev, match]);
      }

      currentIdxRef.current = idx + 1;
    }, currentModeRef.current.delay);

    return () => clearInterval(interval);
    // Only depend on isScanning to prevent restart storms
  }, [isScanning]);

  const liveCount = foundSubs.filter(s => s.status === 'live').length;
  const deadCount = foundSubs.filter(s => s.status === 'dead').length;
  const wildcardCount = foundSubs.filter(s => s.status === 'wildcard').length;

  const maxDepth = Math.max(...foundSubs.map(s => s.depth), 1);

  return (
    <div className="flex flex-col gap-3 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <TreePine size={28} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Subdomain Finder</h2>
      </div>

      {/* Educational Banner */}
      <AnimatePresence>
        {showEducational && (
          <motion.div
            initial={{ scale: 0.9, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -10 }}
            className="bg-blue-info/20 rounded-2xl border-4 border-black p-3 card-shadow relative"
          >
            <button
              onClick={() => setShowEducational(false)}
              className="absolute top-2 right-2 text-blue-700 hover:scale-110 transition-transform"
            >
              <XCircle size={16} strokeWidth={3} />
            </button>
            <div className="flex items-start gap-2">
              <Info size={18} strokeWidth={3} className="text-blue-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-nunito text-xs font-bold text-blue-800">
                  What are subdomains? Subdomains are extensions of a main domain (like mail.example.com, api.example.com).
                </p>
                <p className="font-nunito text-[10px] text-blue-700 mt-1">
                  Hackers search for forgotten subdomains to find hidden services, admin panels, or test servers. Finding them first helps protect your network! Each subdomain found is worth +10 points.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top: Input + Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border-4 border-black p-4 card-shadow">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Globe size={20} strokeWidth={3} className="text-purple-primary" />
          <span className="font-nunito text-sm font-bold text-purple-dark">Domain:</span>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder={target.domain}
            className="flex-1 min-w-[120px] px-3 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-sm text-purple-dark focus:outline-none focus:border-purple-primary"
          />
        </div>

        <button
          onClick={startScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-success border-[3px] border-black rounded-full font-nunito font-bold text-sm text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed card-shadow"
        >
          {isScanning ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Sparkles size={16} strokeWidth={3} />
            </motion.div>
          ) : (
            <Play size={16} strokeWidth={3} />
          )}
          {isScanning ? 'ENUMERATING...' : 'START ENUM'}
        </button>

        <button
          onClick={() => {
            const data = foundSubs.map(s => `${s.name}.${target.domain} [${s.status}] ${s.ip}`).join('\n');
            const blob = new Blob([`Subdomain Scan Results\nDomain: ${target.domain}\nMode: ${currentMode.name}\n\n${data}`], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `subdomains-${target.domain}.txt`;
            a.click();
          }}
          disabled={!scanComplete}
          className="flex items-center gap-1 px-3 py-2 bg-blue-info border-[3px] border-black rounded-full font-nunito font-bold text-xs text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} strokeWidth={3} />
          Export
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Left Panel: Scan Modes + Targets */}
        <div className="w-full lg:w-56 flex-shrink-0 flex flex-col gap-3">
          {/* Scan Modes */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-dark mb-2">Scan Mode</h3>
            <div className="flex flex-col gap-2">
              {SCAN_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => !isScanning && setScanMode(mode.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-[3px] border-black font-nunito text-xs font-bold transition-all hover:scale-105 ${
                    scanMode === mode.id
                      ? 'bg-purple-primary text-white'
                      : 'bg-purple-pale text-purple-dark hover:bg-purple-lighter'
                  }`}
                >
                  {mode.icon}
                  <div className="text-left">
                    <div>{mode.name}</div>
                    <div className="font-nunito text-[9px] opacity-70">{mode.desc} ({mode.wordlist.length})</div>
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
                  <Globe size={14} strokeWidth={3} />
                  <div className="text-left">
                    <div>{t.domain}</div>
                    <div className="font-nunito text-[9px] opacity-70">{t.subdomains.length} subdomains</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scan Stats */}
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

        {/* Center: Subdomain Tree */}
        <div className="flex-1 bg-white rounded-2xl border-4 border-black p-4 card-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-fredoka text-sm text-purple-dark">Discovery Tree</h3>
            {isScanning && (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Search size={16} strokeWidth={3} className="text-purple-primary" />
                </motion.div>
                <span className="font-mono text-xs text-purple-primary">{scanProgress}%</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isScanning && (
            <div className="mb-3 h-3 bg-purple-pale rounded-full border-2 border-black overflow-hidden">
              <motion.div
                className="h-full bg-purple-primary rounded-full"
                style={{ width: `${scanProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}

          {/* Currently Scanning */}
          {isScanning && scanningSub && (
            <motion.div
              key={scanningSub}
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="mb-3 px-3 py-1.5 bg-purple-pale rounded-lg border-2 border-black inline-flex items-center gap-2"
            >
              <Search size={12} strokeWidth={3} className="text-purple-primary" />
              <span className="font-mono text-xs text-purple-dark">Trying: {scanningSub}.{target.domain}</span>
            </motion.div>
          )}

          {/* Tree Visualization */}
          <div className="relative min-h-[200px]">
            {/* Root domain */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-primary rounded-lg border-[3px] border-black flex items-center justify-center">
                <Globe size={16} strokeWidth={3} className="text-white" />
              </div>
              <span className="font-mono text-sm font-bold text-purple-dark">{target.domain}</span>
              <div className="h-[3px] flex-1 bg-purple-lighter rounded-full" />
              {foundSubs.length > 0 && (
                <span className="font-nunito text-xs font-bold bg-green-success px-2 py-0.5 rounded-full border-2 border-black">
                  {foundSubs.length} found
                </span>
              )}
            </div>

            {/* Subdomain branches by depth */}
            {Array.from({ length: maxDepth }, (_, depthLevel) => (
              <div key={depthLevel} className="mb-3">
                <div className="font-nunito text-[10px] font-bold text-purple-light mb-1 ml-4">
                  Depth {depthLevel + 1}
                </div>
                <div className="flex flex-wrap gap-2 ml-4">
                  {foundSubs
                    .filter(s => s.depth === depthLevel + 1)
                    .map((sub, idx) => (
                      <motion.button
                        key={sub.name}
                        initial={{ scale: 0, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 12, delay: idx * 0.05 }}
                        onClick={() => setSelectedSub(sub)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-[3px] border-black font-mono text-xs font-bold hover:scale-110 transition-transform ${
                          getStatusColor(sub.status)
                        } ${selectedSub?.name === sub.name ? 'ring-2 ring-purple-primary ring-offset-1' : ''}`}
                      >
                        {getStatusIcon(sub.status)}
                        <span>{sub.name}.{target.domain}</span>
                      </motion.button>
                    ))}
                </div>
              </div>
            ))}

            {/* Empty state */}
            {!isScanning && foundSubs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-purple-light">
                <TreePine size={48} strokeWidth={2} />
                <p className="font-nunito text-sm mt-2">Enter a domain and start scanning!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="w-full lg:w-60 flex-shrink-0 flex flex-col gap-3">
          {/* Summary */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-dark mb-2">Results</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-3 py-2 bg-green-success/30 rounded-xl border-2 border-black">
                <span className="font-nunito text-xs font-bold text-green-700 flex items-center gap-1">
                  <CheckCircle size={12} strokeWidth={3} /> Live
                </span>
                <span className="font-mono text-lg font-bold text-green-700">{liveCount}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-red-alert/30 rounded-xl border-2 border-black">
                <span className="font-nunito text-xs font-bold text-red-700 flex items-center gap-1">
                  <XCircle size={12} strokeWidth={3} /> Dead
                </span>
                <span className="font-mono text-lg font-bold text-red-700">{deadCount}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-yellow-accent/40 rounded-xl border-2 border-black">
                <span className="font-nunito text-xs font-bold text-yellow-700 flex items-center gap-1">
                  <AlertTriangle size={12} strokeWidth={3} /> Wildcard
                </span>
                <span className="font-mono text-lg font-bold text-yellow-700">{wildcardCount}</span>
              </div>
            </div>
          </div>

          {/* Found List */}
          {foundSubs.length > 0 && (
            <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow flex-1">
              <h3 className="font-fredoka text-sm text-purple-dark mb-2">Subdomains</h3>
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                {foundSubs.map((sub) => (
                  <button
                    key={sub.name}
                    onClick={() => setSelectedSub(sub)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border-2 border-black font-mono text-xs hover:scale-105 transition-transform ${
                      selectedSub?.name === sub.name
                        ? 'bg-purple-primary text-white'
                        : getStatusColor(sub.status) + '/30 text-purple-dark'
                    }`}
                  >
                    {getStatusIcon(sub.status)}
                    <span className="font-bold">{sub.name}</span>
                    <span className="font-nunito text-[9px] ml-auto opacity-70">{sub.record}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subdomain Detail Modal */}
      <AnimatePresence>
        {selectedSub && (
          <motion.div
            initial={{ y: 20, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white rounded-2xl border-4 border-black p-4 card-shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedSub.status)}
                <h3 className="font-fredoka text-lg text-purple-dark">
                  {selectedSub.name}.{target.domain}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="w-8 h-8 bg-red-alert rounded-full border-[3px] border-black flex items-center justify-center hover:scale-110 transition-transform"
              >
                <XCircle size={16} strokeWidth={3} className="text-white" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-pale rounded-xl border-2 border-black p-3">
                <span className="font-nunito text-[10px] text-purple-light">Status</span>
                <div className="font-nunito text-sm font-bold text-purple-dark capitalize flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full border border-black ${getStatusColor(selectedSub.status)}`} />
                  {selectedSub.status}
                </div>
              </div>
              <div className="bg-purple-pale rounded-xl border-2 border-black p-3">
                <span className="font-nunito text-[10px] text-purple-light">DNS Record</span>
                <div className="font-mono text-sm font-bold text-purple-dark">{selectedSub.record}</div>
              </div>
              <div className="bg-purple-pale rounded-xl border-2 border-black p-3 col-span-2">
                <span className="font-nunito text-[10px] text-purple-light">IP / Value</span>
                <div className="font-mono text-sm font-bold text-purple-dark">{selectedSub.ip}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-purple-light">
              <ChevronRight size={12} strokeWidth={3} />
              <span className="font-nunito text-[10px]">
                {selectedSub.status === 'live' && 'This subdomain is active and reachable! Found during recon.'}
                {selectedSub.status === 'dead' && 'This subdomain is not responding. May have been decommissioned.'}
                {selectedSub.status === 'wildcard' && 'Wildcard DNS catches all undefined subdomains. Common misconfiguration!'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
