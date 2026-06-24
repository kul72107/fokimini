import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Check, X, Zap, Trophy, ChevronRight, ChevronDown,
  RotateCcw, Play, ArrowRight, ArrowLeft, Lock, Unlock,
  AlertTriangle, Code, BookOpen, Sparkles, Type, FileText,
  Binary, Hash, Globe, Shield, Layers, Clock, Copy, CheckCheck,
  Info, Star, Trash2
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type PanelMode = 'encode' | 'decode';
type ConversionType = 'text' | 'binary' | 'hex';

interface Conversion {
  id: string;
  input: string;
  output: string;
  mode: PanelMode;
  type: ConversionType;
  urlSafe: boolean;
  timestamp: number;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

const SAMPLE_TEXTS = [
  { label: 'Hello World', text: 'Hello, World!' },
  { label: 'Secret123', text: 'Secret123!' },
  { label: 'CyberPaw', text: 'CyberPaw Arena' },
  { label: 'Password', text: 'MyP@ssw0rd!' },
];

const ASCII_TABLE = [
  { char: 'A', dec: 65, hex: '41', bin: '01000001' },
  { char: 'B', dec: 66, hex: '42', bin: '01000010' },
  { char: 'C', dec: 67, hex: '43', bin: '01000011' },
  { char: 'a', dec: 97, hex: '61', bin: '01100001' },
  { char: 'b', dec: 98, hex: '62', bin: '01100010' },
  { char: 'c', dec: 99, hex: '63', bin: '01100011' },
  { char: '0', dec: 48, hex: '30', bin: '00110000' },
  { char: '1', dec: 49, hex: '31', bin: '00110001' },
  { char: '=', dec: 61, hex: '3D', bin: '00111101' },
  { char: '!', dec: 33, hex: '21', bin: '00100001' },
];

function toBase64(str: string, urlSafe: boolean): string {
  try {
    const base64 = btoa(str);
    if (urlSafe) {
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return base64;
  } catch {
    return '[Invalid Input]';
  }
}

function fromBase64(str: string, urlSafe: boolean): string {
  try {
    let normalized = str;
    if (urlSafe) {
      normalized = str.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding back
      while (normalized.length % 4) normalized += '=';
    }
    return atob(normalized);
  } catch {
    return '[Invalid Base64]';
  }
}

function toBinary(str: string): string {
  return str.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

function textToHex(str: string): string {
  return str.split('').map(c => c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

function base64ToBinary(b64: string): string {
  try {
    const decoded = atob(b64);
    return toBinary(decoded);
  } catch {
    return '';
  }
}

export default function Base64Tool({ onScoreChange }: Props) {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [activePanel, setActivePanel] = useState<PanelMode>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [score, setScore] = useState(0);
  const [showLearn, setShowLearn] = useState(false);
  const [learnNotEncryption, setLearnNotEncryption] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [copiedSide, setCopiedSide] = useState<'left' | 'right' | null>(null);
  const [animatedChars, setAnimatedChars] = useState<{ char: string; index: number }[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = prev + points;
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  // Real-time conversion
  useEffect(() => {
    if (activePanel === 'encode') {
      if (!leftText) {
        setRightText('');
        return;
      }
      const result = toBase64(leftText, urlSafe);
      setRightText(result);
    } else {
      if (!rightText) {
        setLeftText('');
        return;
      }
      const result = fromBase64(rightText, urlSafe);
      setLeftText(result);
    }
  }, [leftText, rightText, activePanel, urlSafe]);

  const performConversion = useCallback(() => {
    setIsConverting(true);
    const sourceText = activePanel === 'encode' ? leftText : rightText;
    const resultText = activePanel === 'encode' ? rightText : leftText;

    if (!sourceText || !resultText) {
      setIsConverting(false);
      return;
    }

    // Animate character by character
    const resultChars = resultText.split('');
    setAnimatedChars([]);

    let i = 0;
    const animate = () => {
      if (i < Math.min(resultChars.length, 50)) {
        setAnimatedChars(prev => [...prev, { char: resultChars[i] as string, index: i }]);
        i += 1;
        animRef.current = setTimeout(animate, 30);
      } else {
        setAnimatedChars([]);
        setIsConverting(false);

        // Record conversion
        const conversion: Conversion = {
          id: `conv-${Date.now()}`,
          input: sourceText,
          output: resultText,
          mode: activePanel,
          type: 'text',
          urlSafe,
          timestamp: Date.now(),
        };
        setConversions(prev => [conversion, ...prev].slice(0, 20));
        addScore(5);
      }
    };
    animate();
  }, [activePanel, leftText, rightText, urlSafe, addScore]);

  useEffect(() => {
    return () => {
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setLeftText('');
    setRightText('');
    setConversions([]);
    setScore(0);
    setAnimatedChars([]);
    setIsConverting(false);
    setLearnNotEncryption(false);
    onScoreChange(0);
  }, [onScoreChange]);

  const copyToClipboard = useCallback(async (text: string, side: 'left' | 'right') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSide(side);
      setTimeout(() => setCopiedSide(null), 1500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedSide(side);
      setTimeout(() => setCopiedSide(null), 1500);
    }
  }, []);

  const currentBinary = activePanel === 'encode'
    ? toBinary(leftText.slice(0, 20))
    : base64ToBinary(rightText.slice(0, 20));

  const currentHex = textToHex(activePanel === 'encode' ? leftText.slice(0, 20) : fromBase64(rightText, urlSafe).slice(0, 20));

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-primary rounded-2xl border-4 border-black flex items-center justify-center">
            <Code size={24} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">Base64 Tool</h2>
            <p className="text-sm text-purple-dark font-nunito">Encode & decode Base64 like magic!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </div>
          <div className="bg-blue-info px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Hash size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{conversions.length}</span>
          </div>
          <button onClick={reset} className="p-2 bg-purple-light rounded-2xl border-4 border-black hover:bg-purple-primary transition-colors">
            <RotateCcw size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl border-4 border-black p-3 mb-4 card-shadow">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Encode/Decode Toggle */}
          <div className="flex items-center gap-2">
            <span className="font-fredoka text-sm text-purple-dark">Mode:</span>
            <div className="flex rounded-xl border-[3px] border-black overflow-hidden">
              <button
                onClick={() => setActivePanel('encode')}
                className={`px-4 py-2 font-fredoka text-xs flex items-center gap-1 transition-colors ${
                  activePanel === 'encode' ? 'bg-purple-primary text-white' : 'bg-white text-purple-darker hover:bg-purple-pale'
                }`}
              >
                <ArrowRight size={14} strokeWidth={3} />
                ENCODE
              </button>
              <button
                onClick={() => setActivePanel('decode')}
                className={`px-4 py-2 font-fredoka text-xs flex items-center gap-1 transition-colors border-l-[3px] border-black ${
                  activePanel === 'decode' ? 'bg-purple-primary text-white' : 'bg-white text-purple-darker hover:bg-purple-pale'
                }`}
              >
                <ArrowLeft size={14} strokeWidth={3} />
                DECODE
              </button>
            </div>
          </div>

          {/* URL-safe toggle */}
          <button
            onClick={() => setUrlSafe(!urlSafe)}
            className={`px-3 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center gap-1.5 transition-transform hover:scale-[1.02] ${
              urlSafe ? 'bg-green-success text-white' : 'bg-white text-purple-darker'
            }`}
          >
            <Globe size={14} strokeWidth={3} />
            URL-Safe {urlSafe ? 'ON' : 'OFF'}
          </button>

          {/* Sample texts */}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[10px] font-nunito text-purple-light mr-1">Samples:</span>
            {SAMPLE_TEXTS.map(s => (
              <button
                key={s.label}
                onClick={() => {
                  if (activePanel === 'encode') {
                    setLeftText(s.text);
                  } else {
                    const encoded = toBase64(s.text, urlSafe);
                    setRightText(encoded);
                  }
                }}
                className="px-2 py-1 rounded-lg border-[2px] border-black bg-purple-pale text-[10px] font-nunito font-bold text-purple-darker hover:bg-purple-lighter transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Input */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow h-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-fredoka text-sm text-purple-darker flex items-center gap-2">
                <Type size={16} strokeWidth={3} />
                {activePanel === 'encode' ? 'Text Input' : 'Decoded Output'}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => copyToClipboard(leftText, 'left')}
                  className="p-1.5 rounded-lg border-[2px] border-black bg-purple-pale hover:bg-purple-lighter transition-colors"
                  title="Copy"
                >
                  {copiedSide === 'left' ? <CheckCheck size={14} strokeWidth={3} className="text-green-success" /> : <Copy size={14} strokeWidth={3} />}
                </button>
                {leftText && (
                  <button
                    onClick={() => setLeftText('')}
                    className="p-1.5 rounded-lg border-[2px] border-black bg-red-alert/20 hover:bg-red-alert/40 transition-colors"
                    title="Clear"
                  >
                    <Trash2 size={14} strokeWidth={3} className="text-red-alert" />
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={leftText}
              onChange={e => setLeftText(e.target.value)}
              placeholder={activePanel === 'encode' ? 'Type text to encode...' : 'Decoded text appears here...'}
              className="w-full h-[150px] px-3 py-2 rounded-xl border-[3px] border-black font-mono text-sm bg-purple-pale focus:outline-none focus:ring-4 focus:ring-purple-primary resize-none"
              readOnly={activePanel === 'decode'}
            />

            {/* Binary Preview */}
            {leftText && activePanel === 'encode' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                className="mt-2"
              >
                <div className="bg-black rounded-xl border-[3px] border-black p-2 overflow-x-auto">
                  <div className="flex items-center gap-1 mb-1">
                    <Binary size={10} strokeWidth={3} className="text-green-success" />
                    <span className="text-[9px] font-mono text-green-success">BINARY</span>
                  </div>
                  <code className="text-[10px] font-mono text-green-success whitespace-pre break-all">{currentBinary}</code>
                </div>
              </motion.div>
            )}

            {/* Hex Preview */}
            {leftText && activePanel === 'encode' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                className="mt-2"
              >
                <div className="bg-purple-darker rounded-xl border-[3px] border-black p-2 overflow-x-auto">
                  <div className="flex items-center gap-1 mb-1">
                    <Hash size={10} strokeWidth={3} className="text-purple-light" />
                    <span className="text-[9px] font-mono text-purple-light">HEX</span>
                  </div>
                  <code className="text-[10px] font-mono text-purple-light whitespace-pre break-all">{currentHex}</code>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Center: Convert Controls */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-3">
          {/* Magic Wand Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={performConversion}
            disabled={isConverting || (!leftText && !rightText)}
            className="w-16 h-16 rounded-full border-[4px] border-black flex items-center justify-center transition-colors disabled:opacity-50"
            style={{ backgroundColor: isConverting ? '#A78BFA' : '#FACC15' }}
          >
            {isConverting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Zap size={28} strokeWidth={3} />
              </motion.div>
            ) : (
              <Wand2 size={28} strokeWidth={3} />
            )}
          </motion.button>

          <span className="font-fredoka text-xs text-purple-dark">CONVERT</span>

          {/* Direction Arrow */}
          <div className="flex flex-col items-center gap-1">
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {activePanel === 'encode' ? (
                <ArrowRight size={32} strokeWidth={3} className="text-purple-primary" />
              ) : (
                <ArrowLeft size={32} strokeWidth={3} className="text-purple-primary" />
              )}
            </motion.div>
            <span className="text-[10px] font-nunito text-purple-light">
              {activePanel === 'encode' ? 'Text → Base64' : 'Base64 → Text'}
            </span>
          </div>

          {/* Animated Characters */}
          <AnimatePresence>
            {animatedChars.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex flex-wrap gap-0.5 justify-center max-w-full"
              >
                {animatedChars.slice(-12).map((c, i) => (
                  <motion.span
                    key={`${c.index}-${i}`}
                    initial={{ y: -20, scale: 2 }}
                    animate={{ y: 0, scale: 1 }}
                    className="inline-flex w-6 h-6 items-center justify-center bg-purple-primary text-white text-xs font-mono font-bold rounded border-[2px] border-black"
                  >
                    {c.char}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Character Set Info */}
          <div className="bg-white rounded-xl border-[3px] border-black p-2 w-full">
            <h4 className="font-fredoka text-[10px] text-purple-darker mb-1 text-center">Base64 Alphabet</h4>
            <div className="flex flex-wrap gap-0.5 justify-center">
              {BASE64_CHARS.split('').slice(0, 16).map((c, i) => (
                <span key={i} className="w-5 h-5 flex items-center justify-center bg-purple-pale rounded text-[9px] font-mono font-bold border border-black">
                  {c}
                </span>
              ))}
              <span className="w-5 h-5 flex items-center justify-center text-[9px] font-mono text-purple-light">...</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Output */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow h-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-fredoka text-sm text-purple-darker flex items-center gap-2">
                <Code size={16} strokeWidth={3} />
                {activePanel === 'encode' ? 'Base64 Output' : 'Base64 Input'}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => copyToClipboard(rightText, 'right')}
                  className="p-1.5 rounded-lg border-[2px] border-black bg-purple-pale hover:bg-purple-lighter transition-colors"
                  title="Copy"
                >
                  {copiedSide === 'right' ? <CheckCheck size={14} strokeWidth={3} className="text-green-success" /> : <Copy size={14} strokeWidth={3} />}
                </button>
                {rightText && (
                  <button
                    onClick={() => setRightText('')}
                    className="p-1.5 rounded-lg border-[2px] border-black bg-red-alert/20 hover:bg-red-alert/40 transition-colors"
                    title="Clear"
                  >
                    <Trash2 size={14} strokeWidth={3} className="text-red-alert" />
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={rightText}
              onChange={e => setRightText(e.target.value)}
              placeholder={activePanel === 'encode' ? 'Base64 result appears here...' : 'Paste Base64 to decode...'}
              className="w-full h-[150px] px-3 py-2 rounded-xl border-[3px] border-black font-mono text-sm bg-purple-pale focus:outline-none focus:ring-4 focus:ring-purple-primary resize-none"
              readOnly={activePanel === 'encode'}
            />

            {/* Decoded Preview (for decode mode) */}
            {activePanel === 'decode' && rightText && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                className="mt-2"
              >
                <div className="bg-green-success/10 rounded-xl border-[3px] border-green-success p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <FileText size={10} strokeWidth={3} className="text-green-success" />
                    <span className="text-[9px] font-nunito font-bold text-green-success">DECODED TEXT</span>
                  </div>
                  <p className="text-xs font-nunito text-purple-darker break-all">{leftText}</p>
                </div>
              </motion.div>
            )}

            {/* Info box */}
            {(leftText || rightText) && (
              <motion.div
                initial={{ opacity: 1, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-blue-info/10 rounded-xl border-[3px] border-blue-info p-2"
              >
                <div className="flex items-center gap-1 mb-1">
                  <Info size={10} strokeWidth={3} className="text-blue-info" />
                  <span className="text-[9px] font-nunito font-bold text-blue-info">INFO</span>
                </div>
                <div className="space-y-0.5 text-[10px] font-nunito text-purple-darker">
                  <p>Input chars: {(activePanel === 'encode' ? leftText : rightText).length}</p>
                  <p>Output chars: {(activePanel === 'encode' ? rightText : leftText).length}</p>
                  <p>Ratio: {activePanel === 'encode'
                    ? rightText.length > 0 ? `${(rightText.length / leftText.length).toFixed(2)}x` : '-'
                    : leftText.length > 0 ? `${(leftText.length / rightText.length).toFixed(2)}x` : '-'
                  } size</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: History + Table + Educational */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        {/* Conversion History */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-darker mb-2 flex items-center gap-2">
              <Clock size={16} strokeWidth={3} />
              History ({conversions.length})
            </h3>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              <AnimatePresence>
                {conversions.map(c => (
                  <motion.div
                    key={c.id}
                    initial={{ x: -20, scale: 0.95 }}
                    animate={{ x: 0, scale: 1 }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg border-[2px] border-black bg-purple-pale cursor-pointer hover:bg-purple-lighter transition-colors"
                    onClick={() => {
                      setActivePanel(c.mode);
                      if (c.mode === 'encode') {
                        setLeftText(c.input);
                      } else {
                        setRightText(c.input);
                      }
                    }}
                  >
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border border-black ${
                      c.mode === 'encode' ? 'bg-purple-primary text-white' : 'bg-green-success text-white'
                    }`}>
                      {c.mode === 'encode' ? 'ENC' : 'DEC'}
                    </span>
                    <code className="flex-1 text-[10px] font-mono text-purple-darker truncate">{c.input}</code>
                    <ChevronRight size={12} strokeWidth={3} className="text-purple-light" />
                  </motion.div>
                ))}
              </AnimatePresence>
              {conversions.length === 0 && (
                <div className="text-center py-4">
                  <Clock size={28} strokeWidth={2} className="text-purple-light mx-auto mb-1" />
                  <p className="text-[11px] text-purple-light font-nunito">No conversions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ASCII Table */}
        <div className="lg:col-span-4">
          <button
            onClick={() => { setShowTable(!showTable); if (!showTable) addScore(10); }}
            className="w-full mb-2 px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] bg-purple-primary text-white"
          >
            <Binary size={16} strokeWidth={3} />
            {showTable ? 'Hide' : 'Show'} ASCII Table (+10)
          </button>

          <AnimatePresence>
            {showTable && (
              <motion.div
                initial={{ height: 0, opacity: 1 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0, opacity: 1 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
                  <h4 className="font-fredoka text-xs text-purple-darker mb-2 text-center">How Text Becomes Base64</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-purple-primary text-white">
                          <th className="px-2 py-1 font-fredoka border-r-2 border-black">Char</th>
                          <th className="px-2 py-1 font-fredoka border-r-2 border-black">Decimal</th>
                          <th className="px-2 py-1 font-fredoka border-r-2 border-black">Hex</th>
                          <th className="px-2 py-1 font-fredoka">Binary</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ASCII_TABLE.map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-purple-pale' : 'bg-white'}>
                            <td className="px-2 py-1 font-mono font-bold text-center border-r border-purple-lighter">{row.char}</td>
                            <td className="px-2 py-1 font-mono text-center border-r border-purple-lighter">{row.dec}</td>
                            <td className="px-2 py-1 font-mono text-center border-r border-purple-lighter">{row.hex}</td>
                            <td className="px-2 py-1 font-mono text-center">{row.bin}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[9px] font-nunito text-purple-light mt-2 text-center">
                    Base64 splits binary into 6-bit groups and maps each to a character
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showTable && (
            <div className="bg-purple-pale rounded-2xl border-[3px] border-purple-light p-4 text-center">
              <Binary size={32} strokeWidth={2} className="text-purple-light mx-auto mb-2" />
              <p className="text-xs font-nunito text-purple-light">
                ASCII table shows how characters become binary, then Base64
              </p>
            </div>
          )}
        </div>

        {/* Educational */}
        <div className="lg:col-span-4">
          <button
            onClick={() => { setShowLearn(!showLearn); if (!showLearn) addScore(10); }}
            className="w-full mb-2 px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] bg-purple-primary text-white"
          >
            <BookOpen size={16} strokeWidth={3} />
            {showLearn ? 'Hide' : 'What is Base64? (+10)'}
          </button>

          <AnimatePresence>
            {showLearn && (
              <motion.div
                initial={{ height: 0, opacity: 1 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0, opacity: 1 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
                  <p className="text-xs font-nunito text-purple-darker mb-2">
                    <strong>Base64</strong> is a way to turn any binary data into text using 64 safe characters (A-Z, a-z, 0-9, +, /). It is used to send images in emails, store data in JSON, and embed files in web pages.
                  </p>
                  <p className="text-xs font-nunito text-purple-darker mb-2">
                    <strong>How it works:</strong> Every 3 bytes (24 bits) become 4 Base64 characters (4 x 6 bits). The <code>=</code> character is padding.
                  </p>

                  {/* Not Encryption Quiz */}
                  <div className={`rounded-xl border-[3px] p-2 mt-2 ${
                    learnNotEncryption ? 'bg-green-success/20 border-green-success' : 'bg-red-alert/10 border-red-alert'
                  }`}>
                    <p className="text-xs font-nunito font-bold text-purple-darker mb-1 flex items-center gap-1">
                      <AlertTriangle size={12} strokeWidth={3} className={learnNotEncryption ? 'text-green-success' : 'text-red-alert'} />
                      Is Base64 encryption?
                    </p>
                    {!learnNotEncryption ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLearnNotEncryption(true)}
                          className="flex-1 px-2 py-1 rounded-lg border-[2px] border-black bg-red-alert text-white font-fredoka text-[10px]"
                        >
                          <Lock size={10} strokeWidth={3} className="inline mr-1" />
                          Yes, it hides data
                        </button>
                        <button
                          onClick={() => { setLearnNotEncryption(true); addScore(20); }}
                          className="flex-1 px-2 py-1 rounded-lg border-[2px] border-black bg-green-success text-white font-fredoka text-[10px]"
                        >
                          <Unlock size={10} strokeWidth={3} className="inline mr-1" />
                          No, it is just encoding!
                        </button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                      >
                        <p className="text-[11px] font-nunito text-purple-darker">
                          <strong>Correct!</strong> Base64 is NOT encryption. Anyone can decode it instantly. It just makes binary data safe to send as text. For real security, you need encryption with a secret key!
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <div className="bg-yellow-accent/20 rounded-xl border-[3px] border-yellow-accent p-2 mt-2">
                    <p className="text-[11px] font-nunito font-bold text-purple-darker">
                      <Sparkles size={12} strokeWidth={3} className="inline text-yellow-accent mr-1" />
                      Real uses: Email attachments, Data URLs, JWT tokens, URL parameters
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showLearn && (
            <div className="bg-purple-pale rounded-2xl border-[3px] border-purple-light p-4 text-center">
              <Shield size={32} strokeWidth={2} className="text-purple-light mx-auto mb-2" />
              <p className="text-xs font-nunito text-purple-light">
                Learn what Base64 is and why it is NOT encryption!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
