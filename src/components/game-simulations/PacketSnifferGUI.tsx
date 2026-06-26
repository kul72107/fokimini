import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, Play, Pause, Square, Search, Filter, Eye, EyeOff,
  Star, Zap, ChevronRight, XCircle, Info, ArrowDown, ArrowUp,
  Globe, Lock, Activity, Server, Layers, Download, Sparkles,
  CheckCircle
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type Protocol = 'HTTP' | 'HTTPS' | 'DNS' | 'TCP' | 'UDP' | 'ICMP' | 'ARP';

interface Packet {
  id: number;
  timestamp: string;
  protocol: Protocol;
  source: string;
  destination: string;
  srcPort: number;
  dstPort: number;
  length: number;
  info: string;
  payload: string;
  flags: string[];
  color: string;
}

const PROTOCOL_COLORS: Record<Protocol, string> = {
  HTTP: '#7C3AED',
  HTTPS: '#5B21B6',
  DNS: '#60A5FA',
  TCP: '#4ADE80',
  UDP: '#FACC15',
  ICMP: '#F87171',
  ARP: '#F472B6',
};

const INTERFACES = [
  { id: 'eth0', name: 'eth0', desc: 'Ethernet - Main LAN', packets: '1.2K/s' },
  { id: 'wlan0', name: 'wlan0', desc: 'WiFi - Wireless Network', packets: '850/s' },
  { id: 'lo', name: 'lo', desc: 'Loopback - Local Only', packets: '3.4K/s' },
  { id: 'docker0', name: 'docker0', desc: 'Docker Bridge', packets: '420/s' },
];

const SOURCE_IPS = [
  '192.168.1.100', '192.168.1.105', '10.0.0.50', '172.16.0.20',
  '203.0.113.10', '198.51.100.25', '192.168.1.1', '8.8.8.8',
  '1.1.1.1', '192.168.1.254',
];

const DEST_IPS = [
  '192.168.1.1', '8.8.8.8', '1.1.1.1', '203.0.113.50',
  '93.184.216.34', '140.82.121.4', '142.250.80.46', '192.168.1.100',
  '172.217.14.110', '104.16.249.249',
];

const PROTOCOLS: Protocol[] = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'ICMP', 'ARP'];

const HTTP_PAYLOADS = [
  'GET /index.html HTTP/1.1\r\nHost: example.com\r\nUser-Agent: CyberPaw/1.0',
  'POST /api/login HTTP/1.1\r\nContent-Type: application/json\r\n{"user":"admin"}',
  'HTTP/1.1 200 OK\r\nContent-Length: 1234\r\nContent-Type: text/html',
  'GET /api/v1/users HTTP/1.1\r\nAuthorization: Bearer eyJhbG...',
  'PUT /api/config HTTP/1.1\r\nContent-Type: application/json',
];

const DNS_PAYLOADS = [
  'Standard query 0x1234 A example.com',
  'Standard query response CNAME example.com -> cdn.example.net',
  'Standard query 0xABCD AAAA google.com',
  'Standard query PTR 8.8.8.8.in-addr.arpa',
  'Standard query MX puppygames.com',
];

const TCP_FLAGS_POOL = [['SYN'], ['SYN', 'ACK'], ['ACK'], ['PSH', 'ACK'], ['FIN', 'ACK'], ['RST']];

