import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldAlert, Check, X, Zap, Trophy, ChevronRight,
  RotateCcw, Play, Globe, Lock, Unlock, AlertTriangle, Code,
  Layers, Sparkles, BookOpen, Fingerprint, Gauge, Target,
  Shuffle, Type, MessageSquare, Split, Scan, Eye, ServerCrash
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type WafType = 'cloudflare' | 'aws' | 'modsecurity' | 'akamai' | 'imperva' | 'none';
type TestPhase = 'idle' | 'detecting' | 'detected' | 'bypassing' | 'complete';

interface WafInfo {
  id: WafType;
  name: string;
  icon: React.ReactNode;
  strength: number;
  color: string;
  description: string;
  rules: string[];
}

interface BypassAttempt {
  id: string;
  technique: string;
  payload: string;
  blocked: boolean;
  wafRule: string;
  timestamp: number;
}

const WAF_TYPES: WafInfo[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    icon: <Shield size={20} strokeWidth={3} />,
    strength: 85,
    color: '#F87171',
    description: 'Cloud-based WAF with DDoS protection',
    rules: ['SQL Injection Pattern', 'XSS Script Tag', 'Known Exploit CVE', 'Rate Limiting'],
  },
  {
    id: 'aws',
    name: 'AWS WAF',
    icon: <Shield size={20} strokeWidth={3} />,
    strength: 70,
    color: '#FACC15',
    description: 'Amazon Web Services WAF with managed rules',
    rules: ['IP Reputation', 'SQLi Match', 'Size Constraint', 'Geo-blocking'],
  },
  {
    id: 'modsecurity',
    name: 'ModSecurity',
    icon: <Shield size={20} strokeWidth={3} />,
    strength: 60,
    color: '#60A5FA',
    description: 'Open-source WAF for Apache, Nginx, IIS',
    rules: ['OWASP Core Rule Set', 'Path Traversal', 'Command Injection', 'HTTP Protocol'],
  },
  {
    id: 'akamai',
    name: 'Akamai',
    icon: <Shield size={20} strokeWidth={3} />,
    strength: 90,
    color: '#F472B6',
    description: 'Enterprise CDN with advanced WAF',
    rules: ['Behavioral Analysis', 'Bot Detection', 'API Security', 'App Layer DDoS'],
  },
  {
    id: 'imperva',
    name: 'Imperva',
    icon: <Shield size={20} strokeWidth={3} />,
    strength: 80,
    color: '#A78BFA',
    description: 'Advanced WAF with machine learning',
    rules: ['Automated Threat Detection', 'Backdoor Protection', 'Remote File Inclusion', 'Session Fixation'],
  },
  {
    id: 'none',
    name: 'No WAF',
    icon: <Unlock size={20} strokeWidth={3} />,
    strength: 0,
    color: '#4ADE80',
    description: 'No Web Application Firewall detected',
    rules: [],
  },
];

interface BypassTechnique {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  normalPayload: string;
  bypassPayload: string;
  color: string;
}

const BYPASS_TECHNIQUES: BypassTechnique[] = [
  {
    id: 'encoding',
    name: 'URL Encoding',
    icon: <Shuffle size={18} strokeWidth={3} />,
    description: 'Encode special characters to bypass pattern matching',
    normalPayload: "' OR 1=1--",
    bypassPayload: "%27%20OR%201%3D1--",
    color: '#F472B6',
  },
  {
    id: 'case',
    name: 'Case Variation',
    icon: <Type size={18} strokeWidth={3} />,
    description: 'Mix uppercase/lowercase to evade case-sensitive filters',
    normalPayload: "<script>alert(1)</script>",
    bypassPayload: "<ScRiPt>alert(1)</ScRiPt>",
    color: '#60A5FA',
  },
  {
    id: 'comment',
    name: 'Comment Injection',
    icon: <MessageSquare size={18} strokeWidth={3} />,
    description: 'Insert SQL comments to break up malicious patterns',
    normalPayload: "' UNION SELECT *--",
    bypassPayload: "'/**/UNION/**/SELECT/**/*--",
    color: '#FACC15',
  },
  {
    id: 'fragment',
    name: 'Fragmentation',
    icon: <Split size={18} strokeWidth={3} />,
    description: 'Split payload across multiple requests or parameters',
    normalPayload: "<img src=x onerror=alert(1)>",
    bypassPayload: "<img src=x oner\\nror=al\\nert(1)>",
    color: '#4ADE80',
  },
];

