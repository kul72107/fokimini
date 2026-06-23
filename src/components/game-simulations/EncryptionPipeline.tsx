import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Key,
  ArrowRight,
  ArrowLeft,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Type,
  Binary,
  Hash,
  ChevronRight,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface EncryptionPipelineProps {
  onScoreChange: (score: number) => void;
}

type EncryptionType = 'caesar' | 'xor' | 'substitution';
type PipelineStage = 'idle' | 'input' | 'encrypting' | 'cipher' | 'decrypting' | 'output';

const SAMPLE_MESSAGES = [
  'HELLO',
  'CYBER',
  'PAWS',
  'SAFE',
  'DATA',
  'KIDS',
  'LOCK',
];

const SUBSTITUTION_MAP: Record<string, string> = {
  A: 'Q', B: 'W', C: 'E', D: 'R', E: 'T', F: 'Y', G: 'U', H: 'I',
  I: 'O', J: 'P', K: 'A', L: 'S', M: 'D', N: 'F', O: 'G', P: 'H',
  Q: 'J', R: 'K', S: 'L', T: 'Z', U: 'X', V: 'C', W: 'V', X: 'B',
  Y: 'N', Z: 'M',
};

const REVERSE_SUB_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SUBSTITUTION_MAP).map(([k, v]) => [v, k])
);

