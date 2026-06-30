import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Shield, Unlock, ArrowRight, ArrowLeft, Check, X,
  RotateCcw, ChevronRight, Trophy, Star, Server, Laptop, Zap
} from 'lucide-react';
import type { OpsContextProps } from '@/lib/opsContext';

interface Props extends OpsContextProps {
  onScoreChange: (score: number) => void;
}

interface HandshakeStep {
  id: string;
  label: string;
  detail: string;
  from: 'client' | 'server';
  icon: 'hello' | 'cert' | 'key' | 'cipher' | 'finished';
}

interface LevelConfig {
  id: number;
  name: string;
  description: string;
  steps: HandshakeStep[];
  hints: string[];
}

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Basic Handshake',
    description: 'Order the 4 main SSL handshake steps.',
    hints: ['The client always speaks first!', 'Server responds with its identity.', 'Keys are exchanged next.', "Finished means we're done!"],
    steps: [
      { id: 's1', label: 'Client Hello', detail: 'Client sends TLS version + cipher suites + random bytes', from: 'client', icon: 'hello' },
      { id: 's2', label: 'Server Hello', detail: 'Server chooses cipher suite + sends server random', from: 'server', icon: 'hello' },
      { id: 's3', label: 'Key Exchange', detail: 'Client generates pre-master secret', from: 'client', icon: 'key' },
      { id: 's4', label: 'Finished', detail: 'Handshake complete! Secure channel ready', from: 'server', icon: 'finished' },
    ],
  },
  {
    id: 2,
    name: 'Full Handshake',
    description: 'Order all 6 standard SSL/TLS handshake steps.',
    hints: ['Client Hello is always first.', 'Server sends its certificate to prove identity.', 'After certificates come key exchange.', 'Cipher spec change signals encryption switch.', 'Finished confirms on both sides!'],
    steps: [
      { id: 's1', label: 'Client Hello', detail: 'TLS version, cipher suites, client random', from: 'client', icon: 'hello' },
      { id: 's2', label: 'Server Hello', detail: 'Chosen cipher, server random', from: 'server', icon: 'hello' },
      { id: 's3', label: 'Certificate', detail: 'Server sends public key certificate', from: 'server', icon: 'cert' },
      { id: 's4', label: 'Key Exchange', detail: 'Client sends pre-master secret (encrypted)', from: 'client', icon: 'key' },
      { id: 's5', label: 'Change Cipher Spec', detail: 'Switch to encrypted communication', from: 'client', icon: 'cipher' },
      { id: 's6', label: 'Finished', detail: 'Both sides confirm - HTTPS ready!', from: 'server', icon: 'finished' },
    ],
  },
  {
    id: 3,
    name: 'Mutual TLS',
    description: 'Order the Mutual TLS handshake with client certificate!',
    hints: ['Regular handshake first...', 'But the server also asks WHO the client is!', 'Client proves identity with a certificate too.', 'Then keys, cipher change, and done!'],
    steps: [
      { id: 's1', label: 'Client Hello', detail: 'TLS version, cipher suites, client random', from: 'client', icon: 'hello' },
      { id: 's2', label: 'Server Hello', detail: 'Chosen cipher, server random', from: 'server', icon: 'hello' },
      { id: 's3', label: 'Certificate', detail: 'Server public key certificate', from: 'server', icon: 'cert' },
      { id: 's4', label: 'Cert Request', detail: 'Server asks for client certificate', from: 'server', icon: 'cert' },
      { id: 's5', label: 'Client Certificate', detail: 'Client sends its own certificate', from: 'client', icon: 'cert' },
      { id: 's6', label: 'Key Exchange', detail: 'Pre-master secret exchange', from: 'client', icon: 'key' },
      { id: 's7', label: 'Change Cipher Spec', detail: 'Both sides switch to encrypted', from: 'server', icon: 'cipher' },
      { id: 's8', label: 'Finished', detail: 'Mutual TLS complete!', from: 'client', icon: 'finished' },
    ],
  },
];

