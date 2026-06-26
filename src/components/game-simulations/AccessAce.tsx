import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Wrench, Eye, User, Lock, Unlock, FileText, Shield,
  Check, X, Play, RotateCcw, ChevronRight, Trophy, Star,
  Calculator, Users, FolderOpen, AlertTriangle, Info, Zap,
  Search, Filter, TrendingUp, Award, HelpCircle
} from 'lucide-react';
import SimuleToolTrainingPanel from './SimuleToolTrainingPanel';

// ─── Types ───────────────────────────────────────────────

interface UserData {
  id: string;
  name: string;
  role: string;
  color: string;
  icon: 'crown' | 'wrench' | 'eye' | 'user';
}

interface FileData {
  id: string;
  name: string;
  type: 'text' | 'code' | 'image' | 'web' | 'data';
  color: string;
  sensitivity: number; // 1-3
}

interface PermissionState {
  [roleId: string]: {
    [fileId: string]: {
      R: boolean;
      W: boolean;
      X: boolean;
    };
  };
}

interface LevelConfig {
  id: number;
  name: string;
  description: string;
  users: string[]; // user ids
  files: string[]; // file ids
  requiredScore: number;
}

interface TestResult {
  userId: string;
  fileId: string;
  passed: boolean;
  permission: 'R' | 'W' | 'X';
  expected: boolean;
}

// ─── Constants ───────────────────────────────────────────

const USERS: UserData[] = [
  { id: 'alice', name: 'Alice', role: 'Admin', color: '#F87171', icon: 'crown' },
  { id: 'bob', name: 'Bob', role: 'Developer', color: '#60A5FA', icon: 'wrench' },
  { id: 'charlie', name: 'Charlie', role: 'Viewer', color: '#4ADE80', icon: 'eye' },
  { id: 'diana', name: 'Diana', role: 'Guest', color: '#9CA3AF', icon: 'user' },
];

const FILES: FileData[] = [
  { id: 'passwords', name: 'secret_passwords.txt', type: 'text', color: '#F87171', sensitivity: 3 },
  { id: 'config', name: 'server_config.json', type: 'code', color: '#60A5FA', sensitivity: 2 },
  { id: 'logo', name: 'company_logo.png', type: 'image', color: '#A78BFA', sensitivity: 1 },
  { id: 'public', name: 'public_page.html', type: 'web', color: '#4ADE80', sensitivity: 1 },
  { id: 'database', name: 'database.sql', type: 'data', color: '#F472B6', sensitivity: 2 },
  { id: 'records', name: 'employee_records.csv', type: 'data', color: '#FB923C', sensitivity: 3 },
];

const PERMISSION_COLORS = {
  R: '#4ADE80',
  W: '#60A5FA',
  X: '#FACC15',
};

const CORRECT_PERMISSIONS: PermissionState = {
  Admin: {
    passwords: { R: true, W: true, X: false },
    config: { R: true, W: true, X: false },
    logo: { R: true, W: true, X: false },
    public: { R: true, W: true, X: true },
    database: { R: true, W: true, X: false },
    records: { R: true, W: true, X: false },
  },
  Developer: {
    passwords: { R: false, W: false, X: false },
    config: { R: true, W: true, X: false },
    logo: { R: true, W: true, X: false },
    public: { R: true, W: true, X: true },
    database: { R: true, W: true, X: false },
    records: { R: false, W: false, X: false },
  },
  Viewer: {
    passwords: { R: false, W: false, X: false },
    config: { R: false, W: false, X: false },
    logo: { R: true, W: false, X: false },
    public: { R: true, W: false, X: false },
    database: { R: false, W: false, X: false },
    records: { R: false, W: false, X: false },
  },
  Guest: {
    passwords: { R: false, W: false, X: false },
    config: { R: false, W: false, X: false },
    logo: { R: false, W: false, X: false },
    public: { R: true, W: false, X: false },
    database: { R: false, W: false, X: false },
    records: { R: false, W: false, X: false },
  },
};

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Getting Started',
    description: 'Learn the basics! Set permissions for 3 files with 2 roles.',
    users: ['alice', 'charlie'],
    files: ['public', 'logo', 'config'],
    requiredScore: 80,
  },
  {
    id: 2,
    name: 'More Roles, More Rules',
    description: 'Add Bob the Developer! Code files need special access.',
    users: ['alice', 'bob', 'charlie'],
    files: ['public', 'logo', 'config', 'database', 'passwords'],
    requiredScore: 80,
  },
  {
    id: 3,
    name: 'Full RBAC Challenge',
    description: 'All 4 roles, all 6 files. Can you manage the complexity?',
    users: ['alice', 'bob', 'charlie', 'diana'],
    files: ['public', 'logo', 'config', 'database', 'passwords', 'records'],
    requiredScore: 80,
  },
  {
    id: 4,
    name: 'Principle of Least Privilege',
    description: 'Give the MINIMUM permissions needed. Less is more!',
    users: ['alice', 'bob', 'charlie', 'diana'],
    files: ['public', 'logo', 'config', 'database', 'passwords', 'records'],
    requiredScore: 90,
  },
];

