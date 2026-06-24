import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Shield, PawPrint, Zap } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    const result = login(username.trim(), password);
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
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${10 + (i * 12) % 80}%`,
            top: `${5 + (i * 17) % 90}%`,
            color: '#DDD6FE',
          }}
          animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
        >
          <PawPrint size={30 + i * 5} fill="currentColor" />
        </motion.div>
      ))}

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-full max-w-lg mx-4 relative z-10"
      >
        {/* Card */}
        <div
          className="border-4 border-black rounded-3xl overflow-hidden"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '8px 8px 0px #000000' }}
        >
          {/* Header */}
          <div
            className="p-6 text-center border-b-4 border-black"
            style={{ backgroundColor: '#7C3AED' }}
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 border-black mb-3"
              style={{ backgroundColor: '#FACC15' }}
            >
              <Shield size={32} color="#000" />
            </motion.div>
            <h1 className="text-3xl font-fredoka font-bold text-white text-outline-sm">
              Welcome Back, Hacker!
            </h1>
            <p className="text-white/80 text-sm font-nunito mt-1">
              Login to access your arsenal
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

            <div className="space-y-2">
              <Label className="font-fredoka font-bold text-sm flex items-center gap-2">
                <Zap size={14} /> Username
              </Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="border-[3px] border-black rounded-xl h-12 font-nunito font-bold focus:ring-2 focus:ring-purple-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="font-fredoka font-bold text-sm flex items-center gap-2">
                <Shield size={14} /> Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="border-[3px] border-black rounded-xl h-12 font-nunito font-bold pr-12 focus:ring-2 focus:ring-purple-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 border-[3px] border-black rounded-2xl font-fredoka font-bold text-xl shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                style={{ backgroundColor: '#7C3AED', color: '#FFF' }}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Zap size={24} />
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield size={22} /> LOGIN
                  </span>
                )}
              </Button>
            </motion.div>

            <div className="text-center pt-2">
              <p className="font-nunito text-sm text-gray-600">
                New here?{' '}
                <Link
                  to="/register"
                  className="font-bold hover:underline"
                  style={{ color: '#7C3AED' }}
                >
                  Create Account
                </Link>
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-[2px] bg-gray-200" />
              <span className="text-xs font-nunito text-gray-400">OR</span>
              <div className="flex-1 h-[2px] bg-gray-200" />
            </div>

            {/* Guest mode */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full h-12 border-[3px] border-black rounded-2xl font-fredoka font-bold shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000]"
              >
                <PawPrint size={18} className="mr-2" /> Continue as Guest
              </Button>
            </motion.div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-nunito text-gray-400 mt-4">
          All data stored locally in your browser
        </p>
      </motion.div>
    </div>
  );
}
