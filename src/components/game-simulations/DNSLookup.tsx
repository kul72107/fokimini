import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Laptop, Server, ArrowRight, Zap, Database,
  Search, Star, MapPin, Clock, Check, BookOpen, RefreshCw
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type RecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT' | 'SOA';

interface DNSRecord {
  type: RecordType;
  value: string;
  ttl: number;
  priority?: number;
}

interface DemoDomain {
  name: string;
  records: DNSRecord[];
  path: { server: string; ip: string; response: string; color: string }[];
  cached: boolean;
}

const RECORD_TYPES: RecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA'];

const DEMO_DOMAINS: DemoDomain[] = [
  {
    name: 'cyberpaws.kids',
    cached: false,
    records: [
      { type: 'A', value: '192.168.42.10', ttl: 300 },
      { type: 'AAAA', value: '2001:db8::1', ttl: 300 },
      { type: 'MX', value: 'mail.cyberpaws.kids', ttl: 3600, priority: 10 },
      { type: 'NS', value: 'ns1.cyberpaws.kids', ttl: 86400 },
      { type: 'NS', value: 'ns2.cyberpaws.kids', ttl: 86400 },
      { type: 'TXT', value: 'v=spf1 include:_spf.cyberpaws.kids ~all', ttl: 3600 },
      { type: 'SOA', value: 'ns1.cyberpaws.kids. admin.cyberpaws.kids. 2024010101 3600 600 86400 300', ttl: 86400 },
    ],
    path: [
      { server: 'Root Server (.kids TLD)', ip: '198.41.0.4', response: 'Referral: ns1.kids TLD server', color: '#F472B6' },
      { server: 'TLD Server (.kids)', ip: '203.0.113.10', response: 'Referral: ns1.cyberpaws.kids', color: '#FB923C' },
      { server: 'Authoritative Server', ip: '192.168.42.2', response: 'A: 192.168.42.10', color: '#4ADE80' },
    ],
  },
  {
    name: 'google.com',
    cached: true,
    records: [
      { type: 'A', value: '142.250.80.46', ttl: 60 },
      { type: 'AAAA', value: '2607:f8b0:4006:81e::200e', ttl: 60 },
      { type: 'CNAME', value: 'google.com', ttl: 86400 },
      { type: 'MX', value: 'smtp.google.com', ttl: 600, priority: 10 },
      { type: 'NS', value: 'ns1.google.com', ttl: 345600 },
      { type: 'NS', value: 'ns2.google.com', ttl: 345600 },
      { type: 'NS', value: 'ns3.google.com', ttl: 345600 },
      { type: 'NS', value: 'ns4.google.com', ttl: 345600 },
      { type: 'TXT', value: 'v=spf1 include:_spf.google.com ~all', ttl: 3600 },
    ],
    path: [
      { server: 'Recursive Resolver (Cached!)', ip: '8.8.8.8', response: 'Cached: A = 142.250.80.46', color: '#4ADE80' },
    ],
  },
  {
    name: 'github.com',
    cached: false,
    records: [
      { type: 'A', value: '140.82.121.4', ttl: 60 },
      { type: 'AAAA', value: '2606:50c::/32', ttl: 60 },
      { type: 'MX', value: 'aspmx.l.google.com', ttl: 3600, priority: 1 },
      { type: 'MX', value: 'alt1.aspmx.l.google.com', ttl: 3600, priority: 5 },
      { type: 'NS', value: 'dns1.p08.nsone.net', ttl: 86400 },
      { type: 'NS', value: 'dns2.p08.nsone.net', ttl: 86400 },
      { type: 'TXT', value: 'v=spf1 ip4:192.30.252.0/22 include:_netblocks.google.com include:_netblocks2.google.com include:_netblocks3.google.com ~all', ttl: 3600 },
    ],
    path: [
      { server: 'Root Server (.com TLD)', ip: '198.41.0.4', response: 'Referral: a.gtld-servers.net', color: '#F472B6' },
      { server: 'TLD Server (.com)', ip: '192.5.6.30', response: 'Referral: dns1.p08.nsone.net', color: '#FB923C' },
      { server: 'Authoritative Server', ip: '198.51.44.8', response: 'A: 140.82.121.4', color: '#4ADE80' },
    ],
  },
];

const RECORD_INFO: Record<RecordType, string> = {
  A: 'Maps a domain name to an IPv4 address (like 192.168.1.1)',
  AAAA: 'Maps a domain name to an IPv6 address (like 2001:db8::1)',
  CNAME: 'Creates an alias pointing another domain name to this one',
  MX: 'Specifies mail servers that handle email for this domain',
  NS: 'Lists the authoritative name servers for this domain',
  TXT: 'Stores text information, often used for SPF/DKIM verification',
  SOA: 'Contains administrative info about the DNS zone',
};

