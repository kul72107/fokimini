/* ═══════════════════════════════════════════════════════════════
   VS BATTLE — Complete rewrite, pure localStorage
   4 Phases: Select -> Prepare -> Battle -> Result
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  Swords, Search, Shuffle, Crosshair, Zap, Shield, Sword,
  ChevronRight, Trophy, Home, User, Users, Target, Radiation,
  Fingerprint, Globe, Mail, Lock, Bug, UserX, Wifi, Skull,
  Star, Sparkles, Activity, Database, Code, Ghost,
  ChevronLeft, Timer, AlertTriangle, CheckCircle, XCircle,
  Flame, TrendingUp, ArrowRight, RefreshCw, X, Power,
  Clock, ShieldCheck, Eye, Network
} from 'lucide-react';
import {
  launchAttack,
  getAvailableTargets,
  getUserTools,
  estimateSuccessChance,
  isToolOnCooldown,
  getToolCooldownRemaining,
  hasShield,
  getShieldRemaining,
  ALL_TOOLS,
  ATTACK_TYPES,
  getAttackTypeLabel,
  type BattleTarget,
  type BattleResult,
  type BattleRound,
  type AttackTool,
} from '@/lib/battleEngine';
import {
  OpsBattleMode,
  OpsResultPanel,
  type OpsMatchSummary,
} from '@/components/ops/OpsBattleMode';

/* ─── Types ─── */
type BattlePhase = 'select' | 'prepare' | 'battle' | 'result' | 'ops' | 'opsResult';

/* ─── Lucide Icon Mapper ─── */
const ICON_MAP: Record<string, React.ElementType> = {
  Search, Wifi, Globe, Lock, Bug, Users, ShieldCheck, Zap,
  Shield, Eye, Star, Power, Clock, Sparkles, Swords, Code,
  Activity, Database, Mail, Fingerprint, Ghost, Flame,
  Crosshair, Skull, XCircle, RefreshCw, TrendingUp, Shuffle, Network,
};