function buildOpsLevels({ target }: NonNullable<OpsContextProps['opsContext']>): LevelConfig[] {
  return LEVELS.map((level, levelIndex) => ({
    ...level,
    name: levelIndex === 0
      ? `${target.platformName} Basic TLS`
      : levelIndex === 1
        ? `${target.platformName} Certificate Flow`
        : `${target.platformName} Mutual TLS`,
    description: level.description.replace('SSL', `${target.primaryDomain} TLS`).replace('standard SSL/TLS', `${target.primaryDomain} TLS`),
    hints: [
      `Client ${target.ips.client} starts the handshake with ${target.hosts.app}.`,
      `Server identity must match ${target.certificate.subject}.`,
      `Trust anchor is ${target.certificate.issuer}.`,
      `Finish only after the encrypted channel protects ${target.sessionCookieName}.`,
    ],
    steps: level.steps.map((step) => ({
      ...step,
      detail: step.id === 's1'
        ? `Client offers TLS options to ${target.primaryDomain}`
        : step.id === 's2'
          ? `${target.hosts.app} selects cipher and server random`
          : step.label === 'Certificate'
            ? `${target.certificate.subject} issued by ${target.certificate.issuer}`
            : step.label === 'Cert Request'
              ? `${target.hosts.app} requests client identity for ${target.adminUser}`
              : step.label === 'Client Certificate'
                ? `${target.standardUser} presents a lab client certificate`
                : step.label === 'Key Exchange'
                  ? `Pre-master secret protects ${target.apiName}`
                  : step.label === 'Change Cipher Spec'
                    ? `Switch traffic for ${target.sessionCookieName} to encrypted mode`
                    : `Secure channel ready for ${target.platformName}`,
    })),
  }));
}

const STEP_COLORS: Record<string, string> = {
  hello: '#7C3AED',
  cert: '#60A5FA',
  key: '#FACC15',
  cipher: '#4ADE80',
  finished: '#F472B6',
};

function StepIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const color = '#FFFFFF';
  switch (icon) {
    case 'hello': return <Zap size={size} strokeWidth={3} color={color} />;
    case 'cert': return <Shield size={size} strokeWidth={3} color={color} />;
    case 'key': return <KeyIcon size={size} color={color} />;
    case 'cipher': return <Lock size={size} strokeWidth={3} color={color} />;
    case 'finished': return <Check size={size} strokeWidth={4} color={color} />;
    default: return <ArrowRight size={size} strokeWidth={3} color={color} />;
  }
}

function KeyIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3Z" />
    </svg>
  );
}

