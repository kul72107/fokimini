import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Check, X, Zap, Trophy, ChevronRight, RotateCcw,
  Play, Search, Code, Bug, Eye, EyeOff, Cookie, AlertTriangle,
  Sparkles, MessageSquare, UserCircle, Globe, Lock, Unlock,
  Fingerprint, Layers, XOctagon, FileWarning
} from 'lucide-react';
import type { OpsContextProps } from '@/lib/opsContext';

interface Props extends OpsContextProps {
  onScoreChange: (score: number) => void;
}

type XSSType = 'safe' | 'reflected' | 'stored' | 'dom' | 'polyglot';
type TargetType = 'comment' | 'search' | 'profile';

interface XSSPayload {
  id: string;
  category: XSSType;
  label: string;
  payload: string;
  sanitized: string;
  description: string;
  exploitability: 'High' | 'Medium' | 'Low';
  exploitColor: string;
}

interface Target {
  id: TargetType;
  label: string;
  icon: React.ReactNode;
  previewHtml: string;
  inputPlaceholder: string;
}

const TARGETS: Target[] = [
  {
    id: 'comment',
    label: 'Comment Section',
    icon: <MessageSquare size={20} strokeWidth={3} />,
    previewHtml: '<div class="comments"><h3>Comments</h3><div class="comment"><b>CatLover99:</b> Great post!</div><div class="comment"><b>HackerPaw:</b> [PAYLOAD]</div></div>',
    inputPlaceholder: 'Write a comment...',
  },
  {
    id: 'search',
    label: 'Search Bar',
    icon: <Search size={20} strokeWidth={3} />,
    previewHtml: '<div class="search-results"><h3>Results for: [PAYLOAD]</h3><p>Found 0 results</p></div>',
    inputPlaceholder: 'Search the site...',
  },
  {
    id: 'profile',
    label: 'Profile Page',
    icon: <UserCircle size={20} strokeWidth={3} />,
    previewHtml: '<div class="profile"><h2>User Profile</h2><p>Name: [PAYLOAD]</p><p>Bio: Web developer</p></div>',
    inputPlaceholder: 'Your display name...',
  },
];

function buildOpsTargets({ target }: NonNullable<OpsContextProps['opsContext']>): Target[] {
  return [
    {
      id: 'comment',
      label: `${target.platformName} Comments`,
      icon: <MessageSquare size={20} strokeWidth={3} />,
      previewHtml: `<div class="comments"><h3>${target.platformName} Comments</h3><div class="comment"><b>${target.standardUser}:</b> Review queued for ${target.widgetName}</div><div class="comment"><b>${target.serviceAccount}:</b> [PAYLOAD]</div></div>`,
      inputPlaceholder: `Comment as ${target.standardUser}`,
    },
    {
      id: 'search',
      label: `${target.apiName} Search`,
      icon: <Search size={20} strokeWidth={3} />,
      previewHtml: `<div class="search-results"><h3>${target.apiName} results for: [PAYLOAD]</h3><p>${target.databaseName}: 0 matching rows</p></div>`,
      inputPlaceholder: `Search ${target.databaseName}`,
    },
    {
      id: 'profile',
      label: `${target.platformName} Profile`,
      icon: <UserCircle size={20} strokeWidth={3} />,
      previewHtml: `<div class="profile"><h2>${target.platformName} Profile</h2><p>Name: [PAYLOAD]</p><p>Bio: ${target.adminUser}</p></div>`,
      inputPlaceholder: `Display name for ${target.standardUser}`,
    },
  ];
}

