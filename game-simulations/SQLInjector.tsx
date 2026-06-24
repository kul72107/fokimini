import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, ShieldAlert, Check, X, Zap, Trophy, ChevronRight,
  RotateCcw, Play, Search, Lock, Unlock, AlertTriangle, Code,
  Bug, Eye, Timer, Layers, Fingerprint, Sparkles, BookOpen
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type TargetType = 'login' | 'search' | 'url';
type PayloadCategory = 'classic' | 'union' | 'time' | 'error' | 'blind';

interface Payload {
  id: string;
  category: PayloadCategory;
  label: string;
  payload: string;
  description: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  riskColor: string;
  vulnerable: boolean;
  extractedData?: { cols: string[]; rows: string[][] };
}

interface Target {
  id: TargetType;
  label: string;
  icon: React.ReactNode;
  baseQuery: string;
  inputLabel: string;
}

const TARGETS: Target[] = [
  {
    id: 'login',
    label: 'Login Form',
    icon: <Lock size={20} strokeWidth={3} />,
    baseQuery: "SELECT * FROM users WHERE username = '[INPUT]' AND password = '[INPUT2]'",
    inputLabel: 'Username',
  },
  {
    id: 'search',
    label: 'Search Box',
    icon: <Search size={20} strokeWidth={3} />,
    baseQuery: "SELECT * FROM products WHERE name LIKE '%[INPUT]%'",
    inputLabel: 'Search term',
  },
  {
    id: 'url',
    label: 'URL Parameter',
    icon: <Code size={20} strokeWidth={3} />,
    baseQuery: "SELECT * FROM pages WHERE id = [INPUT]",
    inputLabel: 'Page ID',
  },
];

const PAYLOADS: Payload[] = [
  {
    id: 'classic1', category: 'classic', label: "Classic OR 1=1",
    payload: "' OR '1'='1",
    description: "Makes WHERE clause always TRUE",
    riskLevel: 'Critical', riskColor: '#F87171', vulnerable: true,
    extractedData: {
      cols: ['id', 'username', 'password', 'role'],
      rows: [
        ['1', 'admin', 'admin123', 'admin'],
        ['2', 'user1', 'pass456', 'user'],
        ['3', 'moderator', 'mod789', 'mod'],
      ],
    },
  },
  {
    id: 'classic2', category: 'classic', label: "OR 1=1 Comment",
    payload: "' OR 1=1--",
    description: "Comments out rest of query",
    riskLevel: 'Critical', riskColor: '#F87171', vulnerable: true,
    extractedData: {
      cols: ['id', 'username', 'password', 'role'],
      rows: [
        ['1', 'admin', 'admin123', 'admin'],
        ['2', 'user1', 'pass456', 'user'],
      ],
    },
  },
  {
    id: 'union1', category: 'union', label: "UNION SELECT",
    payload: "' UNION SELECT * FROM passwords--",
    description: "Combines data from another table",
    riskLevel: 'Critical', riskColor: '#F87171', vulnerable: true,
    extractedData: {
      cols: ['id', 'service', 'password'],
      rows: [
        ['1', 'email', 'emailpass123'],
        ['2', 'bank', 'moneysafe456'],
        ['3', 'social', 'social789'],
      ],
    },
  },
  {
    id: 'time1', category: 'time', label: "WAITFOR DELAY",
    payload: "'; WAITFOR DELAY '0:0:5'--",
    description: "Delays response to confirm injection",
    riskLevel: 'High', riskColor: '#FB923C', vulnerable: true,
  },
  {
    id: 'error1', category: 'error', label: "CONVERT Error",
    payload: "' AND 1=CONVERT(int, (SELECT @@version))--",
    description: "Forces error to leak info",
    riskLevel: 'High', riskColor: '#FB923C', vulnerable: true,
    extractedData: {
      cols: ['error_message'],
      rows: [['Microsoft SQL Server 2019 (RTM) - 15.0.2000.5']],
    },
  },
  {
    id: 'blind1', category: 'blind', label: "SUBSTRING Blind",
    payload: "' AND SUBSTRING((SELECT password FROM users),1,1)='a",
    description: "Extracts data one char at a time",
    riskLevel: 'High', riskColor: '#FB923C', vulnerable: true,
  },
];

