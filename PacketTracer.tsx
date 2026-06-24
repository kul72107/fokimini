import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Laptop, Router, Shield, SwitchCamera, Server,
  ChevronRight, Play, Star, Check, X, ArrowRight, Wifi,
  FileText, Package, MapPin, Zap, Clock
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type Protocol = 'TCP' | 'UDP' | 'ICMP';

interface HopAction {
  device: string;
  icon: React.ReactNode;
  color: string;
  action: string;
  detail: string;
  decision: 'allow' | 'drop' | 'forward';
}

interface PacketJourney {
  protocol: Protocol;
  srcIP: string;
  dstIP: string;
  port: number;
  payload: string;
  hops: HopAction[];
  successful: boolean;
}

const IP_OPTIONS = [
  { label: 'Your PC', ip: '192.168.1.5' },
  { label: 'Workstation A', ip: '192.168.1.10' },
  { label: 'Dev Server', ip: '10.0.0.25' },
  { label: 'Test Laptop', ip: '172.16.0.8' },
];

const DST_IP_OPTIONS = [
  { label: 'Web Server', ip: '93.184.216.34' },
  { label: 'Mail Server', ip: '198.51.100.42' },
  { label: 'DNS Server', ip: '8.8.8.8' },
  { label: 'Game Server', ip: '203.0.113.77' },
];

const BLOCKED_PORTS = [8080, 3389, 9999];

const JOURNEY_TEMPLATES: Record<Protocol, (src: string, dst: string, port: number, payload: string) => PacketJourney> = {
  TCP: (src, dst, port, payload) => ({
    protocol: 'TCP',
    srcIP: src,
    dstIP: dst,
    port,
    payload,
    successful: !BLOCKED_PORTS.includes(port),
    hops: [
      {
        device: 'Your PC',
        icon: <Laptop size={18} strokeWidth={3} />,
        color: '#7C3AED',
        action: 'Building TCP packet...',
        detail: `Source: ${src}:${port}, Dest: ${dst}:80. Flags: SYN. Seq: 0`,
        decision: 'allow',
      },
      {
        device: 'Router',
        icon: <Router size={18} strokeWidth={3} />,
        color: '#60A5FA',
        action: 'Checking routing table...',
        detail: `Found route to ${dst.split('.')[0]}.${dst.split('.')[1]}.0.0/16 via gateway 192.168.1.1. Forwarding...`,
        decision: 'allow',
      },
      {
        device: 'Firewall',
        icon: <Shield size={18} strokeWidth={3} />,
        color: '#F472B6',
        action: 'Inspecting packet...',
        detail: BLOCKED_PORTS.includes(port) ? `Rule match: DROP TCP port ${port}. Blocked by security policy!` : `Rule match: ALLOW TCP port ${port}. Stateful check passed. No malware signature detected.`,
        decision: BLOCKED_PORTS.includes(port) ? 'drop' : 'allow',
      },
      {
        device: 'Switch',
        icon: <SwitchCamera size={18} strokeWidth={3} />,
        color: '#FB923C',
        action: 'MAC address lookup...',
        detail: `Destination MAC found on port 4. Forwarding frame to correct interface.`,
        decision: 'allow',
      },
      {
        device: 'Target Server',
        icon: <Server size={18} strokeWidth={3} />,
        color: '#4ADE80',
        action: 'Processing request...',
        detail: `Port ${port} is listening! SYN-ACK sent. TCP handshake complete. Payload received: "${payload}"`,
        decision: 'allow',
      },
    ],
  }),
  UDP: (src, dst, port, payload) => ({
    protocol: 'UDP',
    srcIP: src,
    dstIP: dst,
    port,
    payload,
    successful: true,
    hops: [
      {
        device: 'Your PC',
        icon: <Laptop size={18} strokeWidth={3} />,
        color: '#7C3AED',
        action: 'Building UDP datagram...',
        detail: `Source: ${src}:${port}, Dest: ${dst}:53. No connection needed - connectionless!`,
        decision: 'allow',
      },
      {
        device: 'Router',
        icon: <Router size={18} strokeWidth={3} />,
        color: '#60A5FA',
        action: 'Route lookup...',
        detail: `UDP packet to ${dst}. No fragmentation needed. TTL: 64. Forwarding...`,
        decision: 'allow',
      },
      {
        device: 'Firewall',
        icon: <Shield size={18} strokeWidth={3} />,
        color: '#F472B6',
        action: 'UDP inspection...',
        detail: `UDP is allowed. No state to track (connectionless). Payload size: ${payload.length} bytes.`,
        decision: 'allow',
      },
      {
        device: 'Switch',
        icon: <SwitchCamera size={18} strokeWidth={3} />,
        color: '#FB923C',
        action: 'Broadcast domain check...',
        detail: `Unicast packet. Forwarding to port 2 based on CAM table entry.`,
        decision: 'allow',
      },
      {
        device: 'Target Server',
        icon: <Server size={18} strokeWidth={3} />,
        color: '#4ADE80',
        action: 'UDP processing...',
        detail: `Received UDP on port ${port}. Processing datagram payload: "${payload}". Reply queued.`,
        decision: 'allow',
      },
    ],
  }),
  ICMP: (src, dst, _port, payload) => ({
    protocol: 'ICMP',
    srcIP: src,
    dstIP: dst,
    port: 0,
    payload,
    successful: true,
    hops: [
      {
        device: 'Your PC',
        icon: <Laptop size={18} strokeWidth={3} />,
        color: '#7C3AED',
        action: 'Building ICMP echo...',
        detail: `ICMP Echo Request (ping) to ${dst}. Type: 8, Code: 0. ID: 0x1234`,
        decision: 'allow',
      },
      {
        device: 'Router',
        icon: <Router size={18} strokeWidth={3} />,
        color: '#60A5FA',
        action: 'ICMP forwarding...',
        detail: `ICMP packet detected. Decrementing TTL. Forwarding to next hop.`,
        decision: 'allow',
      },
      {
        device: 'Firewall',
        icon: <Shield size={18} strokeWidth={3} />,
        color: '#F472B6',
        action: 'Ping inspection...',
        detail: `ICMP Echo Request allowed. Rate limiting check: passed. Not flooding.`,
        decision: 'allow',
      },
      {
        device: 'Switch',
        icon: <SwitchCamera size={18} strokeWidth={3} />,
        color: '#FB923C',
        action: 'Layer 2 forwarding...',
        detail: `Ethernet frame forwarding based on MAC table. Port 3.`,
        decision: 'allow',
      },
      {
        device: 'Target Server',
        icon: <Server size={18} strokeWidth={3} />,
        color: '#4ADE80',
        action: 'Ping reply...',
        detail: `ICMP Echo Reply sent! Type: 0, Code: 0. Your ping reached the server!`,
        decision: 'allow',
      },
    ],
  }),
};

