import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, RotateCcw, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface CryptoCatProps {
  onScoreChange: (score: number) => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const challenges = [
  { plaintext: 'HELLO', hint: 'A greeting word' },
  { plaintext: 'SECRET', hint: 'Something hidden' },
  { plaintext: 'SAFE', hint: 'Being protected' },
  { plaintext: 'CRYPTO', hint: 'Short for cryptography' },
  { plaintext: 'SHIELD', hint: 'A defensive tool' },
];

function caesarCipher(text: string, shift: number): string {
  return text
    .split('')
    .map((char) => {
      const idx = ALPHABET.indexOf(char);
      if (idx === -1) return char;
      return ALPHABET[(idx + shift + 26) % 26];
    })
    .join('');
}

export default function CryptoCat({ onScoreChange }: CryptoCatProps) {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [shift, setShift] = useState(0);
  const [solved, setSolved] = useState<number[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const challenge = challenges[currentChallenge];
  const shiftValue = useMemo(() => Math.floor(Math.random() * 10) + 3, [currentChallenge]);
  const encrypted = useMemo(() => caesarCipher(challenge.plaintext, shiftValue), [challenge, shiftValue]);

  const wheelLetters = ALPHABET.split('');
  const shiftedLetters = wheelLetters.map((_, i) => wheelLetters[(i + shift) % 26]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleShiftChange = (delta: number) => {
    setShift((prev) => ((prev + delta + 26) % 26));
  };

  const handleGuess = () => {
    const decoded = caesarCipher(encrypted, shift);
    if (decoded === challenge.plaintext) {
      if (!solved.includes(currentChallenge)) {
        const newSolved = [...solved, currentChallenge];
        setSolved(newSolved);
        const newScore = Math.min(100, Math.max(0, ((newSolved.length) / challenges.length) * 100));
        onScoreChange(newScore);
      }
      setShowSuccess(true);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const handleReset = () => {
    setShift(0);
    setShowSuccess(false);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  };

  const handleNext = () => {
    if (currentChallenge < challenges.length - 1) {
      setCurrentChallenge(currentChallenge + 1);
      setShift(0);
      setShowSuccess(false);
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Progress */}
      <div className="w-full max-w-lg flex items-center justify-between">
        <span className="font-nunito text-sm font-semibold text-purple-dark">
          Challenge {currentChallenge + 1} of {challenges.length}
        </span>
        <div className="flex items-center gap-2">
          {challenges.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-[2px] border-black ${
                solved.includes(i) ? 'bg-green-success' : i === currentChallenge ? 'bg-yellow-accent' : 'bg-purple-lighter'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Encrypted Message Display */}
      <div className="w-full max-w-lg bg-purple-dark rounded-2xl border-4 border-black p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Lock size={24} strokeWidth={3} className="text-yellow-accent" />
          <span className="font-nunito text-sm font-bold text-purple-lighter uppercase tracking-wider">
            Encrypted Message
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          {encrypted.split('').map((char, i) => (
            <motion.div
              key={i}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: showSuccess ? 180 : 0 }}
              className="w-12 h-14 bg-purple-darker rounded-lg border-[3px] border-black flex items-center justify-center"
            >
              <span className="font-fredoka font-bold text-2xl text-yellow-accent">
                {char}
              </span>
            </motion.div>
          ))}
        </div>
        <p className="font-nunito text-xs text-purple-lighter">
          Hint: {challenge.hint}
        </p>
      </div>

      {/* Caesar Cipher Wheel */}
      <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-6">
        <h4 className="font-nunito font-bold text-sm text-purple-dark mb-4 text-center">
          Caesar Cipher Wheel — Shift: {shift}
        </h4>

        {/* Outer ring (encrypted alphabet) */}
        <div className="flex justify-center gap-1 mb-2 overflow-x-auto pb-2">
          {wheelLetters.slice(0, 13).map((letter, i) => (
            <div
              key={i}
              className="w-7 h-8 bg-purple-lighter rounded border-[2px] border-black flex items-center justify-center flex-shrink-0"
            >
              <span className="font-fredoka text-xs text-purple-dark">{letter}</span>
            </div>
          ))}
        </div>

        {/* Inner ring (shifted) */}
        <motion.div
          className="flex justify-center gap-1 mb-4"
          animate={{ x: shift * 0 }}
        >
          {shiftedLetters.slice(0, 13).map((letter, i) => (
            <div
              key={i}
              className={`w-7 h-8 rounded border-[2px] border-black flex items-center justify-center flex-shrink-0 ${
                shift === shiftValue && challenge.plaintext.includes(wheelLetters[(i - shift + 26) % 26])
                  ? 'bg-green-success'
                  : 'bg-yellow-accent'
              }`}
            >
              <span className="font-fredoka text-xs text-black font-bold">{letter}</span>
            </div>
          ))}
        </motion.div>

        {/* Shift Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleShiftChange(-1)}
            className="w-10 h-10 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center hover:bg-purple-dark transition-colors hover:scale-110"
          >
            <ChevronLeft size={20} strokeWidth={3} className="text-white" />
          </button>
          <div className="w-16 h-16 rounded-full bg-yellow-accent border-[4px] border-black flex items-center justify-center">
            <span className="font-fredoka font-bold text-2xl text-black">{shift}</span>
          </div>
          <button
            onClick={() => handleShiftChange(1)}
            className="w-10 h-10 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center hover:bg-purple-dark transition-colors hover:scale-110"
          >
            <ChevronRight size={20} strokeWidth={3} className="text-white" />
          </button>
        </div>

        {/* Decoded preview */}
        <div className="mt-4 text-center">
          <p className="font-nunito text-sm text-purple-dark mb-1">Decoded:</p>
          <div className="flex items-center justify-center gap-2">
            {caesarCipher(encrypted, shift).split('').map((char, i) => (
              <motion.div
                key={`${shift}-${i}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`w-12 h-14 rounded-lg border-[3px] border-black flex items-center justify-center ${
                  char === challenge.plaintext[i] ? 'bg-green-success' : 'bg-purple-lighter'
                }`}
              >
                <span className="font-fredoka font-bold text-2xl text-black">{char}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-sm text-purple-dark hover:bg-purple-light transition-colors hover:scale-105"
        >
          <RotateCcw size={16} strokeWidth={3} />
          Reset
        </button>

        <button
          onClick={handleGuess}
          className="flex items-center gap-2 px-6 py-3 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark transition-colors hover:scale-105"
        >
          <Unlock size={16} strokeWidth={3} />
          Decode!
        </button>

        {solved.includes(currentChallenge) && currentChallenge < challenges.length - 1 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-accent border-[3px] border-black rounded-full font-nunito font-bold text-sm hover:scale-105 transition-transform"
          >
            Next
            <ChevronRight size={16} strokeWidth={3} />
          </motion.button>
        )}
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="bg-green-success rounded-xl border-[3px] border-black px-6 py-3 flex items-center gap-2"
          >
            <Check size={24} strokeWidth={3} className="text-black" />
            <span className="font-nunito font-bold text-black">
              Correct! The message is: {challenge.plaintext}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
