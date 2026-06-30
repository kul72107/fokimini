import { useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Unlock, Shield, ShieldCheck, Key, Calendar,
  Hash, Settings, Award, ChevronRight, RotateCcw, Trophy,
  Check, X, Sparkles, Zap, FileKey, Fingerprint, AlertTriangle
} from 'lucide-react';
import type { OpsContextProps } from '@/lib/opsContext';

interface Props extends OpsContextProps {
  onScoreChange: (score: number) => void;
}

interface CertField {
  id: string;
  label: string;
  placeholder: string;
  example: string;
  icon: 'key' | 'shield' | 'calendar' | 'hash' | 'settings' | 'fingerprint' | 'filekey';
}

interface CertPiece {
  id: string;
  fieldId: string;
  value: string;
  color: string;
}

interface LevelConfig {
  id: number;
  name: string;
  description: string;
  fields: CertField[];
  mode: 'assemble' | 'fix';
  brokenField?: string;
  brokenValue?: string;
}

const ALL_FIELDS: CertField[] = [
  { id: 'subject', label: 'Subject Name', placeholder: 'Who the cert is for', example: 'www.cyberpaws.kids', icon: 'key' },
  { id: 'issuer', label: 'Issuer Name', placeholder: 'Who issued the cert', example: 'CyberPaws CA', icon: 'shield' },
  { id: 'validFrom', label: 'Valid From', placeholder: 'Start date', example: 'Jan 1, 2025', icon: 'calendar' },
  { id: 'validUntil', label: 'Valid Until', placeholder: 'Expiry date', example: 'Jan 1, 2026', icon: 'calendar' },
  { id: 'publicKey', label: 'Public Key', placeholder: 'Encryption key', example: 'RSA 2048-bit', icon: 'filekey' },
  { id: 'algorithm', label: 'Signature Algorithm', placeholder: 'Hash algorithm', example: 'SHA-256', icon: 'settings' },
  { id: 'serial', label: 'Serial Number', placeholder: 'Unique ID', example: 'A1:B2:C3:D4', icon: 'hash' },
  { id: 'keyUsage', label: 'Key Usage', placeholder: 'Allowed uses', example: 'Encryption, Signing', icon: 'fingerprint' },
];

const PIECE_COLORS = [
  '#7C3AED', '#60A5FA', '#4ADE80', '#FACC15',
  '#F472B6', '#FB923C', '#A78BFA', '#34D399',
];

function generatePieces(fields: CertField[]): CertPiece[] {
  return fields.map((f, i) => ({
    id: `piece-${f.id}`,
    fieldId: f.id,
    value: f.example,
    color: PIECE_COLORS[i % PIECE_COLORS.length],
  })).sort(() => Math.random() - 0.5);
}

function buildLevels(fields: CertField[]): LevelConfig[] {
  return [
    {
      id: 1,
      name: 'Cert Builder Basic',
      description: 'Build a certificate with 4 essential fields!',
      mode: 'assemble',
      fields: ['subject', 'issuer', 'validFrom', 'validUntil'].map((id) => fields.find((f) => f.id === id)!),
    },
    {
      id: 2,
      name: 'Add Security',
      description: 'Add the Public Key and Algorithm fields!',
      mode: 'assemble',
      fields: ['subject', 'issuer', 'validFrom', 'validUntil', 'publicKey', 'algorithm'].map((id) => fields.find((f) => f.id === id)!),
    },
    {
      id: 3,
      name: 'Complete Certificate',
      description: 'Assemble a full certificate with all 8 fields!',
      mode: 'assemble',
      fields,
    },
    {
      id: 4,
      name: 'Cert Inspector',
      description: 'Find and fix the broken field in this certificate!',
      mode: 'fix',
      fields,
      brokenField: 'validUntil',
      brokenValue: 'Feb 1, 2024 (EXPIRED!)',
    },
  ];
}

function buildOpsFields({ target }: NonNullable<OpsContextProps['opsContext']>): CertField[] {
  const examples: Record<string, string> = {
    subject: target.certificate.subject,
    issuer: target.certificate.issuer,
    validFrom: target.certificate.validFrom,
    validUntil: target.certificate.validTo,
    publicKey: 'RSA 2048-bit',
    algorithm: 'SHA-256',
    serial: target.certificate.serialNumber,
    keyUsage: 'Digital Signature, Key Encipherment',
  };
  return ALL_FIELDS.map((field) => ({ ...field, example: examples[field.id] ?? field.example }));
}