const CATEGORY_LABELS: Record<PayloadCategory, string> = {
  classic: 'Classic',
  union: 'Union',
  time: 'Time-based',
  error: 'Error-based',
  blind: 'Blind',
};

const CATEGORY_COLORS: Record<PayloadCategory, string> = {
  classic: '#7C3AED',
  union: '#F472B6',
  time: '#60A5FA',
  error: '#FACC15',
  blind: '#4ADE80',
};

function clampScore(val: number): number {
  return Math.min(100, Math.max(0, val));
}

export default function SQLInjector({ onScoreChange }: Props) {
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<TargetType>('login');
  const [inputValue, setInputValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [selectedPayload, setSelectedPayload] = useState<Payload | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'vulnerable' | 'safe' | null>(null);
  const [showQuery, setShowQuery] = useState(false);
  const [pulsingPayload, setPulsingPayload] = useState(false);
  const [score, setScore] = useState(0);
  const [vulnCount, setVulnCount] = useState(0);
  const [scanningAll, setScanningAll] = useState(false);
  const [scanIndex, setScanIndex] = useState(-1);
  const [foundVulns, setFoundVulns] = useState<string[]>([]);
  const [showFix, setShowFix] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<PayloadCategory | null>('classic');
  const [showResultsPanel, setShowResultsPanel] = useState(false);
  const attemptCounter = useRef(0);
  // Track if fix score has been awarded to prevent toggle exploit
  const fixAwardedRef = useRef(false);
  // Track which vulnerabilities have been scored to prevent duplicate scoring
  const scoredVulnsRef = useRef<Set<string>>(new Set());
  // Refs for timeout cleanup
  const testTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTarget = TARGETS.find(t => t.id === selectedTarget) || TARGETS[0];

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = clampScore(prev + points);
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  const buildQuery = useCallback((payload: string) => {
    const t = currentTarget;
    if (t.id === 'login') {
      return t.baseQuery
        .replace('[INPUT]', payload)
        .replace('[INPUT2]', 'anything');
    }
    return t.baseQuery.replace('[INPUT]', payload);
  }, [currentTarget]);

  const runTest = useCallback((payload: Payload) => {
    // Clear any existing test timeout
    if (testTimeoutRef.current) {
      clearTimeout(testTimeoutRef.current);
      testTimeoutRef.current = null;
    }

    setIsTesting(true);
    setSelectedPayload(payload);
    setShowQuery(true);
    setPulsingPayload(true);
    setTestResult(null);
    setShowFix(false);
    setShowResultsPanel(false);
    attemptCounter.current += 1;

    testTimeoutRef.current = setTimeout(() => {
      testTimeoutRef.current = null;
      setPulsingPayload(false);
      if (payload.vulnerable) {
        setTestResult('vulnerable');
        // Only award score for newly discovered vulnerabilities
        if (!scoredVulnsRef.current.has(payload.id)) {
          scoredVulnsRef.current.add(payload.id);
          setVulnCount(prev => prev + 1);
          setFoundVulns(prev => [...prev, payload.id]);
          addScore(50);
        }
      } else {
        setTestResult('safe');
      }
      setShowResultsPanel(true);
      setIsTesting(false);
    }, 1500);
  }, [addScore]);

  const runAutoScan = useCallback(() => {
    // If already scanning, stop first and reset
    if (scanningAll) {
      setScanningAll(false);
      setScanIndex(-1);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      // Small delay before restarting to allow cleanup
      setTimeout(() => {
        setFoundVulns([]);
        setScanningAll(true);
        setScanIndex(0);
      }, 50);
    } else {
      setFoundVulns([]);
      setScanningAll(true);
      setScanIndex(0);
    }
  }, [scanningAll]);

  useEffect(() => {
    if (!scanningAll || scanIndex < 0) return;
    if (scanIndex >= PAYLOADS.length) {
      setScanningAll(false);
      setScanIndex(-1);
      return;
    }
    const p = PAYLOADS[scanIndex];
    setSelectedPayload(p);
    setShowQuery(true);
    setIsTesting(true);
    setShowResultsPanel(false);

    const timer = setTimeout(() => {
      if (p.vulnerable) {
        setTestResult('vulnerable');
        // Only award score for newly discovered vulnerabilities
        if (!scoredVulnsRef.current.has(p.id)) {
          scoredVulnsRef.current.add(p.id);
          setVulnCount(prev => prev + 1);
          setFoundVulns(prev => [...prev, p.id]);
          addScore(50);
        }
        setShowResultsPanel(true);
      }
      setIsTesting(false);
      setScanIndex(prev => prev + 1);
    }, 1200);

    scanTimeoutRef.current = timer;
    return () => {
      clearTimeout(timer);
      scanTimeoutRef.current = null;
    };
  }, [scanningAll, scanIndex, addScore]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (testTimeoutRef.current) clearTimeout(testTimeoutRef.current);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setInputValue('');
    setPasswordValue('');
    setSelectedPayload(null);
    setTestResult(null);
    setShowQuery(false);
    setPulsingPayload(false);
    setShowResultsPanel(false);
    setShowFix(false);
    setFoundVulns([]);
    setScanningAll(false);
    setScanIndex(-1);
    fixAwardedRef.current = false;
    if (testTimeoutRef.current) {
      clearTimeout(testTimeoutRef.current);
      testTimeoutRef.current = null;
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  }, []);

  const categories = Array.from(new Set(PAYLOADS.map(p => p.category)));

  const safeQuery = currentTarget.baseQuery.replace('[INPUT]', inputValue || '1').replace('[INPUT2]', passwordValue || '***');
  const injectedQuery = selectedPayload ? buildQuery(selectedPayload.payload) : safeQuery;

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-primary rounded-2xl border-4 border-black flex items-center justify-center">
            <Database size={24} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">SQL Injector</h2>
            <p className="text-sm text-purple-dark font-nunito">Test for SQL injection vulnerabilities!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </div>
          <div className="bg-green-success px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Bug size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{vulnCount}</span>
          </div>
          <button onClick={reset} className="p-2 bg-purple-light rounded-2xl border-4 border-black hover:bg-purple-primary transition-colors">
            <RotateCcw size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Target URL Bar */}
      <div className="bg-white rounded-2xl border-4 border-black p-3 mb-4 card-shadow">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-fredoka text-purple-darker">Target:</span>
          <input
            type="text"
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            placeholder="http://target-site.com/login"
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border-4 border-black font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-primary bg-purple-pale"
          />
          {TARGETS.map(t => (
            <button
              key={t.id}
              onClick={() => { setSelectedTarget(t.id); reset(); }}
              className={`px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center gap-2 transition-transform ${
                selectedTarget === t.id ? 'bg-purple-primary text-white scale-105' : 'bg-white text-purple-darker hover:bg-purple-light'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Payload Library */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-2 flex items-center gap-2">
              <BookOpen size={18} strokeWidth={3} />
              Payload Library
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {categories.map(cat => (
                <div key={cat}>
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl border-[3px] border-black font-fredoka text-sm transition-colors"
                    style={{ backgroundColor: CATEGORY_COLORS[cat], color: '#FFFFFF' }}
                  >
                    <span>{CATEGORY_LABELS[cat]}</span>
                    <ChevronRight
                      size={16}
                      strokeWidth={3}
                      className={`transition-transform ${expandedCategory === cat ? 'rotate-90' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedCategory === cat && (
                      <motion.div
                        initial={{ height: 0, opacity: 1 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0, opacity: 1 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 mt-1">
                          {PAYLOADS.filter(p => p.category === cat).map(payload => (
                            <motion.button
                              key={payload.id}
                              layout
                              onClick={() => runTest(payload)}
                              disabled={isTesting || scanningAll}
                              className={`w-full text-left px-3 py-2 rounded-xl border-[3px] border-black text-xs font-mono transition-all ${
                                selectedPayload?.id === payload.id
                                  ? 'bg-purple-primary text-white scale-[1.02]'
                                  : 'bg-purple-pale text-purple-darker hover:bg-purple-lighter'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-nunito font-bold text-xs">{payload.label}</span>
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border-2 border-black"
                                  style={{ backgroundColor: payload.riskColor }}
                                >
                                  {payload.riskLevel}
                                </span>
                              </div>
                              <code className="block truncate text-[10px]">{payload.payload}</code>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <button
            onClick={runAutoScan}
            disabled={isTesting || scanningAll}
            className="w-full px-4 py-3 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50"
            style={{ backgroundColor: scanningAll ? '#A78BFA' : '#FACC15' }}
          >
            <Zap size={18} strokeWidth={3} />
            {scanningAll ? `Scanning ${scanIndex + 1}/${PAYLOADS.length}...` : 'Vulnerability Scanner'}
          </button>

          {scanningAll && (
            <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
              <div className="w-full bg-gray-200 rounded-full h-4 border-2 border-black overflow-hidden">
                <motion.div
                  className="h-full bg-purple-primary rounded-full"
                  animate={{ width: `${((scanIndex) / PAYLOADS.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Center Panel: Live Query Visualization */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
              <Code size={18} strokeWidth={3} />
              Live Query Viewer
            </h3>

            {/* Safe Query */}
            <div className="bg-purple-pale rounded-xl border-[3px] border-black p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert size={14} strokeWidth={3} color="#5B21B6" />
                <span className="text-xs font-nunito font-bold text-purple-dark">Original Query:</span>
              </div>
              <code className="block font-mono text-xs text-purple-darker break-all">
                {safeQuery}
              </code>
            </div>

            {/* Injected Query */}
            <AnimatePresence>
              {showQuery && selectedPayload && (
                <motion.div
                  initial={{ scale: 0.9, height: 0 }}
                  animate={{ scale: 1, height: 'auto' }}
                  exit={{ scale: 0.9, height: 0 }}
                  className="rounded-xl border-[3px] border-black p-3 mb-3 overflow-hidden"
                  style={{ backgroundColor: testResult === 'vulnerable' ? '#FEF2F2' : '#F0FDF4' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Bug size={14} strokeWidth={3} color={testResult === 'vulnerable' ? '#DC2626' : '#16A34A'} />
                    <span className="text-xs font-nunito font-bold" style={{ color: testResult === 'vulnerable' ? '#DC2626' : '#16A34A' }}>
                      {testResult === 'vulnerable' ? 'Injected Query (VULNERABLE!)' : 'Modified Query'}
                    </span>
                  </div>
                  <div className="font-mono text-xs break-all">
                    {(() => {
                      const parts = injectedQuery.split(selectedPayload.payload);
                      if (parts.length === 1) return <span>{injectedQuery}</span>;
                      return (
                        <>
                          {parts.map((part, i) => (
                            <span key={i}>
                              <span className="text-purple-darker">{part}</span>
                              {i < parts.length - 1 && (
                                <motion.span
                                  animate={pulsingPayload ? { scale: [1, 1.1, 1] } : {}}
                                  transition={{ repeat: Infinity, duration: 0.5 }}
                                  className="inline-block px-1 rounded font-bold border border-red-alert"
                                  style={{
                                    backgroundColor: '#F87171',
                                    color: '#FFFFFF',
                                  }}
                                >
                                  {selectedPayload.payload}
                                </motion.span>
                              )}
                            </span>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input area */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-fredoka text-sm text-purple-darker min-w-[80px]">{currentTarget.inputLabel}:</span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={selectedPayload ? selectedPayload.payload : "Enter value or select payload..."}
                  className="flex-1 px-3 py-2 rounded-xl border-[3px] border-black font-mono text-sm bg-purple-pale focus:outline-none focus:ring-4 focus:ring-purple-primary"
                />
              </div>
              {currentTarget.id === 'login' && (
                <div className="flex items-center gap-2">
                  <span className="font-fredoka text-sm text-purple-darker min-w-[80px]">Password:</span>
                  <input
                    type="text"
                    value={passwordValue}
                    onChange={e => setPasswordValue(e.target.value)}
                    placeholder="any password"
                    className="flex-1 px-3 py-2 rounded-xl border-[3px] border-black font-mono text-sm bg-purple-pale focus:outline-none focus:ring-4 focus:ring-purple-primary"
                  />
                </div>
              )}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => {
                    if (inputValue) {
                      const customPayload: Payload = {
                        id: `custom_${Date.now()}`,
                        category: 'classic',
                        label: 'Custom Input',
                        payload: inputValue,
                        description: 'User-provided input',
                        riskLevel: 'Medium',
                        riskColor: '#FACC15',
                        vulnerable: inputValue.includes("'") || inputValue.includes('OR') || inputValue.includes('UNION'),
                      };
                      runTest(customPayload);
                    }
                  }}
                  disabled={!inputValue || isTesting}
                  className="flex-1 px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50 bg-green-success"
                >
                  <Play size={16} strokeWidth={3} />
                  TEST
                </button>
                <button
                  onClick={() => setShowQuery(!showQuery)}
                  className="px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center gap-2 bg-blue-info text-white transition-transform hover:scale-[1.02]"
                >
                  <Eye size={16} strokeWidth={3} />
                  {showQuery ? 'Hide' : 'Show'} Query
                </button>
              </div>
            </div>
          </div>

          {/* Scan Results */}
          {foundVulns.length > 0 && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
            >
              <h3 className="font-fredoka text-lg text-purple-darker mb-2 flex items-center gap-2">
                <Trophy size={18} strokeWidth={3} color="#FACC15" />
                Scan Summary
              </h3>
              <div className="space-y-1">
                {foundVulns.map((vId, i) => {
                  const p = PAYLOADS.find(pl => pl.id === vId);
                  return (
                    <div key={vId} className="flex items-center gap-2 text-sm">
                      <Check size={14} strokeWidth={3} color="#4ADE80" />
                      <span className="font-nunito">{i + 1}. {p?.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border-2 border-black" style={{ backgroundColor: p?.riskColor }}>
                        {p?.riskLevel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-4 space-y-3">
          <AnimatePresence mode="wait">
            {showResultsPanel && selectedPayload && testResult && (
              <motion.div
                key={selectedPayload.id + testResult}
                initial={{ x: 50, scale: 0.9 }}
                animate={{ x: 0, scale: 1 }}
                exit={{ x: 50, scale: 0.9 }}
                className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
              >
                {/* Vulnerability Badge */}
                <div className="text-center mb-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-4 border-black font-fredoka text-xl ${
                      testResult === 'vulnerable' ? 'bg-red-alert text-white' : 'bg-green-success text-white'
                    }`}
                  >
                    {testResult === 'vulnerable' ? <ShieldAlert size={28} strokeWidth={3} /> : <Check size={28} strokeWidth={3} />}
                    {testResult === 'vulnerable' ? 'VULNERABLE!' : 'SAFE'}
                  </motion.div>
                </div>

                {/* Risk Level */}
                {testResult === 'vulnerable' && (
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="font-fredoka text-sm text-purple-darker">Risk Level:</span>
                    <motion.span
                      initial={{ rotate: -10 }}
                      animate={{ rotate: 0 }}
                      className="px-4 py-1 rounded-full border-[3px] border-black font-fredoka text-sm"
                      style={{ backgroundColor: selectedPayload.riskColor }}
                    >
                      {selectedPayload.riskLevel === 'Critical' && '🔴 '}
                      {selectedPayload.riskLevel === 'High' && '🟠 '}
                      {selectedPayload.riskLevel === 'Medium' && '🟡 '}
                      {selectedPayload.riskLevel}
                    </motion.span>
                  </div>
                )}

                {/* Extracted Data */}
                {testResult === 'vulnerable' && selectedPayload.extractedData && (
                  <motion.div
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    className="mb-3"
                  >
                    <h4 className="font-fredoka text-sm text-purple-darker mb-2 flex items-center gap-2">
                      <Database size={16} strokeWidth={3} />
                      Extracted Data:
                    </h4>
                    <div className="rounded-xl border-[3px] border-black overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-purple-primary text-white">
                            {selectedPayload.extractedData.cols.map((col, i) => (
                              <th key={i} className="px-2 py-1.5 font-fredoka border-r-2 border-black last:border-r-0">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPayload.extractedData.rows.map((row, ri) => (
                            <tr key={ri} className={ri % 2 === 0 ? 'bg-purple-pale' : 'bg-white'}>
                              {row.map((cell, ci) => (
                                <td key={ci} className="px-2 py-1.5 font-mono border-r-2 border-purple-lighter last:border-r-0">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* Description */}
                <div className="bg-purple-pale rounded-xl border-[3px] border-black p-2 mb-3">
                  <p className="text-xs font-nunito text-purple-darker">
                    <strong>How it works:</strong> {selectedPayload.description}
                  </p>
                </div>

                {/* How to Fix */}
                <button
                  onClick={() => {
                    setShowFix(!showFix);
                    // Only award points once for viewing the fix
                    if (!showFix && !fixAwardedRef.current) {
                      fixAwardedRef.current = true;
                      addScore(100);
                    }
                  }}
                  className="w-full px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] bg-green-success"
                >
                  <Sparkles size={16} strokeWidth={3} />
                  {showFix ? 'Hide Fix' : 'Show Fix (+100 pts)'}
                </button>

                <AnimatePresence>
                  {showFix && (
                    <motion.div
                      initial={{ height: 0, opacity: 1 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0, opacity: 1 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 bg-green-success/10 rounded-xl border-[3px] border-green-success p-3">
                        <p className="text-xs font-nunito font-bold text-green-700 mb-1">Use Parameterized Query:</p>
                        <code className="block font-mono text-[10px] bg-white rounded-lg border-2 border-black p-2">
                          {currentTarget.id === 'login'
                            ? `db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password])`
                            : currentTarget.id === 'search'
                              ? `db.query("SELECT * FROM products WHERE name LIKE ?", ["%" + search + "%"])`
                              : `db.query("SELECT * FROM pages WHERE id = ?", [pageId])`
                          }
                        </code>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!showResultsPanel && (
            <div className="bg-white rounded-2xl border-4 border-black p-8 card-shadow flex flex-col items-center justify-center text-center min-h-[200px]">
              <Database size={48} strokeWidth={2} color="#A78BFA" />
              <p className="font-fredoka text-lg text-purple-light mt-3">Select a payload to begin testing</p>
              <p className="text-sm text-purple-lighter font-nunito">Click any payload from the library or enter custom input</p>
            </div>
          )}

          {/* Status Panel */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-darker mb-2">Status</h3>
            <div className="space-y-1 text-xs font-nunito">
              <div className="flex items-center justify-between">
                <span>Target Type:</span>
                <span className="font-bold text-purple-primary">{currentTarget.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payloads Tested:</span>
                <span className="font-bold text-purple-primary">{attemptCounter.current}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Vulnerabilities Found:</span>
                <span className="font-bold text-red-alert">{vulnCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payloads Available:</span>
                <span className="font-bold text-purple-primary">{PAYLOADS.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
