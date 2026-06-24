import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Star,
  Lock,
  Users,
  HelpCircle,
  Play,
} from 'lucide-react';
import { games, categories, featuredGame } from '@/data/games';
import type { GameCategory } from '@/data/games';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function PawPrint({ fill, size = 16 }: { fill: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="16" rx="6" ry="5" fill={fill} stroke="#000" strokeWidth="2" />
      <circle cx="7" cy="9" r="3" fill={fill} stroke="#000" strokeWidth="2" />
      <circle cx="12" cy="7" r="3" fill={fill} stroke="#000" strokeWidth="2" />
      <circle cx="17" cy="9" r="3" fill={fill} stroke="#000" strokeWidth="2" />
    </svg>
  );
}

function DifficultyPaws({ level }: { level: 1 | 2 | 3 }) {
  const colors = ['#4ADE80', '#FACC15', '#F87171'];
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <PawPrint
          key={i}
          fill={i <= level ? colors[level - 1] : '#DDD6FE'}
          size={16}
        />
      ))}
      <span className="font-nunito text-xs font-semibold text-purple-dark ml-1">
        {level === 1 ? 'Easy' : level === 2 ? 'Medium' : 'Hard'}
      </span>
    </div>
  );
}

function GameIcon({ iconType, size = 40 }: { iconType: string; size?: number }) {
  const iconMap: Record<string, ReactNode> = {
    password: (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <rect x="24" y="48" width="80" height="64" rx="12" fill="#7C3AED" stroke="#000" strokeWidth="4" />
        <rect x="40" y="16" width="48" height="40" rx="20" fill="#FACC15" stroke="#000" strokeWidth="4" />
        <circle cx="64" cy="80" r="12" fill="#FACC15" stroke="#000" strokeWidth="3" />
        <circle cx="64" cy="80" r="5" fill="#000" />
        <circle cx="52" cy="72" r="3" fill="#FFF" />
        <circle cx="76" cy="72" r="3" fill="#FFF" />
        <ellipse cx="64" cy="78" rx="3" ry="2" fill="#F472B6" />
      </svg>
    ),
    phishing: (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <rect x="16" y="40" width="80" height="56" rx="8" fill="#F472B6" stroke="#000" strokeWidth="4" />
        <polygon points="16,40 56,80 96,40" fill="#F9A8D4" stroke="#000" strokeWidth="3" />
        <circle cx="72" cy="64" r="16" fill="#FACC15" stroke="#000" strokeWidth="3" />
        <text x="66" y="70" fontSize="18" fontWeight="bold" fill="#000">!</text>
        <path d="M100 16L100 48" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <path d="M100 16C108 16 112 22 112 28C112 34 108 38 100 38" stroke="#60A5FA" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M20 112C30 104 40 112 50 112C60 112 70 104 80 112" stroke="#60A5FA" strokeWidth="3" fill="none" />
        <path d="M30 120C40 112 50 120 60 120C70 120 80 112 90 120" stroke="#60A5FA" strokeWidth="3" fill="none" />
      </svg>
    ),
    firewall: (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <rect x="16" y="32" width="96" height="80" rx="4" fill="#FB923C" stroke="#000" strokeWidth="4" />
        <line x1="16" y1="56" x2="112" y2="56" stroke="#000" strokeWidth="3" />
        <line x1="16" y1="80" x2="112" y2="80" stroke="#000" strokeWidth="3" />
        <line x1="48" y1="32" x2="48" y2="56" stroke="#000" strokeWidth="3" />
        <line x1="80" y1="32" x2="80" y2="56" stroke="#000" strokeWidth="3" />
        <line x1="32" y1="56" x2="32" y2="80" stroke="#000" strokeWidth="3" />
        <line x1="64" y1="56" x2="64" y2="80" stroke="#000" strokeWidth="3" />
        <line x1="96" y1="56" x2="96" y2="80" stroke="#000" strokeWidth="3" />
        <line x1="48" y1="80" x2="48" y2="104" stroke="#000" strokeWidth="3" />
        <line x1="80" y1="80" x2="80" y2="104" stroke="#000" strokeWidth="3" />
        <path d="M64 12C64 12 44 20 44 36C44 56 64 72 64 72C64 72 84 56 84 36C84 20 64 12 64 12Z" fill="#FACC15" stroke="#000" strokeWidth="3" />
        <circle cx="64" cy="40" r="8" fill="#7C3AED" stroke="#000" strokeWidth="2" />
        <circle cx="60" cy="38" r="2" fill="#FFF" />
        <circle cx="68" cy="38" r="2" fill="#FFF" />
      </svg>
    ),
    encryption: (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <rect x="28" y="24" width="56" height="80" rx="8" fill="#DDD6FE" stroke="#000" strokeWidth="4" />
        <rect x="28" y="24" width="56" height="16" rx="8" fill="#C4B5FD" stroke="#000" strokeWidth="4" />
        <text x="38" y="64" fontSize="12" fontWeight="bold" fill="#7C3AED" fontFamily="monospace">KHOOR</text>
        <text x="38" y="80" fontSize="12" fontWeight="bold" fill="#7C3AED" fontFamily="monospace">ZRUOG</text>
        <path d="M88 56L104 56M104 56L96 48M104 56L96 64" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="84" y="64" width="28" height="24" rx="6" fill="#FACC15" stroke="#000" strokeWidth="3" />
        <rect x="92" y="52" width="12" height="16" rx="6" fill="#FACC15" stroke="#000" strokeWidth="3" />
        <circle cx="98" cy="76" r="4" fill="#000" />
      </svg>
    ),
    network: (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <circle cx="64" cy="64" r="44" fill="#60A5FA" stroke="#000" strokeWidth="4" />
        <ellipse cx="64" cy="64" rx="20" ry="44" fill="none" stroke="#000" strokeWidth="2" />
        <line x1="20" y1="64" x2="108" y2="64" stroke="#000" strokeWidth="2" />
        <ellipse cx="64" cy="64" rx="36" ry="16" fill="none" stroke="#000" strokeWidth="2" />
        <circle cx="30" cy="40" r="12" fill="#7C3AED" stroke="#000" strokeWidth="3" />
        <circle cx="98" cy="40" r="12" fill="#F472B6" stroke="#000" strokeWidth="3" />
        <circle cx="30" cy="88" r="12" fill="#FACC15" stroke="#000" strokeWidth="3" />
        <circle cx="98" cy="88" r="12" fill="#4ADE80" stroke="#000" strokeWidth="3" />
        <circle cx="28" cy="38" r="2" fill="#FFF" />
        <circle cx="34" cy="38" r="2" fill="#FFF" />
        <circle cx="96" cy="38" r="2" fill="#FFF" />
        <circle cx="102" cy="38" r="2" fill="#FFF" />
        <circle cx="28" cy="86" r="2" fill="#FFF" />
        <circle cx="34" cy="86" r="2" fill="#FFF" />
        <circle cx="96" cy="86" r="2" fill="#FFF" />
        <circle cx="102" cy="86" r="2" fill="#FFF" />
        <line x1="42" y1="40" x2="86" y2="40" stroke="#000" strokeWidth="3" />
        <line x1="42" y1="88" x2="86" y2="88" stroke="#000" strokeWidth="3" />
        <line x1="30" y1="52" x2="30" y2="76" stroke="#000" strokeWidth="3" />
        <line x1="98" y1="52" x2="98" y2="76" stroke="#000" strokeWidth="3" />
      </svg>
    ),
    malware: (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <circle cx="64" cy="64" r="24" fill="#4ADE80" stroke="#000" strokeWidth="4" />
        <line x1="64" y1="32" x2="64" y2="16" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <line x1="64" y1="96" x2="64" y2="112" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <line x1="32" y1="64" x2="16" y2="64" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <line x1="96" y1="64" x2="112" y2="64" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <line x1="41" y1="41" x2="30" y2="30" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <line x1="87" y1="87" x2="98" y2="98" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <line x1="41" y1="87" x2="30" y2="98" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <line x1="87" y1="41" x2="98" y2="30" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <circle cx="56" cy="58" r="4" fill="#000" />
        <circle cx="72" cy="58" r="4" fill="#000" />
        <circle cx="54" cy="56" r="1.5" fill="#FFF" />
        <circle cx="70" cy="56" r="1.5" fill="#FFF" />
        <ellipse cx="64" cy="70" rx="6" ry="4" fill="#EF4444" stroke="#000" strokeWidth="2" />
      </svg>
    ),
    terminal: (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <rect x="16" y="20" width="96" height="72" rx="8" fill="#1F1F1F" stroke="#000" strokeWidth="4" />
        <path d="M32 20L28 4L48 16" fill="#7C3AED" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M96 20L100 4L80 16" fill="#7C3AED" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <rect x="24" y="28" width="80" height="52" rx="4" fill="#000" />
        <text x="32" y="48" fontFamily="monospace" fontSize="10" fill="#4ADE80">&gt; _</text>
        <text x="48" y="48" fontFamily="monospace" fontSize="10" fill="#A78BFA">sql</text>
        <text x="32" y="64" fontFamily="monospace" fontSize="8" fill="#FFF">database/</text>
        <rect x="52" y="92" width="24" height="8" fill="#7C3AED" stroke="#000" strokeWidth="3" />
        <rect x="40" y="100" width="48" height="6" rx="3" fill="#7C3AED" stroke="#000" strokeWidth="3" />
      </svg>
    ),
    web: (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <rect x="12" y="20" width="104" height="88" rx="8" fill="#FFFFFF" stroke="#000" strokeWidth="4" />
        <rect x="12" y="20" width="104" height="20" rx="8" fill="#7C3AED" stroke="#000" strokeWidth="4" />
        <circle cx="28" cy="30" r="5" fill="#F87171" stroke="#000" strokeWidth="2" />
        <circle cx="44" cy="30" r="5" fill="#FACC15" stroke="#000" strokeWidth="2" />
        <circle cx="60" cy="30" r="5" fill="#4ADE80" stroke="#000" strokeWidth="2" />
        <rect x="24" y="56" width="80" height="12" rx="4" fill="#DDD6FE" stroke="#000" strokeWidth="2" />
        <rect x="24" y="76" width="56" height="12" rx="4" fill="#DDD6FE" stroke="#000" strokeWidth="2" />
        <path d="M96 52L96 100" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" />
        <circle cx="96" cy="52" r="10" fill="#FACC15" stroke="#000" strokeWidth="3" />
        <text x="92" y="56" fontSize="10" fontWeight="bold" fill="#000">X</text>
      </svg>
    ),
    crypto: (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <rect x="20" y="24" width="88" height="80" rx="8" fill="#DDD6FE" stroke="#000" strokeWidth="4" />
        <circle cx="64" cy="56" r="20" fill="#7C3AED" stroke="#000" strokeWidth="3" />
        <text x="55" y="62" fontSize="16" fontWeight="bold" fill="#FFF">#</text>
        <rect x="36" y="84" width="56" height="12" rx="4" fill="#FACC15" stroke="#000" strokeWidth="2" />
        <line x1="24" y1="40" x2="40" y2="40" stroke="#000" strokeWidth="2" />
        <line x1="88" y1="40" x2="104" y2="40" stroke="#000" strokeWidth="2" />
        <circle cx="28" cy="40" r="3" fill="#F472B6" />
        <circle cx="100" cy="40" r="3" fill="#F472B6" />
      </svg>
    ),
    forensics: (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <circle cx="64" cy="64" r="40" fill="#F5F3FF" stroke="#000" strokeWidth="4" />
        <circle cx="64" cy="64" r="28" fill="#DDD6FE" stroke="#000" strokeWidth="3" />
        <circle cx="64" cy="64" r="16" fill="#7C3AED" stroke="#000" strokeWidth="3" />
        <circle cx="64" cy="64" r="6" fill="#000" />
        <line x1="64" y1="24" x2="64" y2="48" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        <line x1="64" y1="80" x2="64" y2="104" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        <line x1="24" y1="64" x2="48" y2="64" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="64" x2="104" y2="64" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        <circle cx="64" cy="24" r="5" fill="#FACC15" stroke="#000" strokeWidth="2" />
        <circle cx="64" cy="104" r="5" fill="#FACC15" stroke="#000" strokeWidth="2" />
        <circle cx="24" cy="64" r="5" fill="#FACC15" stroke="#000" strokeWidth="2" />
        <circle cx="104" cy="64" r="5" fill="#FACC15" stroke="#000" strokeWidth="2" />
      </svg>
    ),
    mixed: (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <rect x="20" y="20" width="88" height="88" rx="12" fill="#7C3AED" stroke="#000" strokeWidth="4" />
        <circle cx="44" cy="48" r="12" fill="#FACC15" stroke="#000" strokeWidth="3" />
        <circle cx="84" cy="48" r="12" fill="#F472B6" stroke="#000" strokeWidth="3" />
        <circle cx="44" cy="84" r="12" fill="#4ADE80" stroke="#000" strokeWidth="3" />
        <circle cx="84" cy="84" r="12" fill="#60A5FA" stroke="#000" strokeWidth="3" />
        <circle cx="64" cy="64" r="16" fill="#FFF" stroke="#000" strokeWidth="3" />
        <text x="58" y="70" fontSize="14" fontWeight="bold" fill="#000">?</text>
      </svg>
    ),
  };

  return iconMap[iconType] || iconMap.password;
}

