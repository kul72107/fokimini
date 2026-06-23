import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash, Lock, Unlock, Zap, Trophy, ChevronRight, RotateCcw,
  Play, Square, Timer, Settings, Eye, EyeOff, Sparkles,
  Gauge, Fingerprint, KeyRound, Database, AlertTriangle,
  Check, X, Layers, Shuffle, BookOpen, Target
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type HashAlgo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512' | 'bcrypt';
type AttackMethod = 'dictionary' | 'brute' | 'rainbow' | 'hybrid';

interface HashChallenge {
  id: number;
  label: string;
  hash: string;
  algo: HashAlgo;
  plaintext: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master';
  diffColor: string;
  hint: string;
}

interface WordlistItem {
  word: string;
  isMatch: boolean;
}

const HASH_ALGO_COLORS: Record<HashAlgo, string> = {
  'MD5': '#F472B6',
  'SHA-1': '#60A5FA',
  'SHA-256': '#4ADE80',
  'SHA-512': '#FACC15',
  'bcrypt': '#A78BFA',
};

const CHALLENGES: HashChallenge[] = [
  {
    id: 1, label: 'Easy Start', hash: '5f4dcc3b5aa765d61d8327deb882cf99', algo: 'MD5',
    plaintext: 'password', difficulty: 'Easy', diffColor: '#4ADE80',
    hint: 'Very common password - top of every wordlist',
  },
  {
    id: 2, label: 'Common Word', hash: 'e99a18c428cb38d5f260853678922e03', algo: 'MD5',
    plaintext: 'abc123', difficulty: 'Easy', diffColor: '#4ADE80',
    hint: 'Letters + numbers sequence',
  },
  {
    id: 3, label: 'Medium Mix', hash: 'a9c43db8c6965245c8ead9c5b13b4c71', algo: 'SHA-1',
    plaintext: 'CyberPaw', difficulty: 'Medium', diffColor: '#FACC15',
    hint: 'Our mascot name with capital letters',
  },
  {
    id: 4, label: 'With Numbers', hash: '2b4e7f5c3d1a8e6b9f0c2d4a7e5b1f3c', algo: 'SHA-256',
    plaintext: 'Paw2024!', difficulty: 'Hard', diffColor: '#FB923C',
    hint: 'Word + year + special char',
  },
  {
    id: 5, label: 'Fort Knox', hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', algo: 'SHA-256',
    plaintext: 'admin', difficulty: 'Expert', diffColor: '#F87171',
    hint: 'Default username everywhere',
  },
];

const WORDLISTS: Record<string, WordlistItem[]> = {
  common: [
    { word: '123456', isMatch: false },
    { word: 'password', isMatch: true },
    { word: 'qwerty', isMatch: false },
    { word: 'admin', isMatch: false },
    { word: 'welcome', isMatch: false },
    { word: 'abc123', isMatch: true },
    { word: 'letmein', isMatch: false },
    { word: 'monkey', isMatch: false },
    { word: 'dragon', isMatch: false },
    { word: 'master', isMatch: false },
    { word: 'sunshine', isMatch: false },
    { word: 'princess', isMatch: false },
  ],
  cyber: [
    { word: 'hacker', isMatch: false },
    { word: 'cyber', isMatch: false },
    { word: 'CyberPaw', isMatch: true },
    { word: 'Pwn3d!', isMatch: false },
    { word: '0xDEADBEEF', isMatch: false },
    { word: 'rootkit', isMatch: false },
    { word: 'phishing', isMatch: false },
    { word: 'malware', isMatch: false },
    { word: 'firewall', isMatch: false },
    { word: 'encrypt', isMatch: false },
  ],
  mixed: [
    { word: 'Paw2024!', isMatch: true },
    { word: 'Hello1!', isMatch: false },
    { word: 'Test123$', isMatch: false },
    { word: 'Qwerty!9', isMatch: false },
    { word: 'P@ssw0rd', isMatch: false },
    { word: 'Admin#1', isMatch: false },
    { word: 'Login!23', isMatch: false },
    { word: 'Secure9*', isMatch: false },
  ],
};

const ATTACK_METHODS: { id: AttackMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'dictionary', label: 'Dictionary', icon: <BookOpen size={16} strokeWidth={3} />, desc: 'Try common passwords' },
  { id: 'brute', label: 'Brute Force', icon: <Zap size={16} strokeWidth={3} />, desc: 'Try every combination' },
  { id: 'rainbow', label: 'Rainbow Table', icon: <Layers size={16} strokeWidth={3} />, desc: 'Precomputed hashes' },
  { id: 'hybrid', label: 'Hybrid', icon: <Shuffle size={16} strokeWidth={3} />, desc: 'Dict + mutations' },
];

