import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Keyboard, Eye, EyeOff, Trophy, Lock, Unlock, Monitor,
  Type, Clipboard, Target, Shield, ShieldCheck, AlertTriangle,
  RotateCcw, Zap, FileText, Sparkles, ChevronDown, User, Ghost,
  KeyRound, Trash2, Pause, Play
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type CaptureMode = 'all' | 'window' | 'password' | 'clipboard';
type ViewMode = 'split' | 'attacker' | 'victim';

interface CapturedKey {
  id: string;
  key: string;
  timestamp: string;
  source: string;
  isPassword: boolean;
}

interface PasswordEntry {
  id: string;
  username: string;
  password: string;
  website: string;
  captured: boolean;
}

const KEYBOARD_ROWS = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
];

const SPECIAL_KEYS = ['SPACE', 'ENTER', 'BACK', 'SHIFT'];

const DEMO_PASSWORDS: PasswordEntry[] = [
  { id: '1', username: 'admin@bank.com', password: 'SecurePass123!', website: 'Bank Portal', captured: false },
  { id: '2', username: 'user@email.com', password: 'MyK1ttyL0vesM3', website: 'Email Login', captured: false },
  { id: '3', username: 'gamer123', password: 'P@ssw0rd2024', website: 'Game Store', captured: false },
  { id: '4', username: 'coder@dev.io', password: 'GitHubRocks999', website: 'Code Repo', captured: false },
];

const CAPTURE_MODES: { id: CaptureMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'all', label: 'All Keys', icon: <Keyboard size={16} strokeWidth={3} />, desc: 'Capture every keystroke' },
  { id: 'window', label: 'Window-Specific', icon: <Target size={16} strokeWidth={3} />, desc: 'Only target window' },
  { id: 'password', label: 'Password-Only', icon: <Lock size={16} strokeWidth={3} />, desc: 'Detect password fields' },
  { id: 'clipboard', label: 'Clipboard', icon: <Clipboard size={16} strokeWidth={3} />, desc: 'Copy/paste capture' },
];

const EDUCATION_TIPS = [
  { title: 'How Keyloggers Work', text: 'Keyloggers record every key you press and send it to an attacker. They can be hardware (USB devices) or software (malware).' },
  { title: 'Virtual Keyboard', text: 'Use an on-screen/virtual keyboard for sensitive inputs. This bypasses most software keyloggers since you\'re clicking, not typing.' },
  { title: 'Anti-Keylogger Tools', text: 'Tools like KeyScrambler encrypt keystrokes at the driver level, so even if captured, they appear as gibberish to attackers.' },
  { title: '2FA Protection', text: 'Two-factor authentication protects you even if your password is keylogged, since the attacker also needs your second factor.' },
];