function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    Passwords: 'bg-purple-primary',
    Phishing: 'bg-pink-accent',
    Firewall: 'bg-red-alert',
    Encryption: 'bg-purple-light',
    Malware: 'bg-green-success',
    Networking: 'bg-blue-info',
    Cryptography: 'bg-yellow-accent',
    'Web Security': 'bg-red-alert',
    Forensics: 'bg-purple-dark',
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full border-[3px] border-black text-white font-nunito text-xs font-bold ${
        colorMap[category] || 'bg-purple-primary'
      }`}
    >
      {category}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Card Component                                                    */
/* ------------------------------------------------------------------ */

function GameCard({ game, index }: { game: (typeof games)[0]; index: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: index % 2 === 0 ? -20 : 20 }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 14,
        delay: index * 0.04,
      }}
      whileHover={{ scale: 1.04, y: -6 }}
      className="relative bg-white rounded-2xl border-4 border-black overflow-hidden flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/2] overflow-hidden bg-purple-lighter border-b-[3px] border-black">
        <div className="w-full h-full flex items-center justify-center bg-purple-lighter">
          <GameIcon iconType={game.iconType} size={80} />
        </div>
        {/* XP Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-accent border-[3px] border-black rounded-full px-2 py-0.5">
          <Star size={12} fill="#000" strokeWidth={0} />
          <span className="font-nunito text-xs font-bold text-black">{game.xpReward}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <GameIcon iconType={game.iconType} size={32} />
          <CategoryBadge category={game.category} />
        </div>

        <h3 className="font-fredoka font-semibold text-xl text-purple-dark leading-tight">
          {game.title}
        </h3>

        <p className="font-nunito text-sm text-purple-dark line-clamp-2 leading-relaxed">
          {game.description}
        </p>

        <div className="mt-auto pt-2 flex items-center justify-between">
          <DifficultyPaws level={game.difficulty} />
          <div className="flex items-center gap-1 text-purple-light">
            <Users size={14} strokeWidth={2.5} />
            <span className="font-nunito text-xs font-semibold">
              {game.playerCount >= 1000
                ? `${(game.playerCount / 1000).toFixed(1)}k`
                : game.playerCount}
            </span>
          </div>
        </div>

        {/* Play Button */}
        <Link
          to={`/games/${game.id}`}
          className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-[3px] border-black font-nunito font-bold text-sm transition-colors ${
            game.isLocked
              ? 'bg-purple-lighter text-purple-light cursor-not-allowed'
              : 'bg-purple-primary text-white hover:bg-purple-dark'
          }`}
          onClick={(e) => game.isLocked && e.preventDefault()}
        >
          {game.isLocked ? (
            <>
              <Lock size={16} strokeWidth={3} />
              <span>Locked</span>
            </>
          ) : (
            <>
              <Play size={16} strokeWidth={3} />
              <span>Play Now</span>
            </>
          )}
        </Link>
      </div>

      {/* Lock Overlay */}
      {game.isLocked && (
        <div className="absolute inset-0 bg-purple-darker/60 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Lock size={48} strokeWidth={3} className="text-white" />
          </motion.div>
          <p className="font-nunito text-sm font-semibold text-white text-center px-4">
            Complete {game.unlockRequirement?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'prerequisite'} to unlock
          </p>
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                       */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full flex flex-col items-center justify-center py-16"
    >
      {/* Sad cat face */}
      <svg width="120" height="120" viewBox="0 0 128 128" fill="none" className="mb-4">
        <ellipse cx="64" cy="72" rx="36" ry="32" fill="#A78BFA" stroke="#000" strokeWidth="4" />
        <path d="M32 48L28 20L52 36" fill="#A78BFA" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <path d="M96 48L100 20L76 36" fill="#A78BFA" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <ellipse cx="36" cy="46" rx="8" ry="10" fill="#F472B6" />
        <ellipse cx="92" cy="46" rx="8" ry="10" fill="#F472B6" />
        <circle cx="48" cy="66" r="5" fill="#000" />
        <circle cx="80" cy="66" r="5" fill="#000" />
        <path d="M52 84C56 80 60 78 64 78C68 78 72 80 76 84" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="64" cy="82" rx="5" ry="4" fill="#F472B6" stroke="#000" strokeWidth="2" />
      </svg>
      <h3 className="font-fredoka font-semibold text-2xl text-purple-dark mb-2">
        No missions found!
      </h3>
      <p className="font-nunito text-base text-purple-dark text-center">
        Try different filters or search terms to find your next mission.
      </p>
    </motion.div>
  );
}

