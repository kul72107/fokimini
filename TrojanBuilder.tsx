import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug, Shield, ShieldCheck, ShieldAlert, Play, RotateCcw, Trophy,
  ChevronRight, Lock, Unlock, Zap, Eye, EyeOff, AlertTriangle,
  Check, X, ArrowRight, Layers, Cpu, Wifi, HardDrive, FileDown,
  Sparkles, Target, Radio, Timer, Settings
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type ComponentType = 'dropper' | 'payload' | 'persistence' | 'comm';
type Stage = 'build' | 'test' | 'analyze';

interface TrojanComponent {
  id: string;
  type: ComponentType;
  name: string;
  description: string;
  icon: React.ReactNode;
  defenseBypass: number;
  detectability: number;
}

interface AssembledPart {
  component: TrojanComponent;
  instanceId: string;
}

const COMPONENT_PALETTE: TrojanComponent[] = [
  // Droppers
  { id: 'email', type: 'dropper', name: 'Email Attachment', description: 'Disguised as a PDF document', icon: <FileDown size={18} strokeWidth={3} />, defenseBypass: 30, detectability: 40 },
  { id: 'usb', type: 'dropper', name: 'USB AutoRun', description: 'Triggers when USB is plugged in', icon: <HardDrive size={18} strokeWidth={3} />, defenseBypass: 50, detectability: 60 },
  { id: 'download', type: 'dropper', name: 'Fake Download', description: 'Bundled with free software', icon: <FileDown size={18} strokeWidth={3} />, defenseBypass: 40, detectability: 50 },
  { id: 'macro', type: 'dropper', name: 'Office Macro', description: 'Hidden in a Word/Excel file', icon: <FileDown size={18} strokeWidth={3} />, defenseBypass: 60, detectability: 45 },
  // Payloads
  { id: 'keylog', type: 'payload', name: 'Keylogger', description: 'Records all keystrokes', icon: <Target size={18} strokeWidth={3} />, defenseBypass: 20, detectability: 35 },
  { id: 'screenshot', type: 'payload', name: 'Screen Capture', description: 'Takes periodic screenshots', icon: <Eye size={18} strokeWidth={3} />, defenseBypass: 25, detectability: 30 },
  { id: 'filesteal', type: 'payload', name: 'File Stealer', description: 'Searches for sensitive files', icon: <Layers size={18} strokeWidth={3} />, defenseBypass: 35, detectability: 50 },
  { id: 'cryptominer', type: 'payload', name: 'CryptoMiner', description: 'Uses CPU to mine cryptocurrency', icon: <Cpu size={18} strokeWidth={3} />, defenseBypass: 45, detectability: 70 },
  // Persistence
  { id: 'registry', type: 'persistence', name: 'Registry Key', description: 'Adds startup entry to registry', icon: <Settings size={18} strokeWidth={3} />, defenseBypass: 35, detectability: 40 },
  { id: 'service', type: 'persistence', name: 'System Service', description: 'Installs as a Windows service', icon: <Settings size={18} strokeWidth={3} />, defenseBypass: 55, detectability: 55 },
  { id: 'scheduled', type: 'persistence', name: 'Scheduled Task', description: 'Creates a recurring task', icon: <Timer size={18} strokeWidth={3} />, defenseBypass: 45, detectability: 50 },
  { id: 'dll', type: 'persistence', name: 'DLL Hijack', description: 'Replaces a legitimate DLL', icon: <Layers size={18} strokeWidth={3} />, defenseBypass: 65, detectability: 60 },
  // Communication
  { id: 'http', type: 'comm', name: 'HTTP Callback', description: 'Sends data over HTTP', icon: <Wifi size={18} strokeWidth={3} />, defenseBypass: 20, detectability: 40 },
  { id: 'dns', type: 'comm', name: 'DNS Tunnel', description: 'Hides data in DNS queries', icon: <Radio size={18} strokeWidth={3} />, defenseBypass: 50, detectability: 55 },
  { id: 'https', type: 'comm', name: 'HTTPS Beacon', description: 'Encrypted C2 communication', icon: <Lock size={18} strokeWidth={3} />, defenseBypass: 40, detectability: 35 },
  { id: 'p2p', type: 'comm', name: 'P2P Mesh', description: 'Peer-to-peer command channel', icon: <Wifi size={18} strokeWidth={3} />, defenseBypass: 55, detectability: 50 },
];

