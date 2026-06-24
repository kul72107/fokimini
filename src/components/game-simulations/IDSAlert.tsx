import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  Eye,
  Ban,
  Search,
  Check,
  X,
  Play,
  RotateCcw,
  Activity,
  Computer,
  Server,
  Wifi,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface IDSAlertProps {
  onScoreChange: (score: number) => void;
}

interface NetworkDevice {
  id: string;
  name: string;
  type: 'internet' | 'firewall' | 'workstation' | 'server';
  x: number;
  y: number;
  icon: React.ReactNode;
  color: string;
}

interface IDSAlertItem {
  id: number;
  type: 'port-scan' | 'brute-force' | 'malware-beacon' | 'data-exfil' | 'ddos';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIp: string;
  targetDevice: string;
  description: string;
  timestamp: string;
  correctAction: 'block' | 'investigate' | 'ignore';
  actionLabels: { block: string; investigate: string; ignore: string };
}

interface TrafficDot {
  id: number;
  edgeIndex: number;
  progress: number;
  color: string;
}

const DEVICES: NetworkDevice[] = [
  { id: 'internet', name: 'Internet', type: 'internet', x: 15, y: 50, icon: <Wifi size={20} strokeWidth={3} />, color: '#A78BFA' },
  { id: 'firewall', name: 'Firewall', type: 'firewall', x: 40, y: 50, icon: <Shield size={20} strokeWidth={3} />, color: '#60A5FA' },
  { id: 'ws1', name: 'Workstation 1', type: 'workstation', x: 65, y: 20, icon: <Computer size={20} strokeWidth={3} />, color: '#4ADE80' },
  { id: 'ws2', name: 'Workstation 2', type: 'workstation', x: 65, y: 50, icon: <Computer size={20} strokeWidth={3} />, color: '#4ADE80' },
  { id: 'ws3', name: 'Workstation 3', type: 'workstation', x: 65, y: 80, icon: <Computer size={20} strokeWidth={3} />, color: '#4ADE80' },
  { id: 'server', name: 'Internal Server', type: 'server', x: 88, y: 50, icon: <Server size={20} strokeWidth={3} />, color: '#FACC15' },
];

const EDGES: [string, string][] = [
  ['internet', 'firewall'],
  ['firewall', 'ws1'],
  ['firewall', 'ws2'],
  ['firewall', 'ws3'],
  ['firewall', 'server'],
  ['ws1', 'server'],
  ['ws2', 'server'],
  ['ws3', 'server'],
];

