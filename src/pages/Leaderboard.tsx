import { useState, useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Star,
  Lock,
  Users,
  Zap,
  Target,
  Shield,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Flame,
  Crown,
  Medal,
  Check,
  LogIn,
  Terminal,
  Mail,
  User,
  Bug,
  Database,
  Search as SearchIcon,
  Heart,
  Globe,
  Wifi,
  Award,
  Unlock,
  Compass,
  Bookmark,
  Sparkles,
  Gamepad2,
  Calendar,
  Keyboard,
  ShieldCheck,
  Moon,
  Sun,
  Timer,
  Eye,
} from "lucide-react";
import {
  leaderboardData,
  weeklyChallenge,
  allBadges,
  teamsData,
  currentUserRank,
} from "@/data/mockData";
import type { Badge } from "@/data/mockData";

// ─── spring presets ─────────────────────────────────────────────
const springBounce = { type: "spring" as const, stiffness: 120, damping: 14 };
const springStiff = { type: "spring" as const, stiffness: 100, damping: 12 };

// ─── Lucide icon resolver ───────────────────────────────────────
const iconMap: Record<string, React.ElementType> = {
  LogIn, Lock, Target, Terminal, Mail, User, Flame, Users,
  Gamepad2, Keyboard, Globe, Key: Star,
  Zap, Calendar, Shield, ShieldCheck, Moon,
  Sun, Timer, Trophy, Medal, Bookmark,
  Gem: Crown, Sparkles, Bug, Database, SearchIcon, Eye,
  Wifi, Award, Unlock, Heart, Compass,
  Crown, Star,
};

function BadgeIcon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const Icon = iconMap[name] || Star;
  return <Icon size={size} className={className} strokeWidth={2.5} />;
}

// ─── Podium Section ─────────────────────────────────────────────
const podiumConfig = [
  { rank: 2, height: 180, width: 180, color: "#C0C0C0", medal: "silver", delay: 0.15, medalColor: "#C0C0C0" },
  { rank: 1, height: 240, width: 200, color: "#FACC15", medal: "gold", delay: 0.3, medalColor: "#FACC15" },
  { rank: 3, height: 140, width: 180, color: "#CD7F32", medal: "bronze", delay: 0, medalColor: "#CD7F32" },
];

const top3 = leaderboardData.slice(0, 3);