const PROTOCOL_COLORS: Record<Protocol, string> = {
  TCP: '#4ADE80',
  UDP: '#60A5FA',
  ICMP: '#FACC15',
};

const NETWORK_DEVICES = [
  { label: 'Your PC', icon: <Laptop size={20} strokeWidth={3} />, color: '#7C3AED', x: 5 },
  { label: 'Router', icon: <Router size={20} strokeWidth={3} />, color: '#60A5FA', x: 24 },
  { label: 'Firewall', icon: <Shield size={20} strokeWidth={3} />, color: '#F472B6', x: 43 },
  { label: 'Switch', icon: <SwitchCamera size={20} strokeWidth={3} />, color: '#FB923C', x: 62 },
  { label: 'Server', icon: <Server size={20} strokeWidth={3} />, color: '#4ADE80', x: 81 },
];

export default function PacketTracer({ onScoreChange }: Props) {
  const [srcIP, setSrcIP] = useState(IP_OPTIONS[0].ip);
  const [dstIP, setDstIP] = useState(DST_IP_OPTIONS[0].ip);
  const [protocol, setProtocol] = useState<Protocol>('TCP');
  const [port, setPort] = useState(80);
  const [payload, setPayload] = useState('Hello Server!');
  const [journey, setJourney] = useState<PacketJourney | null>(null);
  const [currentHop, setCurrentHop] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [packetCount, setPacketCount] = useState(0);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [packetX, setPacketX] = useState(-1);
  const [showWireshark, setShowWireshark] = useState(false);

  // Refs to avoid effect restart storms
  const journeyRef = useRef(journey);
  const currentHopRef = useRef(currentHop);
  const isPlayingRef = useRef(isPlaying);
  const autoPlayRef = useRef(autoPlay);

  useEffect(() => { journeyRef.current = journey; }, [journey]);
  useEffect(() => { currentHopRef.current = currentHop; }, [currentHop]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

  const handleSend = () => {
    const j = JOURNEY_TEMPLATES[protocol](srcIP, dstIP, port, payload);
    setJourney(j);
    setCurrentHop(-1);
    setIsPlaying(false);
    setAutoPlay(false);
    setPacketX(-1);
    setLogEntries([]);
  };

  const nextHop = useCallback(() => {
    const j = journeyRef.current;
    if (!j) return;

    setCurrentHop(prev => {
      const next = prev + 1;
      if (next >= j.hops.length) {
        // End of journey reached - use setTimeout to batch state updates outside updater
        setTimeout(() => {
          setIsPlaying(false);
          setAutoPlay(false);
        }, 0);
        if (j.successful) {
          setTotalScore(s => {
            const newScore = s + 15;
            onScoreChange(Math.min(100, newScore));
            return newScore;
          });
          setPacketCount(c => c + 1);
        }
        return prev;
      }
      // Update packet position
      setPacketX(NETWORK_DEVICES[next]?.x ?? -1);
      // Add log entry
      const hop = j.hops[next];
      setLogEntries(prevLog => [
        ...prevLog,
        `[${hop.device}] ${hop.action} - ${hop.detail.slice(0, 50)}...`,
      ]);
      return next;
    });
  }, [onScoreChange]);

  useEffect(() => {
    if (!autoPlayRef.current || !isPlayingRef.current) return;
    const interval = setInterval(() => {
      const j = journeyRef.current;
      const hop = currentHopRef.current;
      if (j && hop >= j.hops.length - 1) {
        setAutoPlay(false);
        setIsPlaying(false);
        return;
      }
      nextHop();
    }, 1500);
    return () => clearInterval(interval);
  }, [autoPlay, isPlaying, nextHop]);

  const startPlayback = () => {
    setIsPlaying(true);
    setCurrentHop(-1);
    setPacketX(-1);
    setLogEntries([]);
    setTimeout(() => nextHop(), 100);
  };

  const startAutoPlay = () => {
    setAutoPlay(true);
    setIsPlaying(true);
    setCurrentHop(-1);
    setPacketX(-1);
    setLogEntries([]);
    setTimeout(() => nextHop(), 100);
  };

  const reset = () => {
    setCurrentHop(-1);
    setIsPlaying(false);
    setAutoPlay(false);
    setPacketX(-1);
    setLogEntries([]);
  };

  return (
    <div className="flex flex-col gap-3 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <Package size={28} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Packet Tracer</h2>
      </div>

      {/* Packet Builder Form */}
      <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Send size={16} strokeWidth={3} className="text-purple-primary" />
          <h3 className="font-fredoka text-sm text-purple-dark">Packet Builder</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Source IP */}
          <div>
            <label className="font-nunito text-xs font-bold text-purple-dark mb-1 block">Source IP</label>
            <select
              value={srcIP}
              onChange={(e) => setSrcIP(e.target.value)}
              className="w-full px-2 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-xs text-purple-dark focus:outline-none"
            >
              {IP_OPTIONS.map(o => (
                <option key={o.ip} value={o.ip}>{o.label} ({o.ip})</option>
              ))}
            </select>
          </div>

          {/* Destination IP */}
          <div>
            <label className="font-nunito text-xs font-bold text-purple-dark mb-1 block">Destination IP</label>
            <select
              value={dstIP}
              onChange={(e) => setDstIP(e.target.value)}
              className="w-full px-2 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-xs text-purple-dark focus:outline-none"
            >
              {DST_IP_OPTIONS.map(o => (
                <option key={o.ip} value={o.ip}>{o.label} ({o.ip})</option>
              ))}
            </select>
          </div>

          {/* Protocol */}
          <div>
            <label className="font-nunito text-xs font-bold text-purple-dark mb-1 block">Protocol</label>
            <div className="flex gap-1">
              {(['TCP', 'UDP', 'ICMP'] as Protocol[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProtocol(p)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border-[3px] border-black font-nunito text-[10px] font-bold transition-all hover:scale-105 ${
                    protocol === p ? 'text-black' : 'bg-purple-pale text-purple-dark'
                  }`}
                  style={protocol === p ? { backgroundColor: PROTOCOL_COLORS[p] } : {}}
                >
                  {p === 'TCP' ? <Zap size={10} strokeWidth={3} /> : p === 'UDP' ? <Wifi size={10} strokeWidth={3} /> : <MapPin size={10} strokeWidth={3} />}
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Port */}
          <div>
            <label className="font-nunito text-xs font-bold text-purple-dark mb-1 block">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Math.max(1, Math.min(65535, Number(e.target.value))))}
              className="w-full px-2 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-xs text-purple-dark focus:outline-none"
              min={1}
              max={65535}
            />
          </div>
        </div>

        {/* Payload */}
        <div className="mt-3">
          <label className="font-nunito text-xs font-bold text-purple-dark mb-1 block">Payload Message</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="Enter payload..."
              className="flex-1 px-3 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-xs text-purple-dark focus:outline-none"
              maxLength={50}
            />
            <button
              onClick={handleSend}
              className="flex items-center gap-2 px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:scale-105 transition-transform card-shadow"
            >
              <Send size={14} strokeWidth={3} />
              BUILD
            </button>
          </div>
        </div>
      </div>

      {/* Network Topology */}
      {journey && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-purple-darker rounded-2xl border-4 border-black p-4 relative overflow-hidden"
          style={{ height: 180 }}
        >
          <h3 className="font-fredoka text-xs text-white mb-2 flex items-center gap-1">
            <Wifi size={12} strokeWidth={3} className="text-purple-light" />
            Network Topology
          </h3>

          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ top: 40 }}>
            {NETWORK_DEVICES.slice(0, -1).map((_, i) => (
              <line
                key={i}
                x1={`${NETWORK_DEVICES[i].x + 6}%`}
                y1="55%"
                x2={`${NETWORK_DEVICES[i + 1].x + 6}%`}
                y2="55%"
                stroke={currentHop >= i ? '#FACC15' : '#5B21B6'}
                strokeWidth={currentHop >= i ? 4 : 2}
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Devices */}
          {NETWORK_DEVICES.map((dev, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 z-10"
              style={{ left: `${dev.x}%` }}
              animate={currentHop === i ? { scale: 1.2 } : { scale: 1 }}
            >
              <div
                className={`w-14 h-14 border-[3px] border-black rounded-2xl flex flex-col items-center justify-center ${
                  currentHop >= i ? '' : 'opacity-50'
                }`}
                style={{ backgroundColor: currentHop >= i ? dev.color : '#3B0764' }}
              >
                {currentHop >= i ? dev.icon : <X size={16} strokeWidth={3} className="text-purple-light" />}
              </div>
              <span className="font-nunito text-[8px] font-bold text-white text-center block mt-1 whitespace-nowrap">
                {dev.label}
              </span>
              {currentHop === i && (
                <motion.div
                  className="absolute -inset-1 rounded-2xl border-2 border-yellow-accent"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}

          {/* Traveling Packet */}
          <AnimatePresence>
            {packetX >= 0 && (
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 z-20"
                initial={{ left: `${NETWORK_DEVICES[0].x + 6}%`, opacity: 0, scale: 0 }}
                animate={{ left: `${packetX + 6}%`, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              >
                <div
                  className="w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center"
                  style={{ backgroundColor: PROTOCOL_COLORS[journey.protocol] }}
                >
                  <span className="font-mono text-[8px] font-bold text-black">{journey.protocol[0]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status */}
          {currentHop >= 0 && currentHop < journey.hops.length && (
            <div className="absolute top-3 right-3 bg-black/80 border border-black rounded-lg px-2 py-1">
              <span className="font-nunito text-[10px] font-bold text-yellow-accent">
                Hop {currentHop + 1}/{journey.hops.length}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Hop Controls */}
      {journey && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={startPlayback}
            className="flex items-center gap-1 px-4 py-2 bg-green-success border-[3px] border-black rounded-full font-nunito font-bold text-xs text-black hover:scale-105 transition-transform"
          >
            <Play size={12} strokeWidth={3} />
            Step-by-Step
          </button>
          <button
            onClick={startAutoPlay}
            className="flex items-center gap-1 px-4 py-2 bg-blue-info border-[3px] border-black rounded-full font-nunito font-bold text-xs text-white hover:scale-105 transition-transform"
          >
            <Zap size={12} strokeWidth={3} />
            Auto-Play
          </button>
          <button
            onClick={nextHop}
            disabled={!isPlaying || currentHop >= (journey?.hops.length ?? 0) - 1}
            className="flex items-center gap-1 px-4 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-xs text-white hover:scale-105 transition-transform disabled:opacity-50"
          >
            <ChevronRight size={12} strokeWidth={3} />
            Next Hop
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1 px-3 py-2 bg-purple-pale border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:scale-105 transition-transform"
          >
            Reset
          </button>
        </div>
      )}

      {/* Hop Detail Panel */}
      <AnimatePresence>
        {journey && currentHop >= 0 && currentHop < journey.hops.length && (
          <motion.div
            key={currentHop}
            initial={{ y: 20, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-12 h-12 rounded-full border-[3px] border-black flex items-center justify-center"
                style={{ backgroundColor: journey.hops[currentHop].color }}
              >
                {journey.hops[currentHop].icon}
              </div>
              <div>
                <h4 className="font-fredoka text-sm text-purple-dark">{journey.hops[currentHop].device}</h4>
                <div className="flex items-center gap-1">
                  {journey.hops[currentHop].decision === 'allow' && (
                    <span className="px-1.5 py-0.5 bg-green-success border border-black rounded-full font-nunito text-[8px] font-bold text-green-800">ALLOW</span>
                  )}
                  {journey.hops[currentHop].decision === 'drop' && (
                    <span className="px-1.5 py-0.5 bg-red-alert border border-black rounded-full font-nunito text-[8px] font-bold text-white">DROP</span>
                  )}
                  {journey.hops[currentHop].decision === 'forward' && (
                    <span className="px-1.5 py-0.5 bg-blue-info border border-black rounded-full font-nunito text-[8px] font-bold text-white">FORWARD</span>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-purple-pale rounded-xl border-[3px] border-black p-3">
              <p className="font-nunito text-sm font-bold text-purple-dark mb-1">{journey.hops[currentHop].action}</p>
              <p className="font-mono text-xs text-purple-dark">{journey.hops[currentHop].detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion */}
      <AnimatePresence>
        {journey && currentHop >= journey.hops.length - 1 && journey.successful && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-green-success rounded-2xl border-4 border-black p-4 flex items-center justify-center gap-3 card-shadow"
          >
            <Check size={24} strokeWidth={4} className="text-white" />
            <div>
              <h4 className="font-fredoka text-sm text-white">Packet Delivered Successfully!</h4>
              <p className="font-nunito text-xs text-green-100">Your {journey.protocol} packet reached {dstIP}!</p>
            </div>
            <Star size={20} strokeWidth={3} className="text-yellow-accent" fill="#FACC15" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {journey && currentHop >= journey.hops.length - 1 && !journey.successful && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-alert rounded-2xl border-4 border-black p-4 flex items-center justify-center gap-3 card-shadow"
          >
            <X size={24} strokeWidth={4} className="text-white" />
            <div>
              <h4 className="font-fredoka text-sm text-white">Packet Dropped!</h4>
              <p className="font-nunito text-xs text-red-100">The firewall blocked your packet on port {port}.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wireshark-style Packet Capture Log */}
      {logEntries.length > 0 && (
        <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-fredoka text-sm text-purple-dark flex items-center gap-2">
              <FileText size={16} strokeWidth={3} className="text-purple-primary" />
              Packet Capture Log
            </h3>
            <button
              onClick={() => setShowWireshark(!showWireshark)}
              className="font-nunito text-[10px] text-purple-light hover:text-purple-primary"
            >
              {showWireshark ? 'Collapse' : 'Expand'}
            </button>
          </div>
          <div className={`bg-purple-darker rounded-xl border-[3px] border-black p-2 font-mono text-[10px] overflow-y-auto ${showWireshark ? 'max-h-48' : 'max-h-24'}`}>
            <div className="text-purple-light mb-1"># Time    Source          Destination    Proto  Info</div>
            {logEntries.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-green-success py-0.5 border-b border-purple-dark/30"
              >
                {entry}
              </motion.div>
            ))}
            {journey && currentHop >= journey.hops.length - 1 && (
              <div className={`py-1 font-bold ${journey.successful ? 'text-green-success' : 'text-red-alert'}`}>
                --- {journey.successful ? 'Packet delivered! +15 pts' : 'Packet dropped!'} ---
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score */}
      <div className="flex items-center justify-center">
        <div className="bg-purple-dark rounded-2xl border-4 border-black px-6 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star size={16} strokeWidth={3} className="text-yellow-accent" />
            <span className="font-nunito text-xs font-bold text-purple-lighter">Score:</span>
            <span className="font-mono text-xl font-bold text-yellow-accent">{totalScore}</span>
          </div>
          <div className="w-px h-6 bg-purple-light" />
          <span className="font-nunito text-xs text-purple-lighter">Packets: {packetCount}</span>
        </div>
      </div>
    </div>
  );
}