export default function HashCracker({ onScoreChange }: Props) {
  const [hashInput, setHashInput] = useState('');
  const [selectedAlgo, setSelectedAlgo] = useState<HashAlgo>('MD5');
  const [selectedMethod, setSelectedMethod] = useState<AttackMethod>('dictionary');
  const [selectedWordlist, setSelectedWordlist] = useState('common');
  const [isCracking, setIsCracking] = useState(false);
  const [crackProgress, setCrackProgress] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [foundPassword, setFoundPassword] = useState('');
  const [crackTime, setCrackTime] = useState('');
  const [score, setScore] = useState(0);
  const [hashesCracked, setHashesCracked] = useState(0);
  const [selectedChallenge, setSelectedChallenge] = useState<HashChallenge | null>(null);
  const [showProcess, setShowProcess] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState('');
  const [speed, setSpeed] = useState(50);
  const [bruteCharset, setBruteCharset] = useState('lower+digits');
  const [bruteMinLen, setBruteMinLen] = useState(1);
  const [bruteMaxLen, setBruteMaxLen] = useState(4);
  const [gearRotation, setGearRotation] = useState(0);
  const [showStrength, setShowStrength] = useState(false);
  const processRef = useRef<NodeJS.Timeout | null>(null);
  const gearRef = useRef<NodeJS.Timeout | null>(null);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = prev + points;
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  const startGearAnimation = useCallback(() => {
    gearRef.current = setInterval(() => {
      setGearRotation(prev => prev + 15);
    }, 50);
  }, []);

  const stopGearAnimation = useCallback(() => {
    if (gearRef.current) clearInterval(gearRef.current);
  }, []);

  const runCrack = useCallback(() => {
    const targetHash = selectedChallenge ? selectedChallenge.hash : hashInput;
    if (!targetHash) return;

    setIsCracking(true);
    setCrackProgress(0);
    setAttempts(0);
    setFoundPassword('');
    setCrackTime('');
    setShowStrength(false);
    startGearAnimation();

    const challenge = selectedChallenge;
    const wordlist = WORDLISTS[selectedWordlist] || WORDLISTS.common;
    const totalSteps = challenge ? wordlist.length : 100;
    const startTime = Date.now();
    let step = 0;

    const process = setInterval(() => {
      step++;
      const progress = Math.min((step / totalSteps) * 100, 100);
      setCrackProgress(progress);
      setAttempts(step * Math.floor(speed / 10 + 1));

      if (showProcess) {
        const wordIdx = (step - 1) % wordlist.length;
        setCurrentAttempt(wordlist[wordIdx]?.word || `attempt_${step}`);
      }

      if (challenge && step >= totalSteps) {
        clearInterval(process);
        stopGearAnimation();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        setCrackTime(elapsed + 's');
        setFoundPassword(challenge.plaintext);
        setHashesCracked(prev => prev + 1);
        setCrackProgress(100);
        const points = challenge.difficulty === 'Easy' ? 100 : challenge.difficulty === 'Medium' ? 150 : challenge.difficulty === 'Hard' ? 200 : challenge.difficulty === 'Expert' ? 250 : 300;
        addScore(points);
        setIsCracking(false);
        setShowStrength(true);
      } else if (!challenge && step >= totalSteps) {
        clearInterval(process);
        stopGearAnimation();
        setCrackTime(((Date.now() - startTime) / 1000).toFixed(2) + 's');
        setIsCracking(false);
      }
    }, 1200 - speed * 10);

    processRef.current = process;
  }, [hashInput, selectedChallenge, selectedWordlist, speed, showProcess, startGearAnimation, stopGearAnimation, addScore]);

  const stopCrack = useCallback(() => {
    if (processRef.current) clearInterval(processRef.current);
    stopGearAnimation();
    setIsCracking(false);
  }, [stopGearAnimation]);

  const loadChallenge = useCallback((ch: HashChallenge) => {
    setSelectedChallenge(ch);
    setHashInput(ch.hash);
    setSelectedAlgo(ch.algo);
    setFoundPassword('');
    setCrackProgress(0);
    setAttempts(0);
    setShowStrength(false);
  }, []);

  const reset = useCallback(() => {
    setHashInput('');
    setSelectedChallenge(null);
    setFoundPassword('');
    setCrackProgress(0);
    setAttempts(0);
    setCrackTime('');
    setShowStrength(false);
    setIsCracking(false);
    if (processRef.current) clearInterval(processRef.current);
    stopGearAnimation();
  }, [stopGearAnimation]);

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Weak', color: '#F87171', emoji: '🔴' };
    if (score <= 2) return { label: 'Fair', color: '#FB923C', emoji: '🟠' };
    if (score <= 3) return { label: 'Good', color: '#FACC15', emoji: '🟡' };
    if (score <= 4) return { label: 'Strong', color: '#4ADE80', emoji: '🟢' };
    return { label: 'Excellent', color: '#4ADE80', emoji: '🔵' };
  };

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-pink-accent rounded-2xl border-4 border-black flex items-center justify-center">
            <Hash size={24} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">Hash Cracker</h2>
            <p className="text-sm text-purple-dark font-nunito">Crack password hashes with different attacks!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </div>
          <div className="bg-pink-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2 text-white">
            <Unlock size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{hashesCracked}</span>
          </div>
          <button onClick={reset} className="p-2 bg-purple-light rounded-2xl border-4 border-black hover:bg-purple-primary transition-colors">
            <RotateCcw size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Hash Input Bar */}
      <div className="bg-white rounded-2xl border-4 border-black p-3 mb-4 card-shadow">
        <div className="flex items-center gap-3 flex-wrap">
          <Hash size={20} strokeWidth={3} color="#7C3AED" />
          <input
            type="text"
            value={hashInput}
            onChange={e => setHashInput(e.target.value)}
            placeholder="Enter hash to crack..."
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border-4 border-black font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-primary bg-purple-pale"
          />
          <span className="font-fredoka text-sm text-purple-darker">Algo:</span>
          {(['MD5', 'SHA-1', 'SHA-256', 'SHA-512', 'bcrypt'] as HashAlgo[]).map(algo => (
            <button
              key={algo}
              onClick={() => setSelectedAlgo(algo)}
              className={`px-3 py-1.5 rounded-xl border-[3px] border-black font-fredoka text-xs transition-transform ${
                selectedAlgo === algo ? 'scale-105 text-white' : 'bg-white text-purple-darker hover:scale-105'
              }`}
              style={selectedAlgo === algo ? { backgroundColor: HASH_ALGO_COLORS[algo] } : {}}
            >
              {algo}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Attack Methods */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-2 flex items-center gap-2">
              <Target size={18} strokeWidth={3} />
              Attack Method
            </h3>
            <div className="space-y-2">
              {ATTACK_METHODS.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl border-[3px] border-black transition-all flex items-center gap-2 ${
                    selectedMethod === method.id
                      ? 'bg-purple-primary text-white scale-[1.02]'
                      : 'bg-purple-pale text-purple-darker hover:bg-purple-lighter'
                  }`}
                >
                  {method.icon}
                  <div>
                    <span className="font-fredoka text-sm">{method.label}</span>
                    <p className="text-[10px] opacity-80">{method.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dictionary Selection */}
          {selectedMethod === 'dictionary' && (
            <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
              <h3 className="font-fredoka text-sm text-purple-darker mb-2">Wordlist</h3>
              <div className="space-y-1">
                {Object.keys(WORDLISTS).map(name => (
                  <button
                    key={name}
                    onClick={() => setSelectedWordlist(name)}
                    className={`w-full text-left px-3 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs transition-all ${
                      selectedWordlist === name ? 'bg-blue-info text-white' : 'bg-purple-pale hover:bg-purple-lighter'
                    }`}
                  >
                    {name.charAt(0).toUpperCase() + name.slice(1)} ({WORDLISTS[name].length} words)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Brute Force Settings */}
          {selectedMethod === 'brute' && (
            <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
              <h3 className="font-fredoka text-sm text-purple-darker mb-2">Brute Force Settings</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-nunito text-purple-dark">Charset:</label>
                  <select
                    value={bruteCharset}
                    onChange={e => setBruteCharset(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border-[3px] border-black font-mono text-xs bg-purple-pale"
                  >
                    <option value="digits">Digits only (0-9)</option>
                    <option value="lower">Lowercase (a-z)</option>
                    <option value="lower+digits">Lowercase + Digits</option>
                    <option value="all">All characters</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-nunito text-purple-dark">Min:</label>
                    <input
                      type="number"
                      value={bruteMinLen}
                      onChange={e => setBruteMinLen(Number(e.target.value))}
                      min={1}
                      max={8}
                      className="w-full px-2 py-1 rounded-lg border-[3px] border-black font-mono text-xs bg-purple-pale"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-nunito text-purple-dark">Max:</label>
                    <input
                      type="number"
                      value={bruteMaxLen}
                      onChange={e => setBruteMaxLen(Number(e.target.value))}
                      min={1}
                      max={8}
                      className="w-full px-2 py-1 rounded-lg border-[3px] border-black font-mono text-xs bg-purple-pale"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Speed Slider */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-darker mb-2 flex items-center gap-2">
              <Gauge size={16} strokeWidth={3} />
              Speed: {speed}%
            </h3>
            <input
              type="range"
              min={1}
              max={100}
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-full accent-purple-primary"
            />
          </div>

          {/* Show Process Toggle */}
          <button
            onClick={() => setShowProcess(!showProcess)}
            className={`w-full px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-all ${
              showProcess ? 'bg-purple-primary text-white' : 'bg-purple-pale text-purple-darker'
            }`}
          >
            {showProcess ? <Eye size={16} strokeWidth={3} /> : <EyeOff size={16} strokeWidth={3} />}
            Show Process: {showProcess ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Center Panel: Cracking Machine */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-4 flex items-center gap-2">
              <Fingerprint size={18} strokeWidth={3} />
              Cracking Machine
            </h3>

            {/* Machine Visual */}
            <div className="relative bg-purple-darker rounded-2xl border-4 border-black p-6 min-h-[200px] flex items-center justify-center overflow-hidden">
              {/* Animated gears background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <motion.div
                  animate={{ rotate: gearRotation }}
                  transition={{ duration: 0 }}
                >
                  <Settings size={120} strokeWidth={1} color="#A78BFA" />
                </motion.div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-4 w-full">
                {/* Input Slot */}
                <div className="w-full max-w-[300px] bg-purple-primary rounded-xl border-4 border-black p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Lock size={16} strokeWidth={3} color="#FFFFFF" />
                    <span className="font-mono text-xs text-white truncate">{hashInput || 'No hash loaded'}</span>
                  </div>
                </div>

                {/* Gears Animation */}
                <div className="flex items-center gap-4 py-2">
                  <motion.div
                    animate={isCracking ? { rotate: 360 } : {}}
                    transition={isCracking ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
                  >
                    <Settings size={40} strokeWidth={3} color="#FACC15" />
                  </motion.div>
                  <motion.div
                    animate={isCracking ? { rotate: -360 } : {}}
                    transition={isCracking ? { repeat: Infinity, duration: 0.7, ease: 'linear' } : {}}
                  >
                    <Settings size={32} strokeWidth={3} color="#F472B6" />
                  </motion.div>
                  <motion.div
                    animate={isCracking ? { rotate: 360 } : {}}
                    transition={isCracking ? { repeat: Infinity, duration: 1.2, ease: 'linear' } : {}}
                  >
                    <Settings size={36} strokeWidth={3} color="#60A5FA" />
                  </motion.div>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-[300px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-fredoka text-white">Progress</span>
                    <span className="text-xs font-mono text-yellow-accent">{Math.round(crackProgress)}%</span>
                  </div>
                  <div className="w-full bg-purple-dark rounded-full h-6 border-4 border-black overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${crackProgress}%`,
                        backgroundColor: crackProgress >= 100 ? '#4ADE80' : '#FACC15',
                      }}
                    />
                  </div>
                </div>

                {/* Output Slot */}
                <motion.div
                  animate={foundPassword ? { scale: [1, 1.1, 1] } : {}}
                  className={`w-full max-w-[300px] rounded-xl border-4 border-black p-3 text-center ${
                    foundPassword ? 'bg-green-success' : 'bg-purple-light'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Unlock size={16} strokeWidth={3} color={foundPassword ? '#FFFFFF' : '#5B21B6'} />
                    <span className={`font-mono text-sm font-bold ${foundPassword ? 'text-white' : 'text-purple-darker'}`}>
                      {foundPassword || 'Waiting...'}
                    </span>
                  </div>
                </motion.div>

                {/* Attempts Counter */}
                <div className="flex items-center gap-4">
                  <div className="bg-purple-primary px-4 py-2 rounded-xl border-[3px] border-black">
                    <span className="text-xs font-fredoka text-white">Attempts: </span>
                    <motion.span
                      key={attempts}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      className="font-mono text-sm text-yellow-accent font-bold"
                    >
                      {attempts.toLocaleString()}
                    </motion.span>
                  </div>
                  {crackTime && (
                    <div className="bg-purple-primary px-4 py-2 rounded-xl border-[3px] border-black">
                      <span className="text-xs font-fredoka text-white">Time: </span>
                      <span className="font-mono text-sm text-green-success font-bold">{crackTime}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Attempt Display */}
            {showProcess && isCracking && (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="mt-3 bg-purple-pale rounded-xl border-[3px] border-black p-2 text-center"
              >
                <span className="text-xs font-nunito text-purple-dark">Trying: </span>
                <code className="font-mono text-sm text-purple-primary">{currentAttempt}</code>
              </motion.div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={isCracking ? stopCrack : runCrack}
                disabled={!hashInput && !selectedChallenge}
                className={`flex-1 px-4 py-3 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50 ${
                  isCracking ? 'bg-red-alert text-white' : 'bg-green-success'
                }`}
              >
                {isCracking ? <Square size={16} strokeWidth={3} /> : <Play size={16} strokeWidth={3} />}
                {isCracking ? 'STOP' : 'START CRACKING'}
              </button>
            </div>
          </div>

          {/* Password Strength Analysis */}
          <AnimatePresence>
            {showStrength && foundPassword && (
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
              >
                <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
                  <KeyRound size={18} strokeWidth={3} />
                  Password Strength Analysis
                </h3>
                {(() => {
                  const strength = getPasswordStrength(foundPassword);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-nunito text-sm">Password:</span>
                        <code className="font-mono text-sm bg-purple-pale px-3 py-1 rounded-lg border-2 border-black">{foundPassword}</code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-nunito text-sm">Length:</span>
                        <span className="font-fredoka text-sm text-purple-primary">{foundPassword.length} chars</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-nunito text-sm">Strength:</span>
                        <span
                          className="px-4 py-1 rounded-full border-[3px] border-black font-fredoka text-sm"
                          style={{ backgroundColor: strength.color }}
                        >
                          {strength.emoji} {strength.label}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-5 gap-1">
                        {[0, 1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className="h-3 rounded-full border-2 border-black"
                            style={{
                              backgroundColor: i < (strength.label === 'Weak' ? 1 : strength.label === 'Fair' ? 2 : strength.label === 'Good' ? 3 : strength.label === 'Strong' ? 4 : 5)
                                ? strength.color : '#E5E7EB',
                            }}
                          />
                        ))}
                      </div>
                      {strength.label === 'Weak' || strength.label === 'Fair' ? (
                        <p className="text-xs font-nunito text-red-alert mt-1">
                          <AlertTriangle size={12} strokeWidth={3} className="inline mr-1" />
                          This password is easily crackable! Use longer passwords with mixed characters.
                        </p>
                      ) : null}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel: Challenges */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-2 flex items-center gap-2">
              <Database size={18} strokeWidth={3} />
              Challenges
            </h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {CHALLENGES.map(ch => (
                <motion.button
                  key={ch.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => loadChallenge(ch)}
                  className={`w-full text-left p-3 rounded-xl border-[3px] border-black transition-all ${
                    selectedChallenge?.id === ch.id
                      ? 'bg-purple-primary text-white scale-[1.01]'
                      : 'bg-purple-pale text-purple-darker hover:bg-purple-lighter'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-fredoka text-sm">#{ch.id} {ch.label}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold border-2 border-black"
                      style={{ backgroundColor: ch.diffColor }}
                    >
                      {ch.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span
                      className="px-1.5 py-0.5 rounded border border-black font-mono"
                      style={{
                        backgroundColor: selectedChallenge?.id === ch.id ? 'rgba(255,255,255,0.3)' : HASH_ALGO_COLORS[ch.algo],
                        color: selectedChallenge?.id === ch.id ? '#FFFFFF' : '#000000',
                      }}
                    >
                      {ch.algo}
                    </span>
                    <span className="font-mono truncate opacity-70">{ch.hash.slice(0, 20)}...</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Challenge Hint */}
          <AnimatePresence>
            {selectedChallenge && !foundPassword && (
              <motion.div
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                className="bg-yellow-accent/20 rounded-2xl border-4 border-yellow-accent p-3"
              >
                <h4 className="font-fredoka text-sm text-purple-darker mb-1 flex items-center gap-2">
                  <Sparkles size={16} strokeWidth={3} />
                  Hint
                </h4>
                <p className="text-xs font-nunito text-purple-dark">{selectedChallenge.hint}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Panel */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-darker mb-2">Status</h3>
            <div className="space-y-1 text-xs font-nunito">
              <div className="flex items-center justify-between">
                <span>Algorithm:</span>
                <span className="font-bold" style={{ color: HASH_ALGO_COLORS[selectedAlgo] }}>{selectedAlgo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Method:</span>
                <span className="font-bold text-purple-primary">{ATTACK_METHODS.find(m => m.id === selectedMethod)?.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Hashes Cracked:</span>
                <span className="font-bold text-green-success">{hashesCracked}/{CHALLENGES.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Attempts:</span>
                <span className="font-mono font-bold text-purple-primary">{attempts.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