const PAYLOADS: XSSPayload[] = [
  {
    id: 'ref1', category: 'reflected', label: 'Script Alert',
    payload: "<script>alert('XSS')</script>",
    sanitized: "&lt;script&gt;alert('XSS')&lt;/script&gt;",
    description: 'Classic script tag injection',
    exploitability: 'High', exploitColor: '#F87171',
  },
  {
    id: 'ref2', category: 'reflected', label: 'Image onerror',
    payload: "<img src=x onerror=alert(1)>",
    sanitized: "&lt;img src=x onerror=alert(1)&gt;",
    description: 'Image tag with error handler',
    exploitability: 'High', exploitColor: '#F87171',
  },
  {
    id: 'sto1', category: 'stored', label: 'SVG onload',
    payload: "<svg onload=alert(1)>",
    sanitized: "&lt;svg onload=alert(1)&gt;",
    description: 'SVG with load event handler',
    exploitability: 'High', exploitColor: '#F87171',
  },
  {
    id: 'sto2', category: 'stored', label: 'Body onload',
    payload: "<body onload=alert(1)>",
    sanitized: "&lt;body onload=alert(1)&gt;",
    description: 'Body tag with load handler',
    exploitability: 'Medium', exploitColor: '#FB923C',
  },
  {
    id: 'dom1', category: 'dom', label: 'javascript: Protocol',
    payload: "javascript:alert(1)",
    sanitized: "# (blocked)",
    description: 'JavaScript protocol in URL',
    exploitability: 'Medium', exploitColor: '#FB923C',
  },
  {
    id: 'dom2', category: 'dom', label: 'onclick Handler',
    payload: "#' onclick='alert(1)",
    sanitized: "# (onclick removed)",
    description: 'Inline onclick event injection',
    exploitability: 'Medium', exploitColor: '#FB923C',
  },
  {
    id: 'poly1', category: 'polyglot', label: 'Polyglot IMG',
    payload: '">\'><img src=x onerror=alert(1)>',
    sanitized: '&quot;&gt;&#x27;&gt;&lt;img src=x onerror=alert(1)&gt;',
    description: 'Works in multiple contexts',
    exploitability: 'High', exploitColor: '#F87171',
  },
];

const CATEGORY_LABELS: Record<XSSType, string> = {
  reflected: 'Reflected',
  stored: 'Stored',
  dom: 'DOM',
  polyglot: 'Polyglot',
  safe: 'Safe',
};

const CATEGORY_COLORS: Record<XSSType, string> = {
  reflected: '#F87171',
  stored: '#FB923C',
  dom: '#FACC15',
  polyglot: '#F472B6',
  safe: '#4ADE80',
};