const ACCESS_SIMULETOOLS = [
  'access-ace',
  'log-analyzer',
  'stego-spy',
  'ids-alert',
] as const;

// ─── Helpers ─────────────────────────────────────────────

function userRoleFromId(userId: string): string {
  return USERS.find((u) => u.id === userId)?.role || 'Guest';
}

function roleFromName(name: string): string {
  return USERS.find((u) => u.name === name)?.role || 'Guest';
}

function getUserIcon(type: string, size = 16) {
  const props = { size, strokeWidth: 3, className: 'text-white' };
  switch (type) {
    case 'crown': return <Crown {...props} />;
    case 'wrench': return <Wrench {...props} />;
    case 'eye': return <Eye {...props} />;
    default: return <User {...props} />;
  }
}

function getFileIcon(type: string, size = 16) {
  const props = { size, strokeWidth: 3, className: 'text-white' };
  switch (type) {
    case 'text': return <FileText {...props} />;
    case 'code': return <CodeIcon {...props} />;
    case 'image': return <ImageIcon {...props} />;
    case 'web': return <GlobeIcon {...props} />;
    default: return <DatabaseIcon {...props} />;
  }
}

function CodeIcon(props: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 3} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ImageIcon(props: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 3} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function GlobeIcon(props: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 3} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function DatabaseIcon(props: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 3} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function emptyPermissions(): PermissionState {
  const state: PermissionState = {};
  USERS.forEach((u) => {
    state[u.role] = {};
    FILES.forEach((f) => {
      state[u.role][f.id] = { R: false, W: false, X: false };
    });
  });
  return state;
}

function clampScore(s: number) {
  return Math.min(100, Math.max(0, s));
}

// ─── Main Component ──────────────────────────────────────