/* ================================================================== */
/*  MAIN PAGE                                                         */
/* ================================================================== */

export default function Games() {
  const [activeCategory, setActiveCategory] = useState<GameCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<{
    1: boolean;
    2: boolean;
    3: boolean;
  }>({ 1: true, 2: true, 3: true });

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesCategory =
        activeCategory === 'All' || game.category === activeCategory;
      const matchesSearch =
        searchQuery === '' ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter[game.difficulty];
      return matchesCategory && matchesSearch && matchesDifficulty;
    });
  }, [activeCategory, searchQuery, difficultyFilter]);

  const toggleDifficulty = (level: 1 | 2 | 3) => {
    setDifficultyFilter((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  return (
    <div className="min-h-[100dvh]">
      {/* ============================================================ */}
      {/*  SECTION 1: Page Header                                      */}
      {/* ============================================================ */}
      <section className="bg-purple-dark relative overflow-hidden px-6 pt-12 pb-8">
        {/* Decorative paws */}
        <div className="absolute top-4 left-4 opacity-10 pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 200 200" fill="none" className="animate-float-slow">
            <ellipse cx="100" cy="130" rx="40" ry="35" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="55" cy="75" rx="22" ry="26" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="100" cy="58" rx="22" ry="28" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="145" cy="75" rx="22" ry="26" fill="#A78BFA" stroke="#000" strokeWidth="4" />
          </svg>
        </div>
        <div className="absolute top-8 right-8 opacity-10 pointer-events-none rotate-12">
          <svg width="100" height="100" viewBox="0 0 200 200" fill="none" className="animate-float">
            <ellipse cx="100" cy="130" rx="40" ry="35" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="55" cy="75" rx="22" ry="26" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="100" cy="58" rx="22" ry="28" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="145" cy="75" rx="22" ry="26" fill="#A78BFA" stroke="#000" strokeWidth="4" />
          </svg>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none -rotate-12">
          <svg width="80" height="80" viewBox="0 0 200 200" fill="none" className="animate-float-slow">
            <ellipse cx="100" cy="130" rx="40" ry="35" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="55" cy="75" rx="22" ry="26" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="100" cy="58" rx="22" ry="28" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="145" cy="75" rx="22" ry="26" fill="#A78BFA" stroke="#000" strokeWidth="4" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            className="flex items-center justify-center gap-3 flex-wrap"
            initial={{ y: 40, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            <h1 className="font-fredoka font-bold text-5xl md:text-6xl text-white text-outline-sm">
              Mission Control
            </h1>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 10,
                delay: 0.4,
              }}
              whileHover={{ rotate: 3, scale: 1.05 }}
              className="inline-block bg-yellow-accent border-[3px] border-black rounded-full px-4 py-1 font-fredoka font-semibold text-lg text-black"
            >
              24+ Missions
            </motion.span>
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.3 }}
            className="font-nunito text-xl text-purple-lighter mt-3"
          >
            Choose your mission, save the digital world!
          </motion.p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 2: Filter & Search Bar                              */}
      {/* ============================================================ */}
      <motion.section
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.2 }}
        className="sticky top-[72px] z-40 bg-purple-pale border-b-4 border-black px-4 py-3"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-3">
          {/* Category Pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {categories.map((cat, i) => (
              <motion.button
                key={cat}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setActiveCategory(cat)}
                className={`h-10 px-5 rounded-full border-[3px] font-nunito font-semibold text-sm whitespace-nowrap transition-transform hover:scale-105 ${
                  activeCategory === cat
                    ? 'bg-yellow-accent border-black text-black border-4 scale-105'
                    : 'bg-white border-black text-purple-dark'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <span className="font-nunito text-sm font-semibold text-purple-dark">Level:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleDifficulty(level as 1 | 2 | 3)}
                    className="transition-transform hover:scale-110"
                  >
                    <PawPrint
                      fill={
                        difficultyFilter[level as 1 | 2 | 3]
                          ? level === 1
                            ? '#4ADE80'
                            : level === 2
                            ? '#FACC15'
                            : '#F87171'
                          : '#DDD6FE'
                      }
                      size={18}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-light"
                strokeWidth={2.5}
              />
              <input
                type="text"
                placeholder="Search missions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-60 h-11 pl-10 pr-4 bg-white border-[3px] border-black rounded-full font-nunito text-base text-purple-dark placeholder:text-purple-light focus:border-4 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ============================================================ */}
      {/*  SECTION 3: Featured Mission                                 */}
      {/* ============================================================ */}
      <section className="bg-purple-pale px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 30, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.3 }}
            className="bg-purple-lighter rounded-2xl border-4 border-black overflow-hidden"
          >
            {/* FEATURED ribbon */}
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-3 left-3 z-10 bg-yellow-accent border-[3px] border-black rounded-lg px-3 py-1"
              >
                <span className="font-nunito text-xs font-bold text-black tracking-wider">
                  FEATURED
                </span>
              </motion.div>

              <div className="flex flex-col md:flex-row">
                {/* Featured Image */}
                <div className="md:w-3/5 relative bg-purple-lighter flex items-center justify-center p-8 border-b-[3px] md:border-b-0 md:border-r-[3px] border-black">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="relative"
                  >
                    <GameIcon iconType={featuredGame.iconType} size={200} />
                  </motion.div>
                </div>

                {/* Featured Info */}
                <div className="md:w-2/5 p-6 md:p-8 flex flex-col gap-4">
                  <span className="font-nunito text-xs font-bold text-yellow-accent tracking-widest uppercase">
                    Mission of the Week
                  </span>
                  <h2 className="font-fredoka font-bold text-3xl md:text-4xl text-purple-dark text-outline-sm">
                    {featuredGame.title}
                  </h2>
                  <p className="font-nunito text-base text-purple-dark leading-relaxed">
                    {featuredGame.description}
                  </p>
                  <DifficultyPaws level={featuredGame.difficulty} />
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 bg-yellow-accent border-[3px] border-black rounded-full px-3 py-1">
                      <Star size={16} fill="#000" strokeWidth={0} />
                      <span className="font-nunito text-sm font-bold text-black">
                        +{featuredGame.xpReward} XP
                      </span>
                    </div>
                    <CategoryBadge category={featuredGame.category} />
                  </div>
                  <Link
                    to={`/games/${featuredGame.id}`}
                    className="mt-2 inline-flex items-center justify-center gap-2 bg-purple-primary text-white font-nunito font-bold text-base px-8 py-4 rounded-full border-[4px] border-black hover:bg-purple-dark transition-colors w-fit"
                  >
                    <Play size={20} strokeWidth={3} />
                    Start Mission
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 4: Games Masonry Grid                               */}
      {/* ============================================================ */}
      <section className="bg-purple-pale px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredGames.length > 0 ? (
                filteredGames.map((game, index) => (
                  <GameCard key={game.id} game={game} index={index} />
                ))
              ) : (
                <EmptyState />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 5: Coming Soon Teaser                               */}
      {/* ============================================================ */}
      <section className="bg-purple-dark px-6 py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            initial={{ y: 30, scale: 0.95 }}
            whileInView={{ y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            className="font-fredoka font-semibold text-3xl md:text-4xl text-white text-outline-sm mb-2"
          >
            More Missions Coming Soon!
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.2 }}
            className="font-nunito text-base text-purple-lighter mb-8"
          >
            New games every month
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { category: 'Web Security', delay: 0 },
              { category: 'Mobile Safety', delay: 0.5 },
              { category: 'AI & Ethics', delay: 1 },
              { category: 'Advanced CTF', delay: 1.5 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: item.delay * 0.3 }}
                animate={{ y: [0, -8, 0] }}
                style={{ animationDuration: `${4 + i * 0.5}s` }}
                className="bg-purple-darker rounded-2xl border-4 border-dashed border-purple-light p-8 flex flex-col items-center justify-center gap-4 min-h-[240px]"
              >
                <motion.div
                  animate={{ rotate: [-5, 5, -5] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <HelpCircle size={64} strokeWidth={3} className="text-purple-light" />
                </motion.div>
                <span className="font-nunito text-sm font-semibold text-purple-lighter">
                  {item.category}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
