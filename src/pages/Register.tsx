import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, UserPlus, PawPrint, Zap, Star } from 'lucide-react';

function passwordStrength(pw: string): { level: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = [
    { level: 0, label: 'Too Short', color: '#9CA3AF' },
    { level: 1, label: 'Weak', color: '#F87171' },
    { level: 2, label: 'Fair', color: '#FB923C' },
    { level: 3, label: 'Good', color: '#FACC15' },
    { level: 4, label: 'Strong', color: '#4ADE80' },
  ];
  if (pw.length === 0) return levels[0];
  if (pw.length < 6) return levels[1];
  return levels[s] || levels[1];
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim() || !displayName.trim()) {
      setError('All fields are required');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      setError('Username: 3-32 chars, alphanumeric + underscore only');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    const result = register(username.trim(), password, displayName.trim());
    setIsLoading(false);
    if (result.ok) {
      navigate('/profile');
    } else {
      setError(result.error);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#F5F3FF' }}
    >
      {/* Floating paw decorations */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: `${8 + (i * 15) % 75}%`, top: `${5 + (i * 13) % 85}%`, color: '#DDD6FE' }}
          animate={{ y: [0, -12, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.4 }}
        >
          <PawPrint size={28 + i * 4} fill="currentColor" />
        </motion.div>
      ))}

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-full max-w-lg mx-4 relative z-10"
      >
        <div
          className="border-4 border-black rounded-3xl overflow-hidden"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '8px 8px 0px #000000' }}
        >
          {/* Header */}
          <div
            className="p-6 text-center border-b-4 border-black"
            style={{ backgroundColor: '#4ADE80' }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 border-black mb-3"
              style={{ backgroundColor: '#FACC15' }}
            >
              <UserPlus size={32} color="#000" />
            </motion.div>
            <h1 className="text-3xl font-fredoka font-bold text-white text-outline-sm">
              Join the Arena!
            </h1>
            <p className="text-white/80 text-sm font-nunito mt-1">
              Create your hacker identity
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="p-3 rounded-xl border-[3px] border-black text-center text-sm font-bold"
                style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
              >
                {error}
              </motion.div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <Label className="font-fredoka font-bold text-sm flex items-center gap-2">
                <Zap size={14} /> Username
              </Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="hacker_123"
                className="border-[3px] border-black rounded-xl h-12 font-nunito font-bold"
                required
                minLength={3}
                maxLength={32}
              />
              <p className="text-xs text-gray-400 font-nunito">3-32 chars, letters, numbers, _ only</p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label className="font-fredoka font-bold text-sm flex items-center gap-2">
                <Star size={14} /> Display Name
              </Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Cyber Kitty"
                className="border-[3px] border-black rounded-xl h-12 font-nunito font-bold"
                required
                minLength={2}
                maxLength={32}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="font-fredoka font-bold text-sm flex items-center gap-2">
                <PawPrint size={14} /> Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="border-[3px] border-black rounded-xl h-12 font-nunito font-bold pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-2 flex-1 rounded-full border border-black transition-colors"
                        style={{ backgroundColor: i <= strength.level ? strength.color : '#E5E7EB' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-bold font-nunito" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 border-[3px] border-black rounded-2xl font-fredoka font-bold text-xl shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                style={{ backgroundColor: '#4ADE80', color: '#000' }}
              >
                {isLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Zap size={24} />
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus size={22} /> CREATE ACCOUNT
                  </span>
                )}
              </Button>
            </motion.div>

            <div className="text-center pt-2">
              <p className="font-nunito text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-bold hover:underline" style={{ color: '#7C3AED' }}>
                  Login
                </Link>
              </p>
            </div>

            {/* Guest */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full h-12 border-[3px] border-black rounded-2xl font-fredoka font-bold shadow-[4px_4px_0px_#000]"
              >
                <PawPrint size={18} className="mr-2" /> Continue as Guest
              </Button>
            </motion.div>
          </form>
        </div>

        <p className="text-center text-xs font-nunito text-gray-400 mt-4">
          All data is stored locally in your browser — no server needed!
        </p>
      </motion.div>
    </div>
  );
}