export default function AccessAce({ onScoreChange }: { onScoreChange: (score: number) => void }) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [permissions, setPermissions] = useState<PermissionState>(emptyPermissions());
  const [activeTab, setActiveTab] = useState<'files' | 'matrix' | 'test' | 'calculator'>('files');
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [score, setScore] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [levelScores, setLevelScores] = useState<(number | null)[]>(new Array(4).fill(null));
  const [showLevelSelect, setShowLevelSelect] = useState(true);
  const [chmodValue, setChmodValue] = useState<string>('644');
  const [showBinary, setShowBinary] = useState(false);
  const [educationalTip, setEducationalTip] = useState<string>('');

  // Ref for test interval cleanup
  const testIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const level = LEVELS[currentLevel];

  const currentUsers = USERS.filter((u) => level.users.includes(u.id));
  const currentFiles = FILES.filter((f) => level.files.includes(f.id));

  // Reset permissions on level change + cleanup any running test interval
  useEffect(() => {
    setPermissions(emptyPermissions());
    setTestResults(null);
    setIsTesting(false);
    setLevelComplete(false);
    setActiveTab('files');
    setEducationalTip('');
  }, [currentLevel]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
        testIntervalRef.current = null;
      }
    };
  }, []);

  // ─── Permission Handlers ────────────────────────────────

  const togglePermission = useCallback((role: string, fileId: string, perm: 'R' | 'W' | 'X') => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [fileId]: {
          ...prev[role][fileId],
          [perm]: !prev[role][fileId][perm],
        },
      },
    }));
    setTestResults(null);
  }, []);

  const setAllForRoleFile = useCallback((role: string, fileId: string, perms: { R: boolean; W: boolean; X: boolean }) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [fileId]: { ...perms },
      },
    }));
    setTestResults(null);
  }, []);

  // ─── Test Access Simulation ────────────────────────────

  const runTest = useCallback(() => {
    // Clear any existing interval first
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }

    setIsTesting(true);
    setActiveTab('test');

    const results: TestResult[] = [];
    currentUsers.forEach((user) => {
      const role = user.role;
      currentFiles.forEach((file) => {
        ['R', 'W', 'X'].forEach((perm) => {
          const hasPerm = permissions[role]?.[file.id]?.[perm as 'R' | 'W' | 'X'] || false;
          const shouldHave = CORRECT_PERMISSIONS[role]?.[file.id]?.[perm as 'R' | 'W' | 'X'] || false;
          results.push({
            userId: user.id,
            fileId: file.id,
            permission: perm as 'R' | 'W' | 'X',
            passed: hasPerm === shouldHave,
            expected: shouldHave,
          });
        });
      });
    });

    // Stagger animation
    setTestResults([]);
    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      setTestResults(results.slice(0, idx));
      if (idx >= results.length) {
        clearInterval(interval);
        testIntervalRef.current = null;
        setIsTesting(false);

        // Calculate score
        const correct = results.filter((r) => r.passed).length;
        const pct = Math.round((correct / results.length) * 100);
        setScore(pct);
        onScoreChange(clampScore(pct));

        if (pct >= level.requiredScore) {
          setLevelComplete(true);
          setEducationalTip(getSuccessTip(currentLevel));
          setLevelScores((prev) => {
            const u = [...prev];
            u[currentLevel] = pct;
            return u;
          });
        } else {
          setEducationalTip(getFailureTip(pct));
        }
      }
    }, 60);

    testIntervalRef.current = interval;
  }, [permissions, currentUsers, currentFiles, currentLevel, level.requiredScore, onScoreChange]);

  // ─── chmod Calculator Logic ────────────────────────────

  const parseChmod = (val: string): { R: boolean; W: boolean; X: boolean }[] => {
    if (!/^\d{1,3}$/.test(val)) return [{ R: false, W: false, X: false }, { R: false, W: false, X: false }, { R: false, W: false, X: false }];
    const digits = val.padStart(3, '0').split('').map(Number);
    return digits.map((d) => ({
      R: (d & 4) !== 0,
      W: (d & 2) !== 0,
      X: (d & 1) !== 0,
    }));
  };

  const chmodPerms = parseChmod(chmodValue);

  // ─── Render ────────────────────────────────────────────

  if (showLevelSelect) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="text-center mb-1">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield size={28} strokeWidth={3} className="text-purple-primary" />
            <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Access Ace</h2>
          </div>
          <p className="font-nunito text-sm text-purple-dark">
            Learn Role-Based Access Control! Assign permissions to protect files.
          </p>
        </div>

        <SimuleToolTrainingPanel
          mission="Least privilege, access review evidence, tripwire alerts, and suspicious-object handling."
          toolIds={ACCESS_SIMULETOOLS}
        />

        {/* Level Grid */}
        <div className="w-full max-w-lg grid grid-cols-2 gap-3">
          {LEVELS.map((lvl, idx) => {
            const isUnlocked = idx === 0 || levelScores[idx - 1] !== null;
            const isCompleted = levelScores[idx] !== null;

            return (
              <motion.button
                key={lvl.id}
                whileHover={isUnlocked ? { scale: 1.03 } : {}}
                whileTap={isUnlocked ? { scale: 0.97 } : {}}
                onClick={() => {
                  if (isUnlocked) {
                    setCurrentLevel(idx);
                    setShowLevelSelect(false);
                  }
                }}
                className={`relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border-4 border-black transition-colors ${
                  isCompleted
                    ? 'bg-green-success'
                    : isUnlocked
                    ? 'bg-white hover:bg-purple-pale'
                    : 'bg-gray-200 cursor-not-allowed'
                }`}
                style={{ opacity: isUnlocked ? 1 : 0.5, boxShadow: isUnlocked ? '6px 6px 0px 0px #000' : 'none' }}
              >
                {isCompleted && (
                  <div className="absolute -top-2 -right-2 bg-yellow-accent border-[3px] border-black rounded-full p-0.5">
                    <Check size={14} strokeWidth={4} className="text-black" />
                  </div>
                )}
                {!isUnlocked && <Lock size={20} strokeWidth={3} className="text-gray-500" />}
                {isUnlocked && !isCompleted && <Shield size={20} strokeWidth={3} className="text-purple-primary" />}
                {isCompleted && <Trophy size={20} strokeWidth={3} className="text-yellow-accent" />}
                <span className="font-fredoka text-sm font-bold text-purple-dark">
                  Level {lvl.id}
                </span>
                <span className="font-nunito text-[10px] text-purple-dark text-center leading-tight">
                  {lvl.name}
                </span>
                {levelScores[idx] !== null && (
                  <span className="font-nunito text-[10px] font-bold text-white bg-purple-dark px-2 py-0.5 rounded-full border-2 border-black">
                    {levelScores[idx]}%
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-3" style={{ boxShadow: '6px 6px 0px 0px #000' }}>
          <p className="font-nunito text-xs font-bold text-purple-dark mb-2 text-center">Permission Guide</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              ['R', 'Read', '#4ADE80'],
              ['W', 'Write', '#60A5FA'],
              ['X', 'Execute', '#FACC15'],
            ].map(([perm, label, color]) => (
              <div key={perm} className="flex items-center gap-1">
                <div className="w-6 h-6 rounded border-[2px] border-black flex items-center justify-center" style={{ backgroundColor: color }}>
                  <span className="font-nunito text-[9px] font-bold text-black">{perm}</span>
                </div>
                <span className="font-nunito text-[10px] text-purple-dark">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <Shield size={18} strokeWidth={3} className="text-yellow-accent" />
          <span className="font-fredoka text-sm font-bold text-white">Lv{level.id}: {level.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {levelScores.map((s, i) => (
            <Star
              key={i}
              size={14}
              strokeWidth={2}
              className={s !== null ? 'text-yellow-accent' : 'text-purple-lighter'}
              fill={s !== null ? '#FACC15' : '#DDD6FE'}
            />
          ))}
        </div>
        <button
          onClick={() => setShowLevelSelect(true)}
          className="px-3 py-1 bg-purple-lighter border-[2px] border-black rounded-full font-nunito text-[10px] font-bold text-purple-dark hover:scale-105 transition-transform"
        >
          Levels
        </button>
      </div>

      {/* Description */}
      <div className="w-full max-w-2xl bg-blue-info rounded-xl border-[3px] border-black px-3 py-1.5">
        <p className="font-nunito text-xs text-white text-center font-semibold">{level.description}</p>
      </div>

      <SimuleToolTrainingPanel
        mission="Least privilege, access review evidence, tripwire alerts, and suspicious-object handling."
        toolIds={ACCESS_SIMULETOOLS}
      />

      {/* Organization Chart */}
      <div className="w-full max-w-2xl bg-white rounded-2xl border-4 border-black p-3" style={{ boxShadow: '6px 6px 0px 0px #000' }}>
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} strokeWidth={3} className="text-purple-primary" />
          <span className="font-fredoka text-sm font-bold text-purple-dark">Organization Chart</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {currentUsers.map((user) => (
            <div key={user.id} className="flex flex-col items-center gap-1">
              {/* Avatar */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 rounded-full border-[3px] border-black flex items-center justify-center"
                style={{ backgroundColor: user.color }}
              >
                {getUserIcon(user.icon, 20)}
              </motion.div>
              <span className="font-nunito text-[10px] font-bold text-purple-dark">{user.name}</span>
              <span className="font-nunito text-[8px] text-purple-primary bg-purple-pale px-1.5 py-0.5 rounded-full border border-black font-semibold">
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="w-full max-w-2xl flex gap-1 bg-purple-pale rounded-xl border-[3px] border-black p-1">
        {([
          { key: 'files', label: 'Files', icon: FolderOpen },
          { key: 'matrix', label: 'Matrix', icon: GridIcon },
          { key: 'test', label: 'Test Access', icon: Play },
          { key: 'calculator', label: 'chmod', icon: Calculator },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-nunito text-[10px] font-bold border-[2px] transition-colors ${
              activeTab === tab.key
                ? 'bg-purple-primary text-white border-black'
                : 'bg-white text-purple-dark border-transparent hover:bg-purple-lighter'
            }`}
          >
            <tab.icon size={12} strokeWidth={3} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Files Tab ─────────────────────────────────── */}
      {activeTab === 'files' && (
        <div className="w-full max-w-2xl flex flex-col gap-3">
          {/* Role sections */}
          {currentUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl border-4 border-black p-3" style={{ boxShadow: '5px 5px 0px 0px #000' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full border-[2px] border-black flex items-center justify-center" style={{ backgroundColor: user.color }}>
                  {getUserIcon(user.icon, 14)}
                </div>
                <div>
                  <span className="font-nunito text-sm font-bold text-purple-dark">{user.name}</span>
                  <span className="font-nunito text-[9px] text-purple-primary ml-1">({user.role})</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-purple-pale rounded-xl border-[2px] border-black px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-lg border-[2px] border-black flex items-center justify-center flex-shrink-0" style={{ backgroundColor: file.color }}>
                        {getFileIcon(file.type, 12)}
                      </div>
                      <span className="font-nunito text-[9px] font-bold text-purple-dark truncate max-w-[80px] sm:max-w-[100px]">{file.name}</span>
                    </div>
                    <div className="flex gap-1">
                      {(['R', 'W', 'X'] as const).map((perm) => {
                        const isSet = permissions[user.role]?.[file.id]?.[perm] || false;
                        return (
                          <motion.button
                            key={perm}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => togglePermission(user.role, file.id, perm)}
                            className={`w-7 h-7 rounded border-[2px] border-black flex items-center justify-center font-nunito text-[9px] font-bold transition-colors ${
                              isSet ? 'text-black' : 'text-gray-400 bg-white'
                            }`}
                            style={isSet ? { backgroundColor: PERMISSION_COLORS[perm] } : {}}
                            title={perm === 'R' ? 'Read' : perm === 'W' ? 'Write' : 'Execute'}
                          >
                            {perm}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Quick Set Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => {
                currentUsers.forEach((u) => {
                  currentFiles.forEach((f) => {
                    setAllForRoleFile(u.role, f.id, { R: true, W: true, X: true });
                  });
                });
              }}
              className="px-3 py-1.5 bg-green-success border-[2px] border-black rounded-full font-nunito text-[10px] font-bold text-black hover:scale-105 transition-transform"
            >
              Grant All
            </button>
            <button
              onClick={() => {
                currentUsers.forEach((u) => {
                  currentFiles.forEach((f) => {
                    setAllForRoleFile(u.role, f.id, { R: false, W: false, X: false });
                  });
                });
              }}
              className="px-3 py-1.5 bg-red-alert border-[2px] border-black rounded-full font-nunito text-[10px] font-bold text-white hover:scale-105 transition-transform"
            >
              Revoke All
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="px-3 py-1.5 bg-purple-lighter border-[2px] border-black rounded-full font-nunito text-[10px] font-bold text-purple-dark hover:scale-105 transition-transform"
            >
              <HelpCircle size={12} strokeWidth={3} className="inline mr-1" />
              Help
            </button>
          </div>

          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ height: 0, opacity: 1 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 1 }}
                className="bg-yellow-accent rounded-xl border-[3px] border-black p-3 overflow-hidden"
              >
                <p className="font-nunito text-[10px] text-black font-semibold">
                  <Info size={12} className="inline mr-1" />
                  <strong>Admin</strong>: Full access to everything. <strong>Developer</strong>: Can read/write code & configs. <strong>Viewer</strong>: Read public files only. <strong>Guest</strong>: Only public_page.html.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Test Button */}
          <button
            onClick={runTest}
            className="w-full py-3 bg-purple-primary border-[3px] border-black rounded-2xl font-fredoka text-base font-bold text-white hover:bg-purple-dark transition-colors hover:scale-[1.02] flex items-center justify-center gap-2"
            style={{ boxShadow: '5px 5px 0px 0px #000' }}
          >
            <Play size={18} strokeWidth={3} />
            Test Access
          </button>
        </div>
      )}

      {/* ─── Matrix Tab ────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div className="w-full max-w-2xl bg-white rounded-2xl border-4 border-black overflow-hidden" style={{ boxShadow: '6px 6px 0px 0px #000' }}>
          <div className="bg-purple-dark px-3 py-2 border-b-[3px] border-black">
            <span className="font-fredoka text-sm font-bold text-white">Permission Matrix</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-pale">
                  <th className="font-nunito text-[9px] font-bold text-purple-dark px-2 py-1.5 border-r-[2px] border-black text-left">Role \ File</th>
                  {currentFiles.map((f) => (
                    <th key={f.id} className="font-nunito text-[8px] font-bold text-purple-dark px-1 py-1.5 border-r-[2px] border-black text-center min-w-[60px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-5 h-5 rounded border-[2px] border-black flex items-center justify-center" style={{ backgroundColor: f.color }}>
                          {getFileIcon(f.type, 8)}
                        </div>
                        <span className="truncate max-w-[55px]">{f.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user, ui) => (
                  <tr key={user.id} className={ui % 2 === 0 ? 'bg-white' : 'bg-purple-pale/50'}>
                    <td className="font-nunito text-[9px] font-bold text-purple-dark px-2 py-1.5 border-r-[2px] border-black border-t-[2px] border-black">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full border-[2px] border-black flex items-center justify-center flex-shrink-0" style={{ backgroundColor: user.color }}>
                          {getUserIcon(user.icon, 8)}
                        </div>
                        {user.role}
                      </div>
                    </td>
                    {currentFiles.map((f) => {
                      const perms = permissions[user.role]?.[f.id] || { R: false, W: false, X: false };
                      return (
                        <td key={f.id} className="text-center border-r-[2px] border-black border-t-[2px] border-black px-1 py-1">
                          <div className="flex gap-0.5 justify-center">
                            {(['R', 'W', 'X'] as const).map((p) => (
                              <button
                                key={p}
                                onClick={() => togglePermission(user.role, f.id, p)}
                                className={`w-5 h-5 rounded border-[2px] border-black font-nunito text-[7px] font-bold transition-colors ${
                                  perms[p] ? 'text-black' : 'text-gray-400 bg-gray-100'
                                }`}
                                style={perms[p] ? { backgroundColor: PERMISSION_COLORS[p] } : {}}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Test Tab ──────────────────────────────────── */}
      {activeTab === 'test' && (
        <div className="w-full max-w-2xl flex flex-col gap-3">
          {!testResults ? (
            <div className="bg-white rounded-2xl border-4 border-black p-6 flex flex-col items-center gap-3" style={{ boxShadow: '6px 6px 0px 0px #000' }}>
              <Shield size={40} strokeWidth={3} className="text-purple-primary" />
              <p className="font-nunito text-sm text-purple-dark text-center">
                Click &quot;Test Access&quot; to simulate each user trying to access files!
              </p>
              <button
                onClick={runTest}
                className="px-6 py-2.5 bg-purple-primary border-[3px] border-black rounded-full font-fredoka text-sm font-bold text-white hover:bg-purple-dark transition-colors hover:scale-105 flex items-center gap-2"
              >
                <Play size={16} strokeWidth={3} />
                Start Test
              </button>
            </div>
          ) : (
            <>
              {/* Score banner */}
              <div
                className={`rounded-xl border-[3px] border-black px-4 py-2 flex items-center justify-between ${
                  levelComplete ? 'bg-green-success' : score >= 50 ? 'bg-yellow-accent' : 'bg-red-alert'
                }`}
              >
                <div className="flex items-center gap-2">
                  {levelComplete ? (
                    <Trophy size={20} strokeWidth={3} className="text-yellow-accent" />
                  ) : (
                    <AlertTriangle size={20} strokeWidth={3} className="text-white" />
                  )}
                  <span className="font-fredoka text-sm font-bold text-black">
                    Score: {score}%
                  </span>
                </div>
                <span className="font-nunito text-[10px] text-black font-semibold">
                  {levelComplete ? 'Level Complete!' : `Need ${level.requiredScore}% to pass`}
                </span>
              </div>

              {/* Test Results Grid */}
              <div className="bg-white rounded-2xl border-4 border-black p-3" style={{ boxShadow: '6px 6px 0px 0px #000' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} strokeWidth={3} className="text-purple-primary" />
                  <span className="font-fredoka text-xs font-bold text-purple-dark">Simulation Results</span>
                </div>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {testResults.map((result, idx) => {
                    const user = USERS.find((u) => u.id === result.userId)!;
                    const file = FILES.find((f) => f.id === result.fileId)!;
                    return (
                      <motion.div
                        key={`${result.userId}-${result.fileId}-${result.permission}`}
                        initial={{ x: -20, scale: 0.9 }}
                        animate={{ x: 0, scale: 1 }}
                        transition={{ delay: idx * 0.01, duration: 0.15 }}
                        className={`flex items-center justify-between rounded-lg border-[2px] border-black px-2 py-1 ${
                          result.passed ? 'bg-green-success/20' : 'bg-red-alert/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full border-[2px] border-black flex items-center justify-center flex-shrink-0" style={{ backgroundColor: user.color }}>
                            {getUserIcon(user.icon, 8)}
                          </div>
                          <span className="font-nunito text-[9px] font-bold text-purple-dark">{user.name}</span>
                          <span className="font-nunito text-[8px] text-gray-500">&rarr;</span>
                          <div className="w-5 h-5 rounded border-[2px] border-black flex items-center justify-center flex-shrink-0" style={{ backgroundColor: file.color }}>
                            {getFileIcon(file.type, 8)}
                          </div>
                          <span className="font-nunito text-[8px] text-purple-dark truncate max-w-[80px]">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className="font-nunito text-[8px] font-bold px-1.5 py-0.5 rounded border border-black"
                            style={{ backgroundColor: PERMISSION_COLORS[result.permission] }}
                          >
                            {result.permission}
                          </span>
                          {result.passed ? (
                            <Check size={12} strokeWidth={4} className="text-green-success" />
                          ) : (
                            <X size={12} strokeWidth={4} className="text-red-alert" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Educational Tip */}
              {educationalTip && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className={`rounded-xl border-[3px] border-black p-3 ${
                    levelComplete ? 'bg-green-success' : 'bg-yellow-accent'
                  }`}
                >
                  <p className="font-nunito text-[10px] text-black font-semibold text-center">{educationalTip}</p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-center">
                {!levelComplete && (
                  <button
                    onClick={() => setActiveTab('files')}
                    className="px-4 py-2 bg-purple-lighter border-[3px] border-black rounded-full font-nunito text-xs font-bold text-purple-dark hover:scale-105 transition-transform flex items-center gap-1"
                  >
                    <RotateCcw size={14} strokeWidth={3} />
                    Fix Permissions
                  </button>
                )}
                {levelComplete && currentLevel < LEVELS.length - 1 && (
                  <button
                    onClick={() => {
                      setCurrentLevel((prev) => prev + 1);
                      setShowLevelSelect(true);
                    }}
                    className="px-4 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito text-xs font-bold text-white hover:scale-105 transition-transform flex items-center gap-1"
                  >
                    Next Level
                    <ChevronRight size={14} strokeWidth={3} />
                  </button>
                )}
                <button
                  onClick={runTest}
                  disabled={isTesting}
                  className="px-4 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito text-xs font-bold text-white hover:scale-105 transition-transform flex items-center gap-1 disabled:opacity-50"
                >
                  <Play size={14} strokeWidth={3} />
                  Re-Test
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Calculator Tab ────────────────────────────── */}
      {activeTab === 'calculator' && (
        <div className="w-full max-w-2xl flex flex-col gap-3">
          <div className="bg-white rounded-2xl border-4 border-black p-4" style={{ boxShadow: '6px 6px 0px 0px #000' }}>
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={16} strokeWidth={3} className="text-purple-primary" />
              <span className="font-fredoka text-sm font-bold text-purple-dark">Permission Calculator</span>
            </div>

            {/* chmod Input */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs text-purple-dark">chmod</span>
              <input
                type="text"
                value={chmodValue}
                onChange={(e) => setChmodValue(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="w-16 h-10 font-mono text-lg text-center text-purple-dark bg-purple-pale border-[3px] border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-primary"
                placeholder="644"
              />
              <span className="font-nunito text-[10px] text-purple-dark">Numeric mode (e.g. 644, 755, 777)</span>
            </div>

            {/* Visual Breakdown */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['Owner', 'Group', 'Others'].map((label, gi) => {
                const perm = chmodPerms[gi];
                if (!perm) return null;
                return (
                  <div key={label} className="bg-purple-pale rounded-xl border-[3px] border-black p-2">
                    <p className="font-nunito text-[10px] font-bold text-purple-dark text-center mb-1">{label}</p>
                    <div className="flex flex-col gap-1">
                      {(['R', 'W', 'X'] as const).map((p, pi) => {
                        const val = [4, 2, 1][pi];
                        const isSet = perm[p];
                        return (
                          <div key={p} className="flex items-center justify-between">
                            <span className="font-nunito text-[9px] text-purple-dark">{p} ({val})</span>
                            <div
                              className={`w-5 h-5 rounded border-[2px] border-black flex items-center justify-center ${
                                isSet ? '' : 'bg-gray-200'
                              }`}
                              style={isSet ? { backgroundColor: PERMISSION_COLORS[p] } : {}}
                            >
                              {isSet && <Check size={10} strokeWidth={4} className="text-black" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Binary Toggle */}
            <button
              onClick={() => setShowBinary(!showBinary)}
              className="w-full py-2 bg-purple-lighter border-[2px] border-black rounded-xl font-nunito text-[10px] font-bold text-purple-dark hover:bg-purple-light transition-colors"
            >
              {showBinary ? 'Hide' : 'Show'} Binary Representation
            </button>

            <AnimatePresence>
              {showBinary && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 bg-purple-dark rounded-xl border-[3px] border-black p-2">
                    <p className="font-nunito text-[9px] text-white text-center mb-1">Binary (1 = granted, 0 = denied)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['Owner', 'Group', 'Others'].map((label, gi) => {
                        const perm = chmodPerms[gi];
                        if (!perm) return null;
                        return (
                          <div key={label} className="text-center">
                            <p className="font-nunito text-[8px] text-purple-lighter mb-0.5">{label}</p>
                            <div className="flex gap-0.5 justify-center">
                              <span className="font-mono text-[10px] text-green-success bg-black px-1 rounded">{perm.R ? '1' : '0'}</span>
                              <span className="font-mono text-[10px] text-blue-info bg-black px-1 rounded">{perm.W ? '1' : '0'}</span>
                              <span className="font-mono text-[10px] text-yellow-accent bg-black px-1 rounded">{perm.X ? '1' : '0'}</span>
                            </div>
                            <p className="font-mono text-[10px] text-yellow-accent mt-0.5">
                              {(perm.R ? 4 : 0) + (perm.W ? 2 : 0) + (perm.X ? 1 : 0)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Common Modes */}
            <div className="mt-3 flex flex-wrap gap-1 justify-center">
              {[
                { val: '777', label: 'Full Access' },
                { val: '755', label: 'Exec Allowed' },
                { val: '644', label: 'Normal File' },
                { val: '600', label: 'Private' },
                { val: '400', label: 'Read Only' },
              ].map((m) => (
                <button
                  key={m.val}
                  onClick={() => setChmodValue(m.val)}
                  className={`px-2 py-1 border-[2px] border-black rounded-full font-mono text-[9px] font-bold hover:scale-105 transition-transform ${
                    chmodValue === m.val ? 'bg-purple-primary text-white' : 'bg-purple-pale text-purple-dark'
                  }`}
                >
                  {m.val} - {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Educational Card */}
          <div className="bg-yellow-accent rounded-2xl border-4 border-black p-3" style={{ boxShadow: '5px 5px 0px 0px #000' }}>
            <div className="flex items-center gap-2 mb-1">
              <Award size={14} strokeWidth={3} className="text-black" />
              <span className="font-fredoka text-xs font-bold text-black">How chmod Numbers Work</span>
            </div>
            <p className="font-nunito text-[10px] text-black">
              Each digit is the sum of: <strong>4</strong> (Read) + <strong>2</strong> (Write) + <strong>1</strong> (Execute).
              Three digits = Owner, Group, Others. 644 = Owner RW, Group R, Others R.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small Icon Components ───────────────────────────────

function GridIcon(props: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 3} strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

// ─── Educational Tips ────────────────────────────────────

function getSuccessTip(levelIdx: number): string {
  const tips = [
    "Great job! You understand the basics of file permissions. Admin needs full access, while Viewers only need to read public files.",
    "Excellent! Developers need access to code and config files but should NOT access passwords. Security matters!",
    "Amazing! You've mastered RBAC! Each role has specific access — no more, no less. This is how real systems work!",
    "Perfect! The Principle of Least Privilege means giving ONLY the minimum permissions needed. fewer permissions = safer system!",
  ];
  return tips[levelIdx] || tips[0];
}

function getFailureTip(score: number): string {
  if (score < 30) return "Keep trying! Remember: Admin gets everything, Viewer gets only public files, Guest only gets public_page.html.";
  if (score < 60) return "Getting closer! Check who should access sensitive files like passwords. Not everyone needs access to everything!";
  return "Almost there! Double-check the Developer permissions — they need code/config access but NOT password or employee records.";
}
