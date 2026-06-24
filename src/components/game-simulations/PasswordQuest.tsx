import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Lock, Unlock } from 'lucide-react';

interface PasswordQuestProps {
  onScoreChange: (score: number) => void;
}

function calculateStrength(password: string): {
  score: number;
  label: string;
  color: string;
  tips: string[];
} {
  let score = 0;
  const tips: string[] = [];

  if (password.length >= 8) score += 1;
  else tips.push('Use at least 8 characters');

  if (password.length >= 12) score += 1;

  if (/[A-Z]/.test(password)) score += 1;
  else tips.push('Add uppercase letters');

  if (/[a-z]/.test(password)) score += 1;
  else tips.push('Add lowercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else tips.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else tips.push('Add special characters (!@#$%)');

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['#EF4444', '#F87171', '#FACC15', '#A78BFA', '#4ADE80', '#4ADE80'];
  const clamped = Math.min(5, score);

  return {
    score: clamped,
    label: labels[clamped],
    color: colors[clamped],
    tips,
  };
}

export default function PasswordQuest({ onScoreChange }: PasswordQuestProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(() => calculateStrength(password), [password]);

  const gateOpenPercent = Math.min(100, (strength.score / 5) * 100);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Castle Gate Visual */}
      <div className="relative w-full max-w-md">
        <div className="bg-purple-dark rounded-2xl border-4 border-black p-6 text-center relative overflow-hidden">
          {/* Castle bricks pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="bricks" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="40" height="20" fill="none" stroke="#000" strokeWidth="1" />
                  <line x1="20" y1="0" x2="20" y2="20" stroke="#000" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#bricks)" />
            </svg>
          </div>

          <div className="relative z-10">
            <motion.div
              animate={{ y: 100 - gateOpenPercent }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="mb-4"
            >
              {strength.score >= 4 ? (
                <Unlock size={64} strokeWidth={3} className="text-green-success mx-auto" />
              ) : (
                <Lock size={64} strokeWidth={3} className="text-yellow-accent mx-auto" />
              )}
            </motion.div>

            <h3 className="font-fredoka font-bold text-2xl text-white text-outline-sm mb-2">
              The Castle Gate
            </h3>
            <p className="font-nunito text-sm text-purple-lighter mb-4">
              Create a strong password to open the gate!
            </p>

            {/* Gate opening visual */}
            <div className="w-full h-4 bg-purple-darker rounded-full border-2 border-black overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: strength.color }}
                animate={{ width: `${gateOpenPercent}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </div>

            <motion.p
              key={strength.label}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="font-nunito font-bold text-base mt-2"
              style={{ color: strength.color }}
            >
              {strength.label}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Password Input */}
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-2">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              onScoreChange(calculateStrength(e.target.value).score * 20);
            }}
            placeholder="Type a password..."
            className="flex-1 h-12 px-4 bg-white border-[3px] border-black rounded-xl font-nunito text-base text-purple-dark placeholder:text-purple-light focus:outline-none focus:border-4"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="h-12 px-4 bg-purple-lighter border-[3px] border-black rounded-xl font-nunito font-semibold text-sm text-purple-dark hover:bg-purple-light transition-colors"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Strength Meter Bars */}
        <div className="flex gap-1 mb-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-1 h-3 rounded-full border-2 border-black transition-colors"
              style={{
                backgroundColor: i <= strength.score ? strength.color : '#DDD6FE',
              }}
            />
          ))}
        </div>

        {/* Tips */}
        <AnimatePresence>
          {password.length > 0 && strength.tips.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white rounded-xl border-[3px] border-black p-4 overflow-hidden"
            >
              <h4 className="font-nunito font-bold text-sm text-purple-dark mb-2 flex items-center gap-2">
                <ShieldAlert size={16} strokeWidth={3} />
                Tips to Improve
              </h4>
              <ul className="space-y-1">
                {strength.tips.map((tip, i) => (
                  <motion.li
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="font-nunito text-sm text-purple-dark flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-accent border border-black" />
                    {tip}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {strength.score >= 4 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-4 bg-green-success rounded-xl border-[3px] border-black p-4 flex items-center gap-3"
          >
            <ShieldCheck size={32} strokeWidth={3} className="text-black" />
            <div>
              <p className="font-nunito font-bold text-black">Excellent password!</p>
              <p className="font-nunito text-sm text-black/70">
                This password would take centuries to crack.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