const WAF_DETECTION_PAYLOADS = [
  "' AND 1=1--",
  "<script>test</script>",
  "../../../etc/passwd",
  "UNION SELECT NULL--",
];

export default function WAFTester({ onScoreChange }: Props) {
  const [targetUrl, setTargetUrl] = useState('');
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [detectedWaf, setDetectedWaf] = useState<WafInfo | null>(null);
  const [bypassAttempts, setBypassAttempts] = useState<BypassAttempt[]>([]);
  const [score, setScore] = useState(0);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showLearn, setShowLearn] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [gaugeValue, setGaugeValue] = useState(0);
  const [wafDetectedFlag, setWafDetectedFlag] = useState(false);

  // Refs for timer cleanup
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bypassTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScoreChangeRef = useRef(onScoreChange);

  // Keep ref in sync
  useEffect(() => { onScoreChangeRef.current = onScoreChange; }, [onScoreChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
      if (bypassTimeoutRef.current) clearTimeout(bypassTimeoutRef.current);
    };
  }, []);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = Math.max(0, Math.min(500, prev + points));
      onScoreChangeRef.current(next);
      return next;
    });
  }, []);

  const detectWaf = useCallback(() => {
    if (!targetUrl.trim()) return;
    // Clear any previous detection interval
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    
    setPhase('detecting');
    setDetectionProgress(0);
    setGaugeValue(0);
    setCurrentStep(0);
    setBypassAttempts([]);
    setDetectedWaf(null);
    setWafDetectedFlag(false);

    // Simulate detection steps
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setCurrentStep(step);
      setDetectionProgress((step / 4) * 100);

      if (step >= 4) {
        if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
        detectIntervalRef.current = null;
        // Pick a random WAF (excluding 'none' most of the time)
        const wafPool = Math.random() > 0.1
          ? WAF_TYPES.filter(w => w.id !== 'none')
          : WAF_TYPES;
        const selected = wafPool[Math.floor(Math.random() * wafPool.length)];

        setDetectedWaf(selected);
        setPhase('detected');
        setGaugeValue(selected.strength);

        if (selected.id !== 'none') {
          setWafDetectedFlag(true);
          addScore(40);
        }
      }
    }, 800);

    detectIntervalRef.current = interval;
  }, [targetUrl, addScore]);

  const runBypass = useCallback((technique: BypassTechnique) => {
    if (!detectedWaf || detectedWaf.id === 'none') return;
    setPhase('bypassing');

    // Clear any previous bypass timeout
    if (bypassTimeoutRef.current) clearTimeout(bypassTimeoutRef.current);

    // Simulate bypass attempt
    const blocked = Math.random() > 0.4; // 60% success rate for education
    const rule = detectedWaf.rules[Math.floor(Math.random() * detectedWaf.rules.length)] || 'Generic Filter';

    bypassTimeoutRef.current = setTimeout(() => {
      const attempt: BypassAttempt = {
        id: `${technique.id}-${Date.now()}`,
        technique: technique.name,
        payload: technique.bypassPayload,
        blocked,
        wafRule: blocked ? `Blocked by: ${rule}` : `Bypassed: ${rule}`,
        timestamp: Date.now(),
      };
      setBypassAttempts(prev => [attempt, ...prev]);

      if (!blocked) {
        addScore(60);
      }
      setPhase('detected');
      bypassTimeoutRef.current = null;
    }, 1200);
  }, [detectedWaf, addScore]);

  const reset = useCallback(() => {
    // Clear all pending timers
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (bypassTimeoutRef.current) {
      clearTimeout(bypassTimeoutRef.current);
      bypassTimeoutRef.current = null;
    }
    setPhase('idle');
    setDetectedWaf(null);
    setBypassAttempts([]);
    setScore(0);
    setDetectionProgress(0);
    setCurrentStep(0);
    setGaugeValue(0);
    setShowLearn(false);
    setShowRules(false);
    setWafDetectedFlag(false);
    onScoreChangeRef.current(0);
  }, []);

  const successfulBypasses = bypassAttempts.filter(a => !a.blocked).length;
  const totalAttempts = bypassAttempts.length;

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-primary rounded-2xl border-4 border-black flex items-center justify-center">
            <Shield size={24} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">WAF Tester</h2>
            <p className="text-sm text-purple-dark font-nunito">Detect & test Web Application Firewalls!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </div>
          {detectedWaf && detectedWaf.id !== 'none' && (
            <div className="bg-blue-info px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
              <Unlock size={20} strokeWidth={3} />
              <span className="font-fredoka text-lg">{successfulBypasses}</span>
            </div>
          )}
          <button onClick={reset} className="p-2 bg-purple-light rounded-2xl border-4 border-black hover:bg-purple-primary transition-colors">
            <RotateCcw size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Target URL + Detect Button */}
      <div className="bg-white rounded-2xl border-4 border-black p-3 mb-4 card-shadow">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-fredoka text-purple-darker">Target:</span>
          <input
            type="text"
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border-4 border-black font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-primary"
          />
          <button
            onClick={detectWaf}
            disabled={!targetUrl.trim() || phase === 'detecting' || phase === 'bypassing'}
            className="px-6 py-2 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50"
            style={{ backgroundColor: phase === 'detecting' ? '#A78BFA' : '#FACC15' }}
          >
            {phase === 'detecting' ? <Scan size={16} strokeWidth={3} className="animate-spin" /> : <Fingerprint size={16} strokeWidth={3} />}
            {phase === 'detecting' ? 'DETECTING...' : 'DETECT WAF'}
          </button>
        </div>

        {/* Detection Progress */}
        {phase === 'detecting' && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-nunito font-bold text-purple-dark">
                Sending test payloads... ({currentStep}/4)
              </span>
              <span className="text-xs font-mono text-purple-light">{Math.round(detectionProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5 border-[3px] border-black overflow-hidden">
              <motion.div
                className="h-full bg-purple-primary rounded-full"
                animate={{ width: `${detectionProgress}%` }}
              />
            </div>
            <div className="flex gap-1 mt-2">
              {WAF_DETECTION_PAYLOADS.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: i < currentStep ? 1 : 0 }}
                  className="flex-1 bg-purple-pale rounded-lg border-[2px] border-black px-2 py-1"
                >
                  <code className="text-[10px] font-mono text-purple-darker truncate block">{p}</code>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: WAF Detection Gauge */}
        <div className="lg:col-span-4 space-y-3">
          {/* WAF Badge */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
              <Gauge size={18} strokeWidth={3} />
              WAF Detection
            </h3>

            {phase === 'idle' && (
              <div className="text-center py-6">
                <Shield size={48} strokeWidth={2} className="text-purple-light mx-auto mb-2" />
                <p className="font-fredoka text-sm text-purple-light">Enter a URL to detect WAF</p>
              </div>
            )}

            {phase === 'detecting' && (
              <div className="text-center py-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  <Scan size={48} strokeWidth={2} className="text-purple-primary mx-auto mb-2" />
                </motion.div>
                <p className="font-fredoka text-sm text-purple-primary animate-pulse">Analyzing responses...</p>
              </div>
            )}

            <AnimatePresence>
              {(phase === 'detected' || phase === 'bypassing') && detectedWaf && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  {/* WAF Badge */}
                  <div className="text-center mb-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                      className="inline-flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-4 border-black"
                      style={{ backgroundColor: detectedWaf.color }}
                    >
                      {detectedWaf.id === 'none' ? <Unlock size={32} strokeWidth={3} className="text-white" /> : <ShieldAlert size={32} strokeWidth={3} className="text-white" />}
                      <span className="font-fredoka text-xl text-white">
                        {detectedWaf.id === 'none' ? 'NO WAF DETECTED' : `${detectedWaf.name} DETECTED`}
                      </span>
                    </motion.div>
                  </div>

                  {/* Strength Gauge */}
                  {detectedWaf.id !== 'none' && (
                    <>
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-fredoka text-sm text-purple-dark">WAF Strength</span>
                          <span className="font-fredoka text-sm" style={{ color: detectedWaf.color }}>{gaugeValue}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6 border-[3px] border-black overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: detectedWaf.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${gaugeValue}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                      <p className="text-xs font-nunito text-purple-darker text-center mb-3">
                        {detectedWaf.description}
                      </p>

                      {/* Identified Rules */}
                      <button
                        onClick={() => { setShowRules(!showRules); if (!showRules) addScore(20); }}
                        className="w-full px-3 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] bg-purple-pale"
                      >
                        <Eye size={14} strokeWidth={3} />
                        {showRules ? 'Hide' : 'Show'} Identified Rules (+20)
                      </button>

                      <AnimatePresence>
                        {showRules && (
                          <motion.div
                            initial={{ height: 0, opacity: 1 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0, opacity: 1 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 space-y-1">
                              {detectedWaf.rules.map((rule, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ x: -10 }}
                                  animate={{ x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="flex items-center gap-2 px-2 py-1 bg-purple-pale rounded-lg border-[2px] border-black"
                                >
                                  <AlertTriangle size={12} strokeWidth={3} className="text-yellow-accent" />
                                  <span className="text-xs font-nunito text-purple-darker">{rule}</span>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {detectedWaf.id === 'none' && (
                    <div className="bg-green-success/20 rounded-xl border-[3px] border-green-success p-3 mt-2">
                      <p className="text-xs font-nunito text-purple-darker flex items-center gap-2">
                        <Check size={14} strokeWidth={3} className="text-green-success" />
                        <strong>No WAF protection found!</strong> This site is vulnerable to direct attacks.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Summary Stats */}
          {totalAttempts > 0 && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl border-4 border-black p-3 card-shadow"
            >
              <h3 className="font-fredoka text-sm text-purple-darker mb-2">Bypass Stats</h3>
              <div className="space-y-1 text-xs font-nunito">
                <div className="flex items-center justify-between">
                  <span>Total Attempts:</span>
                  <span className="font-bold text-purple-primary">{totalAttempts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Successful:</span>
                  <span className="font-bold text-green-success">{successfulBypasses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Blocked:</span>
                  <span className="font-bold text-red-alert">{totalAttempts - successfulBypasses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Success Rate:</span>
                  <span className="font-bold text-purple-primary">{totalAttempts > 0 ? Math.round((successfulBypasses / totalAttempts) * 100) : 0}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Center: Bypass Techniques */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
              <Layers size={18} strokeWidth={3} />
              Bypass Techniques
            </h3>

            {!detectedWaf || detectedWaf.id === 'none' ? (
              <div className="text-center py-8">
                <Target size={40} strokeWidth={2} className="text-purple-light mx-auto mb-2" />
                <p className="font-fredoka text-sm text-purple-light">Detect a WAF first to test bypasses</p>
              </div>
            ) : (
              <div className="space-y-2">
                {BYPASS_TECHNIQUES.map(tech => {
                  const attempts = bypassAttempts.filter(a => a.technique === tech.name);
                  const lastAttempt = attempts[0];

                  return (
                    <motion.div
                      key={tech.id}
                      layout
                      className="rounded-xl border-[3px] border-black overflow-hidden"
                      style={{ backgroundColor: '#F5F3FF' }}
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg border-[3px] border-black flex items-center justify-center"
                              style={{ backgroundColor: tech.color }}
                            >
                              {tech.icon}
                            </div>
                            <div>
                              <h4 className="font-fredoka text-sm text-purple-darker">{tech.name}</h4>
                              <p className="text-[10px] font-nunito text-purple-light">{tech.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => runBypass(tech)}
                            disabled={phase === 'bypassing'}
                            className="px-3 py-1.5 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center gap-1 transition-transform hover:scale-[1.02] disabled:opacity-50"
                            style={{ backgroundColor: tech.color }}
                          >
                            <Play size={12} strokeWidth={3} />
                            TEST
                          </button>
                        </div>

                        {/* Payloads */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="bg-red-alert/10 rounded-lg border-[2px] border-red-alert p-1.5">
                            <span className="text-[9px] font-nunito font-bold text-red-alert block mb-0.5">Normal (Blocked)</span>
                            <code className="text-[10px] font-mono text-purple-darker break-all">{tech.normalPayload}</code>
                          </div>
                          <div className="bg-green-success/10 rounded-lg border-[2px] border-green-success p-1.5">
                            <span className="text-[9px] font-nunito font-bold text-green-success block mb-0.5">Bypass Attempt</span>
                            <code className="text-[10px] font-mono text-purple-darker break-all">{tech.bypassPayload}</code>
                          </div>
                        </div>

                        {/* Last Attempt Result */}
                        {lastAttempt && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border-[2px] border-black ${
                              lastAttempt.blocked ? 'bg-red-alert/20' : 'bg-green-success/20'
                            }`}
                          >
                            {lastAttempt.blocked ? (
                              <X size={14} strokeWidth={3} className="text-red-alert" />
                            ) : (
                              <Check size={14} strokeWidth={3} className="text-green-success" />
                            )}
                            <span className="text-[10px] font-nunito text-purple-darker">
                              {lastAttempt.blocked ? 'BLOCKED' : 'BYPASSED!'} — {lastAttempt.wafRule}
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Bypass Attempt Log + Educational */}
        <div className="lg:col-span-3 space-y-3">
          {/* Attempt Log */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-darker mb-2 flex items-center gap-2">
              <Code size={16} strokeWidth={3} />
              Attempt Log
            </h3>
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
              <AnimatePresence>
                {bypassAttempts.map(a => (
                  <motion.div
                    key={a.id}
                    initial={{ x: 20, scale: 0.95 }}
                    animate={{ x: 0, scale: 1 }}
                    className={`flex items-start gap-2 px-2 py-1.5 rounded-lg border-[2px] border-black ${
                      a.blocked ? 'bg-red-alert/10' : 'bg-green-success/10'
                    }`}
                  >
                    {a.blocked ? (
                      <X size={14} strokeWidth={3} className="text-red-alert flex-shrink-0 mt-0.5" />
                    ) : (
                      <Check size={14} strokeWidth={3} className="text-green-success flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="text-[10px] font-nunito font-bold text-purple-darker block">{a.technique}</span>
                      <span className="text-[9px] font-nunito text-purple-light">{a.wafRule}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {bypassAttempts.length === 0 && (
                <div className="text-center py-4">
                  <Code size={28} strokeWidth={2} className="text-purple-light mx-auto mb-1" />
                  <p className="text-[11px] text-purple-light font-nunito">No attempts yet</p>
                </div>
              )}
            </div>
          </div>

          {/* WAF Type Selector (for testing) */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-darker mb-2 flex items-center gap-2">
              <ServerCrash size={16} strokeWidth={3} />
              Simulated WAFs
            </h3>
            <div className="space-y-1">
              {WAF_TYPES.filter(w => w.id !== 'none').map(waf => (
                <button
                  key={waf.id}
                  onClick={() => {
                    if (phase !== 'detecting' && phase !== 'bypassing') {
                      setDetectedWaf(waf);
                      setPhase('detected');
                      setGaugeValue(waf.strength);
                      setBypassAttempts([]);
                      if (!wafDetectedFlag) {
                        setWafDetectedFlag(true);
                        addScore(40);
                      }
                    }
                  }}
                  disabled={phase === 'detecting' || phase === 'bypassing'}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border-[2px] border-black text-left transition-transform hover:scale-[1.01] disabled:opacity-50 ${
                    detectedWaf?.id === waf.id ? 'ring-2 ring-purple-primary' : ''
                  }`}
                  style={{ backgroundColor: waf.color + '20' }}
                >
                  <div className="w-6 h-6 rounded border-[2px] border-black flex items-center justify-center" style={{ backgroundColor: waf.color }}>
                    <Shield size={12} strokeWidth={3} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-nunito font-bold text-purple-darker block truncate">{waf.name}</span>
                    <span className="text-[9px] font-nunito text-purple-light">Strength: {waf.strength}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Educational */}
          <button
            onClick={() => { setShowLearn(!showLearn); if (!showLearn) addScore(10); }}
            className="w-full px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] bg-purple-primary text-white"
          >
            <BookOpen size={16} strokeWidth={3} />
            {showLearn ? 'Hide' : 'What is WAF? (+10)'}
          </button>

          <AnimatePresence>
            {showLearn && (
              <motion.div
                initial={{ height: 0, opacity: 1 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0, opacity: 1 }}
                className="overflow-hidden"
              >
                <div className="bg-purple-pale rounded-2xl border-[3px] border-purple-primary p-3">
                  <p className="text-xs font-nunito text-purple-darker mb-2">
                    <strong>WAF (Web Application Firewall)</strong> is like a security guard for websites! It sits between the internet and the web server, checking every request for malicious content.
                  </p>
                  <p className="text-xs font-nunito text-purple-darker mb-2">
                    <strong>How it protects:</strong> WAFs use rules to block SQL injection, XSS, and other attacks. They can rate-limit requests and block known bad IP addresses.
                  </p>
                  <p className="text-xs font-nunito text-purple-darker mb-2">
                    <strong>Bypass techniques</strong> try to sneak past these rules by disguising malicious payloads using encoding, case changes, or splitting attacks across requests.
                  </p>
                  <div className="bg-yellow-accent/20 rounded-xl border-[3px] border-yellow-accent p-2 mt-1">
                    <p className="text-[11px] font-nunito font-bold text-purple-darker">
                      <Sparkles size={12} strokeWidth={3} className="inline text-yellow-accent mr-1" />
                      Defense: WAFs are not enough alone! Use secure code, input validation, and regular security testing.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
