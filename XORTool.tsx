import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Binary, KeyRound, ArrowRight, RefreshCw, Trophy, Zap,
  ShieldAlert, Info, Lock, Unlock, Eye, EyeOff,
  Type, Hash, FileCode, Sparkles, AlertTriangle, Check
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type OutputFormat = 'ascii' | 'hex' | 'binary';
type XorMode = 'single' | 'repeated' | 'attack';

function xorEncrypt(plaintext: string, key: string): number[] {
  if (!key) return plaintext.split('').map(c => c.charCodeAt(0));
  const result: number[] = [];
  for (let i = 0; i < plaintext.length; i++) {
    result.push(plaintext.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function toHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function toBinary(bytes: number[]): string {
  return bytes.map(b => b.toString(2).padStart(8, '0')).join(' ');
}

function toAscii(bytes: number[]): string {
  return bytes.map(b => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');
}

function calculateBitColor(byte: number, bitIndex: number): string {
  const bit = (byte >> (7 - bitIndex)) & 1;
  return bit === 1 ? '#7C3AED' : '#9CA3AF';
}

const CRIB_WORDS = ['the', 'and', 'for', 'secret', 'password', 'key', 'admin', 'user', 'data', 'file', 'hello', 'world'];

const EDUCATION_TIPS = [
  { title: 'What is XOR?', text: 'XOR (exclusive OR) flips bits when the key bit is 1. It\'s symmetric: encrypting and decrypting use the same operation!' },
  { title: 'Why is XOR weak alone?', text: 'Without a truly random key as long as the message (one-time pad), patterns can be detected and broken.' },
  { title: 'Key Reuse Attack', text: 'If you reuse a key: C1 XOR C2 = P1 XOR P2. This leaks information about both plaintexts!' },
];

export default function XORTool({ onScoreChange }: Props) {
  const [plaintext, setPlaintext] = useState('HELLO');
  const [key, setKey] = useState('KEY');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('hex');
  const [mode, setMode] = useState<XorMode>('repeated');
  const [score, setScore] = useState(0);
  const [operationsCount, setOperationsCount] = useState(0);
  const [showEducation, setShowEducation] = useState(false);
  const [attackResult, setAttackResult] = useState<string | null>(null);
  const [attackInProgress, setAttackInProgress] = useState(false);
  const [currentCrib, setCurrentCrib] = useState(0);
  const [brokenKey, setBrokenKey] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Use ref for attack interval to allow cleanup from multiple places
  const attackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attackStepRef = useRef(0);
  const plaintextRef = useRef(plaintext);
  const keyRef = useRef(key);
  const brokenKeyRef = useRef(brokenKey);

  // Keep refs in sync
  useEffect(() => {
    plaintextRef.current = plaintext;
  }, [plaintext]);
  useEffect(() => {
    keyRef.current = key;
  }, [key]);
  useEffect(() => {
    brokenKeyRef.current = brokenKey;
  }, [brokenKey]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (attackIntervalRef.current) {
        clearInterval(attackIntervalRef.current);
      }
    };
  }, []);

  const result = useMemo(() => xorEncrypt(plaintext, key), [plaintext, key]);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = Math.min(100, Math.max(0, prev + points));
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  const handleRunXOR = () => {
    setOperationsCount(prev => prev + 1);
    addScore(10);
  };

  const handleReset = () => {
    // Clear any running attack interval
    if (attackIntervalRef.current) {
      clearInterval(attackIntervalRef.current);
      attackIntervalRef.current = null;
    }
    setPlaintext('HELLO');
    setKey('KEY');
    setAttackResult(null);
    setBrokenKey(false);
    setShowSuccess(false);
    setScore(0);
    setOperationsCount(0);
    setCurrentCrib(0);
    setAttackInProgress(false);
    onScoreChange(0);
  };

  const handleAttack = () => {
    if (plaintext.length < 3 || key.length < 2) return;

    // Clear any existing interval first
    if (attackIntervalRef.current) {
      clearInterval(attackIntervalRef.current);
    }

    setAttackInProgress(true);
    setCurrentCrib(0);
    setAttackResult(null);
    attackStepRef.current = 0;

    attackIntervalRef.current = setInterval(() => {
      const step = attackStepRef.current;
      const currentPlaintext = plaintextRef.current;
      const currentKey = keyRef.current;

      if (step >= CRIB_WORDS.length) {
        if (attackIntervalRef.current) {
          clearInterval(attackIntervalRef.current);
          attackIntervalRef.current = null;
        }
        setAttackInProgress(false);
        setAttackResult('Attack complete. No definite crib match found in this demo.');
        return;
      }

      const crib = CRIB_WORDS[step];
      // Simulate crib drag: XOR ciphertext with crib at various positions
      const decrypted = [];
      for (let i = 0; i < Math.min(currentPlaintext.length, crib.length); i++) {
        decrypted.push(String.fromCharCode(currentPlaintext.charCodeAt(i) ^ crib.charCodeAt(i)));
      }
      const partial = decrypted.join('');

      // Check if partial could be part of the key
      if (partial.toLowerCase().includes(currentKey.toLowerCase().slice(0, 2)) ||
          currentKey.toLowerCase().includes(partial.toLowerCase().slice(0, 2))) {
        if (attackIntervalRef.current) {
          clearInterval(attackIntervalRef.current);
          attackIntervalRef.current = null;
        }
        setAttackInProgress(false);
        setAttackResult(`Key reuse detected! Crib "${crib}" reveals key fragment: "${partial}"`);
        if (!brokenKeyRef.current) {
          setBrokenKey(true);
          addScore(50);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
        return;
      }

      setCurrentCrib(step);
      attackStepRef.current = step + 1;
    }, 400);
  };

  const outputText = useMemo(() => {
    switch (outputFormat) {
      case 'binary': return toBinary(result);
      case 'hex': return toHex(result);
      case 'ascii': return toAscii(result);
    }
  }, [result, outputFormat]);

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-primary rounded-2xl border-4 border-black flex items-center justify-center">
            <Binary size={24} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">XOR Tool</h2>
            <p className="text-sm text-purple-dark font-nunito">Visualize XOR encryption in real-time!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </div>
          <div className="bg-purple-primary px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2 text-white">
            <Zap size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{operationsCount}</span>
          </div>
          <button onClick={handleReset} className="p-2 bg-purple-light rounded-2xl border-4 border-black hover:bg-purple-primary transition-colors">
            <RefreshCw size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { id: 'single' as XorMode, label: 'Single XOR', icon: <Lock size={16} strokeWidth={3} />, desc: 'One char key' },
          { id: 'repeated' as XorMode, label: 'Repeated XOR', icon: <KeyRound size={16} strokeWidth={3} />, desc: 'Multi-char key' },
          { id: 'attack' as XorMode, label: 'Key Reuse Attack', icon: <ShieldAlert size={16} strokeWidth={3} />, desc: 'Crib dragging' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm transition-all hover:scale-105 ${
              mode === m.id ? 'bg-purple-primary text-white scale-105' : 'bg-white text-purple-darker'
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
        <button
          onClick={() => setShowEducation(!showEducation)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm bg-yellow-accent hover:scale-105 transition-transform"
        >
          <Info size={16} strokeWidth={3} />
          Learn
        </button>
      </div>

      {/* Education Panel */}
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
                XOR Education
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {EDUCATION_TIPS.map((tip, i) => (
                  <div key={i} className="bg-purple-pale rounded-xl border-3 border-purple-light p-3">
                    <h4 className="font-fredoka text-sm text-purple-darker mb-1">{tip.title}</h4>
                    <p className="text-xs font-nunito text-purple-dark">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Inputs */}
        <div className="space-y-4">
          {/* Plaintext Input */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Type size={18} strokeWidth={3} className="text-purple-primary" />
              <h3 className="font-fredoka text-lg text-purple-darker">Plaintext</h3>
            </div>
            <input
              type="text"
              value={plaintext}
              onChange={e => setPlaintext(e.target.value.slice(0, 32))}
              className="w-full px-4 py-3 rounded-xl border-4 border-black font-mono text-lg bg-purple-pale focus:outline-none focus:ring-4 focus:ring-purple-primary"
              placeholder="Enter text to encrypt..."
            />
            <div className="flex gap-1 mt-2 flex-wrap">
              {plaintext.split('').map((char, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-9 h-10 bg-purple-lighter rounded-lg border-2 border-black flex flex-col items-center justify-center"
                >
                  <span className="font-fredoka text-xs text-purple-darker">{char}</span>
                  <span className="font-mono text-[8px] text-purple-primary">{char.charCodeAt(0)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Key Input */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={18} strokeWidth={3} className="text-yellow-accent" />
              <h3 className="font-fredoka text-lg text-purple-darker">Key</h3>
            </div>
            <input
              type="text"
              value={key}
              onChange={e => setKey(e.target.value.slice(0, 16))}
              className="w-full px-4 py-3 rounded-xl border-4 border-black font-mono text-lg bg-yellow-accent/20 focus:outline-none focus:ring-4 focus:ring-yellow-accent"
              placeholder="Enter key..."
            />
            <div className="flex gap-1 mt-2 flex-wrap">
              {key.split('').map((char, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-9 h-10 bg-yellow-accent rounded-lg border-2 border-black flex flex-col items-center justify-center"
                >
                  <span className="font-fredoka text-xs text-black">{char}</span>
                  <span className="font-mono text-[8px] text-purple-darker">{char.charCodeAt(0)}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* XOR Symbol */}
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 bg-purple-dark rounded-full border-4 border-black flex items-center justify-center"
            >
              <span className="font-fredoka text-2xl text-yellow-accent">&#8853;</span>
            </motion.div>
          </div>

          {/* Output Controls */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCode size={18} strokeWidth={3} className="text-green-success" />
                <h3 className="font-fredoka text-lg text-purple-darker">Output</h3>
              </div>
              <div className="flex gap-1">
                {([
                  { id: 'hex' as OutputFormat, label: 'HEX', icon: <Hash size={14} strokeWidth={3} /> },
                  { id: 'binary' as OutputFormat, label: 'BIN', icon: <Binary size={14} strokeWidth={3} /> },
                  { id: 'ascii' as OutputFormat, label: 'ASCII', icon: <Type size={14} strokeWidth={3} /> },
                ]).map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => setOutputFormat(fmt.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border-[3px] border-black font-fredoka text-xs transition-all hover:scale-105 ${
                      outputFormat === fmt.id ? 'bg-purple-primary text-white' : 'bg-purple-pale text-purple-darker'
                    }`}
                  >
                    {fmt.icon}
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-purple-darker rounded-xl border-4 border-black p-4 min-h-[60px]">
              <code className="font-mono text-sm text-green-success break-all">{outputText}</code>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunXOR}
              className="w-full mt-3 px-4 py-3 bg-green-success rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <Zap size={16} strokeWidth={3} />
              Run XOR Operation (+10 pts)
            </button>
          </div>
        </div>

        {/* Right: Visualization */}
        <div className="space-y-4">
          {/* Binary Visualization */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
              <Binary size={18} strokeWidth={3} />
              Bit-Level Visualization
            </h3>
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {plaintext.split('').map((char, charIdx) => {
                const byte = result[charIdx] ?? 0;
                const keyChar = key[charIdx % key.length];
                return (
                  <motion.div
                    key={charIdx}
                    initial={{ x: -20 }}
                    animate={{ x: 0 }}
                    transition={{ delay: charIdx * 0.05 }}
                    className="bg-purple-pale rounded-xl border-2 border-black p-2"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-fredoka text-xs text-purple-darker bg-purple-lighter px-2 py-0.5 rounded-lg">
                        {char} ({char.charCodeAt(0)})
                      </span>
                      <span className="text-xs text-purple-primary">&#8853;</span>
                      <span className="font-fredoka text-xs text-purple-darker bg-yellow-accent px-2 py-0.5 rounded-lg">
                        {keyChar} ({keyChar?.charCodeAt(0) ?? 0})
                      </span>
                      <ArrowRight size={12} strokeWidth={3} className="text-purple-primary" />
                      <span className="font-fredoka text-xs text-white bg-purple-primary px-2 py-0.5 rounded-lg">
                        = {byte}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 8 }, (_, bitIdx) => (
                        <motion.div
                          key={bitIdx}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: charIdx * 0.05 + bitIdx * 0.01 }}
                          className="w-7 h-7 rounded border-2 border-black flex items-center justify-center"
                          style={{ backgroundColor: calculateBitColor(byte, bitIdx) }}
                        >
                          <span className="font-mono text-[10px] text-white font-bold">
                            {(byte >> (7 - bitIdx)) & 1}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Attack Mode Panel */}
          {mode === 'attack' && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
            >
              <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
                <ShieldAlert size={18} strokeWidth={3} />
                Known-Plaintext Attack (Crib Dragging)
              </h3>
              <div className="bg-red-alert/10 rounded-xl border-2 border-red-alert p-3 mb-3">
                <p className="text-xs font-nunito text-purple-dark">
                  <AlertTriangle size={14} strokeWidth={3} className="inline mr-1 text-red-alert" />
                  When the same key is reused, XORing two ciphertexts cancels out the key:
                  C1 &#8853; C2 = (P1 &#8853; K) &#8853; (P2 &#8853; K) = P1 &#8853; P2
                </p>
              </div>

              <div className="flex gap-2 flex-wrap mb-3">
                {CRIB_WORDS.map((word, i) => (
                  <motion.div
                    key={word}
                    animate={
                      attackInProgress && i === currentCrib
                        ? { scale: [1, 1.2, 1], backgroundColor: ['#F5F3FF', '#FACC15', '#F5F3FF'] }
                        : {}
                    }
                    transition={{ repeat: attackInProgress && i === currentCrib ? Infinity : 0, duration: 0.4 }}
                    className="px-3 py-1 bg-purple-pale rounded-lg border-2 border-black font-mono text-xs"
                  >
                    {word}
                  </motion.div>
                ))}
              </div>

              <button
                onClick={handleAttack}
                disabled={attackInProgress || plaintext.length < 3}
                className="w-full px-4 py-3 bg-red-alert text-white rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                <ShieldAlert size={16} strokeWidth={3} />
                {attackInProgress ? 'Attacking...' : 'Launch Key Reuse Attack'}
              </button>

              <AnimatePresence>
                {attackResult && (
                  <motion.div
                    initial={{ scale: 0.8, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8 }}
                    className="mt-3 bg-purple-pale rounded-xl border-3 border-purple-primary p-3"
                  >
                    <p className="text-xs font-nunito text-purple-dark">{attackResult}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Character Processing */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
              <Eye size={18} strokeWidth={3} />
              Character-by-Character Processing
            </h3>
            <div className="space-y-2">
              {plaintext.split('').slice(0, 8).map((char, i) => {
                const keyChar = key[i % key.length];
                const resByte = result[i];
                return (
                  <motion.div
                    key={i}
                    initial={{ x: 20 }}
                    animate={{ x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-2 bg-purple-pale rounded-xl p-2 border-2 border-purple-lighter"
                  >
                    <div className="w-10 h-10 bg-purple-lighter rounded-lg border-2 border-black flex items-center justify-center">
                      <span className="font-fredoka text-sm text-purple-darker">{char}</span>
                    </div>
                    <span className="font-mono text-xs text-purple-primary">{char.charCodeAt(0).toString(2).padStart(8, '0')}</span>
                    <span className="font-fredoka text-lg text-purple-dark">&#8853;</span>
                    <div className="w-10 h-10 bg-yellow-accent rounded-lg border-2 border-black flex items-center justify-center">
                      <span className="font-fredoka text-sm text-black">{keyChar}</span>
                    </div>
                    <span className="font-mono text-xs text-yellow-accent">{keyChar?.charCodeAt(0).toString(2).padStart(8, '0')}</span>
                    <ArrowRight size={16} strokeWidth={3} className="text-green-success" />
                    <div className="w-10 h-10 bg-green-success rounded-lg border-2 border-black flex items-center justify-center">
                      <span className="font-fredoka text-sm text-black">{resByte ?? 0}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            className="fixed bottom-6 right-6 bg-green-success rounded-2xl border-4 border-black px-6 py-4 flex items-center gap-3 card-shadow-lg z-50"
          >
            <Check size={24} strokeWidth={3} className="text-black" />
            <div>
              <span className="font-fredoka text-lg text-black">Key Broken! +50 pts</span>
              <p className="text-xs font-nunito text-purple-darker">Key reuse vulnerability exploited!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
