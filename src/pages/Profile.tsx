import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { localAuth } from '@/lib/localAuth';
import {
  Trophy, Zap, Target, Flame, Shield, Lock,
  ChevronRight, Star, Swords, Gamepad2, Terminal,
  Edit3, Check, X, Cat, Ghost, Bug, Eye, Wifi, Key,
  Router, Sparkles, Crosshair, Save
} from 'lucide-react';

const AVATARS = [
  { id: 'cat', icon: Cat, color: '#FB923C' },
  { id: 'ghost', icon: Ghost, color: '#9CA3AF' },
  { id: 'bug', icon: Bug, color: '#4ADE80' },
  { id: 'eye', icon: Eye, color: '#22D3EE' },
  { id: 'wifi', icon: Wifi, color: '#A78BFA' },
  { id: 'key', icon: Key, color: '#F472B6' },
  { id: 'router', icon: Router, color: '#60A5FA' },
  { id: 'shield', icon: Shield, color: '#F87171' },
  { id: 'zap', icon: Zap, color: '#FACC15' },
  { id: 'sparkles', icon: Sparkles, color: '#A78BFA' },
  { id: 'crosshair', icon: Crosshair, color: '#22D3EE' },
  { id: 'lock', icon: Lock, color: '#4ADE80' },
];

const TITLES = [
  { level: 1, title: 'Script Kitten' },
  { level: 2, title: 'Code Cat' },
  { level: 3, title: 'Whisker Hacker' },
  { level: 5, title: 'Cyber Purr-ogrammer' },
  { level: 7, title: 'Shadow Tail' },
  { level: 10, title: 'Neon Claw' },
  { level: 15, title: 'Data Tiger' },
  { level: 20, title: 'Phantom Pounce' },
  { level: 25, title: 'Net Ninja Cat' },
  { level: 30, title: 'Legendary CyberLion' },
];

