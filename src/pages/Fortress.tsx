/* ═══════════════════════════════════════════════════════════════
   FORTRESS — Defense management, pure localStorage
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  Castle, Shield, Eye, ShieldCheck, Bot, Lock, Save,
  ChevronUp, Zap, Swords, Clock, Trophy, AlertTriangle,
  CheckCircle, XCircle, Activity, ChevronRight, Sword,
  ShieldOff, Flame, Sparkles, X
} from 'lucide-react';
import {
  upgradeDefense,
  calculateDefensePower,
  getUserDefenses,
  getRecentAttacks,
  getShieldRemaining,
  hasShield,
  initPlayerDefenses,
  type DefenseState,
  type BattleLog,
} from '@/lib/battleEngine';

/* ─── Defense Layer Config ─── */
interface DefenseLayerConfig {
  key: keyof DefenseState;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const DEFENSE_LAYERS: DefenseLayerConfig[] = [
  {
    key: 'firewallLevel',
    name: 'FIREWALL',
    description: 'Blocks basic attacks and unauthorized access',
    icon: <Shield size={24} strokeWidth={3} />,
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
  {
    key: 'wafLevel',
    name: 'WAF',
    description: 'Web Application Firewall - blocks web exploits',
    icon: <Shield size={24} strokeWidth={3} />,
    color: '#F97316',
    bgColor: '#FFEDD5',
  },
  {
    key: 'idsLevel',
    name: 'IDS',
    description: 'Intrusion Detection System - spots threats',
    icon: <Eye size={24} strokeWidth={3} />,
    color: '#EAB308',
    bgColor: '#FEF9C3',
  },
  {
    key: 'antiVirusLevel',
    name: 'ANTI-VIRUS',
    description: 'Stops malware and malicious code',
    icon: <ShieldCheck size={24} strokeWidth={3} />,
    color: '#22C55E',
    bgColor: '#DCFCE7',
  },
  {
    key: 'honeypotLevel',
    name: 'HONEYPOT',
    description: 'Traps attackers in decoy systems',
    icon: <Bot size={24} strokeWidth={3} />,
    color: '#9333EA',
    bgColor: '#F3E8FF',
  },
  {
    key: 'encryptionLevel',
    name: 'ENCRYPTION',
    description: 'Protects data with strong crypto',
    icon: <Lock size={24} strokeWidth={3} />,
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  {
    key: 'backupLevel',
    name: 'BACKUP',
    description: 'Recovery system for critical data',
    icon: <Save size={24} strokeWidth={3} />,
    color: '#14B8A6',
    bgColor: '#CCFBF1',
  },
];

const UPGRADE_COST_BASE = 50;
function getUpgradeCost(currentLevel: number): number {
  return UPGRADE_COST_BASE + currentLevel * 25;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function Fortress() {
  const { user, isAuthenticated } = useAuth();
  const [defenses, setDefenses] = useState<DefenseState | null>(null);
  const [attacks, setAttacks] = useState<BattleLog[]>([]);
  const [shieldActive, setShieldActive] = useState(false);
  const [shieldSeconds, setShieldSeconds] = useState(0);
  const [upgradingLayer, setUpgradingLayer] = useState<string | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [xpAnim, setXpAnim] = useState<{ amount: number; key: number } | null>(null);

  // Load data
  const loadData = useCallback(() => {
    if (!user) return;
    initPlayerDefenses(user.id);
    const d = getUserDefenses(user.id);
    setDefenses(d);
    setAttacks(getRecentAttacks(user.id));
    setShieldActive(hasShield(user.id));
    setShieldSeconds(getShieldRemaining(user.id));
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Shield countdown timer
  useEffect(() => {
    if (!shieldActive || shieldSeconds <= 0) return;
    const interval = setInterval(() => {
      if (!user) return;
      setShieldSeconds(getShieldRemaining(user.id));
      setShieldActive(hasShield(user.id));
    }, 5000);
    return () => clearInterval(interval);
  }, [shieldActive, shieldSeconds, user]);

  const handleUpgrade = (layerKey: keyof DefenseState) => {
    if (!user || !defenses) return;
    const currentLevel = defenses[layerKey] as number || 0;
    if (currentLevel >= 20) {
      setUpgradeMsg({ text: 'Max level reached!', type: 'error' });
      setTimeout(() => setUpgradeMsg(null), 2000);
      return;
    }

    setUpgradingLayer(layerKey as string);
    const cost = getUpgradeCost(currentLevel);

    const result = upgradeDefense(user.id, layerKey);
    if (result.success) {
      setXpAnim({ amount: -cost, key: Date.now() });
      setUpgradeMsg({ text: `${layerKey.toString().replace('Level', '').toUpperCase()} upgraded to Lv.${result.newLevel}!`, type: 'success' });
      loadData();
      setTimeout(() => {
        setUpgradingLayer(null);
        setUpgradeMsg(null);
      }, 2000);
    } else {
      setUpgradeMsg({ text: result.error || 'Upgrade failed', type: 'error' });
      setUpgradingLayer(null);
      setTimeout(() => setUpgradeMsg(null), 2000);
    }
  };

  const totalPower = defenses ? calculateDefensePower(defenses) : 0;
  const fortressLevel = Math.floor(totalPower / 35) + 1;
  const totalUpgrades = DEFENSE_LAYERS.reduce((sum, layer) => sum + ((defenses?.[layer.key] as number) || 0), 0);
  const maxUpgrades = DEFENSE_LAYERS.length * 20;

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl border-4 border-black p-8 max-w-md w-full text-center card-shadow-lg"
        >
          <Castle size={48} strokeWidth={2.5} className="text-purple-primary mx-auto mb-4" />
          <h2 className="font-fredoka text-2xl font-bold text-purple-darker mb-2">Login Required</h2>
          <p className="font-nunito text-purple-dark mb-6">Login to manage your fortress defenses!</p>
          <a href="/login" className="inline-block px-6 py-3 bg-purple-primary text-white rounded-2xl border-4 border-black font-fredoka font-bold hover:bg-purple-dark transition-colors">
            Go to Login
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* XP Animation */}
      <AnimatePresence>
        {xpAnim && (
          <motion.div
            key={xpAnim.key}
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 1.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="text-6xl font-fredoka font-bold text-yellow-accent text-outline">
              {xpAnim.amount > 0 ? '+' : ''}{xpAnim.amount} XP
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade message */}
      <AnimatePresence>
        {upgradeMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl border-4 border-black font-nunito font-bold text-sm ${
              upgradeMsg.type === 'success' ? 'bg-green-success text-black' : 'bg-red-alert text-white'
            }`}
          >
            {upgradeMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-14 h-14 bg-purple-dark rounded-2xl border-4 border-black flex items-center justify-center">
            <Castle size={28} strokeWidth={3} className="text-yellow-accent" />
          </div>
          <div>
            <h1 className="font-fredoka text-3xl font-bold text-purple-darker text-outline-sm">
              MY FORTRESS
            </h1>
            <p className="font-nunito text-sm text-purple-dark">
              Build your defenses. Stop the hackers.
            </p>
          </div>
        </motion.div>

        {/* Stats Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {/* Total Defense Power */}
          <div className="bg-purple-dark rounded-2xl border-4 border-black p-5 card-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={20} strokeWidth={3} className="text-yellow-accent" />
              <span className="font-nunito text-sm font-bold text-white">Total Defense</span>
            </div>
            <motion.div
              key={totalPower}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="font-fredoka text-4xl font-bold text-yellow-accent"
            >
              {totalPower}
            </motion.div>
            <div className="font-nunito text-xs text-purple-light mt-1">Power Rating</div>
          </div>

          {/* Shield Status */}
          <div className={`rounded-2xl border-4 border-black p-5 card-shadow ${shieldActive ? 'bg-green-success' : 'bg-red-alert'}`}>
            <div className="flex items-center gap-2 mb-2">
              {shieldActive ? (
                <CheckCircle size={20} strokeWidth={3} className="text-black" />
              ) : (
                <XCircle size={20} strokeWidth={3} className="text-white" />
              )}
              <span className={`font-nunito text-sm font-bold ${shieldActive ? 'text-black' : 'text-white'}`}>
                Shield Status
              </span>
            </div>
            <div className={`font-fredoka text-2xl font-bold ${shieldActive ? 'text-black' : 'text-white'}`}>
              {shieldActive ? 'ACTIVE' : 'INACTIVE'}
            </div>
            <div className={`font-nunito text-xs mt-1 ${shieldActive ? 'text-black/70' : 'text-white/70'}`}>
              {shieldActive
                ? `Expires in ${Math.ceil(shieldSeconds / 60)} min`
                : 'No active protection'
              }
            </div>
          </div>

          {/* Fortress Level */}
          <div className="bg-white rounded-2xl border-4 border-black p-5 card-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={20} strokeWidth={3} className="text-purple-primary" />
              <span className="font-nunito text-sm font-bold text-purple-darker">Fortress Level</span>
            </div>
            <div className="font-fredoka text-4xl font-bold text-purple-primary">{fortressLevel}</div>
            <div className="font-nunito text-xs text-gray-500 mt-1">Based on total defense power</div>
          </div>
        </motion.div>

        {/* Fortress Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border-4 border-black p-6 mb-8 card-shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <Castle size={22} strokeWidth={3} className="text-purple-primary" />
            <h2 className="font-fredoka text-xl font-bold text-purple-darker">Defense Layers</h2>
            <span className="ml-auto font-nunito text-sm text-gray-500">
              {totalUpgrades} / {maxUpgrades} Total Upgrades
            </span>
          </div>

          {/* Castle Visual */}
          <FortressVisual defenses={defenses} totalPower={totalPower} />

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="font-nunito text-xs text-gray-500">Fortress Strength</span>
              <span className="font-nunito text-xs font-bold text-purple-darker">
                {Math.round((totalUpgrades / maxUpgrades) * 100)}%
              </span>
            </div>
            <div className="h-4 bg-purple-pale border-2 border-black rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(totalUpgrades / maxUpgrades) * 100}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full rounded-full bg-purple-primary"
              />
            </div>
          </div>
        </motion.div>

        {/* Defense Layers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {DEFENSE_LAYERS.map((layer, index) => {
            const level = (defenses?.[layer.key] as number) || 0;
            const cost = getUpgradeCost(level);
            const isMaxed = level >= 20;
            const isUpgrading = upgradingLayer === layer.key;

            return (
              <motion.div
                key={layer.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-2xl border-4 border-black p-4 card-shadow hover:translate-y-[-2px] transition-transform"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl border-[3px] border-black flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: layer.bgColor }}
                  >
                    <span style={{ color: layer.color }}>{layer.icon}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-fredoka font-bold text-purple-darker">{layer.name}</h3>
                      <span className="font-fredoka text-lg font-bold" style={{ color: layer.color }}>
                        Lv.{level}
                      </span>
                    </div>
                    <p className="font-nunito text-xs text-gray-500 mb-2">{layer.description}</p>

                    {/* Level bar */}
                    <div className="h-2.5 bg-purple-pale border border-black rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(level / 20) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.1 * index }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                    </div>

                    {/* Upgrade button */}
                    <motion.button
                      whileHover={isMaxed || isUpgrading ? {} : { scale: 1.03 }}
                      whileTap={isMaxed || isUpgrading ? {} : { scale: 0.97 }}
                      onClick={() => handleUpgrade(layer.key)}
                      disabled={isMaxed || isUpgrading}
                      className={`w-full py-2 rounded-xl border-[3px] border-black font-nunito text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        isMaxed
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isUpgrading
                            ? 'bg-purple-pale text-purple-primary cursor-wait'
                            : 'bg-purple-pale text-purple-darker hover:bg-purple-lighter cursor-pointer'
                      }`}
                    >
                      {isMaxed ? (
                        <><Trophy size={14} strokeWidth={3} className="text-yellow-accent" /> MAXED</>
                      ) : isUpgrading ? (
                        <><Zap size={14} strokeWidth={3} className="animate-spin" /> Upgrading...</>
                      ) : (
                        <><ChevronUp size={14} strokeWidth={3} /> Upgrade ({cost} XP)</>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Attacks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border-4 border-black p-6 card-shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <Swords size={22} strokeWidth={3} className="text-red-alert" />
            <h2 className="font-fredoka text-xl font-bold text-purple-darker">Recent Attacks</h2>
            <span className="ml-auto font-nunito text-sm text-gray-500">{attacks.length} entries</span>
          </div>

          {attacks.length === 0 ? (
            <div className="text-center py-8">
              <Shield size={40} strokeWidth={2} className="text-green-success mx-auto mb-2" />
              <p className="font-nunito text-sm font-bold text-purple-darker">No attacks yet!</p>
              <p className="font-nunito text-xs text-gray-500">Your fortress is safe... for now.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {attacks.map((attack, i) => {
                  const isWin = ['full_breach', 'breach', 'partial'].includes(attack.result);
                  return (
                    <motion.div
                      key={attack.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border-[3px] border-black"
                      style={{ backgroundColor: isWin ? '#FEE2E2' : '#DCFCE7' }}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg border-[3px] border-black flex items-center justify-center flex-shrink-0 ${
                          isWin ? 'bg-red-100' : 'bg-green-100'
                        }`}
                      >
                        {isWin ? (
                          <Sword size={16} strokeWidth={3} className="text-red-600" />
                        ) : (
                          <Shield size={16} strokeWidth={3} className="text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-nunito text-sm font-bold text-purple-darker truncate">
                            {attack.attackerName} attacked!
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full border-2 border-black text-[10px] font-nunito font-bold text-white flex-shrink-0"
                            style={{
                              backgroundColor: attack.result === 'full_breach' ? '#DC2626'
                                : attack.result === 'breach' ? '#EA580C'
                                : attack.result === 'partial' ? '#CA8A04'
                                : '#16A34A'
                            }}
                          >
                            {attack.result.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-nunito text-xs text-gray-500">-{attack.damageDealt} HP</span>
                          <span className="text-gray-300">|</span>
                          <span className="font-nunito text-xs text-gray-500">
                            {new Date(attack.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FORTRESS VISUAL — Grows with defense power
   ═══════════════════════════════════════════════════════════ */

function FortressVisual({ defenses, totalPower }: { defenses: DefenseState | null; totalPower: number }) {
  if (!defenses) return null;

  const towerHeight = 40 + Math.min(totalPower, 200) * 0.4;
  const wallWidth = 160 + Math.min(totalPower, 200) * 0.6;
  const gateGlow = totalPower > 100 ? 'shadow-[0_0_20px_#7C3AED]' : '';

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative">
        {/* Sky elements */}
        <motion.div
          animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute -top-6 -left-12"
        >
          <Sparkles size={20} strokeWidth={2} className="text-yellow-accent" />
        </motion.div>

        {/* Towers */}
        <div className="flex justify-between" style={{ width: wallWidth }}>
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
              className="relative"
            >
              <div
                className="border-4 border-black rounded-t-lg mx-auto"
                style={{
                  width: i === 1 ? 36 : 28,
                  height: towerHeight - (i === 1 ? 0 : 12),
                  backgroundColor: totalPower > 100 ? '#7C3AED' : '#A78BFA',
                }}
              />
              {/* Tower top flag */}
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-5 bg-black"
              />
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                className="absolute -top-6 left-1/2 -translate-x-1/2"
              >
                <Flame size={14} strokeWidth={3} className="text-red-alert" />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Wall */}
        <motion.div
          className="border-4 border-black rounded-lg mx-auto"
          style={{
            width: wallWidth,
            height: 24,
            backgroundColor: totalPower > 150 ? '#5B21B6' : '#7C3AED',
          }}
        />

        {/* Gate */}
        <div className="flex justify-center -mt-1">
          <div
            className={`border-4 border-black rounded-b-xl ${gateGlow}`}
            style={{
              width: 48,
              height: 32,
              backgroundColor: totalPower > 80 ? '#FACC15' : '#FDE68A',
            }}
          />
        </div>

        {/* Shield dome */}
        {totalPower > 50 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none"
          >
            <div
              className="rounded-full border-2 border-dashed border-purple-primary/40"
              style={{
                width: wallWidth + 20,
                height: towerHeight + wallWidth * 0.3,
                marginLeft: -(wallWidth + 20) / 2,
              }}
            />
          </motion.div>
        )}

        {/* Defense particles */}
        {totalPower > 75 && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -20, 0],
                  x: [0, (i - 1) * 15, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 1.2 }}
                className="absolute bottom-0"
                style={{ left: `${30 + i * 30}%` }}
              >
                <Shield size={12} strokeWidth={3} className="text-purple-primary/50" />
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Base label */}
      <div className="mt-2 text-center">
        <span className="font-nunito text-xs font-bold text-purple-dark">
          Defense Power: {totalPower}
        </span>
      </div>
    </div>
  );
}