function PodiumSection() {
  return (
    <section className="bg-[#DDD6FE] relative overflow-hidden py-12 px-4">
      {/* Paw decorations */}
      <div className="absolute left-4 top-8 opacity-[0.10] pointer-events-none">
        <svg width="120" height="120" viewBox="0 0 200 200" fill="none">
          <ellipse cx="100" cy="140" rx="40" ry="36" fill="#A78BFA" stroke="#000" strokeWidth="4" />
          <ellipse cx="50" cy="80" rx="24" ry="28" fill="#A78BFA" stroke="#000" strokeWidth="4" />
          <ellipse cx="100" cy="50" rx="24" ry="32" fill="#A78BFA" stroke="#000" strokeWidth="4" />
          <ellipse cx="150" cy="80" rx="24" ry="28" fill="#A78BFA" stroke="#000" strokeWidth="4" />
        </svg>
      </div>
      <div className="absolute right-4 bottom-8 opacity-[0.10] pointer-events-none rotate-12">
        <svg width="100" height="100" viewBox="0 0 200 200" fill="none">
          <ellipse cx="100" cy="140" rx="40" ry="36" fill="#A78BFA" stroke="#000" strokeWidth="4" />
          <ellipse cx="50" cy="80" rx="24" ry="28" fill="#A78BFA" stroke="#000" strokeWidth="4" />
          <ellipse cx="100" cy="50" rx="24" ry="32" fill="#A78BFA" stroke="#000" strokeWidth="4" />
          <ellipse cx="150" cy="80" rx="24" ry="28" fill="#A78BFA" stroke="#000" strokeWidth="4" />
        </svg>
      </div>

      <div className="max-w-3xl mx-auto flex items-end justify-center gap-4">
        {podiumConfig.map((cfg) => {
          const player = top3[cfg.rank - 1];
          const isCenter = cfg.rank === 1;
          return (
            <div
              key={cfg.rank}
              className="flex flex-col items-center"
              style={{ width: cfg.width }}
            >
              {/* Medal */}
              <motion.div
                initial={{ y: -40, opacity: 0, scale: 0 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ ...springBounce, delay: cfg.delay + 0.3 }}
                className="mb-2"
              >
                <div
                  className="w-12 h-12 rounded-full border-[3px] border-black flex items-center justify-center"
                  style={{ backgroundColor: cfg.medalColor }}
                >
                  {isCenter ? (
                    <Crown size={24} strokeWidth={3} />
                  ) : (
                    <Medal size={24} strokeWidth={3} />
                  )}
                </div>
              </motion.div>

              {/* Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...springBounce, delay: cfg.delay + 0.5 }}
                className="w-16 h-16 rounded-full border-[3px] border-black flex items-center justify-center mb-2 font-fredoka font-bold text-white text-xl"
                style={{ backgroundColor: player?.avatarColor || "#7C3AED" }}
              >
                {player?.username.charAt(0)}
              </motion.div>

              {/* Name & Score */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: cfg.delay + 0.6 }}
                className="text-center mb-2"
              >
                <p className="font-fredoka font-semibold text-sm text-purple-dark truncate max-w-[160px]">
                  {player?.username}
                </p>
                <p className="font-nunito font-bold text-lg text-purple-dark">
                  {player?.xp.toLocaleString()} XP
                </p>
              </motion.div>

              {/* Podium Block */}
              <motion.div
                initial={{ y: 100, scale: 0.8 }}
                animate={{ y: 0, scale: 1 }}
                transition={{ ...springStiff, delay: cfg.delay }}
                className="w-full rounded-t-2xl border-4 border-black relative flex items-end justify-center pb-3"
                style={{ height: cfg.height, backgroundColor: cfg.color }}
              >
                {/* Rank badge */}
                <div
                  className="absolute -top-4 right-2 w-8 h-8 rounded-full bg-purple-dark border-[3px] border-black flex items-center justify-center"
                >
                  <span className="font-fredoka font-bold text-xs text-white">
                    #{cfg.rank}
                  </span>
                </div>
                <p className="font-fredoka font-semibold text-purple-dark text-sm">
                  Lv.{player?.level}
                </p>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Rankings Table ─────────────────────────────────────────────
const PAGE_SIZE = 20;

function RankingsTable({ tab }: { tab: "global" | "friends" }) {
  const [page, setPage] = useState(0);
  const data = tab === "global" ? leaderboardData : leaderboardData.filter((_, i) => i % 3 === 0);
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paged = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <section className="bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={springBounce}
        >
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_80px_100px_80px_80px] gap-2 bg-purple-dark rounded-t-2xl border-4 border-black border-b-0 px-4 py-3">
            <span className="font-nunito font-semibold text-xs text-white uppercase tracking-wider">Rank</span>
            <span className="font-nunito font-semibold text-xs text-white uppercase tracking-wider">Hacker</span>
            <span className="font-nunito font-semibold text-xs text-white uppercase tracking-wider text-center">Level</span>
            <span className="font-nunito font-semibold text-xs text-white uppercase tracking-wider text-center">XP</span>
            <span className="font-nunito font-semibold text-xs text-white uppercase tracking-wider text-center">Badges</span>
            <span className="font-nunito font-semibold text-xs text-white uppercase tracking-wider text-center">Streak</span>
          </div>

          {/* Table Rows */}
          {paged.map((player, i) => {
            const rankInList = page * PAGE_SIZE + i + 1;
            const isCurrentUser = player.isCurrentUser;
            const isTop3 = rankInList <= 3;

            return (
              <motion.div
                key={player.rank}
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ ...springBounce, delay: i * 0.03 }}
                whileHover={{ scale: 1.01 }}
                className={`grid grid-cols-[60px_1fr_80px_100px_80px_80px] gap-2 px-4 py-3 border-b-2 border-purple-lighter items-center ${
                  i % 2 === 0 ? "bg-white" : "bg-purple-pale"
                } ${isCurrentUser ? "bg-yellow-accent/30 border-[3px] border-black rounded-xl" : ""}`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center">
                  {isTop3 ? (
                    <div
                      className={`w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center ${
                        rankInList === 1
                          ? "bg-[#FACC15]"
                          : rankInList === 2
                          ? "bg-[#C0C0C0]"
                          : "bg-[#CD7F32]"
                      }`}
                    >
                      <Trophy size={14} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-lighter border-2 border-black flex items-center justify-center">
                      <span className="font-nunito font-bold text-xs text-purple-dark">
                        {rankInList}
                      </span>
                    </div>
                  )}
                </div>

                {/* Player */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full border-[3px] border-black flex-shrink-0 flex items-center justify-center font-fredoka font-bold text-white text-sm"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.username.charAt(0)}
                  </div>
                  <span className="font-fredoka font-semibold text-sm text-purple-dark truncate">
                    {player.username}
                  </span>
                  {isCurrentUser && (
                    <span className="bg-pink-accent border-2 border-black rounded-full px-2 py-0.5 font-nunito font-bold text-[10px] text-white flex-shrink-0">
                      You
                    </span>
                  )}
                </div>

                {/* Level */}
                <div className="flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-purple-primary border-2 border-black flex items-center justify-center">
                    <span className="font-nunito font-bold text-[10px] text-white">
                      {player.level}
                    </span>
                  </div>
                </div>

                {/* XP */}
                <span className="font-nunito font-semibold text-sm text-purple-dark text-center">
                  {player.xp.toLocaleString()}
                </span>

                {/* Badges */}
                <div className="flex items-center justify-center -space-x-1">
                  {[...Array(Math.min(player.badges, 5))].map((_, j) => (
                    <div
                      key={j}
                      className="w-5 h-5 rounded-full bg-yellow-accent border-2 border-black flex items-center justify-center"
                    >
                      <Star size={10} fill="#000" strokeWidth={0} />
                    </div>
                  ))}
                  {player.badges > 5 && (
                    <span className="font-nunito font-bold text-[10px] text-purple-dark ml-1">
                      +{player.badges - 5}
                    </span>
                  )}
                </div>

                {/* Streak */}
                <div className="flex items-center justify-center gap-0.5">
                  <Flame size={14} className="text-orange-500" fill="#f97316" strokeWidth={0} />
                  <span className="font-nunito font-bold text-xs text-purple-dark">
                    {player.streak}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 rounded-full border-[3px] border-black bg-purple-lighter disabled:opacity-40 hover:scale-105 transition-transform"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-full border-[3px] border-black font-nunito font-bold text-xs transition-transform hover:scale-105 ${
                  page === i
                    ? "bg-purple-primary text-white"
                    : "bg-white text-purple-dark"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="p-2 rounded-full border-[3px] border-black bg-purple-lighter disabled:opacity-40 hover:scale-105 transition-transform"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Countdown Timer ────────────────────────────────────────────
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState(calcLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function calcLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const FlipDigit = memo(function FlipDigit({ value, label }: { value: number; label: string }) {
  const prev = useRef(value);
  const flip = prev.current !== value;
  useEffect(() => { prev.current = value; });

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        key={value}
        animate={flip ? { rotateX: [0, -90, 0] } : {}}
        transition={{ duration: 0.3 }}
        className="w-[60px] h-[60px] bg-purple-darker border-[3px] border-black rounded-xl flex items-center justify-center"
      >
        <span className="font-fredoka font-bold text-2xl text-white">
          {String(value).padStart(2, "0")}
        </span>
      </motion.div>
      <span className="font-nunito text-[10px] text-purple-lighter uppercase">{label}</span>
    </div>
  );
});

function WeeklyChallengeSection() {
  const timeLeft = useCountdown(weeklyChallenge.endsAt);
  const progressPct = (weeklyChallenge.currentProgress / weeklyChallenge.totalRequired) * 100;

  return (
    <section className="bg-purple-primary py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={springBounce}
          className="bg-purple-darker rounded-3xl border-4 border-black p-6 md:p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Info */}
            <div>
              <span className="font-nunito font-semibold text-xs text-yellow-accent uppercase tracking-widest">
                This Week&apos;s Challenge
              </span>
              <h3 className="font-fredoka font-bold text-2xl md:text-3xl text-white text-outline-sm mt-2">
                {weeklyChallenge.title}
              </h3>
              <p className="font-nunito text-sm text-purple-lighter mt-2">
                {weeklyChallenge.description}
              </p>

              {/* Progress */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-nunito font-semibold text-sm text-white">
                    Your Progress: {weeklyChallenge.currentProgress} / {weeklyChallenge.totalRequired}
                  </span>
                </div>
                <div className="w-full h-5 bg-purple-darker border-[3px] border-black rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${progressPct}%` }}
                    viewport={{ once: true }}
                    transition={{ ...springBounce, delay: 0.3 }}
                    className="h-full bg-yellow-accent rounded-full"
                  />
                  <span className="absolute inset-0 flex items-center justify-center font-nunito font-bold text-[10px] text-white">
                    {Math.round(progressPct)}%
                  </span>
                </div>
                {/* Step circles */}
                <div className="flex items-center gap-2 mt-3">
                  {Array.from({ length: weeklyChallenge.totalRequired }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ ...springBounce, delay: 0.5 + i * 0.1 }}
                      className={`w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center ${
                        i < weeklyChallenge.currentProgress
                          ? "bg-green-success"
                          : i === weeklyChallenge.currentProgress
                          ? "bg-yellow-accent"
                          : "bg-purple-darker"
                      }`}
                    >
                      {i < weeklyChallenge.currentProgress && (
                        <Check size={14} strokeWidth={4} className="text-black" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Participate Button */}
              <button className="mt-6 bg-yellow-accent border-[3px] border-black rounded-full px-6 py-3 font-fredoka font-bold text-base text-black hover:scale-105 active:scale-95 transition-transform">
                Participate Now
              </button>
            </div>

            {/* Right: Timer + Reward */}
            <div className="flex flex-col items-center justify-center">
              {/* Countdown */}
              <p className="font-nunito font-semibold text-sm text-white mb-3">Time Remaining</p>
              <div className="flex items-center gap-2">
                <FlipDigit value={timeLeft.days} label="Days" />
                <span className="font-fredoka font-bold text-2xl text-white">:</span>
                <FlipDigit value={timeLeft.hours} label="Hours" />
                <span className="font-fredoka font-bold text-2xl text-white">:</span>
                <FlipDigit value={timeLeft.minutes} label="Mins" />
                <span className="font-fredoka font-bold text-2xl text-white">:</span>
                <FlipDigit value={timeLeft.seconds} label="Secs" />
              </div>

              {/* Reward */}
              <div className="mt-6 flex items-center gap-3 bg-purple-primary/50 border-[3px] border-black rounded-2xl p-4">
                <div className="w-16 h-16 rounded-full bg-yellow-accent border-[3px] border-black flex items-center justify-center">
                  <Trophy size={28} strokeWidth={3} />
                </div>
                <div>
                  <p className="font-nunito font-semibold text-sm text-white">Reward:</p>
                  <p className="font-fredoka font-bold text-base text-yellow-accent">
                    {weeklyChallenge.rewardBadge}
                  </p>
                  <p className="font-nunito font-bold text-sm text-green-success">
                    +{weeklyChallenge.rewardXP} XP
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Badge Gallery ──────────────────────────────────────────────
const rarityColor: Record<string, string> = {
  common: "#A78BFA",
  rare: "#60A5FA",
  epic: "#A78BFA",
  legendary: "#FACC15",
};

const categoryFilter: (Badge["category"] | "All")[] = [
  "All",
  "Beginner",
  "Explorer",
  "Hacker",
  "Master",
  "Legend",
];

function BadgeGallery() {
  const [filter, setFilter] = useState<Badge["category"] | "All">("All");
  const filtered =
    filter === "All" ? allBadges : allBadges.filter((b) => b.category === filter);
  const earnedCount = allBadges.filter((b) => b.unlocked).length;

  return (
    <section className="bg-purple-pale py-12 px-4 relative">
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 48C20 48 8 40 8 28C8 18 16 12 28 12C40 12 48 18 48 28C48 40 36 48 36 48' stroke='%237C3AED' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
        backgroundSize: "60px 60px",
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="font-fredoka font-semibold text-3xl md:text-4xl text-purple-dark text-outline-sm">
            Badge Collection
          </h2>
          <p className="font-nunito text-sm text-purple-dark mt-1">
            Earn them all to become a Cyber Master!
          </p>
          <p className="font-nunito font-bold text-sm text-purple-dark mt-1">
            {earnedCount} / {allBadges.length} earned
          </p>
          <div className="w-48 h-3 bg-purple-lighter border-[3px] border-black rounded-full mx-auto mt-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(earnedCount / allBadges.length) * 100}%` }}
              viewport={{ once: true }}
              transition={{ ...springBounce, delay: 0.2 }}
              className="h-full bg-yellow-accent rounded-full"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
          {categoryFilter.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full border-[3px] font-nunito font-semibold text-sm transition-transform hover:scale-105 ${
                filter === cat
                  ? "bg-yellow-accent border-black text-black"
                  : "bg-white border-purple-lighter text-purple-dark"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-5">
          {filtered.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ ...springBounce, delay: i * 0.02 }}
              whileHover={
                badge.unlocked
                  ? { scale: 1.1, rotate: 3 }
                  : { rotate: [0, -2, 2, -2, 0] }
              }
              className={`bg-white rounded-2xl border-[3px] border-black p-3 flex flex-col items-center text-center gap-1 relative ${
                badge.unlocked ? "" : "opacity-70"
              }`}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-full border-[3px] border-black flex items-center justify-center ${
                  badge.unlocked ? "" : "grayscale"
                }`}
                style={{
                  backgroundColor: badge.unlocked ? rarityColor[badge.rarity] : "#DDD6FE",
                }}
              >
                <BadgeIcon
                  name={badge.icon}
                  size={24}
                  className={badge.unlocked ? "text-black" : "text-gray-400"}
                />
              </div>

              {/* Name */}
              <p className="font-nunito font-semibold text-[11px] text-purple-dark leading-tight line-clamp-2 min-h-[28px]">
                {badge.name}
              </p>

              {/* Status */}
              {badge.unlocked ? (
                <div className="flex items-center gap-0.5">
                  <Check size={10} strokeWidth={4} className="text-green-success" />
                  <span className="font-nunito text-[9px] text-green-success font-bold">
                    Earned
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Lock size={12} className="text-gray-400" />
                  {badge.progress && (
                    <span className="font-nunito text-[9px] text-purple-light">
                      {badge.progress}
                    </span>
                  )}
                </div>
              )}

              {/* Rarity indicator */}
              <div
                className="w-2 h-2 rounded-full border border-black absolute top-2 right-2"
                style={{ backgroundColor: rarityColor[badge.rarity] }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Team Competition ───────────────────────────────────────────
function TeamCompetition() {
  const maxXP = teamsData[0].totalXP;

  return (
    <section className="bg-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-fredoka font-semibold text-3xl md:text-4xl text-purple-dark text-outline-sm">
            Team Competition
          </h2>
          <p className="font-nunito text-sm text-purple-dark mt-1">
            Join forces with friends and compete together!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Rankings */}
          <div className="flex flex-col gap-3">
            {teamsData.map((team, i) => (
              <motion.div
                key={team.rank}
                initial={{ x: -30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ ...springBounce, delay: i * 0.08 }}
                className="bg-white rounded-xl border-[3px] border-black p-4 flex items-center gap-4"
              >
                {/* Rank */}
                <div className="w-8 h-8 rounded-full bg-purple-lighter border-2 border-black flex items-center justify-center flex-shrink-0">
                  <span className="font-nunito font-bold text-xs text-purple-dark">
                    {team.rank}
                  </span>
                </div>

                {/* Team Icon */}
                <div
                  className="w-10 h-10 rounded-lg border-[3px] border-black flex items-center justify-center font-fredoka font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: team.color }}
                >
                  {team.initial}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-fredoka font-semibold text-sm text-purple-dark truncate">
                    {team.name}
                  </p>
                  <div className="flex items-center gap-1 text-purple-light">
                    <Users size={12} />
                    <span className="font-nunito text-[11px]">{team.members} members</span>
                  </div>
                </div>

                {/* XP + Bar */}
                <div className="flex flex-col items-end gap-1 w-24">
                  <span className="font-nunito font-bold text-sm text-purple-dark">
                    {(team.totalXP / 1000).toFixed(0)}k XP
                  </span>
                  <div className="w-full h-3 bg-purple-lighter border-2 border-black rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(team.totalXP / maxXP) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ ...springBounce, delay: 0.3 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Join/Create CTA */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ ...springBounce, delay: 0.3 }}
            className="bg-purple-lighter rounded-3xl border-4 border-black p-8 flex flex-col items-center justify-center text-center gap-4"
          >
            <Shield size={48} strokeWidth={3} className="text-purple-primary" />
            <h3 className="font-fredoka font-semibold text-xl text-purple-dark">
              Not in a team yet?
            </h3>
            <p className="font-nunito text-sm text-purple-dark">
              Create your own squad or join an existing team!
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button className="bg-purple-primary border-[3px] border-black rounded-full px-6 py-3 font-fredoka font-bold text-sm text-white flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform">
                <Plus size={18} strokeWidth={3} />
                Create Team
              </button>
              <button className="bg-white border-[3px] border-black rounded-full px-6 py-3 font-fredoka font-bold text-sm text-purple-primary flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform">
                <Search size={18} strokeWidth={3} />
                Find a Team
              </button>
            </div>
            <p className="font-nunito text-xs text-purple-light mt-2">
              Playing solo is fun too!
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN LEADERBOARD PAGE
// ═════════════════════════════════════════════════════════════════
export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");

  return (
    <div className="min-h-[100dvh]">
      {/* ── Section 1: Page Header ── */}
      <section className="bg-purple-dark pt-[72px] pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 200 200" className="absolute top-20 left-10">
            <ellipse cx="100" cy="140" rx="40" ry="36" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="50" cy="80" rx="24" ry="28" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="100" cy="50" rx="24" ry="32" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="150" cy="80" rx="24" ry="28" fill="#A78BFA" stroke="#000" strokeWidth="4" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Title */}
          <motion.div
            initial={{ y: 30, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={springBounce}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <motion.div
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Trophy size={48} className="text-yellow-accent" strokeWidth={3} />
            </motion.div>
            <h1 className="font-fredoka font-bold text-4xl md:text-5xl text-white text-outline-sm">
              Cyber Rankings
            </h1>
          </motion.div>

          <p className="font-nunito text-base text-purple-lighter mb-6">
            See how you rank against other young hackers!
          </p>

          {/* Player Rank Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...springBounce, delay: 0.3 }}
            className="inline-flex items-center gap-2 bg-yellow-accent border-4 border-black rounded-full px-8 py-3 mb-6"
          >
            <span className="font-fredoka font-bold text-xl text-purple-dark">
              Your Rank: #{currentUserRank}
            </span>
            <div className="flex items-center gap-1">
              <Flame size={18} className="text-orange-600" fill="#ea580c" strokeWidth={0} />
              <span className="font-nunito font-bold text-sm text-purple-dark">15</span>
            </div>
          </motion.div>

          {/* Rank Switch Tabs */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...springBounce, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="inline-flex bg-purple-darker border-[3px] border-black rounded-full p-1">
              <button
                onClick={() => setActiveTab("global")}
                className={`px-6 py-2 rounded-full font-nunito font-semibold text-sm transition-transform hover:scale-105 ${
                  activeTab === "global"
                    ? "bg-purple-primary text-white"
                    : "bg-transparent text-purple-lighter"
                }`}
              >
                Global
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={`px-6 py-2 rounded-full font-nunito font-semibold text-sm transition-transform hover:scale-105 ${
                  activeTab === "friends"
                    ? "bg-purple-primary text-white"
                    : "bg-transparent text-purple-lighter"
                }`}
              >
                My Friends
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 2: Podium ── */}
      <PodiumSection />

      {/* ── Section 3: Rankings Table ── */}
      <RankingsTable tab={activeTab} />

      {/* ── Section 4: Weekly Challenge ── */}
      <WeeklyChallengeSection />

      {/* ── Section 5: Badge Gallery ── */}
      <BadgeGallery />

      {/* ── Section 6: Team Competition ── */}
      <TeamCompetition />
    </div>
  );
}