export default function XSSTester({ onScoreChange, opsContext }: Props) {
  const targets = useMemo(() => opsContext ? buildOpsTargets(opsContext) : TARGETS, [opsContext]);
  const defaultTargetUrl = opsContext ? `https://${opsContext.target.primaryDomain}${opsContext.target.cmsPath}` : '';
  const [targetUrl, setTargetUrl] = useState(defaultTargetUrl);
  const [selectedTarget, setSelectedTarget] = useState<TargetType>('comment');
  const [inputValue, setInputValue] = useState('');
  const [selectedPayload, setSelectedPayload] = useState<XSSPayload | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [xssDetected, setXssDetected] = useState<boolean | null>(null);
  const [xrayMode, setXrayMode] = useState(false);
  const [score, setScore] = useState(0);
  const [xssFound, setXssFound] = useState(0);
  const [showAlertBox, setShowAlertBox] = useState(false);
  const [cookiesStolen, setCookiesStolen] = useState(false);
  const [showSanitized, setShowSanitized] = useState(false);
  const [foundXssList, setFoundXssList] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<XSSType | null>('reflected');
  const [attemptCounter, setAttemptCounter] = useState(0);

  const currentTarget = targets.find(t => t.id === selectedTarget) || targets[0];

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = prev + points;
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  const runTest = useCallback((payload: XSSPayload) => {
    setIsTesting(true);
    setSelectedPayload(payload);
    setXssDetected(null);
    setShowAlertBox(false);
    setCookiesStolen(false);
    setShowSanitized(false);
    setAttemptCounter(prev => prev + 1);

    setTimeout(() => {
      const isMalicious = payload.category !== 'safe';
      setXssDetected(isMalicious);
      if (isMalicious) {
        setXssFound(prev => prev + 1);
        setFoundXssList(prev => [...prev, payload.id]);
        addScore(40);
        setTimeout(() => setShowAlertBox(true), 300);
        setTimeout(() => setCookiesStolen(true), 800);
      }
      setIsTesting(false);
    }, 1200);
  }, [addScore]);

  const reset = useCallback(() => {
    setInputValue('');
    setSelectedPayload(null);
    setXssDetected(null);
    setShowAlertBox(false);
    setCookiesStolen(false);
    setShowSanitized(false);
    setXrayMode(false);
  }, []);

  const categories: XSSType[] = ['reflected', 'stored', 'dom', 'polyglot'];

  const renderPreview = () => {
    let html = currentTarget.previewHtml;
    const payload = selectedPayload?.payload || inputValue;
    const display = payload || '...';

    if (xrayMode && selectedPayload && selectedPayload.category !== 'safe') {
      const highlighted = `<span style="background:#F87171;color:#fff;padding:2px 4px;border:2px solid #000;border-radius:4px">${escapeHtml(display)}</span>`;
      html = html.replace('[PAYLOAD]', highlighted);
    } else {
      html = html.replace('[PAYLOAD]', escapeHtml(display));
    }

    return { __html: html };
  };

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-alert rounded-2xl border-4 border-black flex items-center justify-center">
            <Bug size={24} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">XSS Tester</h2>
            <p className="text-sm text-purple-dark font-nunito">Test the active target surface for app-layer script handling.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </div>
          <div className="bg-red-alert px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2 text-white">
            <ShieldAlert size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{xssFound}</span>
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
            placeholder={opsContext ? `https://${opsContext.target.primaryDomain}${opsContext.target.cmsPath}` : 'http://target-site.com'}
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border-4 border-black font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-primary bg-purple-pale"
          />
          {targets.map(t => (
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
              <Code size={18} strokeWidth={3} />
              XSS Payloads
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
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 mt-1">
                          {PAYLOADS.filter(p => p.category === cat).map(payload => (
                            <motion.button
                              key={payload.id}
                              layout
                              onClick={() => runTest(payload)}
                              disabled={isTesting}
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
                                  style={{ backgroundColor: payload.exploitColor }}
                                >
                                  {payload.exploitability}
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

          {/* X-Ray Mode Toggle */}
          <button
            onClick={() => setXrayMode(!xrayMode)}
            className={`w-full px-4 py-3 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] ${
              xrayMode ? 'bg-purple-primary text-white' : 'bg-blue-info text-white'
            }`}
          >
            {xrayMode ? <Eye size={18} strokeWidth={3} /> : <EyeOff size={18} strokeWidth={3} />}
            X-Ray Mode {xrayMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Center Panel: Website Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-fredoka text-lg text-purple-darker flex items-center gap-2">
                <Globe size={18} strokeWidth={3} />
                Website Preview
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-alert border-2 border-black" />
                <div className="w-3 h-3 rounded-full bg-yellow-accent border-2 border-black" />
                <div className="w-3 h-3 rounded-full bg-green-success border-2 border-black" />
              </div>
            </div>

            {/* Browser Address Bar */}
            <div className="bg-purple-pale rounded-t-xl border-[3px] border-black border-b-0 p-2 flex items-center gap-2">
              <Lock size={14} strokeWidth={3} color="#4ADE80" />
              <span className="font-mono text-xs text-purple-darker truncate">
                {targetUrl || (opsContext ? `https://${opsContext.target.primaryDomain}/${selectedTarget}` : 'http://demo-site.com/' + selectedTarget)}
              </span>
            </div>

            {/* Preview Content */}
            <div className="relative bg-white rounded-b-xl border-[3px] border-black p-4 min-h-[200px] overflow-hidden">
              {/* X-Ray overlay */}
              {xrayMode && selectedPayload && selectedPayload.category !== 'safe' && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-purple-darker/5 z-10 pointer-events-none"
                  style={{ backgroundColor: 'rgba(91,33,182,0.08)' }}
                />
              )}

              <div
                className="font-mono text-sm text-purple-darker"
                dangerouslySetInnerHTML={renderPreview()}
              />

              {/* Animated Alert Box */}
              <AnimatePresence>
                {showAlertBox && (
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-alert text-white px-8 py-6 rounded-2xl border-4 border-black z-20 card-shadow-lg"
                  >
                    <div className="text-center">
                      <ShieldAlert size={40} strokeWidth={3} className="mx-auto mb-2" />
                      <p className="font-fredoka text-2xl text-outline-sm">ALERT(1)</p>
                      <p className="text-sm font-nunito mt-1">XSS Executed!</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cookie Jar Animation */}
              <AnimatePresence>
                {cookiesStolen && (
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [0, -10, 10, -5, 0] }}
                    transition={{ duration: 0.5 }}
                    className="absolute bottom-4 right-4 z-20"
                  >
                    <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
                      <Cookie size={20} strokeWidth={3} />
                      <span className="font-fredoka text-sm">{opsContext ? `${opsContext.target.sessionCookieName} exposed` : 'Cookies stolen!'}</span>
                    </div>
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{
                          x: (i - 2) * 40,
                          y: -60 - Math.random() * 40,
                          opacity: 0,
                          rotate: (i - 2) * 45,
                        }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="absolute top-0 left-1/2"
                      >
                        <Cookie size={16} strokeWidth={3} color="#FACC15" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Testing Indicator */}
              {isTesting && (
                <div className="absolute inset-0 bg-purple-pale/80 flex items-center justify-center z-30 rounded-b-xl">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Zap size={40} strokeWidth={3} color="#7C3AED" />
                  </motion.div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={currentTarget.inputPlaceholder}
                  className="flex-1 px-3 py-2 rounded-xl border-[3px] border-black font-mono text-sm bg-purple-pale focus:outline-none focus:ring-4 focus:ring-purple-primary"
                />
                <button
                  onClick={() => {
                    if (inputValue) {
                      const custom: XSSPayload = {
                        id: `custom_${Date.now()}`,
                        category: inputValue.includes('<script') || inputValue.includes('onerror') || inputValue.includes('onload') || inputValue.includes('javascript:') ? 'reflected' : 'safe',
                        label: 'Custom Input',
                        payload: inputValue,
                        sanitized: escapeHtml(inputValue),
                        description: 'User-provided input',
                        exploitability: 'Low',
                        exploitColor: '#FACC15',
                      };
                      runTest(custom);
                    }
                  }}
                  disabled={!inputValue || isTesting}
                  className="px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center gap-2 bg-green-success transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  <Play size={16} strokeWidth={3} />
                  TEST
                </button>
              </div>
            </div>
          </div>

          {/* Found XSS List */}
          {foundXssList.length > 0 && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
            >
              <h3 className="font-fredoka text-lg text-purple-darker mb-2 flex items-center gap-2">
                <Trophy size={18} strokeWidth={3} color="#FACC15" />
                XSS Found ({foundXssList.length})
              </h3>
              <div className="space-y-1">
                {foundXssList.map((vId, i) => {
                  const p = PAYLOADS.find(pl => pl.id === vId);
                  return (
                    <div key={vId} className="flex items-center gap-2 text-sm">
                      <ShieldAlert size={14} strokeWidth={3} color="#F87171" />
                      <span className="font-nunito">{i + 1}. {p?.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border-2 border-black" style={{ backgroundColor: p?.exploitColor }}>
                        {p?.category}
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
            {selectedPayload && xssDetected !== null && (
              <motion.div
                key={selectedPayload.id}
                initial={{ x: 50, scale: 0.9 }}
                animate={{ x: 0, scale: 1 }}
                exit={{ x: 50, scale: 0.9 }}
                className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
              >
                {/* XSS Detected Badge */}
                <div className="text-center mb-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-4 border-black font-fredoka text-xl ${
                      xssDetected ? 'bg-red-alert text-white' : 'bg-green-success text-white'
                    }`}
                  >
                    {xssDetected ? <Bug size={28} strokeWidth={3} /> : <Check size={28} strokeWidth={3} />}
                    {xssDetected ? 'XSS DETECTED!' : 'SAFE'}
                  </motion.div>
                </div>

                {xssDetected && (
                  <>
                    {/* XSS Type */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="font-fredoka text-sm text-purple-darker">XSS Type:</span>
                      <span
                        className="px-4 py-1 rounded-full border-[3px] border-black font-fredoka text-sm text-white"
                        style={{ backgroundColor: CATEGORY_COLORS[selectedPayload.category] }}
                      >
                        {CATEGORY_LABELS[selectedPayload.category]}
                      </span>
                    </div>

                    {/* Exploitability */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="font-fredoka text-sm text-purple-darker">Exploitability:</span>
                      <span
                        className="px-3 py-1 rounded-full border-[3px] border-black font-fredoka text-sm"
                        style={{ backgroundColor: selectedPayload.exploitColor }}
                      >
                        {selectedPayload.exploitability}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="bg-red-alert/10 rounded-xl border-[3px] border-red-alert p-2 mb-3">
                      <p className="text-xs font-nunito text-red-700">
                        <AlertTriangle size={12} strokeWidth={3} className="inline mr-1" />
                        <strong>{selectedPayload.description}</strong>
                      </p>
                    </div>

                    {/* Sanitized Version Toggle */}
                    <button
                      onClick={() => { setShowSanitized(!showSanitized); if (!showSanitized) addScore(20); }}
                      className="w-full px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] bg-green-success"
                    >
                      <Sparkles size={16} strokeWidth={3} />
                      {showSanitized ? 'Hide Sanitized' : 'Show Sanitized (+20 pts)'}
                    </button>

                    <AnimatePresence>
                      {showSanitized && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 bg-green-success/10 rounded-xl border-[3px] border-green-success p-3">
                            <p className="text-xs font-nunito font-bold text-green-700 mb-1">Sanitized Output:</p>
                            <code className="block font-mono text-[10px] bg-white rounded-lg border-2 border-black p-2 break-all">
                              {selectedPayload.sanitized}
                            </code>
                            <p className="text-[10px] font-nunito text-green-600 mt-1">
                              Tip: Always encode HTML entities and use a whitelist approach for user input.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {!xssDetected && (
                  <div className="bg-green-success/10 rounded-xl border-[3px] border-green-success p-3 text-center">
                    <Check size={32} strokeWidth={3} color="#4ADE80" className="mx-auto mb-2" />
                    <p className="text-sm font-nunito text-green-700">
                      No XSS detected. This input appears safe!
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!selectedPayload && (
            <div className="bg-white rounded-2xl border-4 border-black p-8 card-shadow flex flex-col items-center justify-center text-center min-h-[200px]">
              <Bug size={48} strokeWidth={2} color="#A78BFA" />
              <p className="font-fredoka text-lg text-purple-light mt-3">Select a payload to test</p>
              <p className="text-sm text-purple-lighter font-nunito">Choose from the XSS payload library</p>
            </div>
          )}

          {/* Status Panel */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-darker mb-2">Status</h3>
            <div className="space-y-1 text-xs font-nunito">
              <div className="flex items-center justify-between">
                <span>Target:</span>
                <span className="font-bold text-purple-primary">{currentTarget.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tests Run:</span>
                <span className="font-bold text-purple-primary">{attemptCounter}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>XSS Found:</span>
                <span className="font-bold text-red-alert">{xssFound}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>X-Ray Mode:</span>
                <span className={`font-bold ${xrayMode ? 'text-purple-primary' : 'text-gray-400'}`}>
                  {xrayMode ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char];
  });
}