export default function KeyloggerSim({ onScoreChange }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('all');
  const [capturedKeys, setCapturedKeys] = useState<CapturedKey[]>([]);
  const [score, setScore] = useState(0);
  const [keysCaptured, setKeysCaptured] = useState(0);
  const [passwordsFound, setPasswordsFound] = useState(0);
  const [activeWindow, setActiveWindow] = useState('Browser - Login Page');
  const [victimInput, setVictimInput] = useState('');
  const [showEducation, setShowEducation] = useState(false);
  const [isKeyloggerActive, setIsKeyloggerActive] = useState(true);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [foundPassword, setFoundPassword] = useState<PasswordEntry | null>(null);
  const [clipboardContent, setClipboardContent] = useState('');
  const [showClipboardCapture, setShowClipboardCapture] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Use refs to avoid stale closures in callbacks
  const victimInputRef = useRef(victimInput);
  const activeWindowRef = useRef(activeWindow);
  const captureModeRef = useRef(captureMode);
  const isKeyloggerActiveRef = useRef(isKeyloggerActive);
  const scoreRef = useRef(score);
  const passwordsFoundRef = useRef(passwordsFound);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep refs in sync with state
  useEffect(() => { victimInputRef.current = victimInput; }, [victimInput]);
  useEffect(() => { activeWindowRef.current = activeWindow; }, [activeWindow]);
  useEffect(() => { captureModeRef.current = captureMode; }, [captureMode]);
  useEffect(() => { isKeyloggerActiveRef.current = isKeyloggerActive; }, [isKeyloggerActive]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { passwordsFoundRef.current = passwordsFound; }, [passwordsFound]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, []);

  const addTimeout = (timeout: ReturnType<typeof setTimeout>) => {
    timeoutRefs.current.push(timeout);
  };

  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  };

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = Math.min(100, Math.max(0, prev + points));
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [capturedKeys]);

  const captureKey = useCallback((key: string, isPasswordField = false) => {
    if (!isKeyloggerActiveRef.current) return;

    const currentCaptureMode = captureModeRef.current;
    const currentActiveWindow = activeWindowRef.current;

    // Check capture mode filtering
    if (currentCaptureMode === 'password' && !isPasswordField) return;
    if (currentCaptureMode === 'window' && currentActiveWindow !== 'Browser - Login Page') return;

    const newCapture: CapturedKey = {
      id: `${Date.now()}-${Math.random()}`,
      key,
      timestamp: new Date().toLocaleTimeString(),
      source: currentActiveWindow,
      isPassword: isPasswordField && currentCaptureMode !== 'all',
    };

    setCapturedKeys(prev => [...prev.slice(-200), newCapture]);
    setKeysCaptured(prev => prev + 1);
    addScore(5);
  }, [addScore]);

  const handleKeyPress = (key: string) => {
    // Animate key
    setActiveKeys(prev => new Set(prev).add(key));
    const animTimeout = setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 150);
    addTimeout(animTimeout);

    const currentVictimInput = victimInputRef.current;

    if (key === 'SPACE') {
      setVictimInput(prev => prev + ' ');
      captureKey('[SPACE]');
    } else if (key === 'ENTER') {
      captureKey('[ENTER]', currentVictimInput.length > 0);
      if (currentVictimInput.length > 0) {
        // Check if input looks like a password
        DEMO_PASSWORDS.forEach(p => {
          if (!p.captured && currentVictimInput.includes(p.password)) {
            p.captured = true;
            setFoundPassword(p);
            setPasswordsFound(prev => {
              const next = prev + 1;
              return next;
            });
            addScore(100);
            const t = setTimeout(() => setFoundPassword(null), 4000);
            addTimeout(t);
          }
        });
      }
      setVictimInput('');
    } else if (key === 'BACK') {
      setVictimInput(prev => prev.slice(0, -1));
      captureKey('[BACKSPACE]');
    } else if (key === 'SHIFT') {
      captureKey('[SHIFT]');
    } else {
      setVictimInput(prev => prev + key);
      captureKey(key, currentVictimInput.length > 6);
    }
  };

  const handleClipboardCopy = () => {
    if (!isKeyloggerActiveRef.current || captureModeRef.current !== 'clipboard') return;
    const content = victimInputRef.current || 'copied text';
    setClipboardContent(content);
    setShowClipboardCapture(true);
    captureKey(`[CLIPBOARD: ${content.slice(0, 20)}]`);
    const t = setTimeout(() => setShowClipboardCapture(false), 2000);
    addTimeout(t);
  };

  const handleWindowChange = (window: string) => {
    setActiveWindow(window);
    captureKey(`[SWITCHED TO: ${window}]`);
  };

  const handleReset = () => {
    clearAllTimeouts();
    setCapturedKeys([]);
    setVictimInput('');
    setKeysCaptured(0);
    setPasswordsFound(0);
    setFoundPassword(null);
    setClipboardContent('');
    setScore(0);
    setActiveWindow('Browser - Login Page');
    setIsKeyloggerActive(true);
    setShowScreenshot(false);
    setShowClipboardCapture(false);
    setActiveKeys(new Set());
    DEMO_PASSWORDS.forEach(p => p.captured = false);
    onScoreChange(0);
  };

  const windows = ['Browser - Login Page', 'Notepad', 'Email Client', 'File Manager', 'Terminal'];

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-alert rounded-2xl border-4 border-black flex items-center justify-center">
            <Keyboard size={24} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">Keylogger Sim</h2>
            <p className="text-sm text-purple-dark font-nunito">See how keyloggers capture keystrokes!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </div>
          <div className="bg-purple-primary px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2 text-white">
            <Keyboard size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{keysCaptured}</span>
          </div>
          <div className="bg-green-success px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Lock size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{passwordsFound}</span>
          </div>
          <button onClick={handleReset} className="p-2 bg-purple-light rounded-2xl border-4 border-black hover:bg-purple-primary transition-colors">
            <RotateCcw size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {/* View Mode */}
        <div className="flex gap-1 bg-white rounded-2xl border-4 border-black p-1">
          {([
            { id: 'split' as ViewMode, label: 'Split View', icon: <Monitor size={14} strokeWidth={3} /> },
            { id: 'attacker' as ViewMode, label: 'Attacker', icon: <Eye size={14} strokeWidth={3} /> },
            { id: 'victim' as ViewMode, label: 'Victim', icon: <User size={14} strokeWidth={3} /> },
          ]).map(v => (
            <button
              key={v.id}
              onClick={() => setViewMode(v.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-fredoka text-xs transition-all hover:scale-105 ${
                viewMode === v.id ? 'bg-purple-primary text-white' : 'text-purple-darker'
              }`}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>

        {/* Keylogger Toggle */}
        <button
          onClick={() => setIsKeyloggerActive(!isKeyloggerActive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm transition-all hover:scale-105 ${
            isKeyloggerActive ? 'bg-red-alert text-white' : 'bg-green-success text-black'
          }`}
        >
          {isKeyloggerActive ? <><Eye size={16} strokeWidth={3} /> Logging ON</> : <><EyeOff size={16} strokeWidth={3} /> Logging OFF</>}
        </button>

        {/* Screenshot Toggle */}
        <button
          onClick={() => setShowScreenshot(!showScreenshot)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm transition-all hover:scale-105 ${
            showScreenshot ? 'bg-blue-info text-white' : 'bg-white text-purple-darker'
          }`}
        >
          <Monitor size={16} strokeWidth={3} />
          Screenshot: {showScreenshot ? 'ON' : 'OFF'}
        </button>

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
              <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
                <Sparkles size={18} strokeWidth={3} />
                Understanding Keyloggers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EDUCATION_TIPS.map((tip, i) => (
                  <div key={i} className="bg-purple-pale rounded-xl border-2 border-purple-lighter p-3">
                    <h4 className="font-fredoka text-sm text-purple-darker mb-1">{tip.title}</h4>
                    <p className="text-xs font-nunito text-purple-dark">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capture Mode Selection */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {CAPTURE_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setCaptureMode(mode.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm transition-all hover:scale-105 ${
              captureMode === mode.id ? 'bg-purple-primary text-white scale-105' : 'bg-white text-purple-darker'
            }`}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      {/* Main Views */}
      <div className={`grid gap-4 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-3xl mx-auto'}`}>
        {/* Attacker View */}
        {(viewMode === 'split' || viewMode === 'attacker') && (
          <motion.div
            initial={viewMode === 'split' ? { x: -20 } : {}}
            animate={{ x: 0 }}
            className="space-y-3"
          >
            {/* Attacker Log */}
            <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-fredoka text-lg text-purple-darker flex items-center gap-2">
                  <Ghost size={18} strokeWidth={3} className="text-red-alert" />
                  Attacker View
                  <span className="text-xs font-nunito text-purple-light">(Keys Captured)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-nunito text-purple-dark">Mode: {CAPTURE_MODES.find(m => m.id === captureMode)?.label}</span>
                  <div className={`w-3 h-3 rounded-full border-2 border-black ${isKeyloggerActive ? 'bg-red-alert animate-pulse' : 'bg-gray-300'}`} />
                </div>
              </div>

              {/* Log Display */}
              <div className="bg-purple-darker rounded-xl border-4 border-black p-3 h-[250px] overflow-y-auto font-mono text-xs">
                {capturedKeys.length === 0 ? (
                  <div className="text-center text-purple-light py-8">
                    <Keyboard size={32} strokeWidth={2} className="mx-auto mb-2 opacity-30" />
                    <p>Waiting for keystrokes...</p>
                    <p className="text-[10px] mt-1 opacity-50">Type on the victim keyboard to see captures here</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {capturedKeys.slice(-100).map((ck) => (
                      <motion.div
                        key={ck.id}
                        initial={{ x: -10, scale: 0.9 }}
                        animate={{ x: 0, scale: 1 }}
                        className={`flex items-center gap-2 px-2 py-1 rounded ${
                          ck.isPassword ? 'bg-red-alert/30 border border-red-alert' : 'bg-purple-primary/20'
                        }`}
                      >
                        <span className="text-purple-light text-[10px] flex-shrink-0">{ck.timestamp}</span>
                        <span className="text-purple-light text-[10px] flex-shrink-0">[{ck.source.slice(0, 12)}]</span>
                        <span className={`${ck.isPassword ? 'text-red-alert font-bold' : 'text-green-success'}`}>
                          {ck.key}
                        </span>
                      </motion.div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>

              {/* Clipboard Capture Indicator */}
              <AnimatePresence>
                {showClipboardCapture && (
                  <motion.div
                    initial={{ scale: 0.8, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 10 }}
                    className="mt-2 bg-blue-info/20 rounded-xl border-2 border-blue-info p-2"
                  >
                    <span className="text-xs font-nunito text-purple-dark">
                      <Clipboard size={12} strokeWidth={3} className="inline mr-1" />
                      Clipboard captured: {clipboardContent.slice(0, 30)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Screenshot Sim */}
              {showScreenshot && (
                <div className="mt-3 bg-purple-pale rounded-xl border-2 border-black p-3">
                  <h4 className="font-fredoka text-xs text-purple-darker mb-2 flex items-center gap-1">
                    <Monitor size={14} strokeWidth={3} />
                    Screenshot Capture
                  </h4>
                  <div className="bg-white rounded-lg border-2 border-black p-3 h-[100px] relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full max-w-[200px]">
                        <div className="h-2 bg-purple-lighter rounded mb-2 w-3/4" />
                        <div className="h-2 bg-purple-lighter rounded mb-2 w-full" />
                        <div className="h-2 bg-purple-lighter rounded mb-2 w-5/6" />
                        <div className="flex gap-2 mt-3">
                          <div className="h-6 bg-purple-primary rounded flex-1" />
                          <div className="h-6 bg-purple-lighter rounded flex-1" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-1 right-1 bg-red-alert text-white text-[8px] font-nunito px-1.5 py-0.5 rounded border border-black">
                      CAPTURED
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Password Findings */}
            <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
              <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
                <Lock size={18} strokeWidth={3} />
                Captured Passwords
              </h3>
              {DEMO_PASSWORDS.filter(p => p.captured).length === 0 ? (
                <div className="text-center py-6 text-purple-light">
                  <Lock size={32} strokeWidth={2} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-nunito">No passwords captured yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {DEMO_PASSWORDS.filter(p => p.captured).map(p => (
                    <motion.div
                      key={p.id}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="bg-red-alert/20 rounded-xl border-2 border-red-alert p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-fredoka text-sm text-purple-darker">{p.website}</span>
                        <Unlock size={16} strokeWidth={3} className="text-red-alert" />
                      </div>
                      <div className="mt-1 text-xs font-nunito text-purple-dark">User: {p.username}</div>
                      <div className="font-mono text-sm text-red-alert font-bold">{p.password}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Victim View */}
        {(viewMode === 'split' || viewMode === 'victim') && (
          <motion.div
            initial={viewMode === 'split' ? { x: 20 } : {}}
            animate={{ x: 0 }}
            className="space-y-3"
          >
            {/* Victim Desktop Simulation */}
            <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-fredoka text-lg text-purple-darker flex items-center gap-2">
                  <User size={18} strokeWidth={3} className="text-blue-info" />
                  Victim View
                  <span className="text-xs font-nunito text-purple-light">(Normal Desktop)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <select
                    value={activeWindow}
                    onChange={e => handleWindowChange(e.target.value)}
                    className="px-3 py-1 rounded-lg border-3 border-black font-fredoka text-xs bg-purple-pale"
                  >
                    {windows.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Simulated Window */}
              <div className="bg-purple-pale rounded-xl border-4 border-black p-4 min-h-[120px]">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-purple-lighter">
                  <div className="w-3 h-3 rounded-full bg-red-alert border border-black" />
                  <div className="w-3 h-3 rounded-full bg-yellow-accent border border-black" />
                  <div className="w-3 h-3 rounded-full bg-green-success border border-black" />
                  <span className="font-fredoka text-xs text-purple-darker ml-2">{activeWindow}</span>
                </div>

                {/* Input Display */}
                <div className="bg-white rounded-lg border-2 border-black p-3 mb-3">
                  <label className="text-xs font-nunito text-purple-dark block mb-1">
                    {captureMode === 'password' ? 'Password Field (hidden):' : 'Text Input:'}
                  </label>
                  <div className="font-mono text-sm text-purple-darker min-h-[24px] break-all">
                    {captureMode === 'password' ? '\u2022'.repeat(victimInput.length) : victimInput}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className="inline-block w-2 h-4 bg-purple-primary ml-0.5 align-middle"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleClipboardCopy}
                    className="px-3 py-1.5 bg-purple-lighter rounded-lg border-2 border-black font-fredoka text-xs hover:scale-105 transition-transform"
                  >
                    <Clipboard size={12} strokeWidth={3} className="inline mr-1" />
                    Copy
                  </button>
                  <button
                    onClick={() => setVictimInput('')}
                    className="px-3 py-1.5 bg-purple-lighter rounded-lg border-2 border-black font-fredoka text-xs hover:scale-105 transition-transform"
                  >
                    <Trash2 size={12} strokeWidth={3} className="inline mr-1" />
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Virtual Keyboard */}
            <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
              <h3 className="font-fredoka text-sm text-purple-darker mb-3 flex items-center gap-2">
                <Keyboard size={16} strokeWidth={3} />
                Virtual Keyboard (click to type)
              </h3>
              <div className="space-y-2">
                {KEYBOARD_ROWS.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex justify-center gap-1">
                    {row.map(key => (
                      <motion.button
                        key={key}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleKeyPress(key)}
                        className={`w-9 h-10 rounded-lg border-[3px] border-black font-fredoka text-sm transition-colors ${
                          activeKeys.has(key)
                            ? 'bg-purple-primary text-white scale-95'
                            : 'bg-purple-pale text-purple-darker hover:bg-purple-lighter'
                        }`}
                      >
                        {key}
                      </motion.button>
                    ))}
                  </div>
                ))}
                {/* Special Keys */}
                <div className="flex justify-center gap-1 mt-1">
                  {SPECIAL_KEYS.map(key => (
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleKeyPress(key)}
                      className={`h-10 rounded-lg border-[3px] border-black font-fredoka text-xs transition-colors ${
                        activeKeys.has(key)
                          ? 'bg-purple-primary text-white scale-95'
                          : 'bg-yellow-accent text-purple-darker hover:bg-yellow-accent/80'
                      } ${key === 'SPACE' ? 'w-40' : 'w-20'}`}
                    >
                      {key}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Anti-Keylogger Protection */}
            <div className="bg-green-success/20 rounded-2xl border-4 border-green-success p-4">
              <h3 className="font-fredoka text-sm text-purple-darker mb-2 flex items-center gap-2">
                <ShieldCheck size={16} strokeWidth={3} />
                How to Protect Yourself
              </h3>
              <ul className="space-y-1 text-xs font-nunito text-purple-dark">
                <li className="flex items-start gap-1">
                  <Check size={12} strokeWidth={3} className="text-green-success flex-shrink-0 mt-0.5" />
                  Use a virtual keyboard for passwords (like the one above!)
                </li>
                <li className="flex items-start gap-1">
                  <Check size={12} strokeWidth={3} className="text-green-success flex-shrink-0 mt-0.5" />
                  Enable two-factor authentication on all accounts
                </li>
                <li className="flex items-start gap-1">
                  <Check size={12} strokeWidth={3} className="text-green-success flex-shrink-0 mt-0.5" />
                  Keep your OS and antivirus updated
                </li>
                <li className="flex items-start gap-1">
                  <Check size={12} strokeWidth={3} className="text-green-success flex-shrink-0 mt-0.5" />
                  Use a password manager with autofill (bypasses keyloggers)
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>

      {/* Password Found Banner */}
      <AnimatePresence>
        {foundPassword && (
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            className="fixed bottom-6 right-6 bg-red-alert rounded-2xl border-4 border-black px-6 py-4 flex items-center gap-3 card-shadow-lg z-50"
          >
            <Unlock size={24} strokeWidth={3} className="text-white" />
            <div>
              <span className="font-fredoka text-lg text-white">Password Captured! +100 pts</span>
              <p className="text-xs font-nunito text-white/80">
                {foundPassword.website}: {foundPassword.username} / {foundPassword.password}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