const NODE_POSITIONS = [
  { x: 10, label: 'Your Device', icon: <Laptop size={20} strokeWidth={3} />, color: '#7C3AED' },
  { x: 28, label: 'Resolver', icon: <Server size={18} strokeWidth={3} />, color: '#60A5FA' },
  { x: 46, label: 'Root DNS', icon: <Database size={18} strokeWidth={3} />, color: '#F472B6' },
  { x: 64, label: 'TLD DNS', icon: <Database size={18} strokeWidth={3} />, color: '#FB923C' },
  { x: 82, label: 'Authoritative', icon: <Server size={18} strokeWidth={3} />, color: '#4ADE80' },
  { x: 96, label: 'Result', icon: <MapPin size={18} strokeWidth={3} />, color: '#FACC15' },
];

export default function DNSLookup({ onScoreChange }: Props) {
  const [domainInput, setDomainInput] = useState('');
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('A');
  const [activeDomain, setActiveDomain] = useState<DemoDomain | null>(null);
  const [traceStep, setTraceStep] = useState(-1);
  const [isTracing, setIsTracing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedServer, setSelectedServer] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [lookupCount, setLookupCount] = useState(0);
  const [showInfo, setShowInfo] = useState<RecordType | null>(null);

  const handleResolve = useCallback(() => {
    const match = DEMO_DOMAINS.find(
      d => d.name === (domainInput.toLowerCase().trim() || 'cyberpaws.kids')
    ) || DEMO_DOMAINS[0];
    setActiveDomain(match);
    setTraceStep(-1);
    setShowResults(false);
    setIsTracing(false);
    setSelectedServer(null);
  }, [domainInput]);

  const startTrace = () => {
    if (!activeDomain) return;
    setIsTracing(true);
    setTraceStep(-1);
    setShowResults(false);
    setSelectedServer(null);

    let step = 0;
    const maxSteps = activeDomain.path.length;
    const interval = setInterval(() => {
      if (step >= maxSteps) {
        clearInterval(interval);
        setIsTracing(false);
        setShowResults(true);
        setTotalScore(prev => {
          const newScore = prev + 15;
          onScoreChange(Math.min(100, newScore));
          return newScore;
        });
        setLookupCount(c => c + 1);
        return;
      }
      setTraceStep(step);
      step++;
    }, 1200);
  };

  const handleDomainSelect = (domain: DemoDomain) => {
    setDomainInput(domain.name);
    setActiveDomain(domain);
    setTraceStep(-1);
    setShowResults(false);
    setIsTracing(false);
    setSelectedServer(null);
  };

  const filteredRecords = activeDomain
    ? activeDomain.records.filter(r => r.type === selectedRecordType)
    : [];

  return (
    <div className="flex flex-col gap-3 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <Globe size={28} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">DNS Lookup Tool</h2>
      </div>

      {/* Top: Input + Record Type */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border-4 border-black p-4 card-shadow">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={20} strokeWidth={3} className="text-purple-primary" />
          <span className="font-nunito text-sm font-bold text-purple-dark">Domain:</span>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="cyberpaws.kids"
            className="flex-1 min-w-[120px] px-3 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-sm text-purple-dark focus:outline-none focus:border-purple-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleResolve()}
          />
        </div>

        <button
          onClick={handleResolve}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:scale-105 transition-transform card-shadow"
        >
          <Zap size={16} strokeWidth={3} />
          RESOLVE
        </button>
      </div>

      {/* Record Type Selector */}
      <div className="flex flex-wrap items-center gap-2 justify-center">
        {RECORD_TYPES.map((rt) => (
          <button
            key={rt}
            onClick={() => setSelectedRecordType(rt)}
            onMouseEnter={() => setShowInfo(rt)}
            onMouseLeave={() => setShowInfo(null)}
            className={`relative px-3 py-1.5 rounded-full border-[3px] border-black font-mono text-xs font-bold transition-all hover:scale-105 ${
              selectedRecordType === rt
                ? 'bg-purple-primary text-white'
                : 'bg-white text-purple-dark hover:bg-purple-pale'
            }`}
          >
            {rt}
            {showInfo === rt && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-purple-dark text-white text-[10px] font-nunito p-2 rounded-xl border-2 border-black z-50">
                {RECORD_INFO[rt]}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Demo Domains */}
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <span className="font-nunito text-xs font-bold text-purple-dark">Quick Select:</span>
        {DEMO_DOMAINS.map((d) => (
          <button
            key={d.name}
            onClick={() => handleDomainSelect(d)}
            className={`px-3 py-1 rounded-full border-[3px] border-black font-mono text-xs font-bold transition-all hover:scale-105 ${
              activeDomain?.name === d.name
                ? 'bg-green-success text-black'
                : 'bg-white text-purple-dark hover:bg-purple-pale'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* DNS Resolution Tree Diagram */}
      {activeDomain && (
        <motion.div
          initial={{ opacity: 1, y: 20 }}
          animate={{ y: 0 }}
          className="bg-white rounded-2xl border-4 border-black p-4 card-shadow relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-fredoka text-sm text-purple-dark">DNS Resolution Path</h3>
            <div className="flex items-center gap-2">
              {activeDomain.cached && (
                <span className="px-2 py-0.5 bg-green-success border-2 border-black rounded-full font-nunito text-[9px] font-bold text-green-800">
                  CACHED!
                </span>
              )}
              <button
                onClick={startTrace}
                disabled={isTracing}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-info border-[3px] border-black rounded-full font-nunito font-bold text-xs text-white hover:scale-105 transition-transform disabled:opacity-50"
              >
                <RefreshCw size={12} strokeWidth={3} className={isTracing ? 'animate-spin' : ''} />
                Trace Path
              </button>
            </div>
          </div>

          {/* Path Visualization */}
          <div className="relative h-28 mb-2">
            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {NODE_POSITIONS.slice(0, -1).map((_, i) => {
                const fromX = NODE_POSITIONS[i].x;
                const toX = NODE_POSITIONS[i + 1].x;
                const isActive = traceStep >= 0 && (
                  activeDomain.path.length === 1
                    ? i <= 1
                    : i < traceStep + 2
                );
                return (
                  <line
                    key={i}
                    x1={`${fromX}%`}
                    y1="50%"
                    x2={`${toX}%`}
                    y2="50%"
                    stroke={isActive ? '#FACC15' : '#DDD6FE'}
                    strokeWidth={isActive ? 4 : 2}
                    strokeDasharray={isActive ? 'none' : '4,4'}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Animated packet */}
              {isTracing && traceStep >= 0 && (
                <motion.circle
                  r={8}
                  fill="#FACC15"
                  stroke="#000"
                  strokeWidth={2}
                  initial={{ cy: '50%' }}
                  animate={{
                    cx: activeDomain.path.length === 1
                      ? ['10%', '28%']
                      : [
                          `${NODE_POSITIONS[Math.min(traceStep + 1, NODE_POSITIONS.length - 2)].x}%`,
                          `${NODE_POSITIONS[Math.min(traceStep + 2, NODE_POSITIONS.length - 1)].x}%`,
                        ],
                  }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                />
              )}
            </svg>

            {/* Nodes */}
            {activeDomain.path.length === 1
              // Cached path: show resolver only
              ? [NODE_POSITIONS[0], NODE_POSITIONS[1], NODE_POSITIONS[5]].map((node, i) => {
                  const isActive = i <= 1;
                  return (
                    <motion.button
                      key={i}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                      style={{ left: `${node.x}%` }}
                      onClick={() => setSelectedServer(i)}
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className={`w-12 h-12 rounded-full border-[3px] border-black flex items-center justify-center ${
                        isActive ? 'bg-green-success' : 'bg-purple-pale'
                      }`}>
                        {node.icon}
                      </div>
                      <span className="font-nunito text-[8px] font-bold text-purple-dark text-center block mt-1 whitespace-nowrap">
                        {node.label}
                      </span>
                    </motion.button>
                  );
                })
              // Full path
              : activeDomain.path.map((hop, i) => {
                  const nodeIdx = i === 0 ? 2 : i === activeDomain.path.length - 1 ? 4 : 3;
                  const displayNode = NODE_POSITIONS[nodeIdx];
                  const isActive = i <= traceStep;
                  return (
                    <motion.button
                      key={i}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                      style={{ left: `${displayNode.x}%` }}
                      initial={{ scale: 0 }}
                      animate={{ scale: isActive ? 1.1 : 1 }}
                      transition={{ type: 'spring', delay: i * 0.1 }}
                      onClick={() => setSelectedServer(i)}
                      whileHover={{ scale: 1.15 }}
                    >
                      <div
                        className="w-12 h-12 rounded-full border-[3px] border-black flex items-center justify-center"
                        style={{ backgroundColor: isActive ? hop.color : '#DDD6FE' }}
                      >
                        {isActive ? <Check size={18} strokeWidth={4} className="text-white" /> : displayNode.icon}
                      </div>
                      <span className="font-nunito text-[8px] font-bold text-purple-dark text-center block mt-1 whitespace-nowrap">
                        {hop.server.split(' ')[0]}
                      </span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-green-success border-2 border-black rounded-full flex items-center justify-center"
                        >
                          <Check size={8} strokeWidth={4} className="text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })
            }

            {/* Start and end nodes */}
            {activeDomain.path.length > 1 && (
              <>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10" style={{ left: '10%' }}>
                  <div className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center bg-purple-primary">
                    <Laptop size={16} strokeWidth={3} className="text-white" />
                  </div>
                  <span className="font-nunito text-[8px] font-bold text-purple-dark text-center block mt-1">You</span>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10" style={{ left: '96%' }}>
                  <div className={`w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center ${
                    showResults ? 'bg-green-success' : 'bg-purple-pale'
                  }`}>
                    <MapPin size={16} strokeWidth={3} className={showResults ? 'text-white' : 'text-purple-light'} />
                  </div>
                  <span className="font-nunito text-[8px] font-bold text-purple-dark text-center block mt-1">IP</span>
                </div>
              </>
            )}
          </div>

          {/* Server Detail Cards */}
          <AnimatePresence>
            {selectedServer !== null && activeDomain.path[selectedServer] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-purple-pale rounded-xl border-[3px] border-black p-3 mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Server size={14} strokeWidth={3} className="text-purple-primary" />
                    <span className="font-nunito text-xs font-bold text-purple-dark">
                      {activeDomain.path[selectedServer].server}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={12} strokeWidth={3} className="text-blue-info" />
                    <span className="font-mono text-xs text-purple-dark">{activeDomain.path[selectedServer].ip}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight size={12} strokeWidth={3} className="text-green-success" />
                    <span className="font-nunito text-xs text-purple-dark">{activeDomain.path[selectedServer].response}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Results Panel */}
      {showResults && activeDomain && (
        <motion.div
          initial={{ y: 20, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
        >
          <h3 className="font-fredoka text-sm text-purple-dark mb-3">
            DNS Records for {activeDomain.name} — Type: {selectedRecordType}
          </h3>

          {filteredRecords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredRecords.map((record, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-purple-pale rounded-xl border-[3px] border-black p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-purple-primary border-2 border-black rounded-full font-mono text-[10px] font-bold text-white">
                      {record.type}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock size={10} strokeWidth={3} className="text-purple-light" />
                      <span className="font-mono text-[9px] text-purple-light">TTL: {record.ttl}s</span>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-purple-dark break-all">{record.value}</p>
                  {record.priority !== undefined && (
                    <span className="font-nunito text-[9px] text-purple-light">Priority: {record.priority}</span>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen size={32} strokeWidth={2} className="text-purple-lighter mx-auto mb-2" />
              <p className="font-nunito text-sm text-purple-light">No {selectedRecordType} records found for this domain.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Educational Sidebar */}
      <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} strokeWidth={3} className="text-purple-primary" />
          <h3 className="font-fredoka text-sm text-purple-dark">DNS Record Types Guide</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(Object.entries(RECORD_INFO) as [RecordType, string][]).map(([type, info]) => (
            <button
              key={type}
              onClick={() => setSelectedRecordType(type)}
              className={`flex items-start gap-2 p-2 rounded-xl border-[3px] border-black transition-all hover:scale-105 text-left ${
                selectedRecordType === type ? 'bg-purple-primary text-white' : 'bg-purple-pale text-purple-dark'
              }`}
            >
              <span className={`px-1.5 py-0.5 border-2 border-black rounded font-mono text-[10px] font-bold flex-shrink-0 ${
                selectedRecordType === type ? 'bg-white text-purple-primary' : 'bg-purple-primary text-white'
              }`}>
                {type}
              </span>
              <span className="font-nunito text-[10px]">{info}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center justify-center">
        <div className="bg-purple-dark rounded-2xl border-4 border-black px-6 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star size={16} strokeWidth={3} className="text-yellow-accent" fill="#FACC15" />
            <span className="font-nunito text-xs font-bold text-purple-lighter">Score:</span>
            <span className="font-mono text-xl font-bold text-yellow-accent">{totalScore}</span>
          </div>
          <div className="w-px h-6 bg-purple-light" />
          <span className="font-nunito text-xs text-purple-lighter">Lookups: {lookupCount}</span>
        </div>
      </div>
    </div>
  );
}