export default function EncryptionPipeline({ onScoreChange }: EncryptionPipelineProps) {
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [encryptionType, setEncryptionType] = useState<EncryptionType>('caesar');
  const [selectedMessage, setSelectedMessage] = useState('');
  const [key, setKey] = useState('');
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [cipherText, setCipherText] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [showIntercept, setShowIntercept] = useState(false);
  const [message, setMessage] = useState('Select a message and watch the encryption pipeline!');
  const [showStart, setShowStart] = useState(true);
  const [keyStrength, setKeyStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [completedPipelines, setCompletedPipelines] = useState(0);

  const levelTitles = ['Caesar Cipher', 'XOR Encryption', 'Substitution Cipher'];
  const levelTypes: EncryptionType[] = ['caesar', 'xor', 'substitution'];

  const caesarEncrypt = (text: string, shift: number): string => {
    return text
      .toUpperCase()
      .split('')
      .map((c) => {
        if (c < 'A' || c > 'Z') return c;
        return String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65);
      })
      .join('');
  };

  const caesarDecrypt = (text: string, shift: number): string => {
    return caesarEncrypt(text, 26 - (shift % 26));
  };

  const xorEncrypt = (text: string, keyStr: string): string => {
    if (!keyStr) return text;
    return text
      .split('')
      .map((c, i) => {
        const keyChar = keyStr[i % keyStr.length];
        return String.fromCharCode(c.charCodeAt(0) ^ keyChar.charCodeAt(0));
      })
      .map((c) => {
        const code = c.charCodeAt(0);
        if (code >= 32 && code <= 126) return c;
        return String.fromCharCode((code % 95) + 32);
      })
      .join('');
  };

  const substitutionEncrypt = (text: string): string => {
    return text
      .toUpperCase()
      .split('')
      .map((c) => SUBSTITUTION_MAP[c] || c)
      .join('');
  };

  const substitutionDecrypt = (text: string): string => {
    return text
      .split('')
      .map((c) => REVERSE_SUB_MAP[c] || c)
      .join('');
  };

  const calculateKeyStrength = (k: string): 'weak' | 'medium' | 'strong' => {
    if (k.length < 2) return 'weak';
    if (k.length < 4) return 'medium';
    return 'strong';
  };

  const handleKeyChange = (newKey: string) => {
    setKey(newKey.toUpperCase());
    setKeyStrength(calculateKeyStrength(newKey));
  };

  const handleSelectMessage = (msg: string) => {
    if (stage !== 'idle' && stage !== 'input') return;
    setSelectedMessage(msg);
    setCipherText('');
    setDecryptedText('');
    setStage('input');
    setShowIntercept(false);
    setPipelineProgress(0);
    setMessage(`Message "${msg}" selected. ${encryptionType === 'caesar' ? 'Set a shift key (1-25)' : encryptionType === 'xor' ? 'Enter an XOR key' : 'Ready to encrypt!'}`);
  };

  const runPipeline = () => {
    if (!selectedMessage) return;

    if (encryptionType === 'caesar' && (!key || isNaN(parseInt(key)))) {
      setMessage('Please enter a numeric shift key (1-25)!');
      return;
    }
    if (encryptionType === 'xor' && !key) {
      setMessage('Please enter an XOR key!');
      return;
    }

    setStage('encrypting');
    setPipelineProgress(25);
    setMessage('Encrypting... watch the transformation!');

    setTimeout(() => {
      let encrypted = '';
      if (encryptionType === 'caesar') {
        encrypted = caesarEncrypt(selectedMessage, parseInt(key) || 3);
      } else if (encryptionType === 'xor') {
        encrypted = xorEncrypt(selectedMessage, key);
      } else {
        encrypted = substitutionEncrypt(selectedMessage);
      }
      setCipherText(encrypted);
      setStage('cipher');
      setPipelineProgress(50);
      setMessage(`Cipher text: "${encrypted}". Now decrypting...`);

      setTimeout(() => {
        setStage('decrypting');
        setPipelineProgress(75);
        setMessage('Decrypting with the same key...');

        setTimeout(() => {
          let decrypted = '';
          if (encryptionType === 'caesar') {
            decrypted = caesarDecrypt(cipherText || encrypted, parseInt(key) || 3);
          } else if (encryptionType === 'xor') {
            decrypted = xorEncrypt(encrypted, key); // XOR is symmetric
          } else {
            decrypted = substitutionDecrypt(encrypted);
          }
          setDecryptedText(decrypted);
          setStage('output');
          setPipelineProgress(100);

          const success = decrypted === selectedMessage;
          const newCompleted = completedPipelines + 1;
          setCompletedPipelines(newCompleted);

          if (success) {
            const newScore = Math.min(100, score + 20);
            setScore(newScore);
            onScoreChange(newScore);
            setMessage(`Success! Decrypted correctly: "${decrypted}". The pipeline works!`);
          } else {
            setMessage(`Decryption mismatch! Expected: "${selectedMessage}", Got: "${decrypted}"`);
          }
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const handleNextLevel = () => {
    if (level < 3) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setEncryptionType(levelTypes[nextLevel - 1]);
      setSelectedMessage('');
      setKey('');
      setCipherText('');
      setDecryptedText('');
      setStage('idle');
      setShowIntercept(false);
      setPipelineProgress(0);
      setMessage(`Level ${nextLevel}: ${levelTitles[nextLevel - 1]}! Select a new message.`);
    }
  };

  const resetPipeline = () => {
    setSelectedMessage('');
    setKey('');
    setCipherText('');
    setDecryptedText('');
    setStage('idle');
    setShowIntercept(false);
    setPipelineProgress(0);
    setMessage('Select a message to start again.');
  };

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setLevel(1);
    setEncryptionType('caesar');
    setSelectedMessage('');
    setKey('');
    setCipherText('');
    setDecryptedText('');
    setStage('idle');
    setShowIntercept(false);
    setShowStart(false);
    setPipelineProgress(0);
    setCompletedPipelines(0);
    onScoreChange(0);
    setMessage('Level 1: Caesar Cipher! Select a message and set a shift key.');
  };

  const resetGame = () => {
    setGameActive(false);
    setShowStart(true);
    setScore(0);
    setLevel(1);
    setEncryptionType('caesar');
    setSelectedMessage('');
    setKey('');
    setCipherText('');
    setDecryptedText('');
    setStage('idle');
    setShowIntercept(false);
    setPipelineProgress(0);
    setCompletedPipelines(0);
    onScoreChange(0);
    setMessage('');
  };

  const getKeyInput = () => {
    if (encryptionType === 'caesar') {
      return (
        <div className="flex flex-col items-center gap-2">
          <label className="font-nunito text-xs font-bold text-purple-dark">
            <Key size={12} strokeWidth={3} className="inline mr-1" />
            Caesar Shift Key (1-25):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={25}
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              className="w-16 text-center font-mono text-lg font-bold text-purple-dark bg-white border-[3px] border-black rounded-xl px-2 py-1"
              placeholder="3"
            />
            {/* Caesar wheel visual */}
            <div className="relative w-12 h-12">
              <motion.div
                animate={stage === 'encrypting' ? { rotate: parseInt(key || '0') * 13.8 } : { rotate: 0 }}
                transition={{ duration: 1.5 }}
                className="w-full h-full rounded-full border-[3px] border-black bg-yellow-accent flex items-center justify-center"
              >
                <span className="font-mono text-xs font-bold">{key || '?'}</span>
              </motion.div>
            </div>
          </div>
        </div>
      );
    }

    if (encryptionType === 'xor') {
      return (
        <div className="flex flex-col items-center gap-2">
          <label className="font-nunito text-xs font-bold text-purple-dark">
            <Key size={12} strokeWidth={3} className="inline mr-1" />
            XOR Key (any text):
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => handleKeyChange(e.target.value.toUpperCase())}
            className="w-32 text-center font-mono text-sm font-bold text-purple-dark bg-white border-[3px] border-black rounded-xl px-2 py-1"
            placeholder="SECRET"
            maxLength={8}
          />
          {key && (
            <div className="flex items-center gap-1">
              <span className="font-nunito text-[9px] text-purple-light">Key strength:</span>
              <span
                className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-black ${
                  keyStrength === 'weak'
                    ? 'bg-red-alert text-white'
                    : keyStrength === 'medium'
                    ? 'bg-yellow-accent text-black'
                    : 'bg-green-success text-black'
                }`}
              >
                {keyStrength.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-2">
        <span className="font-nunito text-xs font-bold text-purple-dark">
          <Hash size={12} strokeWidth={3} className="inline mr-1" />
          Substitution Cipher (no key needed)
        </span>
        <span className="font-nunito text-[10px] text-purple-light">
          Each letter is replaced by another fixed letter.
        </span>
      </div>
    );
  };

  const renderCharTransform = (original: string, transformed: string, label: string, isEncrypt: boolean) => (
    <div className="flex flex-col items-center gap-1">
      <span className="font-nunito text-[8px] text-purple-light">{label}</span>
      <div className="flex gap-1">
        {(transformed || original).split('').map((char, i) => (
          <motion.div
            key={`${label}-${i}`}
            initial={isEncrypt && stage === 'encrypting' ? { rotateY: 0, scale: 1 } : {}}
            animate={
              isEncrypt && stage === 'encrypting'
                ? { rotateY: 180, scale: [1, 1.2, 1] }
                : !isEncrypt && stage === 'decrypting'
                ? { rotateY: [180, 0], scale: [1, 1.2, 1] }
                : {}
            }
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="w-8 h-8 bg-white border-[3px] border-black rounded-lg flex items-center justify-center"
          >
            <span className="font-mono text-sm font-bold text-purple-dark">{char}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const stageColors: Record<PipelineStage, string> = {
    idle: 'bg-purple-lighter',
    input: 'bg-yellow-accent',
    encrypting: 'bg-purple-primary',
    cipher: 'bg-red-alert',
    decrypting: 'bg-purple-primary',
    output: 'bg-green-success',
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 max-w-3xl mx-auto">
      {/* HUD */}
      <div className="w-full flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <Lock size={18} strokeWidth={3} className="text-yellow-accent" />
          <span className="font-nunito text-sm font-bold text-white">
            Level {level}/3
          </span>
        </div>
        <div className="font-nunito text-sm font-bold text-yellow-accent">Score: {score}</div>
        <div className="font-nunito text-xs text-purple-lighter">
          {completedPipelines} done
        </div>
      </div>

      {/* Message */}
      <div className="w-full bg-blue-info/20 rounded-xl border-[3px] border-blue-info p-2 text-center">
        <p className="font-nunito text-sm text-purple-dark">{message}</p>
      </div>

      {/* Start Screen */}
      {showStart && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-full bg-purple-pale rounded-2xl border-4 border-black p-6 text-center"
        >
          <Lock size={48} strokeWidth={3} className="text-purple-primary mx-auto mb-3" />
          <h3 className="font-fredoka text-xl font-bold text-purple-dark mb-2">
            Encryption Pipeline
          </h3>
          <p className="font-nunito text-sm text-purple-dark mb-4">
            Watch how encryption transforms your message! Select a message,
            provide a key, and see the encryption/decryption pipeline in action.
          </p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark transition-colors hover:scale-105"
          >
            <Play size={18} strokeWidth={3} className="inline mr-2" />
            Start Pipeline
          </button>
        </motion.div>
      )}

      {gameActive && (
        <>
          {/* Level Indicator */}
          <div className="w-full">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-full border border-black ${
                    i < level ? 'bg-green-success' : i === level ? 'bg-yellow-accent' : 'bg-purple-lighter'
                  }`}
                />
              ))}
            </div>
            <span className="font-nunito text-[10px] text-purple-dark mt-1 block text-center">
              {levelTitles[level - 1]}
            </span>
          </div>

          {/* Pipeline Diagram */}
          <div className="w-full bg-white rounded-2xl border-4 border-black overflow-hidden p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="w-full h-3 bg-purple-lighter rounded-full border-2 border-black overflow-hidden">
                <motion.div
                  className="h-full bg-purple-primary"
                  animate={{ width: `${pipelineProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Pipeline Stages */}
            <div className="flex items-center justify-between gap-2 mb-4">
              {/* Stage 1: Plain Text */}
              <div
                className={`flex-1 rounded-xl border-[3px] border-black p-2 text-center transition-colors ${
                  stage === 'input' || stage === 'encrypting' ? 'bg-yellow-accent' : 'bg-purple-pale'
                }`}
              >
                <Type size={16} strokeWidth={3} className="text-purple-dark mx-auto mb-1" />
                <span className="font-nunito text-[9px] font-bold text-purple-dark block">
                  Plain Text
                </span>
                {selectedMessage && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex gap-0.5 justify-center mt-1"
                  >
                    {selectedMessage.split('').map((c, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 bg-white border border-black rounded flex items-center justify-center"
                      >
                        <span className="font-mono text-[9px] font-bold">{c}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              <ArrowRight size={16} strokeWidth={3} className="text-purple-light" />

              {/* Stage 2: Key Input */}
              <div
                className={`flex-1 rounded-xl border-[3px] border-black p-2 text-center ${
                  stage === 'encrypting' || stage === 'decrypting' ? 'bg-yellow-accent' : 'bg-purple-pale'
                }`}
              >
                <Key size={16} strokeWidth={3} className="text-purple-dark mx-auto mb-1" />
                <span className="font-nunito text-[9px] font-bold text-purple-dark block">
                  Key Input
                </span>
                <div className="mt-1">{getKeyInput()}</div>
              </div>

              <ArrowRight size={16} strokeWidth={3} className="text-purple-light" />

              {/* Stage 3: Encryption */}
              <motion.div
                animate={stage === 'encrypting' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: stage === 'encrypting' ? Infinity : 0 }}
                className={`flex-1 rounded-xl border-[3px] border-black p-2 text-center ${
                  stage === 'encrypting' ? 'bg-purple-primary' : stage === 'cipher' ? 'bg-purple-primary/20' : 'bg-purple-pale'
                }`}
              >
                <Zap size={16} strokeWidth={3} className={stage === 'encrypting' ? 'text-yellow-accent mx-auto mb-1' : 'text-purple-dark mx-auto mb-1'} />
                <span className={`font-nunito text-[9px] font-bold block ${stage === 'encrypting' ? 'text-white' : 'text-purple-dark'}`}>
                  {encryptionType === 'caesar' ? 'Caesar' : encryptionType === 'xor' ? 'XOR Gate' : 'Substitution'}
                </span>
                {encryptionType === 'xor' && (
                  <div className="mt-1 font-mono text-[8px] text-purple-light">A ^ B = C</div>
                )}
                {encryptionType === 'caesar' && key && (
                  <div className="mt-1 font-mono text-[8px] text-purple-light">Shift +{key}</div>
                )}
              </motion.div>

              <ArrowRight size={16} strokeWidth={3} className="text-purple-light" />

              {/* Stage 4: Cipher Text */}
              <div
                className={`flex-1 rounded-xl border-[3px] border-black p-2 text-center ${
                  stage === 'cipher' || stage === 'decrypting' ? 'bg-red-alert/20' : 'bg-purple-pale'
                }`}
              >
                <Lock size={16} strokeWidth={3} className="text-purple-dark mx-auto mb-1" />
                <span className="font-nunito text-[9px] font-bold text-purple-dark block">
                  Cipher Text
                </span>
                {cipherText && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex gap-0.5 justify-center mt-1"
                  >
                    {cipherText.split('').map((c, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 bg-red-alert border border-black rounded flex items-center justify-center"
                      >
                        <span className="font-mono text-[9px] font-bold text-white">{c}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Decryption Row */}
            {(stage === 'decrypting' || stage === 'output') && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex-1 rounded-xl border-[3px] border-black p-2 text-center bg-purple-pale">
                  <Lock size={14} strokeWidth={3} className="text-purple-dark mx-auto mb-1" />
                  <span className="font-nunito text-[8px] font-bold text-purple-dark">Cipher</span>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {(cipherText || '').split('').map((c, i) => (
                      <div key={i} className="w-4 h-4 bg-red-alert border border-black rounded flex items-center justify-center">
                        <span className="font-mono text-[7px] font-bold text-white">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <ArrowRight size={14} strokeWidth={3} className="text-purple-light" />

                <motion.div
                  animate={stage === 'decrypting' ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.5, repeat: stage === 'decrypting' ? Infinity : 0 }}
                  className={`flex-1 rounded-xl border-[3px] border-black p-2 text-center ${
                    stage === 'decrypting' ? 'bg-purple-primary' : 'bg-purple-pale'
                  }`}
                >
                  <Unlock size={14} strokeWidth={3} className={stage === 'decrypting' ? 'text-yellow-accent mx-auto mb-1' : 'text-purple-dark mx-auto mb-1'} />
                  <span className={`font-nunito text-[8px] font-bold block ${stage === 'decrypting' ? 'text-white' : 'text-purple-dark'}`}>
                    Decrypt
                  </span>
                </motion.div>

                <ArrowRight size={14} strokeWidth={3} className="text-purple-light" />

                <div
                  className={`flex-1 rounded-xl border-[3px] border-black p-2 text-center ${
                    stage === 'output' ? 'bg-green-success/20' : 'bg-purple-pale'
                  }`}
                >
                  <Type size={14} strokeWidth={3} className="text-purple-dark mx-auto mb-1" />
                  <span className="font-nunito text-[8px] font-bold text-purple-dark block">
                    Decrypted
                  </span>
                  {decryptedText && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex gap-0.5 justify-center mt-1"
                    >
                      {decryptedText.split('').map((c, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 border border-black rounded flex items-center justify-center ${
                            c === selectedMessage[i] ? 'bg-green-success' : 'bg-red-alert'
                          }`}
                        >
                          <span className="font-mono text-[7px] font-bold text-white">{c}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Message Selection */}
          <div className="w-full bg-white rounded-xl border-[3px] border-black p-3">
            <span className="font-nunito text-[10px] font-bold text-purple-dark mb-2 block">
              <Type size={12} strokeWidth={3} className="inline mr-1" />
              Select a message:
            </span>
            <div className="flex gap-2 flex-wrap">
              {SAMPLE_MESSAGES.map((msg) => (
                <motion.button
                  key={msg}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectMessage(msg)}
                  disabled={stage !== 'idle' && stage !== 'input'}
                  className={`px-3 py-1 rounded-full border-[2px] font-mono text-xs font-bold transition-colors ${
                    selectedMessage === msg
                      ? 'bg-yellow-accent border-black text-black'
                      : 'bg-purple-pale border-purple-light text-purple-dark hover:border-black'
                  } ${stage !== 'idle' && stage !== 'input' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {msg}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-2 justify-center flex-wrap">
            {selectedMessage && (stage === 'idle' || stage === 'input') && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={runPipeline}
                className="flex items-center gap-2 px-5 py-2 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark transition-colors hover:scale-105"
              >
                <Zap size={16} strokeWidth={3} /> Encrypt & Decrypt
              </motion.button>
            )}
            {stage === 'output' && level < 3 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleNextLevel}
                className="flex items-center gap-2 px-5 py-2 bg-green-success text-black border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform"
              >
                <ChevronRight size={16} strokeWidth={3} /> Next Level
              </motion.button>
            )}
            {stage === 'output' && level === 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-green-success rounded-xl border-[3px] border-black px-4 py-2 flex items-center gap-2"
              >
                <Check size={20} strokeWidth={3} className="text-black" />
                <span className="font-nunito font-bold text-black">
                  All Levels Complete! Final Score: {score}
                </span>
              </motion.div>
            )}
            <button
              onClick={resetPipeline}
              className="flex items-center gap-2 px-3 py-2 bg-purple-pale text-purple-dark border-[3px] border-black rounded-full font-nunito text-xs font-bold hover:bg-purple-lighter transition-colors hover:scale-105"
            >
              <RotateCcw size={14} strokeWidth={3} /> New Message
            </button>
            <button
              onClick={() => setShowIntercept(!showIntercept)}
              className={`flex items-center gap-2 px-3 py-2 border-[3px] border-black rounded-full font-nunito text-xs font-bold transition-colors hover:scale-105 ${
                showIntercept ? 'bg-red-alert text-white' : 'bg-purple-pale text-purple-dark'
              }`}
            >
              {showIntercept ? <Eye size={14} strokeWidth={3} /> : <EyeOff size={14} strokeWidth={3} />}
              Intercept Mode
            </button>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-3 py-2 bg-red-alert text-white border-[3px] border-black rounded-full font-nunito text-xs font-bold hover:scale-105 transition-transform"
            >
              <RotateCcw size={14} strokeWidth={3} /> Reset
            </button>
          </div>

          {/* Intercept Mode */}
          <AnimatePresence>
            {showIntercept && cipherText && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-full bg-red-alert/10 rounded-2xl border-[3px] border-red-alert p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={18} strokeWidth={3} className="text-red-alert" />
                  <span className="font-fredoka text-sm font-bold text-red-alert">
                    Attacker&apos;s View (Intercepted)
                  </span>
                </div>
                <p className="font-nunito text-xs text-purple-dark mb-2">
                  An attacker intercepting the message would only see this encrypted data.
                  Without the key, it looks like random characters!
                </p>
                <div className="bg-black rounded-xl border-2 border-red-alert p-3">
                  <span className="font-mono text-xs text-red-alert">
                    Intercepted: &quot;{cipherText}&quot;
                  </span>
                </div>
                <p className="font-nunito text-[10px] text-purple-light mt-2">
                  This is why encryption is important — even if someone captures your data,
                  they cannot read it without the decryption key!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Side-by-side Comparison */}
          {stage === 'output' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-full bg-white rounded-2xl border-[3px] border-black p-3"
            >
              <span className="font-nunito text-[10px] font-bold text-purple-dark mb-2 block">
                <Shield size={12} strokeWidth={3} className="inline mr-1" />
                Encryption Verification
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-success/20 rounded-xl border-2 border-green-success p-2 text-center">
                  <span className="font-nunito text-[9px] text-purple-light block">Original</span>
                  <span className="font-mono text-sm font-bold text-purple-dark">{selectedMessage}</span>
                </div>
                <div className="bg-red-alert/20 rounded-xl border-2 border-red-alert p-2 text-center">
                  <span className="font-nunito text-[9px] text-purple-light block">Cipher</span>
                  <span className="font-mono text-sm font-bold text-red-alert">{cipherText}</span>
                </div>
                <div
                  className={`rounded-xl border-2 p-2 text-center ${
                    decryptedText === selectedMessage
                      ? 'bg-green-success/20 border-green-success'
                      : 'bg-red-alert/20 border-red-alert'
                  }`}
                >
                  <span className="font-nunito text-[9px] text-purple-light block">Decrypted</span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      decryptedText === selectedMessage ? 'text-green-success' : 'text-red-alert'
                    }`}
                  >
                    {decryptedText}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