export default function SSLHandshake({ onScoreChange, opsContext }: Props) {
  const levels = useMemo(() => opsContext ? buildOpsLevels(opsContext) : LEVELS, [opsContext]);
  const clientLabel = opsContext?.target.standardUser ?? 'Client';
  const serverLabel = opsContext?.target.primaryDomain ?? 'Server';
  const [currentLevel, setCurrentLevel] = useState(0);
  const [orderedSteps, setOrderedSteps] = useState<string[]>([]);
  const [availableSteps, setAvailableSteps] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [levelComplete, setLevelComplete] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [message, setMessage] = useState('');
  const [shakeWrong, setShakeWrong] = useState(false);
  const [successArrows, setSuccessArrows] = useState(false);
  const [levelScores, setLevelScores] = useState<(number | null)[]>(new Array(levels.length).fill(null));
  const [levelStars, setLevelStars] = useState<(number | null)[]>(new Array(levels.length).fill(null));
  const [totalScore, setTotalScore] = useState(0);

  const level = levels[currentLevel] ?? levels[0];

  const initLevel = useCallback(() => {
    const shuffled = [...level.steps.map((s) => s.id)].sort(() => Math.random() - 0.5);
    setAvailableSteps(shuffled);
    setOrderedSteps([]);
    setLevelComplete(false);
    setSuccessArrows(false);
    setShakeWrong(false);
    setMessage(`Level ${level.id}: ${level.name} - Click steps in the correct handshake order!`);
  }, [level]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  const getStep = (id: string) => level.steps.find((s) => s.id === id)!;

  const handleStepClick = (stepId: string) => {
    if (levelComplete || allComplete) return;

    const step = getStep(stepId);
    const correctOrder = level.steps.map((s) => s.id);
    const nextIndex = orderedSteps.length;

    if (correctOrder[nextIndex] === stepId) {
      // Correct!
      const newOrdered = [...orderedSteps, stepId];
      setOrderedSteps(newOrdered);
      setAvailableSteps((prev) => prev.filter((id) => id !== stepId));
      setMessage(`Correct! ${step.label} - ${step.detail}`);

      if (newOrdered.length === level.steps.length) {
        // Level complete!
        const baseScore = 100;
        const penalty = attempts * 10;
        const finalScore = Math.max(20, baseScore - penalty);
        const stars = finalScore >= 90 ? 3 : finalScore >= 60 ? 2 : 1;

        setLevelComplete(true);
        setSuccessArrows(true);
        setTotalScore((prev) => prev + finalScore);
        onScoreChange(totalScore + finalScore);

        setLevelScores((prev) => {
          const u = [...prev];
          u[currentLevel] = finalScore;
          return u;
        });
        setLevelStars((prev) => {
          const u = [...prev];
          u[currentLevel] = stars;
          return u;
        });

        if (currentLevel >= levels.length - 1) {
          setAllComplete(true);
          setMessage('Secure Connection Established! All levels complete!');
        } else {
          setMessage(`Level Complete! All steps in correct order!`);
        }
      }
    } else {
      // Wrong!
      setAttempts((a) => a + 1);
      setShakeWrong(true);
      setMessage(`Wrong order! ${step.label} does not come next. Try again!`);
      setTimeout(() => setShakeWrong(false), 600);
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < levels.length - 1) {
      const nextLevel = currentLevel + 1;
      setCurrentLevel(nextLevel);
      setAttempts(0);
      const newShuffled = [...levels[nextLevel].steps.map((s) => s.id)].sort(() => Math.random() - 0.5);
      setAvailableSteps(newShuffled);
      setOrderedSteps([]);
      setLevelComplete(false);
      setSuccessArrows(false);
      setShakeWrong(false);
      setMessage(`Level ${nextLevel + 1}: ${levels[nextLevel].name} - Click steps in the correct handshake order!`);
    }
  };

  const handleRetryLevel = () => {
    setAttempts(0);
    initLevel();
  };

  const handleResetAll = () => {
    setCurrentLevel(0);
    setScore(0);
    setAttempts(0);
    setLevelScores(new Array(levels.length).fill(null));
    setLevelStars(new Array(levels.length).fill(null));
    setTotalScore(0);
    setAllComplete(false);
    setOrderedSteps([]);
    const shuffled = [...levels[0].steps.map((s) => s.id)].sort(() => Math.random() - 0.5);
    setAvailableSteps(shuffled);
    setLevelComplete(false);
    setSuccessArrows(false);
    setMessage(`Level 1: ${levels[0].name} - Click steps in the correct handshake order!`);
    onScoreChange(0);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Title */}
      <div className="text-center">
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">SSL Handshake</h2>
        <p className="font-nunito text-xs text-purple-dark mt-1">
          Build the target TLS handshake by ordering steps correctly!
        </p>
      </div>

      {/* HUD */}
      <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-nunito text-xs font-bold text-purple-lighter">Lvl {level.id}</span>
          <span className="font-nunito text-xs font-bold text-white">{level.name}</span>
        </div>
        <div className="font-nunito text-xs font-bold text-yellow-accent">Score: {totalScore}</div>
        <div className="font-nunito text-xs text-purple-lighter">
          {orderedSteps.length}/{level.steps.length}
        </div>
      </div>

      {/* Message */}
      <div
        className={`w-full max-w-lg rounded-xl border-[3px] border-black px-3 py-2 ${
          shakeWrong ? 'bg-red-alert' : levelComplete ? 'bg-green-success' : 'bg-blue-info'
        }`}
      >
        <p className="font-nunito text-xs text-center font-bold text-white">{message}</p>
      </div>

      {/* Diagram Area */}
      <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4 relative" style={{ minHeight: 380 }}>
        {/* Client and Server Labels */}
        <div className="flex justify-between mb-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-2xl bg-green-success border-[3px] border-black flex items-center justify-center">
              <Laptop size={28} strokeWidth={3} className="text-white" />
            </div>
            <span className="font-nunito text-xs font-bold text-purple-dark">{clientLabel}</span>
          </div>

          <div className="flex items-center gap-1">
            <Lock
              size={20}
              strokeWidth={3}
              className={levelComplete ? 'text-green-success' : 'text-purple-light'}
            />
            <span className="font-nunito text-xs font-bold text-purple-dark">
              {levelComplete ? 'Encrypted!' : 'Plain Text'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-2xl bg-blue-info border-[3px] border-black flex items-center justify-center">
              <Server size={28} strokeWidth={3} className="text-white" />
            </div>
            <span className="font-nunito text-xs font-bold text-purple-dark">{serverLabel}</span>
          </div>
        </div>

        {/* Connection Line */}
        <div className="relative mx-auto" style={{ width: '80%', height: 2, backgroundColor: levelComplete ? '#4ADE80' : '#DDD6FE' }}>
          {orderedSteps.length > 0 && (
            <motion.div
              className="absolute top-0 left-0 h-full bg-yellow-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(orderedSteps.length / level.steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>

        {/* Ordered Steps */}
        <div className="mt-4 space-y-2">
          <p className="font-nunito text-xs font-bold text-purple-dark mb-1">Handshake Flow:</p>
          {orderedSteps.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed border-purple-lighter rounded-xl">
              <span className="font-nunito text-xs text-purple-light">Click steps below to build the handshake</span>
            </div>
          ) : (
            orderedSteps.map((stepId, index) => {
              const step = getStep(stepId);
              const color = STEP_COLORS[step.icon];
              return (
                <motion.div
                  key={`ordered-${index}-${stepId}`}
                  initial={{ x: step.from === 'client' ? -50 : 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`flex items-center gap-3 p-2 rounded-xl border-[3px] border-black`}
                  style={{ backgroundColor: color }}
                >
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center flex-shrink-0">
                    <span className="font-nunito text-xs font-bold text-black">{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    {step.from === 'client' ? (
                      <ArrowRight size={16} strokeWidth={3} className="text-white flex-shrink-0" />
                    ) : (
                      <ArrowLeft size={16} strokeWidth={3} className="text-white flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-nunito text-sm font-bold text-white block">{step.label}</span>
                      <span className="font-nunito text-[10px] text-white/90">{step.detail}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StepIcon icon={step.icon} size={16} />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Arrow animations between steps when correct */}
        <AnimatePresence>
          {successArrows && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-success rounded-full border-[3px] border-black">
                <Lock size={18} strokeWidth={3} className="text-white" />
                <span className="font-nunito text-sm font-bold text-white">Secure Connection Established!</span>
                <Shield size={18} strokeWidth={3} className="text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Available Steps */}
        {!levelComplete && (
          <div className="mt-4">
            <p className="font-nunito text-xs font-bold text-purple-dark mb-2">Available Steps:</p>
            <div
              className={`flex flex-wrap gap-2 ${shakeWrong ? 'animate-pulse' : ''}`}
              style={shakeWrong ? { transform: 'translateX(0)' } : {}}
            >
              {availableSteps.map((stepId) => {
                const step = getStep(stepId);
                const color = STEP_COLORS[step.icon];
                return (
                  <motion.button
                    key={stepId}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleStepClick(stepId)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-[3px] border-black font-nunito text-xs font-bold text-white hover:brightness-110 transition-all"
                    style={{ backgroundColor: color }}
                  >
                    <StepIcon icon={step.icon} size={12} />
                    {step.label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Level Complete Modal */}
      <AnimatePresence>
        {levelComplete && (
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg bg-green-success rounded-2xl border-4 border-black p-4 flex flex-col items-center gap-2"
            style={{ boxShadow: '8px 8px 0px 0px #000000' }}
          >
            <Trophy size={32} strokeWidth={3} className="text-yellow-accent" />
            <h3 className="font-fredoka text-xl text-black text-outline-sm">
              {allComplete ? 'All Levels Complete!' : `Level ${level.id} Complete!`}
            </h3>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  size={24}
                  strokeWidth={2}
                  className={s <= (levelStars[currentLevel] || 0) ? 'text-yellow-accent' : 'text-black/20'}
                  fill={s <= (levelStars[currentLevel] || 0) ? '#FACC15' : 'transparent'}
                />
              ))}
            </div>
            <p className="font-nunito text-sm font-bold text-black">
              Score: {levelScores[currentLevel]}
            </p>
            {!allComplete ? (
              <button
                onClick={handleNextLevel}
                className="flex items-center gap-1 px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark transition-colors hover:scale-105"
              >
                Next Level
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            ) : (
              <button
                onClick={handleResetAll}
                className="flex items-center gap-1 px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark transition-colors hover:scale-105"
              >
                <RotateCcw size={16} strokeWidth={3} />
                Play Again
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleRetryLevel}
          disabled={levelComplete}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light transition-colors hover:scale-105 disabled:opacity-50"
        >
          <RotateCcw size={14} strokeWidth={3} />
          Retry
        </button>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light transition-colors hover:scale-105"
        >
          <Unlock size={14} strokeWidth={3} />
          Reset All
        </button>
      </div>

      {/* Legend */}
      <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-3">
        <p className="font-nunito text-xs font-bold text-purple-dark mb-2 text-center">Step Types</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {Object.entries(STEP_COLORS).map(([icon, color]) => (
            <div key={icon} className="flex items-center gap-1">
              <div
                className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <StepIcon icon={icon} size={8} />
              </div>
              <span className="font-nunito text-[10px] text-purple-dark capitalize">{icon}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