function generateRandomPacket(id: number): Packet {
  const proto = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
  const src = SOURCE_IPS[Math.floor(Math.random() * SOURCE_IPS.length)];
  const dst = DEST_IPS[Math.floor(Math.random() * DEST_IPS.length)];
  const srcPort = Math.floor(Math.random() * 64512) + 1024;
  let dstPort = 80;
  let info = '';
  let payload = '';
  let flags: string[] = [];

  switch (proto) {
    case 'HTTP':
      dstPort = [80, 8080, 8000][Math.floor(Math.random() * 3)];
      info = `${srcPort} -> ${dstPort} [${['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)]}]`;
      payload = HTTP_PAYLOADS[Math.floor(Math.random() * HTTP_PAYLOADS.length)];
      flags = ['PSH', 'ACK'];
      break;
    case 'HTTPS':
      dstPort = 443;
      info = `${srcPort} -> ${dstPort} [TLSv1.3] Application Data`;
      payload = `TLS 1.3 Encrypted Application Data (${Math.floor(Math.random() * 2000 + 500)} bytes)`;
      flags = ['PSH', 'ACK'];
      break;
    case 'DNS':
      dstPort = 53;
      info = DNS_PAYLOADS[Math.floor(Math.random() * DNS_PAYLOADS.length)];
      payload = `DNS Query ID: 0x${Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0')}`;
      break;
    case 'TCP':
      dstPort = [22, 25, 110, 143, 3306, 3389, 5432][Math.floor(Math.random() * 7)];
      flags = TCP_FLAGS_POOL[Math.floor(Math.random() * TCP_FLAGS_POOL.length)];
      info = `${srcPort} -> ${dstPort} [${flags.join(', ')}] Seq=${Math.floor(Math.random() * 1000000)}`;
      payload = `TCP Segment - ${flags.join('+')} flags set`;
      break;
    case 'UDP':
      dstPort = [53, 67, 68, 123, 161, 5060][Math.floor(Math.random() * 6)];
      info = `${srcPort} -> ${dstPort} Len=${Math.floor(Math.random() * 500 + 50)}`;
      payload = `UDP Datagram - Source: ${srcPort}, Dest: ${dstPort}`;
      break;
    case 'ICMP':
      dstPort = 0;
      info = `Echo (ping) request id=0x${Math.floor(Math.random() * 256).toString(16)}, seq=${Math.floor(Math.random() * 100)}`;
      payload = `ICMP Type 8 (Echo Request) - TTL: ${Math.floor(Math.random() * 64 + 64)}`;
      break;
    case 'ARP':
      dstPort = 0;
      info = `Who has ${dst}? Tell ${src}`;
      payload = `ARP Request - Looking for MAC address of ${dst}`;
      break;
  }

  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${(now.getMilliseconds()).toString().padStart(3, '0')}`;

  return {
    id,
    timestamp,
    protocol: proto,
    source: src,
    destination: dst,
    srcPort,
    dstPort,
    length: Math.floor(Math.random() * 1400 + 40),
    info,
    payload,
    flags,
    color: PROTOCOL_COLORS[proto],
  };
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', icon: <Layers size={12} strokeWidth={3} /> },
  { id: 'HTTP', label: 'HTTP', icon: <Globe size={12} strokeWidth={3} /> },
  { id: 'HTTPS', label: 'HTTPS', icon: <Lock size={12} strokeWidth={3} /> },
  { id: 'DNS', label: 'DNS', icon: <Server size={12} strokeWidth={3} /> },
  { id: 'TCP', label: 'TCP', icon: <ArrowRightIcon /> },
  { id: 'UDP', label: 'UDP', icon: <ArrowDown size={12} strokeWidth={3} /> },
  { id: 'ICMP', label: 'ICMP', icon: <Activity size={12} strokeWidth={3} /> },
];

function ArrowRightIcon() {
  return <ArrowUp size={12} strokeWidth={3} className="rotate-90" />;
}

export default function PacketSnifferGUI({ onScoreChange }: Props) {
  const [selectedInterface, setSelectedInterface] = useState('eth0');
  const [isCapturing, setIsCapturing] = useState(false);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);
  const [protocolFilter, setProtocolFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [captureCount, setCaptureCount] = useState(0);
  const [packetCounter, setPacketCounter] = useState(0);
  const [showEducational, setShowEducational] = useState(true);
  const [protocolsIdentified, setProtocolsIdentified] = useState<Set<Protocol>>(new Set());
  const packetIdRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const startCapture = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCaptureCount(c => c + 1);
  };

  const stopCapture = () => {
    setIsCapturing(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetCapture = () => {
    stopCapture();
    setPackets([]);
    setSelectedPacket(null);
    setPacketCounter(0);
    setProtocolsIdentified(new Set());
  };

  useEffect(() => {
    if (!isCapturing) return;

    intervalRef.current = setInterval(() => {
      packetIdRef.current += 1;
      const newPacket = generateRandomPacket(packetIdRef.current);

      setPackets(prev => {
        const updated = [...prev, newPacket];
        if (updated.length > 200) return updated.slice(-200);
        return updated;
      });
      setPacketCounter(c => c + 1);

      setProtocolsIdentified(prev => {
        const next = new Set(prev);
        next.add(newPacket.protocol);
        return next;
      });

      setTotalScore(prev => {
        const newScore = prev + 5;
        onScoreChange(Math.min(100, newScore));
        return newScore;
      });
    }, 600);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCapturing, onScoreChange]);

  useEffect(() => {
    if (protocolsIdentified.size >= 5 && protocolsIdentified.size <= 7) {
      setTotalScore(prev => {
        const bonus = protocolsIdentified.size * 20;
        const newScore = prev + bonus;
        onScoreChange(Math.min(100, newScore));
        return newScore;
      });
    }
  }, [protocolsIdentified.size]);

  useEffect(() => {
    if (bottomRef.current && isCapturing) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [packets.length, isCapturing]);

  const filteredPackets = packets.filter(p => {
    const matchProtocol = protocolFilter === 'all' || p.protocol === protocolFilter;
    const query = searchQuery.toLowerCase();
    const matchSearch = !query ||
      p.source.toLowerCase().includes(query) ||
      p.destination.toLowerCase().includes(query) ||
      p.info.toLowerCase().includes(query) ||
      p.protocol.toLowerCase().includes(query);
    return matchProtocol && matchSearch;
  });

  const protocolCounts = PROTOCOLS.reduce((acc, proto) => {
    acc[proto] = packets.filter(p => p.protocol === proto).length;
    return acc;
  }, {} as Record<Protocol, number>);

  return (
    <div className="flex flex-col gap-3 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <Wifi size={28} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Packet Sniffer</h2>
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
                  What is packet sniffing? It&apos;s like listening to network conversations! Every time your computer talks to the internet, it sends small data packets.
                </p>
                <p className="font-nunito text-[10px] text-blue-700 mt-1">
                  Each packet has headers (like an envelope address) and payload (the actual message). Different protocols (HTTP, DNS, TCP) are like different languages. Each packet captured = +5 points. Identifying all protocols = +20 bonus!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interface Selector + Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border-4 border-black p-4 card-shadow">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Server size={20} strokeWidth={3} className="text-purple-primary" />
          <span className="font-nunito text-sm font-bold text-purple-dark">Interface:</span>
          <div className="flex flex-wrap gap-1">
            {INTERFACES.map((iface) => (
              <button
                key={iface.id}
                onClick={() => { stopCapture(); setSelectedInterface(iface.id); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-[3px] border-black font-nunito text-xs font-bold transition-all hover:scale-105 ${
                  selectedInterface === iface.id
                    ? 'bg-purple-primary text-white'
                    : 'bg-purple-pale text-purple-dark hover:bg-purple-lighter'
                }`}
              >
                <Wifi size={12} strokeWidth={3} />
                {iface.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCapturing ? (
            <button
              onClick={startCapture}
              disabled={isCapturing}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-success border-[3px] border-black rounded-full font-nunito font-bold text-sm text-black hover:scale-105 transition-transform card-shadow"
            >
              <Play size={16} strokeWidth={3} />
              START CAPTURE
            </button>
          ) : (
            <button
              onClick={stopCapture}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-alert border-[3px] border-black rounded-full font-nunito font-bold text-sm text-black hover:scale-105 transition-transform card-shadow"
            >
              <Square size={16} strokeWidth={3} />
              STOP
            </button>
          )}
          <button
            onClick={resetCapture}
            className="flex items-center gap-1 px-3 py-2.5 bg-purple-pale border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:scale-105 transition-transform"
          >
            <ArrowDown size={14} strokeWidth={3} />
            Clear
          </button>
        </div>
      </div>

      {/* Live Stats Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {PROTOCOLS.map(proto => (
          <motion.div
            key={proto}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-black font-nunito text-[10px] font-bold"
            style={{ backgroundColor: PROTOCOL_COLORS[proto] + '30' }}
            animate={protocolCounts[proto] > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <div className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: PROTOCOL_COLORS[proto] }} />
            <span style={{ color: PROTOCOL_COLORS[proto] }}>{proto}</span>
            <span className="font-mono">{protocolCounts[proto]}</span>
          </motion.div>
        ))}
        <div className="flex items-center gap-1 px-3 py-1 bg-purple-pale rounded-lg border-2 border-black ml-auto">
          <Activity size={14} strokeWidth={3} className="text-purple-primary" />
          <span className="font-mono text-xs font-bold text-purple-dark">{packetCounter} pkts</span>
          {isCapturing && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-2 h-2 bg-green-success rounded-full border border-black"
            />
          )}
        </div>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={16} strokeWidth={3} className="text-purple-primary" />
        <div className="flex flex-wrap gap-1">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setProtocolFilter(opt.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border-2 border-black font-nunito text-[10px] font-bold transition-all hover:scale-105 ${
                protocolFilter === opt.id
                  ? 'bg-purple-primary text-white'
                  : 'bg-white text-purple-dark'
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto flex-1 min-w-[150px] max-w-[250px]">
          <Search size={14} strokeWidth={3} className="text-purple-light" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter packets..."
            className="flex-1 px-2 py-1 bg-white border-2 border-black rounded-lg font-mono text-xs text-purple-dark focus:outline-none focus:border-purple-primary"
          />
        </div>
      </div>

      {/* Main Content: Packet Table + Detail */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Packet Table */}
        <div className="flex-1 bg-white rounded-2xl border-4 border-black p-3 card-shadow overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-fredoka text-sm text-purple-dark">Packet Capture</h3>
            <span className="font-mono text-[10px] text-purple-light">{filteredPackets.length} shown</span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[60px_70px_110px_110px_1fr] gap-1 px-2 py-1.5 bg-purple-pale rounded-lg border-2 border-black mb-1">
            <span className="font-mono text-[9px] font-bold text-purple-dark">Time</span>
            <span className="font-mono text-[9px] font-bold text-purple-dark">Proto</span>
            <span className="font-mono text-[9px] font-bold text-purple-dark">Source</span>
            <span className="font-mono text-[9px] font-bold text-purple-dark">Destination</span>
            <span className="font-mono text-[9px] font-bold text-purple-dark">Info</span>
          </div>

          {/* Packet Rows */}
          <div className="max-h-[350px] overflow-y-auto flex flex-col gap-1">
            <AnimatePresence>
              {filteredPackets.map((pkt) => (
                <motion.button
                  key={pkt.id}
                  initial={{ x: -20, scale: 0.95 }}
                  animate={{ x: 0, scale: 1 }}
                  className={`grid grid-cols-[60px_70px_110px_110px_1fr] gap-1 px-2 py-1.5 rounded-lg border-2 border-black text-left transition-all hover:scale-[1.01] ${
                    selectedPacket?.id === pkt.id
                      ? 'ring-2 ring-purple-primary ring-offset-1'
                      : ''
                  }`}
                  style={{ backgroundColor: PROTOCOL_COLORS[pkt.protocol] + '18' }}
                  onClick={() => setSelectedPacket(pkt)}
                >
                  <span className="font-mono text-[9px] text-purple-dark truncate">{pkt.timestamp}</span>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-black"
                      style={{ backgroundColor: PROTOCOL_COLORS[pkt.protocol] }}
                    />
                    <span className="font-mono text-[9px] font-bold" style={{ color: PROTOCOL_COLORS[pkt.protocol] }}>
                      {pkt.protocol}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-purple-dark truncate">{pkt.source}</span>
                  <span className="font-mono text-[9px] text-purple-dark truncate">{pkt.destination}</span>
                  <span className="font-mono text-[9px] text-purple-light truncate">{pkt.info}</span>
                </motion.button>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />

            {filteredPackets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-purple-light">
                <Layers size={36} strokeWidth={2} />
                <p className="font-nunito text-xs mt-2">
                  {packets.length === 0 ? 'Start capture to see packets!' : 'No packets match filter'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-3">
          {/* Packet Detail */}
          {selectedPacket ? (
            <motion.div
              initial={{ scale: 0.9, x: 20 }}
              animate={{ scale: 1, x: 0 }}
              className="bg-white rounded-2xl border-4 border-black p-3 card-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-fredoka text-sm text-purple-dark">Packet #{selectedPacket.id}</h3>
                <button
                  onClick={() => setSelectedPacket(null)}
                  className="w-6 h-6 bg-red-alert rounded-full border-2 border-black flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <XCircle size={12} strokeWidth={3} className="text-white" />
                </button>
              </div>

              {/* Protocol Badge */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="px-3 py-1 rounded-full border-[3px] border-black font-mono text-xs font-bold text-white"
                  style={{ backgroundColor: PROTOCOL_COLORS[selectedPacket.protocol] }}
                >
                  {selectedPacket.protocol}
                </div>
                <span className="font-mono text-[10px] text-purple-light">{selectedPacket.length} bytes</span>
              </div>

              {/* Frame Info */}
              <div className="mb-2 p-2 bg-purple-pale/50 rounded-xl border-2 border-black">
                <span className="font-nunito text-[9px] font-bold text-purple-light">Frame</span>
                <div className="font-mono text-[10px] text-purple-dark">Arrival Time: {selectedPacket.timestamp}</div>
                <div className="font-mono text-[10px] text-purple-dark">Frame Length: {selectedPacket.length} bytes</div>
              </div>

              {/* IP Header */}
              <div className="mb-2 p-2 bg-blue-info/10 rounded-xl border-2 border-black">
                <span className="font-nunito text-[9px] font-bold text-blue-700">Internet Protocol</span>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div>
                    <span className="font-nunito text-[9px] text-blue-600">Source</span>
                    <div className="font-mono text-[10px] font-bold text-purple-dark">{selectedPacket.source}</div>
                  </div>
                  <div>
                    <span className="font-nunito text-[9px] text-blue-600">Destination</span>
                    <div className="font-mono text-[10px] font-bold text-purple-dark">{selectedPacket.destination}</div>
                  </div>
                </div>
              </div>

              {/* Transport Layer */}
              {selectedPacket.protocol !== 'ARP' && selectedPacket.protocol !== 'ICMP' && (
                <div className="mb-2 p-2 bg-green-success/10 rounded-xl border-2 border-black">
                  <span className="font-nunito text-[9px] font-bold text-green-700">
                    {selectedPacket.protocol === 'TCP' || selectedPacket.protocol === 'HTTP' || selectedPacket.protocol === 'HTTPS'
                      ? 'Transmission Control'
                      : 'User Datagram'}
                  </span>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <div>
                      <span className="font-nunito text-[9px] text-green-600">Src Port</span>
                      <div className="font-mono text-[10px] font-bold text-purple-dark">{selectedPacket.srcPort}</div>
                    </div>
                    <div>
                      <span className="font-nunito text-[9px] text-green-600">Dst Port</span>
                      <div className="font-mono text-[10px] font-bold text-purple-dark">{selectedPacket.dstPort}</div>
                    </div>
                  </div>
                  {selectedPacket.flags.length > 0 && (
                    <div className="mt-1">
                      <span className="font-nunito text-[9px] text-green-600">Flags</span>
                      <div className="flex gap-1 mt-0.5">
                        {selectedPacket.flags.map(f => (
                          <span key={f} className="px-1.5 py-0.5 bg-green-success/30 rounded font-mono text-[9px] font-bold text-green-700 border border-black">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payload */}
              <div className="p-2 bg-yellow-accent/20 rounded-xl border-2 border-black">
                <span className="font-nunito text-[9px] font-bold text-yellow-700">Payload / Info</span>
                <div className="font-mono text-[10px] text-purple-dark mt-1 break-all">{selectedPacket.payload}</div>
              </div>

              {/* Protocol Explanation */}
              <div className="mt-2 flex items-start gap-1">
                <Info size={10} strokeWidth={3} className="text-purple-light flex-shrink-0 mt-0.5" />
                <span className="font-nunito text-[9px] text-purple-light">
                  {selectedPacket.protocol === 'HTTP' && 'HTTP: HyperText Transfer Protocol. Used for web browsing. Sends requests (GET, POST) and responses.'}
                  {selectedPacket.protocol === 'HTTPS' && 'HTTPS: Secure HTTP. All data is encrypted with TLS so attackers cannot read it!'}
                  {selectedPacket.protocol === 'DNS' && 'DNS: Domain Name System. Converts website names (like google.com) into IP addresses.'}
                  {selectedPacket.protocol === 'TCP' && 'TCP: Transmission Control Protocol. Reliable delivery with handshakes (SYN, ACK) and error checking.'}
                  {selectedPacket.protocol === 'UDP' && 'UDP: User Datagram Protocol. Faster than TCP but no delivery guarantee. Used for streaming, DNS.'}
                  {selectedPacket.protocol === 'ICMP' && 'ICMP: Internet Control Message Protocol. Used for ping and error messages between routers.'}
                  {selectedPacket.protocol === 'ARP' && 'ARP: Address Resolution Protocol. Finds MAC addresses for local network devices.'}
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl border-4 border-black p-6 card-shadow flex flex-col items-center justify-center text-purple-light min-h-[200px]">
              <Eye size={36} strokeWidth={2} />
              <p className="font-nunito text-xs mt-2 text-center">Click any packet to inspect its details!</p>
            </div>
          )}

          {/* Protocols Identified */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-xs text-purple-dark mb-2">Protocols Identified</h3>
            <div className="flex flex-wrap gap-1.5">
              {PROTOCOLS.map(proto => (
                <motion.div
                  key={proto}
                  animate={protocolsIdentified.has(proto) ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-black font-mono text-[10px] font-bold ${
                    protocolsIdentified.has(proto)
                      ? ''
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  style={protocolsIdentified.has(proto) ? {
                    backgroundColor: PROTOCOL_COLORS[proto] + '30',
                    color: PROTOCOL_COLORS[proto]
                  } : {}}
                >
                  {protocolsIdentified.has(proto) ? <CheckCircle size={10} strokeWidth={3} /> : <EyeOff size={10} strokeWidth={3} />}
                  {proto}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="bg-purple-dark rounded-2xl border-4 border-black p-3">
        <div className="flex items-center justify-between">
          <span className="font-nunito text-xs font-bold text-purple-lighter">Total Score</span>
          <span className="font-mono text-xl font-bold text-yellow-accent">{totalScore}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-nunito text-[9px] text-purple-lighter">Captures: {captureCount}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3].map(s => (
              <Star key={s} size={12} strokeWidth={2} className={captureCount >= s ? 'text-yellow-accent' : 'text-purple-light'} fill={captureCount >= s ? '#FACC15' : 'transparent'} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