function levelFromXp(totalXp: number) {
  let level = 1;
  let xpNeeded = 100;
  let remaining = totalXp;
  while (remaining >= xpNeeded) {
    remaining -= xpNeeded;
    level++;
    xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
  }
  return { level, currentXp: remaining, nextLevelXp: xpNeeded };
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('US');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'cat');
  const [selectedTitle, setSelectedTitle] = useState(user?.title || 'Script Kitten');
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh from localStorage
  const currentUser = localAuth.me();
  const stats = localAuth.getStats();
  const defenses = localAuth.getDefenses();
  const gameProgress = localAuth.getGameProgress();
  const xpLogs = localAuth.getXpLogs();

  const lvl = levelFromXp(currentUser?.totalXp || 0);
  const completedGames = Object.values(gameProgress).filter((p: any) => p.completed).length;
  const xpPercent = Math.floor((lvl.currentXp / lvl.nextLevelXp) * 100);

  // Available titles
  const availableTitles = TITLES.filter(t => lvl.level >= t.level);

  const handleSave = () => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      displayName: displayName || currentUser.displayName,
      name: displayName || currentUser.displayName,
      bio,
      country: country.toUpperCase(),
      avatar: selectedAvatar,
      title: selectedTitle,
    };
    localStorage.setItem('cyberpaw_current_user', JSON.stringify(updated));

    // Also update in users registry
    const users = JSON.parse(localStorage.getItem('cyberpaw_users') || '{}');
    if (users[currentUser.username]) {
      users[currentUser.username].user = updated;
      localStorage.setItem('cyberpaw_users', JSON.stringify(users));
    }

    setEditMode(false);
    setRefreshKey(k => k + 1);
  };

  const currentAvatar = AVATARS.find(a => a.id === (currentUser?.avatar || 'cat')) || AVATARS[0];
  const AvatarIcon = currentAvatar.icon;

  // Show login prompt if not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F3FF' }}>
        <motion.div
          initial={{ scale: 0.9 }} animate={{ scale: 1 }}
          className="max-w-md mx-4 p-8 border-4 border-black rounded-3xl text-center"
          style={{ backgroundColor: '#FFF', boxShadow: '8px 8px 0 #000' }}
        >
          <div className="w-20 h-20 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FACC15' }}>
            <Cat size={40} />
          </div>
          <h2 className="text-2xl font-fredoka font-bold mb-2">Login Required</h2>
          <p className="text-gray-600 font-nunito mb-6">Create an account to track your progress and unlock all features!</p>
          <div className="flex gap-3 justify-center">
            <Link to="/login" className="px-6 py-3 bg-purple-primary text-white font-bold rounded-2xl border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all">
              Login
            </Link>
            <Link to="/register" className="px-6 py-3 font-bold rounded-2xl border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] transition-all" style={{ backgroundColor: '#4ADE80' }}>
              Sign Up
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div key={refreshKey} className="min-h-screen pb-12" style={{ backgroundColor: '#F5F3FF' }}>
      {/* Header */}
      <div className="border-b-4 border-black" style={{ backgroundColor: '#7C3AED' }}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <motion.div
              className="w-24 h-24 rounded-full border-4 border-black flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: currentAvatar.color }}
              whileHover={{ scale: 1.1 }}
            >
              <AvatarIcon size={48} color="#FFF" strokeWidth={2.5} />
            </motion.div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-fredoka font-bold text-white text-outline-sm">
                {currentUser.displayName}
              </h1>
              <div className="flex items-center gap-2 mt-1 justify-center md:justify-start">
                <span className="px-3 py-1 rounded-full border-2 border-black text-xs font-bold" style={{ backgroundColor: '#FACC15' }}>
                  Lv.{lvl.level}
                </span>
                <span className="text-white/80 font-nunito text-sm font-bold">
                  {currentUser.title || 'Script Kitten'}
                </span>
              </div>

              {/* XP Bar */}
              <div className="mt-3 max-w-md">
                <div className="flex justify-between text-xs font-bold text-white/80 mb-1">
                  <span>XP: {lvl.currentXp.toLocaleString()}</span>
                  <span>{xpPercent}%</span>
                </div>
                <div className="h-4 rounded-full border-2 border-black overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: '#FACC15' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-white/60 font-nunito mt-1">
                  {lvl.currentXp.toLocaleString()} / {lvl.nextLevelXp.toLocaleString()} XP to Level {lvl.level + 1}
                </p>
              </div>
            </div>

            {/* Edit / Logout */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditMode(!editMode)}
                className="p-3 rounded-2xl border-[3px] border-black shadow-[3px_3px_0_#000] hover:shadow-[1px_1px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                style={{ backgroundColor: editMode ? '#F87171' : '#FACC15' }}
              >
                {editMode ? <X size={20} /> : <Edit3 size={20} />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="p-3 rounded-2xl border-[3px] border-black bg-gray-200 shadow-[3px_3px_0_#000] hover:shadow-[1px_1px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Edit Mode */}
        {editMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            className="p-6 border-4 border-black rounded-2xl" style={{ backgroundColor: '#FFF', boxShadow: '6px 6px 0 #000' }}
          >
            <h3 className="text-xl font-fredoka font-bold mb-4">Edit Profile</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="font-bold text-sm mb-1 block">Display Name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full h-12 border-[3px] border-black rounded-xl px-4 font-bold" />
              </div>
              <div>
                <label className="font-bold text-sm mb-1 block">Country Code (2 letters)</label>
                <input value={country} onChange={e => setCountry(e.target.value)} maxLength={2} className="w-full h-12 border-[3px] border-black rounded-xl px-4 font-bold uppercase" />
              </div>
            </div>
            <div className="mb-4">
              <label className="font-bold text-sm mb-1 block">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full border-[3px] border-black rounded-xl p-3 font-bold" rows={3} />
            </div>

            {/* Avatar Selector */}
            <div className="mb-4">
              <label className="font-bold text-sm mb-2 block">Avatar</label>
              <div className="flex flex-wrap gap-3">
                {AVATARS.map(a => {
                  const Icon = a.icon;
                  return (
                    <motion.button
                      key={a.id} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedAvatar(a.id)}
                      className={`w-14 h-14 rounded-full border-[3px] flex items-center justify-center transition-all ${selectedAvatar === a.id ? 'border-black scale-110' : 'border-gray-300'}`}
                      style={{ backgroundColor: a.color }}
                    >
                      <Icon size={24} color="#FFF" />
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Title Selector */}
            <div className="mb-4">
              <label className="font-bold text-sm mb-2 block">Title (level-gated)</label>
              <select
                value={selectedTitle}
                onChange={e => setSelectedTitle(e.target.value)}
                className="w-full h-12 border-[3px] border-black rounded-xl px-4 font-bold"
              >
                {availableTitles.map(t => (
                  <option key={t.title} value={t.title}>{t.title} (Lv.{t.level}+)</option>
                ))}
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="w-full h-12 border-[3px] border-black rounded-2xl font-bold text-lg shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: '#4ADE80' }}
            >
              <Save size={20} /> Save Changes
            </motion.button>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Games Played', value: stats.gamesPlayed, icon: Gamepad2, color: '#7C3AED' },
            { label: 'Completed', value: completedGames, icon: Check, color: '#4ADE80' },
            { label: 'Total XP', value: (currentUser?.totalXp || 0).toLocaleString(), icon: Zap, color: '#FACC15' },
            { label: 'Rank Points', value: stats.rankPoints, icon: Trophy, color: '#F472B6' },
            { label: 'Attacks', value: stats.attacksLaunched, icon: Swords, color: '#F87171' },
            { label: 'Defenses', value: stats.attacksDefended, icon: Shield, color: '#60A5FA' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 border-4 border-black rounded-2xl text-center"
                style={{ backgroundColor: '#FFF', boxShadow: '4px 4px 0 #000' }}
              >
                <div className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: stat.color }}>
                  <Icon size={20} color="#FFF" />
                </div>
                <p className="text-2xl font-fredoka font-bold">{stat.value}</p>
                <p className="text-xs font-nunito font-bold text-gray-500">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Fortress Summary */}
        <div className="p-6 border-4 border-black rounded-2xl" style={{ backgroundColor: '#FFF', boxShadow: '6px 6px 0 #000' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center" style={{ backgroundColor: '#60A5FA' }}>
              <Shield size={20} color="#FFF" />
            </div>
            <h2 className="text-xl font-fredoka font-bold">Fortress Defenses</h2>
            <Link to="/fortress" className="ml-auto text-sm font-bold flex items-center gap-1 hover:underline" style={{ color: '#7C3AED' }}>
              Manage <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Firewall', level: defenses.firewallLevel, color: '#F87171' },
              { label: 'IDS', level: defenses.idsLevel, color: '#FACC15' },
              { label: 'Anti-Virus', level: defenses.antiVirusLevel, color: '#4ADE80' },
              { label: 'Encryption', level: defenses.encryptionLevel, color: '#60A5FA' },
              { label: 'Honeypot', level: defenses.honeypotLevel, color: '#A78BFA' },
              { label: 'WAF', level: defenses.wafLevel, color: '#FB923C' },
              { label: 'Backup', level: defenses.backupLevel, color: '#22D3EE' },
            ].map(d => (
              <div key={d.label} className="p-3 border-[3px] border-black rounded-xl text-center">
                <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center mx-auto mb-1" style={{ backgroundColor: d.color }}>
                  <Shield size={14} color="#FFF" />
                </div>
                <p className="text-lg font-fredoka font-bold">Lv.{d.level}</p>
                <p className="text-xs font-nunito font-bold text-gray-500">{d.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 border-[3px] border-black rounded-xl text-center" style={{ backgroundColor: '#ECFDF5' }}>
            <p className="text-lg font-fredoka font-bold" style={{ color: '#16A34A' }}>
              Total Defense Power: {defenses.totalDefensePower}
            </p>
          </div>
        </div>

        {/* Game Progress */}
        <div className="p-6 border-4 border-black rounded-2xl" style={{ backgroundColor: '#FFF', boxShadow: '6px 6px 0 #000' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center" style={{ backgroundColor: '#4ADE80' }}>
              <Target size={20} color="#FFF" />
            </div>
            <h2 className="text-xl font-fredoka font-bold">Game Progress</h2>
          </div>
          {completedGames === 0 ? (
            <p className="text-center text-gray-500 font-nunito py-4">No games completed yet. Start playing!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(gameProgress).map(([gameId, p]: [string, any]) => (
                <div key={gameId} className="flex items-center gap-3 p-3 border-[3px] border-black rounded-xl" style={{ backgroundColor: '#F5F3FF' }}>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(s => (
                      <Star key={s} size={16} fill={s <= p.stars ? '#FACC15' : 'none'} color={s <= p.stars ? '#FACC15' : '#D1D5DB'} />
                    ))}
                  </div>
                  <span className="font-bold flex-1 capitalize">{gameId.replace(/-/g, ' ')}</span>
                  <span className="text-sm font-bold" style={{ color: '#7C3AED' }}>{p.bestScore} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* XP Log */}
        <div className="p-6 border-4 border-black rounded-2xl" style={{ backgroundColor: '#FFF', boxShadow: '6px 6px 0 #000' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center" style={{ backgroundColor: '#FACC15' }}>
              <Flame size={20} color="#FFF" />
            </div>
            <h2 className="text-xl font-fredoka font-bold">Recent Activity</h2>
          </div>
          {xpLogs.slice(0, 10).map((log: any, i: number) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 border-b-2 border-gray-100 last:border-0"
            >
              <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FACC15' }}>
                <Zap size={14} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{log.description || log.action}</p>
                <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="font-bold text-sm" style={{ color: '#7C3AED' }}>+{log.xpGained} XP</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
