import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Sword,
  Shield,
  Trophy,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Zap,
  Crosshair,
} from 'lucide-react';
import { trpc } from '../providers/trpc';

type FilterType = 'all' | 'attacks' | 'defenses';

interface BattleHistoryProps {
  showFilters?: boolean;
  maxEntries?: number;
}

const ATTACK_TYPE_LABELS: Record<string, string> = {
  port_scan: 'Port Scan',
  sql_injection: 'SQL Injection',
  xss: 'XSS',
  ddos: 'DDoS',
  phishing: 'Phishing',
  brute_force: 'Brute Force',
  trojan: 'Trojan',
  ransomware: 'Ransomware',
  social_engineering: 'Social Eng.',
  mitm: 'MITM',
  zero_day: 'Zero Day',
  custom: 'Custom',
};

const RESULT_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  full_breach: {
    label: 'FULL BREACH',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: <Sword size={14} strokeWidth={3} />,
  },
  breach: {
    label: 'BREACH',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    icon: <Sword size={14} strokeWidth={3} />,
  },
  partial: {
    label: 'PARTIAL',
    color: '#CA8A04',
    bgColor: '#FEF9C3',
    icon: <AlertTriangle size={14} strokeWidth={3} />,
  },
  defended: {
    label: 'DEFENDED',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    icon: <Shield size={14} strokeWidth={3} />,
  },
  blocked: {
    label: 'BLOCKED',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    icon: <Shield size={14} strokeWidth={3} />,
  },
};

export default function BattleHistory({ showFilters = true, maxEntries = 50 }: BattleHistoryProps) {
  const { data: history, isLoading } = trpc.battle.getHistory.useQuery();
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Get current user ID from profile for attack/defense classification
  const { data: profile } = trpc.player.getProfile.useQuery();
  const myUserId = profile?.userId;

  const filteredHistory = history
    ? history
        .filter((entry) => {
          if (filter === 'attacks') return entry.attackerId === myUserId;
          if (filter === 'defenses') return entry.defenderId === myUserId;
          return true;
        })
        .slice(0, maxEntries)
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Zap size={28} strokeWidth={3} className="text-purple-primary" />
        </motion.div>
        <span className="ml-3 font-nunito text-purple-dark">Loading battle history...</span>
      </div>
    );
  }

  if (!filteredHistory.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Crosshair size={40} strokeWidth={2} className="text-purple-light mb-3" />
        <p className="font-nunito text-purple-dark font-bold">No battles yet!</p>
        <p className="font-nunito text-sm text-gray-500 mt-1">
          {filter === 'attacks'
            ? 'Launch your first attack in VS Battle!'
            : filter === 'defenses'
              ? 'No one has attacked you yet.'
              : 'Get into the action - attack or be attacked!'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} strokeWidth={3} className="text-purple-primary" />
          <div className="flex gap-2">
            {(['all', 'attacks', 'defenses'] as FilterType[]).map((f) => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full border-[3px] border-black font-nunito text-xs font-bold transition-colors ${
                  filter === f
                    ? 'bg-purple-primary text-white'
                    : 'bg-white text-purple-darker hover:bg-purple-pale'
                }`}
              >
                {f === 'all' ? 'All' : f === 'attacks' ? 'Attacks' : 'Defenses'}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Battle Entries */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredHistory.map((entry, index) => {
            const resultConfig = RESULT_CONFIG[entry.result] || RESULT_CONFIG.partial;
            const isAttack = entry.attackerId === myUserId;
            const isWin = ['full_breach', 'breach', 'partial'].includes(entry.result);
            const isExpanded = expandedId === entry.id;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border-[3px] border-black overflow-hidden"
                style={{ backgroundColor: resultConfig.bgColor }}
              >
                {/* Main Row */}
                <button
                  onClick={() => setIsExpanded(isExpanded ? null : entry.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:brightness-95 transition-all"
                >
                  {/* Attack/Defense Icon */}
                  <div
                    className="w-9 h-9 rounded-lg border-[3px] border-black flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isAttack ? '#FEE2E2' : '#DBEAFE' }}
                  >
                    {isAttack ? (
                      <Sword size={16} strokeWidth={3} className="text-red-600" />
                    ) : (
                      <Shield size={16} strokeWidth={3} className="text-blue-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-nunito text-sm font-bold text-purple-darker truncate">
                        {isAttack ? 'Attacked Enemy' : 'Defended Attack'}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full border-2 border-black text-[10px] font-nunito font-bold flex items-center gap-1 flex-shrink-0"
                        style={{ backgroundColor: resultConfig.color, color: '#fff' }}
                      >
                        {resultConfig.icon}
                        {resultConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-nunito text-xs text-gray-600">
                        {ATTACK_TYPE_LABELS[entry.attackType] || entry.attackType}
                      </span>
                      <span className="text-gray-300">|</span>
                      <Clock size={10} strokeWidth={3} className="text-gray-400" />
                      <span className="font-nunito text-[10px] text-gray-400">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {entry.xpGained > 0 && (
                      <span className="font-nunito text-xs font-bold text-purple-primary">
                        +{entry.xpGained} XP
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pt-1 border-t-2 border-black/10">
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          <div className="bg-white rounded-lg border-2 border-black p-2 text-center">
                            <Zap size={14} strokeWidth={3} className="text-yellow-accent mx-auto mb-1" />
                            <div className="font-nunito text-xs text-gray-500">XP Gained</div>
                            <div className="font-fredoka text-lg font-bold text-purple-darker">
                              +{entry.xpGained}
                            </div>
                          </div>
                          <div className="bg-white rounded-lg border-2 border-black p-2 text-center">
                            <Sword size={14} strokeWidth={3} className="text-red-alert mx-auto mb-1" />
                            <div className="font-nunito text-xs text-gray-500">Damage</div>
                            <div className="font-fredoka text-lg font-bold text-red-600">
                              {entry.damageDealt}
                            </div>
                          </div>
                          <div className="bg-white rounded-lg border-2 border-black p-2 text-center">
                            <Shield size={14} strokeWidth={3} className="text-blue-info mx-auto mb-1" />
                            <div className="font-nunito text-xs text-gray-500">Blocked</div>
                            <div className="font-fredoka text-lg font-bold text-blue-600">
                              {entry.damageBlocked}
                            </div>
                          </div>
                        </div>

                        {/* Replay Data */}
                        {entry.replayData && typeof entry.replayData === 'object' && (
                          <div className="mt-2 bg-white rounded-lg border-2 border-black p-2">
                            <div className="font-nunito text-[10px] font-bold text-purple-darker mb-1">
                              Battle Replay Data
                            </div>
                            <pre className="font-jetbrains text-[10px] text-gray-600 overflow-x-auto">
                              {JSON.stringify(entry.replayData, null, 2)}
                            </pre>
                          </div>
                        )}

                        {entry.isRevenge && (
                          <div className="mt-2 flex items-center gap-1">
                            <Trophy size={12} strokeWidth={3} className="text-yellow-accent" />
                            <span className="font-nunito text-[10px] font-bold text-purple-darker">
                              Revenge Attack!
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
