import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, Star, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { localAuth } from '@/lib/localAuth';

const navLinks = [
  { path: '/games', label: 'Games' },
  { path: '/terminal', label: 'Terminal' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/about', label: 'About' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  // Get fresh data from localStorage
  const freshUser = localAuth.me();
  const effectiveUser = freshUser || user;

  // Derive display info from local auth
  const displayName = effectiveUser?.displayName || effectiveUser?.name || 'Hacker';
  const userLevel = effectiveUser?.level || 1;
  const userTotalXp = effectiveUser?.totalXp || 0;

  // Calculate XP progress
  let remaining = userTotalXp;
  let xpNeeded = 100;
  for (let l = 1; l < userLevel; l++) {
    remaining -= xpNeeded;
    xpNeeded = Math.floor(100 * Math.pow(1.5, l));
  }
  const currentXp = Math.max(0, remaining);
  const xpPercent = Math.min(100, Math.round((currentXp / xpNeeded) * 100));

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-purple-pale border-b-4 border-black">
      <div className="mx-auto max-w-7xl px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <svg width="48" height="48" viewBox="0 0 128 128" fill="none">
            <ellipse cx="64" cy="72" rx="32" ry="28" fill="#7C3AED" stroke="#000" strokeWidth="4" />
            <path d="M38 52L30 28L54 44" fill="#7C3AED" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
            <path d="M90 52L98 28L74 44" fill="#7C3AED" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
            <path d="M42 50L38 34L54 44" fill="#F472B6" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
            <path d="M86 50L90 34L74 44" fill="#F472B6" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
            <rect x="36" y="62" width="24" height="16" rx="6" fill="#1F1F1F" stroke="#000" strokeWidth="2" />
            <rect x="68" y="62" width="24" height="16" rx="6" fill="#1F1F1F" stroke="#000" strokeWidth="2" />
            <circle cx="46" cy="70" r="3" fill="#60A5FA" />
            <circle cx="82" cy="70" r="3" fill="#60A5FA" />
            <ellipse cx="64" cy="80" rx="4" ry="3" fill="#F472B6" stroke="#000" strokeWidth="1.5" />
            <path d="M58 86C60 88 62 90 64 90C66 90 68 88 70 86" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
          <span className="font-fredoka font-bold text-2xl text-purple-dark hidden sm:block"
            style={{ WebkitTextStroke: '1px #000' }}>
            CyberPaws
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-nunito font-semibold text-base px-5 py-2 rounded-full border-[3px] transition-transform hover:scale-105 ${
                location.pathname === link.path
                  ? 'bg-yellow-accent border-black text-black'
                  : 'bg-transparent border-transparent text-purple-dark hover:border-purple-light'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: XP + Avatar / Login */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* XP Badge */}
              <Link to="/profile" className="hidden sm:flex items-center gap-2 bg-yellow-accent border-[3px] border-black rounded-full px-3 py-1 hover:scale-105 transition-transform">
                <Star size={16} fill="#000" strokeWidth={0} />
                <div className="flex flex-col leading-none">
                  <span className="font-nunito font-bold text-[10px] text-black">Lv.{userLevel}</span>
                  <div className="w-16 h-2 bg-white border-2 border-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-success rounded-full transition-all"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
                <span className="font-nunito font-bold text-[10px] text-black">{userTotalXp} XP</span>
              </Link>
              {/* Avatar */}
              <Link to="/profile" className="w-10 h-10 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center hover:scale-105 transition-transform">
                <span className="font-fredoka font-bold text-white text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 bg-purple-primary border-[3px] border-black rounded-full px-4 py-2 font-nunito font-bold text-sm text-white hover:scale-105 transition-transform"
            >
              <LogIn size={16} strokeWidth={3} />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1 border-[3px] border-black rounded-lg bg-purple-lighter"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-[72px] right-0 bottom-0 w-[280px] bg-purple-dark border-l-4 border-black z-50 md:hidden p-6"
            >
              {/* Mobile user display */}
              {isAuthenticated && (
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 bg-yellow-accent border-[3px] border-black rounded-2xl p-3 mb-4"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center">
                    <span className="font-fredoka font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-nunito font-bold text-sm text-black truncate">{displayName}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-nunito font-bold text-[10px] text-black">Lv.{userLevel}</span>
                      <div className="flex-1 h-2 bg-white border-2 border-black rounded-full overflow-hidden">
                        <div className="h-full bg-green-success rounded-full" style={{ width: `${xpPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              <div className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`font-nunito font-semibold text-lg px-5 py-3 rounded-xl border-[3px] text-center ${
                      location.pathname === link.path
                        ? 'bg-yellow-accent border-black text-black'
                        : 'bg-purple-darker border-purple-light text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className={`font-nunito font-semibold text-lg px-5 py-3 rounded-xl border-[3px] text-center ${
                        location.pathname === '/profile'
                          ? 'bg-yellow-accent border-black text-black'
                          : 'bg-purple-darker border-purple-light text-white'
                      }`}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="font-nunito font-semibold text-lg px-5 py-3 rounded-xl border-[3px] border-red-alert bg-red-alert/20 text-red-alert text-center"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="font-nunito font-semibold text-lg px-5 py-3 rounded-xl border-[3px] border-black bg-green-success text-black text-center"
                  >
                    Login
                  </Link>
                )}
              </div>
              {/* Paw decorations in drawer */}
              <div className="absolute bottom-8 left-6 opacity-20">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <ellipse cx="40" cy="50" rx="18" ry="16" fill="#A78BFA" stroke="#000" strokeWidth="3" />
                  <ellipse cx="22" cy="28" rx="10" ry="12" fill="#A78BFA" stroke="#000" strokeWidth="3" />
                  <ellipse cx="40" cy="20" rx="10" ry="14" fill="#A78BFA" stroke="#000" strokeWidth="3" />
                  <ellipse cx="58" cy="28" rx="10" ry="12" fill="#A78BFA" stroke="#000" strokeWidth="3" />
                </svg>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