const ALERTS: IDSAlertItem[] = [
  {
    id: 1,
    type: 'port-scan',
    severity: 'medium',
    sourceIp: '203.0.113.45',
    targetDevice: 'server',
    description: 'Port Scan: Multiple ports (22,80,443,3306) scanned rapidly',
    timestamp: '14:23:01',
    correctAction: 'block',
    actionLabels: { block: 'Block Source IP', investigate: 'Monitor Closely', ignore: 'False Positive' },
  },
  {
    id: 2,
    type: 'brute-force',
    severity: 'high',
    sourceIp: '198.51.100.22',
    targetDevice: 'ws2',
    description: 'Brute Force: 50 failed SSH login attempts in 2 minutes',
    timestamp: '14:25:33',
    correctAction: 'block',
    actionLabels: { block: 'Block IP Immediately', investigate: 'Check User Account', ignore: 'Legitimate User' },
  },
  {
    id: 3,
    type: 'malware-beacon',
    severity: 'high',
    sourceIp: '192.168.1.105',
    targetDevice: 'ws1',
    description: 'Malware Beacon: Periodic outbound connection every 60s to C2 server',
    timestamp: '14:28:15',
    correctAction: 'investigate',
    actionLabels: { block: 'Block All Outbound', investigate: 'Isolate & Analyze', ignore: 'Normal Traffic' },
  },
  {
    id: 4,
    type: 'data-exfil',
    severity: 'critical',
    sourceIp: '192.168.1.110',
    targetDevice: 'server',
    description: 'Data Exfiltration: 2.5GB transferred to external IP over 10 minutes',
    timestamp: '14:32:47',
    correctAction: 'investigate',
    actionLabels: { block: 'Block Transfer', investigate: 'Audit Data Access', ignore: 'Backup Operation' },
  },
  {
    id: 5,
    type: 'ddos',
    severity: 'critical',
    sourceIp: 'Multiple',
    targetDevice: 'firewall',
    description: 'DDoS Attack: 100,000 SYN packets/sec from 500+ sources',
    timestamp: '14:35:12',
    correctAction: 'block',
    actionLabels: { block: 'Enable Rate Limiting', investigate: 'Analyze Pattern', ignore: 'Traffic Spike' },
  },
  {
    id: 6,
    type: 'port-scan',
    severity: 'low',
    sourceIp: '192.168.1.50',
    targetDevice: 'ws3',
    description: 'Port Scan: Sequential port sweep on ports 1-1024 detected',
    timestamp: '14:40:05',
    correctAction: 'block',
    actionLabels: { block: 'Block Scanner IP', investigate: 'Internal Scan?', ignore: 'Nmap Admin' },
  },
  {
    id: 7,
    type: 'brute-force',
    severity: 'medium',
    sourceIp: '10.0.0.88',
    targetDevice: 'server',
    description: 'Brute Force: Repeated RDP login attempts with common passwords',
    timestamp: '14:45:22',
    correctAction: 'block',
    actionLabels: { block: 'Block RDP Port', investigate: 'Check Account Lock', ignore: 'User Forgot PW' },
  },
  {
    id: 8,
    type: 'malware-beacon',
    severity: 'medium',
    sourceIp: '192.168.1.120',
    targetDevice: 'ws2',
    description: 'Malware Beacon: DNS queries to known malicious domain every 5 min',
    timestamp: '14:50:00',
    correctAction: 'investigate',
    actionLabels: { block: 'Block DNS', investigate: 'Scan for Malware', ignore: 'Legitimate Site' },
  },
  {
    id: 9,
    type: 'data-exfil',
    severity: 'high',
    sourceIp: '192.168.1.99',
    targetDevice: 'ws1',
    description: 'Data Exfiltration: Unusual HTTPS upload of 500MB to rare domain',
    timestamp: '14:55:38',
    correctAction: 'investigate',
    actionLabels: { block: 'Cut Connection', investigate: 'Check Uploaded Data', ignore: 'Cloud Backup' },
  },
  {
    id: 10,
    type: 'ddos',
    severity: 'medium',
    sourceIp: 'Botnet',
    targetDevice: 'firewall',
    description: 'DDoS Attack: UDP flood on DNS port 53 from reflective sources',
    timestamp: '15:00:15',
    correctAction: 'block',
    actionLabels: { block: 'Filter UDP', investigate: 'Trace Sources', ignore: 'Legitimate DNS' },
  },
  {
    id: 11,
    type: 'port-scan',
    severity: 'high',
    sourceIp: '185.220.101.8',
    targetDevice: 'server',
    description: 'Port Scan: All 65,535 ports scanned from Tor exit node',
    timestamp: '15:05:44',
    correctAction: 'block',
    actionLabels: { block: 'Block Tor Exit', investigate: 'Check Logs', ignore: 'Security Audit' },
  },
  {
    id: 12,
    type: 'brute-force',
    severity: 'critical',
    sourceIp: '192.168.1.200',
    targetDevice: 'ws3',
    description: 'Brute Force: 1000+ API calls with stolen credentials',
    timestamp: '15:10:22',
    correctAction: 'block',
    actionLabels: { block: 'Revoke Credentials', investigate: 'Check API Access', ignore: 'App Behavior' },
  },
  {
    id: 13,
    type: 'malware-beacon',
    severity: 'critical',
    sourceIp: '192.168.1.77',
    targetDevice: 'server',
    description: 'Malware Beacon: Encrypted tunnel to known APT C2 server',
    timestamp: '15:15:00',
    correctAction: 'investigate',
    actionLabels: { block: 'Drop Connection', investigate: 'Full Forensics', ignore: 'VPN Traffic' },
  },
  {
    id: 14,
    type: 'data-exfil',
    severity: 'medium',
    sourceIp: '192.168.1.155',
    targetDevice: 'ws2',
    description: 'Data Exfiltration: SMTP with 50MB attachment to external address',
    timestamp: '15:20:18',
    correctAction: 'investigate',
    actionLabels: { block: 'Quarantine Email', investigate: 'Check Attachment', ignore: 'Normal Email' },
  },
  {
    id: 15,
    type: 'ddos',
    severity: 'high',
    sourceIp: 'IoT Botnet',
    targetDevice: 'firewall',
    description: 'DDoS Attack: Mirai botnet HTTP flood targeting web services',
    timestamp: '15:25:33',
    correctAction: 'block',
    actionLabels: { block: 'Activate WAF', investigate: 'Botnet Analysis', ignore: 'Viral Content' },
  },
];