const COMPONENT_COLORS: Record<ComponentType, { bg: string; border: string; label: string }> = {
  dropper: { bg: '#60A5FA', border: '#2563EB', label: 'Dropper' },
  payload: { bg: '#F87171', border: '#DC2626', label: 'Payload' },
  persistence: { bg: '#FB923C', border: '#EA580C', label: 'Persistence' },
  comm: { bg: '#A78BFA', border: '#7C3AED', label: 'Communication' },
};

const DEFENSES = [
  { name: 'Antivirus Scan', icon: <Shield size={16} strokeWidth={3} />, power: 60 },
  { name: 'Firewall Block', icon: <ShieldCheck size={16} strokeWidth={3} />, power: 50 },
  { name: 'Behavior Monitor', icon: <ShieldAlert size={16} strokeWidth={3} />, power: 70 },
  { name: 'Heuristic Analysis', icon: <Shield size={16} strokeWidth={3} />, power: 80 },
];

export default function TrojanBuilder({ onScoreChange }: Props) {
  const [stage, setStage] = useState<Stage>('build');
  const [assembly, setAssembly] = useState<AssembledPart[]>([]);
  const [score, setScore] = useState(0);
  const [testResult, setTestResult] = useState<{ passed: boolean; message: string; defense: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [detectedBy, setDetectedBy] = useState<string[]>([]);
  const [completedTrojans, setCompletedTrojans] = useState(0);
  const [showEducation, setShowEducation] = useState(false);
  const [activeTab, setActiveTab] = useState<ComponentType>('dropper');
  const testTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (testTimeoutRef.current) {
        clearTimeout(testTimeoutRef.current);
      }
    };
  }, []);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = Math.min(100, Math.max(0, prev + points));
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  const addToAssembly = (component: TrojanComponent) => {
    const typeCount = assembly.filter(p => p.component.type === component.type).length;
    if (typeCount >= 2) return; // Max 2 per type
    const instanceId = `${component.id}-${Date.now()}`;
    setAssembly(prev => [...prev, { component, instanceId }]);
    addScore(25);
  };

  const removeFromAssembly = (instanceId: string) => {
    setAssembly(prev => prev.filter(p => p.instanceId !== instanceId));
  };

  const handleTest = () => {
    setIsTesting(true);
    setTestResult(null);
    setDetectedBy([]);

    testTimeoutRef.current = setTimeout(() => {
      const totalBypass = assembly.reduce((sum, p) => sum + p.component.defenseBypass, 0);
      const totalDetect = assembly.reduce((sum, p) => sum + p.component.detectability, 0);
      const avgDetect = assembly.length > 0 ? totalDetect / assembly.length : 0;

      const detected: string[] = [];
      DEFENSES.forEach(def => {
        if (avgDetect > def.power - totalBypass * 0.3) {
          detected.push(def.name);
        }
      });

      setDetectedBy(detected);
      const hasAllTypes = ['dropper', 'payload', 'persistence', 'comm'].every(t =>
        assembly.some(p => p.component.type === t)
      );

      if (detected.length === 0 && hasAllTypes) {
        setTestResult({ passed: true, message: 'Trojan evaded all defenses!', defense: 'None' });
        setCompletedTrojans(prev => prev + 1);
        addScore(100);
      } else if (hasAllTypes) {
        setTestResult({ passed: false, message: `Detected by: ${detected.join(', ')}`, defense: detected[0] });
      } else {
        setTestResult({ passed: false, message: 'Incomplete! Need all 4 component types.', defense: 'Missing Components' });
      }
      setIsTesting(false);
      testTimeoutRef.current = null;
    }, 2000);
  };

  const handleReset = () => {
    // Clear any pending test timeout
    if (testTimeoutRef.current) {
      clearTimeout(testTimeoutRef.current);
      testTimeoutRef.current = null;
    }
    setAssembly([]);
    setTestResult(null);
    setDetectedBy([]);
    setStage('build');
    setIsTesting(false);
    setScore(0);
    setCompletedTrojans(0);
    onScoreChange(0);
  };

  const hasAllTypes = ['dropper', 'payload', 'persistence', 'comm'].every(t =>
    assembly.some(p => p.component.type === t)
  );

  const typeTabs: { type: ComponentType; icon: React.ReactNode }[] = [
    { type: 'dropper', icon: <FileDown size={16} strokeWidth={3} /> },
    { type: 'payload', icon: <Target size={16} strokeWidth={3} /> },
    { type: 'persistence', icon: <Settings size={16} strokeWidth={3} /> },
    { type: 'comm', icon: <Wifi size={16} strokeWidth={3} /> },
  ];

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-alert rounded-2xl border-4 border-black flex items-center justify-center">
            <Bug size={24} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">Trojan Builder</h2>
            <p className="text-sm text-purple-dark font-nunito">Build and test trojan components!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </div>
          <div className="bg-green-success px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Check size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{completedTrojans}</span>
          </div>
          <button onClick={handleReset} className="p-2 bg-purple-light rounded-2xl border-4 border-black hover:bg-purple-primary transition-colors">
            <RotateCcw size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { id: 'build' as Stage, label: 'Build Lab', icon: <Layers size={16} strokeWidth={3} /> },
          { id: 'test' as Stage, label: 'Test vs Defenses', icon: <Shield size={16} strokeWidth={3} /> },
          { id: 'analyze' as Stage, label: 'Analysis', icon: <Eye size={16} strokeWidth={3} /> },
        ]).map(s => (
          <button
            key={s.id}
            onClick={() => setStage(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm transition-all hover:scale-105 ${
              stage === s.id ? 'bg-purple-primary text-white scale-105' : 'bg-white text-purple-darker'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setShowEducation(!showEducation)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm bg-yellow-accent hover:scale-105 transition-transform"
        >
          <Sparkles size={16} strokeWidth={3} />
          Learn
        </button>
      </div>

      {/* Education */}
      <AnimatePresence>
        {showEducation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
              <h3 className="font-fredoka text-lg text-purple-darker mb-2 flex items-center gap-2">
                <Sparkles size={18} strokeWidth={3} />
                How Trojans Work
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { color: '#60A5FA', title: 'Dropper', text: 'The entry point. Gets the trojan onto the system through email, USB, or downloads.' },
                  { color: '#F87171', title: 'Payload', text: 'The malicious action. Steals data, logs keys, or mines cryptocurrency.' },
                  { color: '#FB923C', title: 'Persistence', text: 'Stays after reboot. Registry keys, services, or scheduled tasks ensure survival.' },
                  { color: '#A78BFA', title: 'Communication', text: 'Talks to attacker. Sends stolen data and receives commands via hidden channels.' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl border-3 border-black p-3" style={{ backgroundColor: item.color + '20', borderColor: item.color }}>
                    <h4 className="font-fredoka text-sm mb-1" style={{ color: item.color }}>{item.title}</h4>
                    <p className="text-xs font-nunito text-purple-dark">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BUILD STAGE */}
      {stage === 'build' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Component Palette */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
              <h3 className="font-fredoka text-lg text-purple-darker mb-2 flex items-center gap-2">
                <Layers size={18} strokeWidth={3} />
                Component Palette
              </h3>
              {/* Type Tabs */}
              <div className="flex gap-1 mb-3">
                {typeTabs.map(t => (
                  <button
                    key={t.type}
                    onClick={() => setActiveTab(t.type)}
                    className="flex-1 flex items-center justify-center py-1.5 rounded-lg border-[3px] border-black font-fredoka text-[10px] transition-all hover:scale-105"
                    style={{
                      backgroundColor: activeTab === t.type ? COMPONENT_COLORS[t.type].bg : '#F5F3FF',
                      color: activeTab === t.type ? '#FFFFFF' : '#3B0764',
                    }}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
              {/* Components */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {COMPONENT_PALETTE.filter(c => c.type === activeTab).map(comp => {
                  const colors = COMPONENT_COLORS[comp.type];
                  const isMaxed = assembly.filter(p => p.component.type === comp.type).length >= 2;
                  return (
                    <motion.button
                      key={comp.id}
                      whileHover={{ scale: isMaxed ? 1 : 1.02 }}
                      whileTap={{ scale: isMaxed ? 1 : 0.98 }}
                      onClick={() => !isMaxed && addToAssembly(comp)}
                      disabled={isMaxed}
                      className={`w-full text-left p-3 rounded-xl border-[3px] border-black transition-all ${
                        isMaxed ? 'opacity-40' : 'hover:brightness-110'
                      }`}
                      style={{ backgroundColor: colors.bg + '30' }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
                          {comp.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-fredoka text-sm text-purple-darker block truncate">{comp.name}</span>
                          <span className="text-[10px] font-nunito text-purple-dark">{comp.description}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-nunito text-green-success">Bypass: {comp.defenseBypass}%</div>
                          <div className="text-[10px] font-nunito text-red-alert">Detect: {comp.detectability}%</div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center: Assembly Area */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow min-h-[400px]">
              <h3 className="font-fredoka text-lg text-purple-darker mb-4 flex items-center gap-2">
                <Bug size={18} strokeWidth={3} />
                Assembly Area
              </h3>

              {/* Pipeline Visualization */}
              <div className="relative">
                {/* Connection Lines */}
                {assembly.length > 1 && (
                  <div className="absolute left-6 top-0 bottom-0 w-1 bg-purple-lighter -z-0" />
                )}

                <AnimatePresence>
                  {assembly.length === 0 && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12 text-purple-light"
                    >
                      <Layers size={48} strokeWidth={2} className="mx-auto mb-2" />
                      <p className="font-fredoka text-sm">Click components to assemble your trojan</p>
                      <p className="text-xs font-nunito mt-1">Need: Dropper &#8594; Payload &#8594; Persistence &#8594; Comm</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3 relative z-10">
                  {assembly.map((part, idx) => {
                    const colors = COMPONENT_COLORS[part.component.type];
                    return (
                      <motion.div
                        key={part.instanceId}
                        initial={{ x: -50, scale: 0.8 }}
                        animate={{ x: 0, scale: 1 }}
                        exit={{ x: 50, scale: 0.5 }}
                        layout
                        className="flex items-center gap-3"
                      >
                        <div className="w-8 h-8 bg-purple-primary rounded-full border-2 border-black flex items-center justify-center flex-shrink-0">
                          <span className="font-fredoka text-xs text-white">{idx + 1}</span>
                        </div>
                        <div
                          className="flex-1 p-3 rounded-xl border-[3px] border-black flex items-center gap-2"
                          style={{ backgroundColor: colors.bg }}
                        >
                          <span className="text-white">{part.component.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-fredoka text-sm text-white block truncate">{part.component.name}</span>
                            <span className="text-[10px] text-white/80">{colors.label}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromAssembly(part.instanceId)}
                          className="w-7 h-7 bg-red-alert rounded-lg border-2 border-black flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <X size={14} strokeWidth={3} className="text-white" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Assembly Complete Indicator */}
                {hasAllTypes && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-4 bg-green-success rounded-xl border-4 border-black p-3 text-center"
                  >
                    <Check size={24} strokeWidth={3} className="inline text-black mr-2" />
                    <span className="font-fredoka text-sm text-black">All component types assembled!</span>
                  </motion.div>
                )}
              </div>

              {/* Test Button */}
              <button
                onClick={() => setStage('test')}
                disabled={assembly.length === 0}
                className="w-full mt-4 px-4 py-3 bg-purple-primary text-white rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-40"
              >
                <Shield size={16} strokeWidth={3} />
                Test Against Defenses
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
              <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
                <Eye size={18} strokeWidth={3} />
                Trojan Preview
              </h3>

              {/* Stats */}
              <div className="space-y-3">
                <div className="bg-purple-pale rounded-xl border-2 border-black p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-nunito text-xs text-purple-dark">Defense Bypass</span>
                    <span className="font-fredoka text-sm text-purple-primary">
                      {assembly.reduce((s, p) => s + p.component.defenseBypass, 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-purple-lighter rounded-full h-4 border-2 border-black overflow-hidden">
                    <motion.div
                      className="h-full bg-green-success rounded-full"
                      animate={{ width: `${Math.min(assembly.reduce((s, p) => s + p.component.defenseBypass, 0), 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-purple-pale rounded-xl border-2 border-black p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-nunito text-xs text-purple-dark">Detectability Risk</span>
                    <span className="font-fredoka text-sm text-red-alert">
                      {assembly.length > 0 ? Math.round(assembly.reduce((s, p) => s + p.component.detectability, 0) / assembly.length) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-purple-lighter rounded-full h-4 border-2 border-black overflow-hidden">
                    <motion.div
                      className="h-full bg-red-alert rounded-full"
                      animate={{ width: `${assembly.length > 0 ? Math.round(assembly.reduce((s, p) => s + p.component.detectability, 0) / assembly.length) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Components checklist */}
                <div className="space-y-2">
                  {(['dropper', 'payload', 'persistence', 'comm'] as ComponentType[]).map(type => {
                    const count = assembly.filter(p => p.component.type === type).length;
                    const colors = COMPONENT_COLORS[type];
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border-2 border-black flex items-center justify-center"
                          style={{ backgroundColor: count > 0 ? colors.bg : '#F5F3FF' }}
                        >
                          {count > 0 && <Check size={14} strokeWidth={3} className="text-white" />}
                        </div>
                        <span className="font-fredoka text-xs text-purple-darker flex-1">{colors.label}</span>
                        <span className="font-mono text-xs text-purple-primary">{count}/2</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEST STAGE */}
      {stage === 'test' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border-4 border-black p-6 card-shadow">
            <h3 className="font-fredoka text-xl text-purple-darker mb-6 text-center flex items-center justify-center gap-2">
              <Shield size={24} strokeWidth={3} />
              Defense Testing Lab
            </h3>

            {/* Trojan Summary */}
            <div className="bg-purple-pale rounded-xl border-2 border-black p-3 mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                {assembly.map((part, i) => (
                  <div key={part.instanceId} className="flex items-center gap-2">
                    <div
                      className="px-3 py-1 rounded-lg border-2 border-black font-fredoka text-xs"
                      style={{ backgroundColor: COMPONENT_COLORS[part.component.type].bg, color: '#FFFFFF' }}
                    >
                      {part.component.name}
                    </div>
                    {i < assembly.length - 1 && <ArrowRight size={14} strokeWidth={3} className="text-purple-primary" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Defense Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {DEFENSES.map((def, i) => (
                <motion.div
                  key={def.name}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-xl border-4 border-black p-4 text-center ${
                    detectedBy.includes(def.name) ? 'bg-red-alert/20' : 'bg-green-success/20'
                  }`}
                >
                  <div className="mb-2">{def.icon}</div>
                  <span className="font-fredoka text-sm text-purple-darker block">{def.name}</span>
                  <span className="font-mono text-xs text-purple-primary">Power: {def.power}%</span>
                  {isTesting && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="mt-2"
                    >
                      <Settings size={20} strokeWidth={3} className="mx-auto text-purple-primary" />
                    </motion.div>
                  )}
                  {!isTesting && testResult && (
                    <div className="mt-2">
                      {detectedBy.includes(def.name) ? (
                        <X size={20} strokeWidth={3} className="mx-auto text-red-alert" />
                      ) : (
                        <Check size={20} strokeWidth={3} className="mx-auto text-green-success" />
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Test Button */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleTest}
                disabled={isTesting}
                className="px-6 py-3 bg-purple-primary text-white rounded-2xl border-4 border-black font-fredoka text-sm flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
              >
                <Play size={16} strokeWidth={3} />
                {isTesting ? 'Testing...' : 'Run Test'}
              </button>
              <button
                onClick={() => setStage('build')}
                className="px-6 py-3 bg-purple-lighter rounded-2xl border-4 border-black font-fredoka text-sm flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Layers size={16} strokeWidth={3} />
                Edit Build
              </button>
            </div>

            {/* Test Result */}
            <AnimatePresence>
              {testResult && (
                <motion.div
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className={`mt-6 rounded-2xl border-4 border-black p-4 text-center ${
                    testResult.passed ? 'bg-green-success' : 'bg-red-alert/30'
                  }`}
                >
                  {testResult.passed ? (
                    <>
                      <Unlock size={32} strokeWidth={3} className="mx-auto mb-2 text-black" />
                      <p className="font-fredoka text-lg text-black">{testResult.message}</p>
                      <p className="text-sm font-nunito text-purple-darker mt-1">+100 points!</p>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={32} strokeWidth={3} className="mx-auto mb-2 text-red-alert" />
                      <p className="font-fredoka text-lg text-purple-darker">{testResult.message}</p>
                      {detectedBy.length > 0 && (
                        <p className="text-xs font-nunito text-purple-dark mt-1">
                          Try different components to bypass these defenses!
                        </p>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ANALYZE STAGE */}
      {stage === 'analyze' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border-4 border-black p-6 card-shadow">
            <h3 className="font-fredoka text-xl text-purple-darker mb-4 text-center flex items-center justify-center gap-2">
              <Eye size={24} strokeWidth={3} />
              Trojan Analysis
            </h3>

            {assembly.length === 0 ? (
              <div className="text-center py-12 text-purple-light">
                <Bug size={48} strokeWidth={2} className="mx-auto mb-2" />
                <p className="font-fredoka text-sm">No trojan to analyze yet!</p>
                <button onClick={() => setStage('build')} className="mt-3 px-4 py-2 bg-purple-primary text-white rounded-xl border-4 border-black font-fredoka text-sm hover:scale-105 transition-transform">
                  Go to Build Lab
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Component Breakdown */}
                {assembly.map((part, i) => (
                  <motion.div
                    key={part.instanceId}
                    initial={{ x: -20 }}
                    animate={{ x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-xl border-3 border-black p-3"
                    style={{ backgroundColor: COMPONENT_COLORS[part.component.type].bg + '20' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center"
                        style={{ backgroundColor: COMPONENT_COLORS[part.component.type].bg }}
                      >
                        {part.component.icon}
                      </div>
                      <div className="flex-1">
                        <span className="font-fredoka text-sm text-purple-darker">{part.component.name}</span>
                        <p className="text-xs font-nunito text-purple-dark">{part.component.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-nunito text-green-success">Bypass: {part.component.defenseBypass}%</div>
                        <div className="text-xs font-nunito text-red-alert">Detect: {part.component.detectability}%</div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Detection Tips */}
                <div className="bg-yellow-accent/20 rounded-xl border-4 border-yellow-accent p-4">
                  <h4 className="font-fredoka text-sm text-purple-darker mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} strokeWidth={3} />
                    How to Detect This Trojan
                  </h4>
                  <ul className="space-y-1 text-xs font-nunito text-purple-dark">
                    {assembly.some(p => p.component.type === 'dropper') && (
                      <li>&#8226; Monitor email attachments and USB insertions</li>
                    )}
                    {assembly.some(p => p.component.type === 'payload') && (
                      <li>&#8226; Watch for unusual CPU usage and network activity</li>
                    )}
                    {assembly.some(p => p.component.type === 'persistence') && (
                      <li>&#8226; Check registry run keys and scheduled tasks</li>
                    )}
                    {assembly.some(p => p.component.type === 'comm') && (
                      <li>&#8226; Monitor DNS queries and outbound HTTPS connections</li>
                    )}
                  </ul>
                </div>

                {/* Mitigation */}
                <div className="bg-green-success/20 rounded-xl border-4 border-green-success p-4">
                  <h4 className="font-fredoka text-sm text-purple-darker mb-2 flex items-center gap-2">
                    <ShieldCheck size={16} strokeWidth={3} />
                    Defense Recommendations
                  </h4>
                  <ul className="space-y-1 text-xs font-nunito text-purple-dark">
                    <li>&#8226; Keep antivirus definitions up to date</li>
                    <li>&#8226; Use application whitelisting</li>
                    <li>&#8226; Enable behavioral monitoring (EDR)</li>
                    <li>&#8226; Network segmentation and traffic inspection</li>
                    <li>&#8226; Regular security awareness training</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