function ToolIcon({ name, size = 20, color = '#fff' }: { name: string; size?: number; color?: string }) {
  const Icon = ICON_MAP[name] || Zap;
  return <Icon size={size} color={color} strokeWidth={2.5} />;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function VSBattle() {
  const { user, isAuthenticated } = useAuth();
  const [phase, setPhase] = useState<BattlePhase>('select');
  const [selectedTarget, setSelectedTarget] = useState<BattleTarget | null>(null);
  const [selectedTools, setSelectedTools] = useState<number[]>([]);
  const [selectedAttackType, setSelectedAttackType] = useState<string>('port_scan');
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [opsSummary, setOpsSummary] = useState<OpsMatchSummary | null>(null);

  const handleSelectTarget = (target: BattleTarget) => {
    setSelectedTarget(target);
    setPhase('ops');
    setSelectedTools([]);
    setOpsSummary(null);
  };

  const toggleTool = (toolId: number) => {
    setSelectedTools(prev => {
      if (prev.includes(toolId)) return prev.filter(id => id !== toolId);
      if (prev.length >= 3) return prev;
      return [...prev, toolId];
    });
  };

  const handleLaunchAttack = () => {
    if (!selectedTarget || selectedTools.length === 0 || !user) return;
    setPhase('battle');
  };

  const handleBattleComplete = useCallback((result: BattleResult) => {
    setBattleResult(result);
    setTimeout(() => setPhase('result'), 500);
  }, []);

  const resetBattle = () => {
    setPhase('select');
    setSelectedTarget(null);
    setSelectedTools([]);
    setBattleResult(null);
    setOpsSummary(null);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl border-4 border-black p-8 max-w-md w-full text-center card-shadow-lg"
        >
          <Shield size={48} strokeWidth={2.5} className="text-purple-primary mx-auto mb-4" />
          <h2 className="font-fredoka text-2xl font-bold text-purple-darker mb-2">Login Required</h2>
          <p className="font-nunito text-purple-dark mb-6">You need to be logged in to battle!</p>
          <a
            href={`${import.meta.env.BASE_URL}login`}
            className="inline-block px-6 py-3 bg-purple-primary text-white rounded-2xl border-4 border-black font-fredoka font-bold hover:bg-purple-dark transition-colors"
          >
            Go to Login
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <AnimatePresence mode="wait">
        {phase === 'select' && (
          <PhaseSelect
            key="select"
            userId={user.id}
            onSelectTarget={handleSelectTarget}
          />
        )}
        {phase === 'ops' && selectedTarget && (
          <OpsBattleMode
            key={`ops-${selectedTarget.userId}`}
            target={selectedTarget}
            user={user}
            onBack={() => setPhase('select')}
            onComplete={(summary) => {
              setOpsSummary(summary);
              setPhase('opsResult');
            }}
          />
        )}
        {phase === 'opsResult' && selectedTarget && opsSummary && (
          <OpsResultPanel
            key="ops-result"
            summary={opsSummary}
            target={selectedTarget}
            onRunAgain={() => {
              setOpsSummary(null);
              setPhase('ops');
            }}
            onBackToTargets={resetBattle}
          />
        )}
        {phase === 'prepare' && selectedTarget && (
          <PhasePrepare
            key="prepare"
            target={selectedTarget}
            user={user}
            selectedTools={selectedTools}
            selectedAttackType={selectedAttackType}
            onToggleTool={toggleTool}
            onSelectAttackType={setSelectedAttackType}
            onLaunch={handleLaunchAttack}
            onBack={() => setPhase('select')}
          />
        )}
        {phase === 'battle' && selectedTarget && (
          <PhaseBattle
            key="battle"
            target={selectedTarget}
            toolIds={selectedTools}
            attackType={selectedAttackType}
            user={user}
            onComplete={handleBattleComplete}
          />
        )}
        {phase === 'result' && battleResult && selectedTarget && (
          <PhaseResult
            key="result"
            result={battleResult}
            target={selectedTarget}
            attackType={selectedAttackType}
            onRevenge={() => {
              setPhase('prepare');
              setBattleResult(null);
              setSelectedTools([]);
            }}
            onAttackAgain={resetBattle}
            onBackToBase={resetBattle}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PHASE 1: TARGET SELECTION
   ═══════════════════════════════════════════════════════════ */

function PhaseSelect({
  userId,
  onSelectTarget,
}: {
  userId: number;
  onSelectTarget: (t: BattleTarget) => void;
}) {
  const [targets, setTargets] = useState<BattleTarget[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTargets = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setTargets(getAvailableTargets(userId));
      setLoading(false);
    }, 400);
  }, [userId]);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const filteredTargets = targets.filter(t =>
    t.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRandomMatch = () => {
    if (targets.length > 0) {
      onSelectTarget(targets[Math.floor(Math.random() * targets.length)]);
    }
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="max-w-5xl mx-auto px-4 pt-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 bg-red-alert rounded-2xl border-4 border-black flex items-center justify-center">
          <Swords size={28} strokeWidth={3} className="text-white" />
        </div>
        <div>
          <h1 className="font-fredoka text-3xl font-bold text-purple-darker text-outline-sm">
            CYBERPAW OPS
          </h1>
          <p className="font-nunito text-sm text-purple-dark">
            Pick a rival, clear timed objectives, and outscore their defenses.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-nunito text-xs font-bold text-purple-primary bg-purple-pale px-3 py-1 rounded-full border-2 border-black">
            {targets.length} Targets
          </span>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border-[3px] border-black bg-white p-4">
          <h2 className="font-fredoka text-lg font-bold text-purple-darker">How player VS works</h2>
          <p className="mt-1 font-nunito text-sm font-semibold text-purple-dark">
            Real opponents are the other accounts registered in this browser. Register or log into a second account once, then return here and it will appear as a target. AI bot targets stay available for timed Ops practice.
          </p>
        </div>
        <div className="rounded-2xl border-[3px] border-black bg-yellow-accent px-4 py-3 text-center">
          <p className="font-nunito text-[10px] font-black uppercase text-black">Arsenal</p>
          <p className="font-fredoka text-2xl font-black text-black">{ALL_TOOLS.length}</p>
          <p className="font-nunito text-[10px] font-black text-black">tools</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={20} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-light" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search opponents..."
            className="w-full pl-12 pr-4 py-3 bg-white border-4 border-black rounded-2xl font-nunito text-purple-darker placeholder:text-purple-lighter focus:outline-none focus:ring-4 focus:ring-purple-primary/30"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRandomMatch}
          className="px-5 py-3 bg-purple-primary text-white border-4 border-black rounded-2xl font-nunito font-bold flex items-center gap-2 hover:bg-purple-dark transition-colors"
        >
          <Shuffle size={18} strokeWidth={3} />
          <span className="hidden sm:inline">Random</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadTargets}
          className="px-4 py-3 bg-white border-4 border-black rounded-2xl hover:bg-purple-pale transition-colors"
          title="Refresh targets"
        >
          <RefreshCw size={18} strokeWidth={3} className="text-purple-primary" />
        </motion.button>
      </div>

      {/* Target Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Zap size={32} strokeWidth={3} className="text-purple-primary" />
          </motion.div>
          <span className="ml-3 font-nunito text-purple-dark font-bold">Scanning for targets...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredTargets.map((target, index) => (
              <TargetCard key={`${target.userId}-${index}`} target={target} index={index} onSelect={onSelectTarget} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && filteredTargets.length === 0 && (
        <div className="text-center py-16">
          <Target size={48} strokeWidth={2} className="text-purple-light mx-auto mb-3" />
          <p className="font-fredoka text-xl text-purple-darker">No targets found</p>
          <p className="font-nunito text-sm text-gray-500 mt-1">Try a different search or refresh</p>
        </div>
      )}
    </motion.div>
  );
}

function TargetCard({
  target,
  index,
  onSelect,
}: {
  target: BattleTarget;
  index: number;
  onSelect: (t: BattleTarget) => void;
}) {
  const winRate = target.wins + target.losses > 0
    ? Math.round((target.wins / (target.wins + target.losses)) * 100)
    : 0;
  const shieldActive = hasShield(target.userId);
  const shieldSecs = getShieldRemaining(target.userId);

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 400, damping: 25 }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(target)}
      className="bg-white rounded-2xl border-4 border-black p-5 card-shadow text-left hover:border-purple-primary transition-colors relative overflow-hidden"
    >
      {/* Bot badge */}
      {target.isBot && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-pale border-2 border-black rounded-full">
          <span className="font-nunito text-[10px] font-bold text-purple-primary">AI BOT</span>
        </div>
      )}

      {/* Shield indicator */}
      {shieldActive && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-success border-2 border-black rounded-full flex items-center gap-1">
          <Shield size={10} strokeWidth={3} />
          <span className="font-nunito text-[10px] font-bold">{Math.ceil(shieldSecs / 60)}m</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3 mt-4">
        <div className="w-12 h-12 rounded-xl border-[3px] border-black flex items-center justify-center"
          style={{ backgroundColor: target.isBot ? '#F5F3FF' : '#DBEAFE' }}
        >
          <User size={24} strokeWidth={3} className={target.isBot ? 'text-purple-primary' : 'text-blue-info'} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-fredoka font-bold text-purple-darker truncate">{target.displayName}</h3>
          <div className="flex items-center gap-2">
            <span className="font-nunito text-xs font-bold text-purple-primary">Lv.{target.level}</span>
            <span className="font-nunito text-xs text-gray-400">|</span>
            <span className="font-nunito text-xs text-purple-dark">PWR {target.defensePower}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 bg-purple-pale rounded-lg border-2 border-black p-2 text-center">
          <div className="font-fredoka text-sm font-bold text-purple-darker">{target.wins}W</div>
          <div className="font-nunito text-[10px] text-gray-500">Wins</div>
        </div>
        <div className="flex-1 bg-purple-pale rounded-lg border-2 border-black p-2 text-center">
          <div className="font-fredoka text-sm font-bold text-red-alert">{target.losses}L</div>
          <div className="font-nunito text-[10px] text-gray-500">Losses</div>
        </div>
        <div className="flex-1 rounded-lg border-2 border-black p-2 text-center"
          style={{ backgroundColor: winRate > 50 ? '#DCFCE7' : winRate > 30 ? '#FEF9C3' : '#FEE2E2' }}
        >
          <div className="font-fredoka text-sm font-bold text-purple-darker">{winRate}%</div>
          <div className="font-nunito text-[10px] text-gray-500">Win Rate</div>
        </div>
      </div>

      {/* Defense bar */}
      <div className="flex items-center gap-2">
        <Shield size={14} strokeWidth={3} className="text-purple-primary flex-shrink-0" />
        <div className="flex-1 h-2.5 bg-purple-pale border-2 border-black rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(target.defensePower, 100)}%` }}
            transition={{ duration: 0.8, delay: index * 0.05 }}
            className="h-full rounded-full bg-purple-primary"
          />
        </div>
        <span className="font-nunito text-xs font-bold text-purple-darker">{target.defensePower}</span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1 text-purple-primary">
        <span className="font-nunito text-xs font-bold">Start Timed Ops</span>
        <ChevronRight size={14} strokeWidth={3} />
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════
   PHASE 2: ATTACK PREPARATION
   ═══════════════════════════════════════════════════════════ */

const ATTACK_TYPE_ICONS: Record<string, React.ReactNode> = {
  port_scan: <Crosshair size={20} strokeWidth={3} />,
  sql_injection: <Database size={20} strokeWidth={3} />,
  xss: <Globe size={20} strokeWidth={3} />,
  ddos: <Radiation size={20} strokeWidth={3} />,
  phishing: <Mail size={20} strokeWidth={3} />,
  brute_force: <Fingerprint size={20} strokeWidth={3} />,
  trojan: <Bug size={20} strokeWidth={3} />,
  ransomware: <Lock size={20} strokeWidth={3} />,
  social_engineering: <UserX size={20} strokeWidth={3} />,
  mitm: <Wifi size={20} strokeWidth={3} />,
  zero_day: <Sparkles size={20} strokeWidth={3} />,
  custom: <Swords size={20} strokeWidth={3} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  recon: '#60A5FA', network: '#22D3EE', web: '#A78BFA',
  crypto: '#F472B6', malware: '#F87171', social: '#FB923C',
  defense: '#4ADE80', advanced: '#FACC15',
};

function PhasePrepare({
  target,
  user,
  selectedTools,
  selectedAttackType,
  onToggleTool,
  onSelectAttackType,
  onLaunch,
  onBack,
}: {
  target: BattleTarget;
  user: any;
  selectedTools: number[];
  selectedAttackType: string;
  onToggleTool: (id: number) => void;
  onSelectAttackType: (key: string) => void;
  onLaunch: () => void;
  onBack: () => void;
}) {
  const tools = getUserTools(user.id);
  const successChance = estimateSuccessChance(user.level, selectedTools, target.defensePower);
  const shieldActive = hasShield(target.userId);

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="max-w-5xl mx-auto px-4 pt-6"
    >
      {/* Back button */}
      <motion.button
        whileHover={{ x: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className="flex items-center gap-1 mb-4 font-nunito text-sm font-bold text-purple-dark hover:text-purple-primary"
      >
        <ChevronLeft size={18} strokeWidth={3} />
        Back to Targets
      </motion.button>

      {/* Target Header */}
      <div className="bg-white rounded-2xl border-4 border-black p-5 card-shadow mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-info rounded-2xl border-4 border-black flex items-center justify-center">
            <Target size={28} strokeWidth={3} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-fredoka text-2xl font-bold text-purple-darker">
              Target: {target.displayName}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-nunito text-sm font-bold text-purple-primary">Lv.{target.level}</span>
              <span className="font-nunito text-sm text-gray-400">|</span>
              <span className="font-nunito text-sm font-bold text-purple-dark">Defense: {target.defensePower}</span>
              {shieldActive && (
                <>
                  <span className="font-nunito text-sm text-gray-400">|</span>
                  <span className="flex items-center gap-1 font-nunito text-xs font-bold text-green-success bg-green-success/20 px-2 py-0.5 rounded-full border-2 border-black">
                    <Shield size={10} strokeWidth={3} /> Shielded
                  </span>
                </>
              )}
            </div>
          </div>
          {shieldActive && (
            <div className="text-center">
              <AlertTriangle size={24} strokeWidth={3} className="text-yellow-accent mx-auto" />
              <span className="font-nunito text-[10px] font-bold text-yellow-accent">Shielded!</span>
            </div>
          )}
        </div>
      </div>

      {/* Attack Type Selection */}
      <div className="bg-white rounded-2xl border-4 border-black p-5 card-shadow mb-6">
        <h3 className="font-fredoka text-lg font-bold text-purple-darker mb-3 flex items-center gap-2">
          <Sword size={20} strokeWidth={3} className="text-red-alert" />
          Attack Type
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {ATTACK_TYPES.map(type => (
            <motion.button
              key={type.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectAttackType(type.key)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-[3px] font-nunito text-xs font-bold transition-all ${
                selectedAttackType === type.key
                  ? 'border-purple-primary bg-purple-primary text-white'
                  : 'border-black/20 bg-purple-pale text-purple-darker hover:border-purple-primary/50'
              }`}
            >
              <span className={selectedAttackType === type.key ? 'text-white' : 'text-purple-primary'}>
                {ATTACK_TYPE_ICONS[type.key] || <Zap size={18} strokeWidth={3} />}
              </span>
              <span>{type.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tool Selection */}
      <div className="bg-white rounded-2xl border-4 border-black p-5 card-shadow mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-fredoka text-lg font-bold text-purple-darker flex items-center gap-2">
            <Zap size={20} strokeWidth={3} className="text-yellow-accent" />
            Select Tools ({selectedTools.length}/3)
          </h3>
          {selectedTools.length === 3 && (
            <span className="font-nunito text-xs font-bold text-green-success">MAX SELECTED</span>
          )}
        </div>

        {tools.length === 0 ? (
          <p className="font-nunito text-sm text-gray-500 text-center py-6">
            No tools in your arsenal. Visit the Arsenal to get tools!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tools.map(tool => {
              const isSelected = selectedTools.includes(tool.id);
              const onCd = isToolOnCooldown(tool.id);
              const cdSecs = getToolCooldownRemaining(tool.id);
              const color = CATEGORY_COLORS[tool.category] || '#7C3AED';

              return (
                <motion.button
                  key={tool.id}
                  whileHover={onCd ? {} : { scale: 1.03 }}
                  whileTap={onCd ? {} : { scale: 0.97 }}
                  onClick={() => !onCd && onToggleTool(tool.id)}
                  disabled={onCd}
                  className={`relative flex items-center gap-3 p-3 rounded-xl border-[3px] transition-all text-left ${
                    isSelected
                      ? 'border-purple-primary bg-purple-primary/10'
                      : onCd
                        ? 'border-gray-200 bg-gray-50 opacity-60'
                        : 'border-black/20 bg-purple-pale hover:border-purple-primary/50'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg border-[3px] border-black flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isSelected ? '#7C3AED' : color }}
                  >
                    <ToolIcon name={tool.icon} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-nunito text-sm font-bold text-purple-darker truncate">{tool.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-nunito text-[10px] text-gray-500">PWR {tool.power}</span>
                      <span className="font-nunito text-[10px] text-gray-500">|</span>
                      <span className="font-nunito text-[10px] text-gray-500">T{tool.tier}</span>
                      <span className="font-nunito text-[10px] text-gray-500">|</span>
                      <Ghost size={10} strokeWidth={3} className="text-purple-light" />
                      <span className="font-nunito text-[10px] text-gray-500">{tool.stealthLevel}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle size={20} strokeWidth={3} className="text-purple-primary flex-shrink-0" />
                  )}
                  {onCd && (
                    <div className="absolute inset-0 bg-black/10 rounded-xl flex items-center justify-center">
                      <span className="font-nunito text-xs font-bold text-red-alert bg-white border-2 border-black px-2 py-0.5 rounded-full">
                        <Clock size={10} className="inline mr-1" />
                        {cdSecs}s
                      </span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Estimated Success */}
      <div className="bg-white rounded-2xl border-4 border-black p-5 card-shadow mb-6">
        <h3 className="font-fredoka text-lg font-bold text-purple-darker mb-3 flex items-center gap-2">
          <TrendingUp size={20} strokeWidth={3} className="text-blue-info" />
          Mission Intel
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-nunito text-sm text-purple-dark">Success Chance</span>
              <span className="font-fredoka text-lg font-bold"
                style={{ color: successChance > 70 ? '#22C55E' : successChance > 40 ? '#EAB308' : '#EF4444' }}
              >
                {successChance}%
              </span>
            </div>
            <div className="h-4 bg-purple-pale border-2 border-black rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${successChance}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: successChance > 70 ? '#22C55E' : successChance > 40 ? '#EAB308' : '#EF4444'
                }}
              />
            </div>
          </div>
          <div className="text-center px-4 border-l-2 border-black/10">
            <div className="font-nunito text-xs text-gray-500">Est. Damage</div>
            <div className="font-fredoka text-xl font-bold text-red-alert">
              {selectedTools.length > 0 ? `${Math.floor(selectedTools.reduce((sum, id) => {
                const t = ALL_TOOLS.find(tool => tool.id === id);
                return sum + (t ? t.power * t.tier : 0);
              }, 0) * 0.8)}-${Math.floor(selectedTools.reduce((sum, id) => {
                const t = ALL_TOOLS.find(tool => tool.id === id);
                return sum + (t ? t.power * t.tier : 0);
              }, 0) * 1.5)}` : '0-0'}
            </div>
          </div>
        </div>
      </div>

      {/* LAUNCH BUTTON */}
      <motion.button
        whileHover={selectedTools.length > 0 ? { scale: 1.02 } : {}}
        whileTap={selectedTools.length > 0 ? { scale: 0.98 } : {}}
        onClick={onLaunch}
        disabled={selectedTools.length === 0}
        className={`w-full py-4 rounded-2xl border-4 border-black font-fredoka text-xl font-bold flex items-center justify-center gap-3 transition-all ${
          selectedTools.length > 0
            ? 'bg-red-alert text-white hover:bg-red-600 card-shadow-lg cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Swords size={28} strokeWidth={3} />
        LAUNCH ATTACK
        <ArrowRight size={24} strokeWidth={3} />
      </motion.button>

      {selectedTools.length === 0 && (
        <p className="text-center font-nunito text-xs text-gray-400 mt-2">Select at least 1 tool to attack</p>
      )}
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════════════
   PHASE 3: BATTLE ANIMATION
   ═══════════════════════════════════════════════════════════ */

function PhaseBattle({
  target,
  toolIds,
  attackType,
  user,
  onComplete,
}: {
  target: BattleTarget;
  toolIds: number[];
  attackType: string;
  user: any;
  onComplete: (result: BattleResult) => void;
}) {
  const [currentRound, setCurrentRound] = useState(0);
  const [rounds, setRounds] = useState<BattleRound[]>([]);
  const [attackerHp, setAttackerHp] = useState(100);
  const [defenderHp, setDefenderHp] = useState(100);
  const [flashAttacker, setFlashAttacker] = useState(false);
  const [flashDefender, setFlashDefender] = useState(false);
  const [showDamage, setShowDamage] = useState<number | null>(null);
  const [showBlocked, setShowBlocked] = useState<number | null>(null);
  const [battleMessage, setBattleMessage] = useState('Initializing attack sequence...');
  const [isComplete, setIsComplete] = useState(false);
  const resultRef = useRef<BattleResult | null>(null);

  // Run the battle once on mount
  useEffect(() => {
    try {
      const result = launchAttack(user.id, target.userId, attackType, toolIds);
      resultRef.current = result;

      // Play out rounds one by one
      const replay = result.replay;
      let roundIndex = 0;
      let currentAttackerHp = 100;
      let currentDefenderHp = 100;

      const playRound = () => {
        if (roundIndex >= replay.rounds.length) {
          setIsComplete(true);
          setTimeout(() => onComplete(result), 1500);
          return;
        }

        const round = replay.rounds[roundIndex];
        setCurrentRound(roundIndex + 1);
        setRounds(prev => [...prev, round]);
        setBattleMessage(round.message);

        // Flash effects
        if (round.damage > 0) {
          setFlashDefender(true);
          setShowDamage(round.damage);
          setTimeout(() => {
            setFlashDefender(false);
            setShowDamage(null);
          }, 600);
        }

        if (round.blocked > 0) {
          setFlashAttacker(true);
          setShowBlocked(round.blocked);
          setTimeout(() => {
            setFlashAttacker(false);
            setShowBlocked(null);
          }, 600);
        }

        // Update HP
        currentDefenderHp = Math.max(0, currentDefenderHp - round.damage);
        if (round.damage === 0) {
          currentAttackerHp = Math.max(0, currentAttackerHp - Math.floor(Math.random() * 6 + 2));
        }
        setAttackerHp(currentAttackerHp);
        setDefenderHp(currentDefenderHp);

        roundIndex++;
        setTimeout(playRound, 1800);
      };

      // Start after brief intro
      setTimeout(playRound, 1200);
    } catch (err) {
      setBattleMessage('Attack failed! ' + (err as Error).message);
      setTimeout(() => onComplete({
        result: 'blocked', damageDealt: 0, damageBlocked: 0,
        xpGained: 0, toolsUsed: toolIds, attackType,
        replay: { rounds: [], attackerName: user.displayName, defenderName: target.displayName, finalAttackerHp: 100, finalDefenderHp: 100 },
        won: false, timestamp: new Date().toISOString(),
      }), 1500);
    }
  }, []);

  const attackerPercent = attackerHp;
  const defenderPercent = defenderHp;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.2, opacity: 0 }}
      className="max-w-5xl mx-auto px-4 pt-6"
    >
      {/* Battle Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="inline-flex items-center gap-2 bg-white rounded-2xl border-4 border-black px-6 py-3 card-shadow"
        >
          <Swords size={24} strokeWidth={3} className="text-red-alert" />
          <span className="font-fredoka text-xl font-bold text-purple-darker">
            {isComplete ? 'BATTLE COMPLETE' : `ROUND ${currentRound}`}
          </span>
          <Swords size={24} strokeWidth={3} className="text-red-alert" />
        </motion.div>
      </div>

      {/* VS Battlefield */}
      <div className="bg-white rounded-2xl border-4 border-black p-6 card-shadow-lg mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          {/* ATTACKER (Left) */}
          <div className="flex-1">
            <div className={`rounded-2xl border-4 border-black p-4 transition-all ${flashAttacker ? 'bg-red-100 scale-105' : 'bg-red-50'}`}>
              {/* Name & Level */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-red-alert rounded-xl border-[3px] border-black flex items-center justify-center">
                  <Sword size={20} strokeWidth={3} className="text-white" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-purple-darker">{user.displayName || user.username}</h3>
                  <span className="font-nunito text-xs text-purple-light">Lv.{user.level} | Attacker</span>
                </div>
              </div>

              {/* HP Bar */}
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="font-nunito text-xs font-bold text-purple-darker">HP</span>
                  <span className="font-nunito text-xs font-bold text-purple-darker">{attackerPercent}%</span>
                </div>
                <div className="h-5 bg-gray-200 border-2 border-black rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${attackerPercent}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: attackerPercent > 60 ? '#EF4444' : attackerPercent > 30 ? '#EAB308' : '#DC2626',
                    }}
                  />
                </div>
              </div>

              {/* Attack flash effect */}
              <AnimatePresence>
                {showBlocked !== null && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0, y: -30 }}
                    className="text-center mt-2"
                  >
                    <span className="font-fredoka text-2xl font-bold text-blue-info">-{showBlocked}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-16 h-16 bg-yellow-accent rounded-full border-4 border-black flex items-center justify-center card-shadow"
            >
              <span className="font-fredoka text-xl font-bold text-black">VS</span>
            </motion.div>
          </div>

          {/* DEFENDER (Right) */}
          <div className="flex-1">
            <div className={`rounded-2xl border-4 border-black p-4 transition-all ${flashDefender ? 'bg-red-200 scale-105' : 'bg-blue-50'}`}>
              {/* Name & Level */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-blue-info rounded-xl border-[3px] border-black flex items-center justify-center">
                  <Shield size={20} strokeWidth={3} className="text-white" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-purple-darker">{target.displayName}</h3>
                  <span className="font-nunito text-xs text-purple-light">Lv.{target.level} | Defender</span>
                </div>
              </div>

              {/* HP Bar */}
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="font-nunito text-xs font-bold text-purple-darker">HP</span>
                  <span className="font-nunito text-xs font-bold text-purple-darker">{defenderPercent}%</span>
                </div>
                <div className="h-5 bg-gray-200 border-2 border-black rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${defenderPercent}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: defenderPercent > 60 ? '#3B82F6' : defenderPercent > 30 ? '#EAB308' : '#DC2626',
                    }}
                  />
                </div>
              </div>

              {/* Damage flash effect */}
              <AnimatePresence>
                {showDamage !== null && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0, y: -30 }}
                    className="text-center mt-2"
                  >
                    <span className="font-fredoka text-3xl font-bold text-red-alert">-{showDamage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Battle Message */}
        <div className="mt-4 text-center">
          <motion.p
            key={battleMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-nunito text-sm font-bold text-purple-darker bg-purple-pale inline-block px-4 py-2 rounded-xl border-2 border-black"
          >
            {battleMessage}
          </motion.p>
        </div>

        {/* Round log */}
        <div className="mt-4 max-h-32 overflow-y-auto space-y-1">
          {rounds.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-pale/50"
            >
              <span className="font-nunito text-xs font-bold text-purple-primary">R{r.round}</span>
              <span className="font-nunito text-xs text-purple-darker">{r.attackerTool}</span>
              <span className="font-nunito text-xs text-gray-400">vs</span>
              <span className="font-nunito text-xs text-blue-info">{r.defenderLayer}</span>
              {r.damage > 0 && <span className="font-nunito text-xs font-bold text-red-alert">-{r.damage}</span>}
              {r.blocked > 0 && <span className="font-nunito text-xs font-bold text-blue-info">blk {r.blocked}</span>}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tool icons display */}
      <div className="flex justify-center gap-3">
        {toolIds.map(id => {
          const tool = ALL_TOOLS.find(t => t.id === id);
          if (!tool) return null;
          const color = CATEGORY_COLORS[tool.category] || '#7C3AED';
          return (
            <motion.div
              key={id}
              animate={currentRound > 0 && rounds[currentRound - 1]?.attackerTool === tool.name
                ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }
                : {}
              }
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-xl border-[3px] border-black flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <ToolIcon name={tool.icon} size={22} />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PHASE 4: BATTLE RESULT
   ═══════════════════════════════════════════════════════════ */

function PhaseResult({
  result,
  target,
  attackType,
  onRevenge,
  onAttackAgain,
  onBackToBase,
}: {
  result: BattleResult;
  target: BattleTarget;
  attackType: string;
  onRevenge: () => void;
  onAttackAgain: () => void;
  onBackToBase: () => void;
}) {
  const resultConfig = {
    full_breach: { label: 'FULL BREACH', color: '#DC2626', bg: '#FEE2E2', emoji: 'SKULL' },
    breach: { label: 'BREACH', color: '#EA580C', bg: '#FFF7ED', emoji: 'SWORD' },
    partial: { label: 'PARTIAL', color: '#CA8A04', bg: '#FEF9C3', emoji: 'ALERT' },
    defended: { label: 'DEFENDED', color: '#16A34A', bg: '#DCFCE7', emoji: 'SHIELD' },
    blocked: { label: 'BLOCKED', color: '#16A34A', bg: '#DCFCE7', emoji: 'BLOCK' },
  }[result.result] || { label: 'UNKNOWN', color: '#666', bg: '#F5F5F5', emoji: 'QUESTION' };

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="max-w-lg mx-auto px-4 pt-6"
    >
      {/* Result Banner */}
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="rounded-2xl border-4 border-black p-6 card-shadow-lg mb-6 text-center"
        style={{ backgroundColor: result.won ? '#FEE2E2' : '#DBEAFE' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        >
          {result.won ? (
            <Trophy size={64} strokeWidth={2.5} className="text-yellow-accent mx-auto mb-2" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }} />
          ) : (
            <Shield size={64} strokeWidth={2.5} className="text-blue-info mx-auto mb-2" style={{ filter: 'drop-shadow(3px 3px 0 #000)' }} />
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`font-fredoka text-5xl font-bold text-outline mb-2 ${result.won ? 'text-yellow-accent' : 'text-blue-info'}`}
        >
          {result.won ? 'VICTORY!' : 'DEFEATED'}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-3 border-black"
          style={{ backgroundColor: resultConfig.color }}
        >
          <Sword size={14} strokeWidth={3} className="text-white" />
          <span className="font-nunito text-sm font-bold text-white">{resultConfig.label}</span>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border-4 border-black p-5 card-shadow mb-6"
      >
        <h3 className="font-fredoka text-lg font-bold text-purple-darker mb-4 text-center">Battle Report</h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Damage Dealt */}
          <div className="bg-red-50 rounded-xl border-2 border-black p-3 text-center">
            <Sword size={20} strokeWidth={3} className="text-red-alert mx-auto mb-1" />
            <div className="font-nunito text-xs text-gray-500">Damage Dealt</div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
              className="font-fredoka text-2xl font-bold text-red-alert"
            >
              {result.damageDealt}
            </motion.div>
          </div>

          {/* Damage Blocked */}
          <div className="bg-blue-50 rounded-xl border-2 border-black p-3 text-center">
            <Shield size={20} strokeWidth={3} className="text-blue-info mx-auto mb-1" />
            <div className="font-nunito text-xs text-gray-500">Blocked</div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: 'spring' }}
              className="font-fredoka text-2xl font-bold text-blue-info"
            >
              {result.damageBlocked}
            </motion.div>
          </div>

          {/* XP Earned */}
          <div className="bg-purple-pale rounded-xl border-2 border-black p-3 text-center">
            <Star size={20} strokeWidth={3} className="text-purple-primary mx-auto mb-1" />
            <div className="font-nunito text-xs text-gray-500">XP Earned</div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="font-fredoka text-2xl font-bold text-purple-primary"
            >
              +{result.xpGained}
            </motion.div>
          </div>

          {/* Tools Used */}
          <div className="bg-yellow-50 rounded-xl border-2 border-black p-3 text-center">
            <Zap size={20} strokeWidth={3} className="text-yellow-accent mx-auto mb-1" />
            <div className="font-nunito text-xs text-gray-500">Tools Used</div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: 'spring' }}
              className="font-fredoka text-2xl font-bold text-purple-darker"
            >
              {result.toolsUsed.length}
            </motion.div>
          </div>
        </div>

        {/* Attack Type */}
        <div className="mt-3 flex items-center justify-center gap-2 bg-purple-pale rounded-xl border-2 border-black p-2">
          <span className="font-nunito text-xs text-gray-500">Attack Type:</span>
          <span className="font-nunito text-sm font-bold text-purple-darker">{getAttackTypeLabel(attackType)}</span>
        </div>
      </motion.div>

      {/* Round Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-2xl border-4 border-black p-5 card-shadow mb-6"
      >
        <h3 className="font-fredoka text-lg font-bold text-purple-darker mb-3 flex items-center gap-2">
          <Activity size={20} strokeWidth={3} className="text-purple-primary" />
          Round Summary
        </h3>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {result.replay.rounds.map((round, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/10"
              style={{ backgroundColor: round.damage > round.blocked ? '#FEE2E2' : '#F0F9FF' }}
            >
              <span className="font-nunito text-xs font-bold text-purple-primary w-6">R{round.round}</span>
              <span className="font-nunito text-xs text-purple-darker flex-1">{round.attackerTool}</span>
              <span className="font-nunito text-xs text-gray-400">vs</span>
              <span className="font-nunito text-xs text-blue-info flex-1">{round.defenderLayer}</span>
              <span className={`font-nunito text-xs font-bold ${round.damage > 0 ? 'text-red-alert' : 'text-green-success'}`}>
                {round.damage > 0 ? `-${round.damage}` : 'Blocked'}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="space-y-3"
      >
        {!result.won && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRevenge}
            className="w-full py-3 bg-red-alert text-white rounded-2xl border-4 border-black font-fredoka text-lg font-bold flex items-center justify-center gap-2 card-shadow hover:bg-red-600 transition-colors"
          >
            <Swords size={22} strokeWidth={3} />
            REVENGE ATTACK
          </motion.button>
        )}

        {result.won && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAttackAgain}
            className="w-full py-3 bg-purple-primary text-white rounded-2xl border-4 border-black font-fredoka text-lg font-bold flex items-center justify-center gap-2 card-shadow hover:bg-purple-dark transition-colors"
          >
            <Swords size={22} strokeWidth={3} />
            ATTACK AGAIN
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBackToBase}
          className="w-full py-3 bg-white text-purple-darker rounded-2xl border-4 border-black font-fredoka text-lg font-bold flex items-center justify-center gap-2 hover:bg-purple-pale transition-colors"
        >
          <Home size={20} strokeWidth={3} />
          Back to Base
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