const SEVERITY_COLORS = {
  low: '#60A5FA',
  medium: '#FACC15',
  high: '#FB923C',
  critical: '#F87171',
};

const SEVERITY_BG = {
  low: 'bg-blue-info/20',
  medium: 'bg-yellow-accent/20',
  high: 'bg-orange-400/20',
  critical: 'bg-red-alert/20',
};

const SEVERITY_BORDER = {
  low: 'border-blue-info',
  medium: 'border-yellow-accent',
  high: 'border-orange-400',
  critical: 'border-red-alert',
};

export default function IDSAlert({ onScoreChange }: IDSAlertProps) {
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [trafficDots, setTrafficDots] = useState<TrafficDot[]>([]);
  const [alertFlash, setAlertFlash] = useState(false);
  const [handledCount, setHandledCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [showStart, setShowStart] = useState(true);

  const levelAlerts = ALERTS.slice((level - 1) * 5, level * 5);
  const currentAlert = levelAlerts[currentAlertIndex];

  // Traffic animation
  useEffect(() => {
    if (!gameActive) return;
    const interval = setInterval(() => {
      setTrafficDots((prev) => {
        const updated = prev
          .map((d) => ({ ...d, progress: d.progress + 4 }))
          .filter((d) => d.progress < 100);
        if (Math.random() < 0.6) {
          updated.push({
            id: Date.now() + Math.random(),
            edgeIndex: Math.floor(Math.random() * EDGES.length),
            progress: 0,
            color: Math.random() < 0.8 ? '#4ADE80' : '#F87171',
          });
        }
        return updated.slice(-20);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [gameActive]);

  // Alert flash
  useEffect(() => {
    if (currentAlert && gameActive) {
      setAlertFlash(true);
      const t = setTimeout(() => setAlertFlash(false), 1500);
      return () => clearTimeout(t);
    }
  }, [currentAlertIndex, level, gameActive]);

  const getEdgeCoords = (edgeIndex: number) => {
    const [fromId, toId] = EDGES[edgeIndex];
    const from = DEVICES.find((d) => d.id === fromId)!;
    const to = DEVICES.find((d) => d.id === toId)!;
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  };

  const handleDeviceClick = (deviceId: string) => {
    if (!gameActive || !currentAlert || selectedAction) return;
    setSelectedDevice(deviceId);
  };

  const handleAction = (action: string) => {
    if (!gameActive || !currentAlert || !selectedDevice) return;
    setSelectedAction(action);

    const isCorrectDevice = selectedDevice === currentAlert.targetDevice;
    const isCorrectAction = action === currentAlert.correctAction;

    if (isCorrectDevice && isCorrectAction) {
      const points = currentAlert.severity === 'critical' ? 20 : currentAlert.severity === 'high' ? 15 : 10;
      const newScore = score + points;
      const newCorrect = correctCount + 1;
      setScore(newScore);
      setCorrectCount(newCorrect);
      onScoreChange(Math.min(100, newScore));
      setFeedback(`Correct! You identified the ${DEVICES.find((d) => d.id === currentAlert.targetDevice)?.name} and took the right action! +${points}pts`);
      setFeedbackType('success');
      setTimeline((prev) => [...prev, `${currentAlert.timestamp} - ${currentAlert.type}: CORRECT`]);
    } else if (isCorrectDevice && !isCorrectAction) {
      const newScore = Math.max(0, score - 5);
      setScore(newScore);
      onScoreChange(newScore);
      setFeedback(`Right device, but wrong action! The correct action was: ${currentAlert.actionLabels[currentAlert.correctAction as keyof typeof currentAlert.actionLabels]}`);
      setFeedbackType('error');
      setTimeline((prev) => [...prev, `${currentAlert.timestamp} - ${currentAlert.type}: WRONG ACTION`]);
    } else {
      const newScore = Math.max(0, score - 10);
      setScore(newScore);
      onScoreChange(newScore);
      const correctActionLabel = currentAlert.actionLabels[currentAlert.correctAction as keyof typeof currentAlert.actionLabels];
      setFeedback(`Wrong device! Target: ${DEVICES.find((d) => d.id === currentAlert.targetDevice)?.name}. Correct action: ${correctActionLabel}`);
      setFeedbackType('error');
      setTimeline((prev) => [...prev, `${currentAlert.timestamp} - ${currentAlert.type}: WRONG DEVICE`]);
    }

    setHandledCount((prev) => prev + 1);

    setTimeout(() => {
      if (currentAlertIndex < levelAlerts.length - 1) {
        setCurrentAlertIndex((prev) => prev + 1);
        setSelectedDevice(null);
        setSelectedAction(null);
        setFeedback('');
        setFeedbackType('');
      } else if (level < 3) {
        setLevel((prev) => prev + 1);
        setCurrentAlertIndex(0);
        setSelectedDevice(null);
        setSelectedAction(null);
        setFeedback('');
        setFeedbackType('');
        setMessage(`Level ${level + 1}! Alerts are getting harder...`);
      } else {
        setGameActive(false);
        setShowStart(true);
        setMessage(`Game Complete! Final Score: ${score}`);
      }
    }, 2500);
  };

  const [message, setMessage] = useState('');

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setLevel(1);
    setCurrentAlertIndex(0);
    setSelectedDevice(null);
    setSelectedAction(null);
    setFeedback('');
    setFeedbackType('');
    setHandledCount(0);
    setCorrectCount(0);
    setTrafficDots([]);
    setTimeline([]);
    setShowStart(false);
    onScoreChange(0);
    setMessage(`Level 1: Investigate IDS alerts! Click the affected device, then choose an action.`);
  };

  const resetGame = () => {
    setGameActive(false);
    setShowStart(true);
    setScore(0);
    setLevel(1);
    setCurrentAlertIndex(0);
    setSelectedDevice(null);
    setSelectedAction(null);
    setFeedback('');
    setFeedbackType('');
    setHandledCount(0);
    setCorrectCount(0);
    setTrafficDots([]);
    setTimeline([]);
    onScoreChange(0);
    setMessage('');
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 max-w-3xl mx-auto">
      {/* HUD */}
      <div className="w-full flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <Shield size={18} strokeWidth={3} className="text-yellow-accent" fill="#FACC15" />
          <span className="font-nunito text-sm font-bold text-white">IDS Alert System</span>
        </div>
        <div className="font-nunito text-sm font-bold text-yellow-accent">Score: {score}</div>
        <div className="font-nunito text-xs text-purple-lighter">
          L{level} | {correctCount}/{handledCount} correct
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="w-full bg-blue-info/20 rounded-xl border-[3px] border-blue-info p-2 text-center">
          <p className="font-nunito text-sm text-purple-dark">{message}</p>
        </div>
      )}

      {/* Start / Game Over Screen */}
      {showStart && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-full bg-purple-pale rounded-2xl border-4 border-black p-6 text-center"
        >
          <ShieldAlert size={48} strokeWidth={3} className="text-red-alert mx-auto mb-3" />
          <h3 className="font-fredoka text-xl font-bold text-purple-dark mb-2">
            IDS Alert Analyzer
          </h3>
          <p className="font-nunito text-sm text-purple-dark mb-4">
            Analyze IDS alerts, identify the targeted device, and choose the correct response!
            3 levels with 5 alerts each. Harder alerts as you progress.
          </p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark transition-colors hover:scale-105"
          >
            <Play size={18} strokeWidth={3} className="inline mr-2" />
            Start Investigation
          </button>
        </motion.div>
      )}

      {!showStart && (
        <>
          {/* Network Diagram */}
          <div className="w-full bg-white rounded-2xl border-4 border-black overflow-hidden relative" style={{ height: 280 }}>
            {/* SVG Edges */}
            <svg className="absolute inset-0 w-full h-full">
              {EDGES.map((edge, i) => {
                const from = DEVICES.find((d) => d.id === edge[0])!;
                const to = DEVICES.find((d) => d.id === edge[1])!;
                const isAlertEdge = currentAlert && (edge[0] === currentAlert.targetDevice || edge[1] === currentAlert.targetDevice);
                return (
                  <line
                    key={i}
                    x1={`${from.x}%`}
                    y1={`${from.y}%`}
                    x2={`${to.x}%`}
                    y2={`${to.y}%`}
                    stroke={isAlertEdge && alertFlash ? '#F87171' : '#DDD6FE'}
                    strokeWidth={isAlertEdge && alertFlash ? 4 : 2}
                  />
                );
              })}
              {/* Traffic dots */}
              {trafficDots.map((dot) => {
                const coords = getEdgeCoords(dot.edgeIndex);
                const x = coords.x1 + ((coords.x2 - coords.x1) * dot.progress) / 100;
                const y = coords.y1 + ((coords.y2 - coords.y1) * dot.progress) / 100;
                return (
                  <circle
                    key={dot.id}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r={4}
                    fill={dot.color}
                    stroke="#000"
                    strokeWidth={1}
                  />
                );
              })}
            </svg>

            {/* IDS Sensor Icons on edges */}
            {EDGES.slice(0, 4).map((edge, i) => {
              const from = DEVICES.find((d) => d.id === edge[0])!;
              const to = DEVICES.find((d) => d.id === edge[1])!;
              const cx = (from.x + to.x) / 2;
              const cy = (from.y + to.y) / 2;
              return (
                <motion.div
                  key={`ids-${i}`}
                  animate={alertFlash && currentAlert && (edge[0] === currentAlert.targetDevice || edge[1] === currentAlert.targetDevice) ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3, repeat: alertFlash ? Infinity : 0 }}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${cx}%`, top: `${cy}%` }}
                >
                  <div className="w-6 h-6 rounded-full bg-red-alert border-2 border-black flex items-center justify-center">
                    <Eye size={10} strokeWidth={3} className="text-white" />
                  </div>
                </motion.div>
              );
            })}

            {/* Devices */}
            {DEVICES.map((device) => {
              const isSelected = selectedDevice === device.id;
              const isTarget = currentAlert?.targetDevice === device.id;
              return (
                <motion.button
                  key={device.id}
                  onClick={() => handleDeviceClick(device.id)}
                  whileHover={gameActive && !selectedAction ? { scale: 1.15 } : {}}
                  whileTap={gameActive && !selectedAction ? { scale: 0.95 } : {}}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${device.x}%`, top: `${device.y}%` }}
                >
                  <motion.div
                    animate={
                      alertFlash && isTarget
                        ? { boxShadow: ['0 0 0 0 #F87171', '0 0 0 8px #F87171', '0 0 0 0 #F87171'] }
                        : {}
                    }
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className={`w-14 h-14 rounded-full border-[3px] ${
                      isSelected ? 'border-yellow-accent ring-4 ring-yellow-accent/50' : 'border-black'
                    } flex flex-col items-center justify-center shadow-lg`}
                    style={{ backgroundColor: device.color }}
                  >
                    {device.icon}
                    <span className="font-nunito text-[7px] font-bold text-white leading-none mt-0.5">
                      {device.name.split(' ')[0]}
                    </span>
                  </motion.div>
                </motion.button>
              );
            })}

            {/* Flash overlay */}
            <AnimatePresence>
              {alertFlash && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-red-alert z-0 pointer-events-none"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Alert Panel */}
          {currentAlert && gameActive && (
            <motion.div
              key={currentAlert.id}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              className={`w-full ${SEVERITY_BG[currentAlert.severity]} ${SEVERITY_BORDER[currentAlert.severity]} rounded-2xl border-[3px] p-4`}
            >
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert
                  size={20}
                  strokeWidth={3}
                  style={{ color: SEVERITY_COLORS[currentAlert.severity] }}
                />
                <span className="font-fredoka text-sm font-bold text-purple-dark">
                  ALERT #{currentAlert.id}
                </span>
                <span
                  className="ml-auto font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-black"
                  style={{
                    backgroundColor: SEVERITY_COLORS[currentAlert.severity],
                    color: currentAlert.severity === 'medium' ? '#000' : '#fff',
                  }}
                >
                  {currentAlert.severity.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white rounded-lg border-2 border-black p-2">
                  <span className="font-nunito text-[10px] text-purple-light">Source IP</span>
                  <p className="font-mono text-xs font-bold text-purple-dark">{currentAlert.sourceIp}</p>
                </div>
                <div className="bg-white rounded-lg border-2 border-black p-2">
                  <span className="font-nunito text-[10px] text-purple-light">Time</span>
                  <p className="font-mono text-xs font-bold text-purple-dark flex items-center gap-1">
                    <Clock size={10} strokeWidth={3} /> {currentAlert.timestamp}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg border-2 border-black p-2 mb-3">
                <span className="font-nunito text-[10px] text-purple-light">Alert Details</span>
                <p className="font-nunito text-xs text-purple-dark">{currentAlert.description}</p>
              </div>

              {/* Selected Device */}
              {selectedDevice && (
                <div className="mb-3 bg-yellow-accent/20 border-2 border-yellow-accent rounded-lg p-2 flex items-center gap-2">
                  <Check size={14} strokeWidth={3} className="text-purple-dark" />
                  <span className="font-nunito text-xs font-bold text-purple-dark">
                    Selected: {DEVICES.find((d) => d.id === selectedDevice)?.name}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              {!selectedAction && selectedDevice && (
                <div className="grid grid-cols-3 gap-2">
                  {(['block', 'investigate', 'ignore'] as const).map((action) => (
                    <button
                      key={action}
                      onClick={() => handleAction(action)}
                      className={`p-2 rounded-xl border-[3px] border-black font-nunito text-[11px] font-bold transition-transform hover:scale-105 ${
                        action === 'block'
                          ? 'bg-red-alert text-white'
                          : action === 'investigate'
                          ? 'bg-yellow-accent text-black'
                          : 'bg-purple-lighter text-purple-dark'
                      }`}
                    >
                      {action === 'block' && <Ban size={14} strokeWidth={3} className="mx-auto mb-1" />}
                      {action === 'investigate' && <Search size={14} strokeWidth={3} className="mx-auto mb-1" />}
                      {action === 'ignore' && <X size={14} strokeWidth={3} className="mx-auto mb-1" />}
                      {currentAlert.actionLabels[action]}
                    </button>
                  ))}
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`mt-3 p-2 rounded-lg border-2 font-nunito text-xs text-center ${
                    feedbackType === 'success'
                      ? 'bg-green-success/20 border-green-success text-purple-dark'
                      : 'bg-red-alert/20 border-red-alert text-purple-dark'
                  }`}
                >
                  {feedback}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="w-full bg-white rounded-xl border-[3px] border-black p-3">
              <span className="font-nunito text-[10px] font-bold text-purple-dark mb-2 block">
                <Clock size={12} strokeWidth={3} className="inline mr-1" />
                Attack Timeline
              </span>
              <div className="flex gap-1 flex-wrap">
                {timeline.map((entry, i) => (
                  <span
                    key={i}
                    className={`font-mono text-[8px] px-2 py-0.5 rounded-full border border-black ${
                      entry.includes('CORRECT') ? 'bg-green-success text-black' : 'bg-red-alert text-white'
                    }`}
                  >
                    {entry.split(' - ')[1]?.split(':')[0]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reset */}
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-4 py-2 bg-red-alert text-white border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform"
          >
            <RotateCcw size={14} strokeWidth={3} /> Reset
          </button>
        </>
      )}
    </div>
  );
}