function FieldIcon({ icon, size = 16 }: { icon: CertField['icon']; size?: number }) {
  const props = { size, strokeWidth: 3, className: 'text-white' };
  switch (icon) {
    case 'key': return <Key {...props} />;
    case 'shield': return <Shield {...props} />;
    case 'calendar': return <Calendar {...props} />;
    case 'hash': return <Hash {...props} />;
    case 'settings': return <Settings {...props} />;
    case 'fingerprint': return <Fingerprint {...props} />;
    case 'filekey': return <FileKey {...props} />;
  }
}

export default function CertChampion({ onScoreChange, opsContext }: Props) {
  const fields = useMemo(() => opsContext ? buildOpsFields(opsContext) : ALL_FIELDS, [opsContext]);
  const levels = useMemo(() => buildLevels(fields), [fields]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'allComplete' | 'gameOver'>('menu');
  const [slots, setSlots] = useState<Record<string, CertPiece | null>>({});
  const [pieces, setPieces] = useState<CertPiece[]>([]);
  const [score, setScore] = useState(0);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [slotStatus, setSlotStatus] = useState<Record<string, 'correct' | 'wrong' | 'empty'>>({});
  const [lockState, setLockState] = useState<'open' | 'closing' | 'locked'>('open');
  const [confetti, setConfetti] = useState(false);
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [foundBrokenField, setFoundBrokenField] = useState(false);

  const level = levels[currentLevel];

  const initLevel = useCallback((lvlIdx: number) => {
    const lvl = levels[lvlIdx];
    const initialSlots: Record<string, CertPiece | null> = {};
    const initialStatus: Record<string, 'correct' | 'wrong' | 'empty'> = {};

    if (lvl.mode === 'fix') {
      // Pre-fill all fields with correct values except broken one
      lvl.fields.forEach((f) => {
        if (f.id === lvl.brokenField) {
          initialSlots[f.id] = {
            id: `piece-${f.id}-broken`,
            fieldId: f.id,
            value: lvl.brokenValue!,
            color: '#F87171',
          };
          initialStatus[f.id] = 'wrong';
        } else {
          initialSlots[f.id] = {
            id: `piece-${f.id}`,
            fieldId: f.id,
            value: f.example,
            color: '#4ADE80',
          };
          initialStatus[f.id] = 'correct';
        }
      });
      setPieces([{
        id: 'fix-piece',
        fieldId: lvl.brokenField!,
        value: fields.find((f) => f.id === lvl.brokenField)!.example,
        color: '#4ADE80',
      }]);
    } else {
      lvl.fields.forEach((f) => {
        initialSlots[f.id] = null;
        initialStatus[f.id] = 'empty';
      });
      setPieces(generatePieces(lvl.fields));
    }

    setSlots(initialSlots);
    setSlotStatus(initialStatus);
    setSelectedPiece(null);
    setLockState('open');
    setConfetti(false);
    setMessage(lvl.mode === 'fix' ? 'Find the broken field and fix it!' : 'Fill in all certificate fields!');
    setFoundBrokenField(false);
    setGameState('playing');
  }, [fields, levels]);

  const startGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setAttempts(0);
    onScoreChange(0);
    initLevel(0);
  };

  const handlePieceClick = (piece: CertPiece) => {
    if (gameState !== 'playing') return;
    setSelectedPiece(selectedPiece === piece.id ? null : piece.id);
  };

  const handleSlotClick = (fieldId: string) => {
    if (gameState !== 'playing') return;

    if (level.mode === 'fix') {
      if (fieldId === level.brokenField) {
        const correctPiece = pieces[0];
        setSlots((prev) => ({ ...prev, [fieldId]: correctPiece }));
        setSlotStatus((prev) => ({ ...prev, [fieldId]: 'correct' }));
        setFoundBrokenField(true);
        setMessage('Fixed! The certificate is now valid!');

        // Animate lock
        setTimeout(() => setLockState('closing'), 300);
        setTimeout(() => {
          setLockState('locked');
          setConfetti(true);
          const newScore = score + 100;
          setScore(newScore);
          onScoreChange(Math.min(100, newScore));
          setTimeout(() => setConfetti(false), 3000);
          setGameState('levelComplete');
        }, 800);
      } else {
        setMessage('That field looks fine. Find the broken one!');
        setAttempts((a) => a + 1);
      }
      return;
    }

    if (!selectedPiece) {
      // If slot has a piece, remove it
      if (slots[fieldId]) {
        const existing = slots[fieldId]!;
        setPieces((prev) => [...prev, existing]);
        setSlots((prev) => ({ ...prev, [fieldId]: null }));
        setSlotStatus((prev) => ({ ...prev, [fieldId]: 'empty' }));
      }
      return;
    }

    const piece = pieces.find((p) => p.id === selectedPiece);
    if (!piece) return;

    // Check if piece matches the field
    const correct = piece.fieldId === fieldId;

    if (correct) {
      // Return any existing piece in slot back to pool
      if (slots[fieldId]) {
        setPieces((prev) => [...prev, slots[fieldId]!]);
      }

      setSlots((prev) => ({ ...prev, [fieldId]: piece }));
      setSlotStatus((prev) => ({ ...prev, [fieldId]: 'correct' }));
      setPieces((prev) => prev.filter((p) => p.id !== selectedPiece));
      setSelectedPiece(null);

      // Check if all slots filled
      const newSlots = { ...slots, [fieldId]: piece };
      const allFilled = level.fields.every((f) => newSlots[f.id] !== null);

      if (allFilled) {
        setMessage('Certificate complete! Locking...');
        setTimeout(() => setLockState('closing'), 300);
        setTimeout(() => {
          setLockState('locked');
          setConfetti(true);
          const baseScore = 100;
          const penalty = attempts * 5;
          const finalScore = Math.max(20, baseScore - penalty);
          const newTotal = score + finalScore;
          setScore(newTotal);
          onScoreChange(Math.min(100, newTotal));
          setTimeout(() => setConfetti(false), 3000);

          if (currentLevel >= levels.length - 1) {
            setGameState('allComplete');
          } else {
            setGameState('levelComplete');
          }
        }, 800);
      } else {
        setMessage('Great! Keep filling in the fields!');
      }
    } else {
      setSlotStatus((prev) => ({ ...prev, [fieldId]: 'wrong' }));
      setAttempts((a) => a + 1);
      setMessage('Wrong field! This piece belongs somewhere else.');

      // Bounce animation - reset after delay
      setTimeout(() => {
        setSlotStatus((prev) => ({ ...prev, [fieldId]: slots[fieldId] ? 'correct' : 'empty' }));
      }, 800);
    }
  };

  const nextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel((prev) => prev + 1);
      initLevel(currentLevel + 1);
    }
  };

  // Menu screen
  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="w-full max-w-lg bg-purple-dark rounded-2xl border-4 border-black p-6 flex flex-col items-center gap-3 card-shadow">
          <div className="relative">
            <Unlock size={48} strokeWidth={3} className="text-yellow-accent" />
          </div>
          <h2 className="font-fredoka text-2xl text-white text-outline-sm">Cert Champion</h2>
          <p className="font-nunito text-sm text-purple-lighter text-center">
            Assemble digital certificates piece by piece! Learn what makes a website secure with HTTPS.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Shield size={18} strokeWidth={3} className="text-green-success" />
            <span className="font-nunito text-xs text-purple-lighter">4 Levels</span>
            <span className="text-purple-lighter">|</span>
            <Key size={18} strokeWidth={3} className="text-yellow-accent" />
            <span className="font-nunito text-xs text-purple-lighter">Assemble &amp; Fix</span>
          </div>
          <button
            onClick={startGame}
            className="mt-2 px-8 py-3 bg-green-success text-black border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Zap size={20} strokeWidth={3} />
            Start Building
          </button>
        </div>

        {/* What is a Certificate */}
        <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4 card-shadow">
          <h3 className="font-fredoka text-lg text-purple-dark mb-2 text-center">What is a Digital Certificate?</h3>
          <p className="font-nunito text-xs text-purple-dark text-center mb-3">
            A digital certificate is like an ID card for a website. It proves the site is who it says it is!
          </p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { icon: Key, label: 'Subject', desc: 'Who it\'s for' },
              { icon: Shield, label: 'Issuer', desc: 'Who trusts it' },
              { icon: Calendar, label: 'Dates', desc: 'When it\'s valid' },
              { icon: FileKey, label: 'Public Key', desc: 'Secret code' },
            ]).map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-2 bg-purple-pale rounded-xl border-2 border-black p-2">
                <div className="w-8 h-8 rounded-full bg-purple-primary border-2 border-black flex items-center justify-center flex-shrink-0">
                  <Icon size={14} strokeWidth={3} className="text-white" />
                </div>
                <div>
                  <p className="font-nunito text-[10px] font-bold text-purple-dark">{label}</p>
                  <p className="font-nunito text-[9px] text-purple-light">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allFilled = level.fields.every((f) => slots[f.id] !== null);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* HUD */}
      <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-nunito text-xs font-bold text-purple-lighter">Lvl {level.id}</span>
          <span className="font-nunito text-xs font-bold text-white">{level.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {lockState === 'open' && <Unlock size={16} strokeWidth={3} className="text-yellow-accent" />}
          {lockState === 'closing' && <Lock size={16} strokeWidth={3} className="text-yellow-accent animate-pulse" />}
          {lockState === 'locked' && <Lock size={16} strokeWidth={3} className="text-green-success" />}
        </div>
        <div className="font-nunito text-xs font-bold text-green-success">Score: {score}</div>
      </div>

      {/* Message */}
      <div className="w-full max-w-lg bg-blue-info rounded-xl border-[3px] border-black px-3 py-2">
        <p className="font-nunito text-xs text-center font-bold text-white">{message}</p>
      </div>

      {/* Certificate Assembly Board */}
      <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4 card-shadow relative overflow-hidden">
        {/* HTTPS Banner */}
        <AnimatePresence>
          {lockState === 'locked' && (
            <motion.div
              initial={{ y: -40 }}
              animate={{ y: 0 }}
              className="absolute top-0 left-0 right-0 bg-green-success border-b-[3px] border-black py-1 flex items-center justify-center gap-1 z-10"
            >
              <ShieldCheck size={14} strokeWidth={3} className="text-black" />
              <span className="font-nunito text-xs font-bold text-black">HTTPS SECURE</span>
              <ShieldCheck size={14} strokeWidth={3} className="text-black" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Certificate Header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <motion.div
            animate={
              lockState === 'open'
                ? { rotate: [0, -10, 10, 0] }
                : lockState === 'closing'
                ? { scale: [1, 1.2, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.5 }}
          >
            {lockState === 'locked' ? (
              <Lock size={28} strokeWidth={3} className="text-green-success" />
            ) : (
              <Unlock size={28} strokeWidth={3} className="text-yellow-accent" />
            )}
          </motion.div>
          <h3 className={`font-fredoka text-lg ${lockState === 'locked' ? 'text-green-success' : 'text-purple-dark'}`}>
            {lockState === 'locked' ? 'Certificate Valid!' : 'Certificate Assembly'}
          </h3>
        </div>

        {/* Certificate Fields */}
        <div className="space-y-2">
          {level.fields.map((field) => {
            const piece = slots[field.id];
            const status = slotStatus[field.id];

            return (
              <motion.div
                key={field.id}
                onClick={() => handleSlotClick(field.id)}
                className={`relative flex items-center gap-2 p-2 rounded-xl border-[3px] border-black cursor-pointer transition-colors ${
                  status === 'correct'
                    ? 'bg-green-success/20'
                    : status === 'wrong'
                    ? 'bg-red-alert/20'
                    : 'bg-purple-pale hover:bg-purple-lighter'
                }`}
                animate={status === 'wrong' ? { x: [-4, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                {/* Field Icon */}
                <div
                  className="w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: piece ? piece.color : '#DDD6FE' }}
                >
                  {piece ? <Check size={14} strokeWidth={4} className="text-white" /> : <FieldIcon icon={field.icon} size={14} />}
                </div>

                {/* Field Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-nunito text-[10px] font-bold text-purple-dark">{field.label}</p>
                  {piece ? (
                    <p className="font-mono text-xs text-purple-dark truncate">{piece.value}</p>
                  ) : (
                    <p className="font-nunito text-xs text-purple-light italic">{field.placeholder}</p>
                  )}
                </div>

                {/* Status Indicator */}
                {status === 'correct' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-green-success border-2 border-black flex items-center justify-center flex-shrink-0"
                  >
                    <Check size={12} strokeWidth={4} className="text-black" />
                  </motion.div>
                )}
                {status === 'wrong' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-red-alert border-2 border-black flex items-center justify-center flex-shrink-0"
                  >
                    <X size={12} strokeWidth={4} className="text-white" />
                  </motion.div>
                )}
                {status === 'empty' && level.mode === 'fix' && field.id === level.brokenField && (
                  <div className="w-6 h-6 rounded-full bg-red-alert border-2 border-black flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={12} strokeWidth={3} className="text-white" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Confetti */}
        <AnimatePresence>
          {confetti && (
            <>
              {Array.from({ length: 16 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full border-2 border-black"
                  style={{
                    backgroundColor: ['#4ADE80', '#FACC15', '#60A5FA', '#F472B6', '#7C3AED'][i % 5],
                    left: `${5 + (i % 8) * 12}%`,
                    top: '30%',
                  }}
                  initial={{ y: 0, scale: 0 }}
                  animate={{
                    y: [0, -60 - Math.random() * 40, 150],
                    x: [(Math.random() - 0.5) * 80],
                    rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                    scale: [0, 1, 0.5],
                  }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Pieces Pool */}
      {gameState === 'playing' && pieces.length > 0 && (
        <div className="w-full max-w-lg bg-purple-pale rounded-2xl border-4 border-black p-3 card-shadow">
          <p className="font-nunito text-xs font-bold text-purple-dark mb-2 text-center">
            {level.mode === 'fix' ? 'Fix Piece Available:' : 'Certificate Pieces:'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {pieces.map((piece) => (
              <motion.button
                key={piece.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handlePieceClick(piece)}
                className={`flex items-center gap-1.5 px-3 py-2 border-[3px] border-black rounded-xl font-nunito text-xs font-bold transition-all ${
                  selectedPiece === piece.id
                    ? 'bg-yellow-accent text-black scale-105'
                    : 'bg-white text-purple-dark hover:bg-purple-lighter'
                }`}
                style={
                  selectedPiece === piece.id
                    ? { boxShadow: '4px 4px 0px 0px #3B0764' }
                    : {}
                }
              >
                <div
                  className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center"
                  style={{ backgroundColor: piece.color }}
                >
                  <FieldIcon
                    icon={fields.find((f) => f.id === piece.fieldId)?.icon || 'key'}
                    size={10}
                  />
                </div>
                {piece.value}
              </motion.button>
            ))}
          </div>
          {selectedPiece && (
            <p className="font-nunito text-[10px] text-purple-dark text-center mt-2">
              Click a field above to place the piece!
            </p>
          )}
        </div>
      )}

      {/* Level Complete */}
      <AnimatePresence>
        {gameState === 'levelComplete' && (
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg bg-green-success rounded-2xl border-4 border-black p-5 flex flex-col items-center gap-2 card-shadow"
          >
            <Award size={40} strokeWidth={3} className="text-white" />
            <h3 className="font-fredoka text-xl text-white text-outline-sm">Level {level.id} Complete!</h3>
            <p className="font-nunito text-xs text-white text-center">
              {level.mode === 'fix'
                ? 'You found and fixed the broken field!'
                : 'Certificate assembled successfully!'}
            </p>
            <div className="font-nunito text-sm font-bold text-white">Score: {score}</div>
            <button
              onClick={nextLevel}
              className="mt-1 px-6 py-2 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform flex items-center gap-1"
            >
              Next Level
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Complete */}
      <AnimatePresence>
        {gameState === 'allComplete' && (
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg bg-yellow-accent rounded-2xl border-4 border-black p-5 flex flex-col items-center gap-2 card-shadow"
          >
            <Trophy size={40} strokeWidth={3} className="text-purple-dark" />
            <h3 className="font-fredoka text-xl text-purple-dark">Cert Champion!</h3>
            <p className="font-nunito text-xs text-purple-dark text-center">
              You mastered digital certificates and HTTPS!
            </p>
            <div className="font-nunito text-lg font-bold text-purple-dark">Final Score: {score}</div>
            <button
              onClick={startGame}
              className="mt-1 px-6 py-2 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform flex items-center gap-1"
            >
              <RotateCcw size={16} strokeWidth={3} />
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setAttempts((a) => a + 1);
            initLevel(currentLevel);
          }}
          disabled={gameState !== 'playing'}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light transition-colors hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} strokeWidth={3} />
          Restart Level
        </button>
      </div>
    </div>
  );
}
