import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive,
  Save,
  Clock,
  AlertTriangle,
  Check,
  RotateCcw,
  Trash2,
  Lock,
  FileText,
  Folder,
  Image,
  Music,
  Video,
  Database,
  ShieldCheck,
  ShieldAlert,
  Cloud,
  Monitor,
  Zap,
  Hammer,
  PawPrint,
  Play,
  ArrowRight,
  ArrowLeft,
  Star,
  Info,
  Archive,
  WifiOff,
  RefreshCw,
  ServerCrash,
} from 'lucide-react';

interface BackupSystemProps {
  onScoreChange: (score: number) => void;
}

interface FileItem {
  id: number;
  name: string;
  icon: 'doc' | 'image' | 'music' | 'video' | 'code' | 'data';
  status: 'safe' | 'encrypted' | 'deleted' | 'corrupted';
  hasBackup: boolean;
  version: number;
}

interface BackupSnapshot {
  id: number;
  timestamp: string;
  type: 'full' | 'incremental';
  filesBackedUp: number;
}

type DisasterType = 'ransomware' | 'deletion' | 'crash' | null;
type GamePhase = 'idle' | 'backing' | 'disaster' | 'restoring' | 'recovered';

const INITIAL_FILES: FileItem[] = [
  { id: 1, name: 'homework.docx', icon: 'doc', status: 'safe', hasBackup: false, version: 1 },
  { id: 2, name: 'family.jpg', icon: 'image', status: 'safe', hasBackup: false, version: 1 },
  { id: 3, name: 'playlist.mp3', icon: 'music', status: 'safe', hasBackup: false, version: 1 },
  { id: 4, name: 'project.tsx', icon: 'code', status: 'safe', hasBackup: false, version: 1 },
  { id: 5, name: 'movie.mp4', icon: 'video', status: 'safe', hasBackup: false, version: 1 },
  { id: 6, name: 'budget.xlsx', icon: 'data', status: 'safe', hasBackup: false, version: 1 },
  { id: 7, name: 'notes.txt', icon: 'doc', status: 'safe', hasBackup: false, version: 1 },
  { id: 8, name: 'avatar.png', icon: 'image', status: 'safe', hasBackup: false, version: 1 },
  { id: 9, name: 'backup.sql', icon: 'data', status: 'safe', hasBackup: false, version: 1 },
  { id: 10, name: 'intro.mp4', icon: 'video', status: 'safe', hasBackup: false, version: 1 },
  { id: 11, name: 'song.mp3', icon: 'music', status: 'safe', hasBackup: false, version: 1 },
  { id: 12, name: 'app.js', icon: 'code', status: 'safe', hasBackup: false, version: 1 },
];

const DISASTER_SCENARIOS = [
  {
    type: 'ransomware' as const,
    title: 'Ransomware Attack!',
    description: 'A ransomware encrypted all your files! They show a lock screen demanding payment.',
    icon: Lock,
    color: '#F87171',
    message: 'All files have been encrypted! The attackers demand 2 Bitcoin to unlock them.',
    tip: '💡 Ransomware encrypts your files. With backups, you can restore without paying!',
  },
  {
    type: 'deletion' as const,
    title: 'Accidental Deletion!',
    description: 'Someone accidentally deleted important files from the system!',
    icon: Trash2,
    color: '#FACC15',
    message: 'Critical files were accidentally deleted by a user!',
    tip: '💡 Accidents happen! Regular backups let you recover files deleted by mistake.',
  },
  {
    type: 'crash' as const,
    title: 'Hard Drive Crash!',
    description: 'The hard drive failed and files are corrupted beyond repair!',
    icon: ServerCrash,
    color: '#FB923C',
    message: 'Hard drive sectors failed! Files are corrupted with bad blocks.',
    tip: '💡 Hardware fails eventually. The 3-2-1 rule: 3 copies, 2 media types, 1 offsite!',
  },
];

function getFileIcon(icon: string) {
  switch (icon) {
    case 'doc': return FileText;
    case 'image': return Image;
    case 'music': return Music;
    case 'video': return Video;
    case 'code': return Folder;
    case 'data': return Database;
    default: return FileText;
  }
}

function getFileColor(icon: string) {
  switch (icon) {
    case 'doc': return '#7C3AED';
    case 'image': return '#F472B6';
    case 'music': return '#60A5FA';
    case 'video': return '#FB923C';
    case 'code': return '#4ADE80';
    case 'data': return '#A78BFA';
    default: return '#7C3AED';
  }
}

export default function BackupSystem({ onScoreChange }: BackupSystemProps) {
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [disaster, setDisaster] = useState<DisasterType>(null);
  const [backupCount, setBackupCount] = useState(0);
  const [recoveries, setRecoveries] = useState(0);
  const [educationalTip, setEducationalTip] = useState('');
  const [showBackupTypes, setShowBackupTypes] = useState(false);
  const [backupIdCounter, setBackupIdCounter] = useState(0);
  const [animatingRestore, setAnimatingRestore] = useState(false);
  const [disasterMessage, setDisasterMessage] = useState('');
  const [show321Rule, setShow321Rule] = useState(false);
  // Ref for restore timeout cleanup
  const restoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScoreChangeRef = useRef(onScoreChange);

  // Keep ref in sync
  useEffect(() => { onScoreChangeRef.current = onScoreChange; }, [onScoreChange]);

  const createBackup = (type: 'full' | 'incremental') => {
    const backedFiles = type === 'full'
      ? files.length
      : Math.floor(files.length * 0.3) + 1;

    // Use functional update to avoid stale closure on backupIdCounter
    setBackupIdCounter((prev) => {
      const newBackup: BackupSnapshot = {
        id: prev,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        type,
        filesBackedUp: backedFiles,
      };
      setBackups((prevBackups) => [...prevBackups.slice(-6), newBackup]);
      return prev + 1;
    });

    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        hasBackup: type === 'full' ? true : f.hasBackup || Math.random() > 0.5,
        version: f.hasBackup ? f.version + 1 : 1,
      }))
    );

    setBackupCount((prev) => prev + 1);
    // Use functional update to avoid stale closure on score
    setScore((prev) => {
      const newScore = prev + 30;
      const clampedScore = Math.max(0, Math.min(500, newScore));
      onScoreChangeRef.current(clampedScore);
      return clampedScore;
    });

    setEducationalTip(
      type === 'full'
        ? `✅ Full backup created! All ${backedFiles} files backed up. Full backups copy everything but take more space.`
        : `✅ Incremental backup created! ${backedFiles} changed files backed up. Incremental backups are faster and save space!`
    );
    setTimeout(() => setEducationalTip(''), 5000);
  };

  const triggerDisaster = (type: 'ransomware' | 'deletion' | 'crash') => {
    setDisaster(type);
    setPhase('disaster');

    const scenario = DISASTER_SCENARIOS.find((d) => d.type === type);
    if (scenario) {
      setDisasterMessage(scenario.message);
      setEducationalTip(scenario.tip);
    }
    setTimeout(() => setEducationalTip(''), 6000);

    setFiles((prev) => {
      const affectedIndices = new Set<number>();
      while (affectedIndices.size < 5) {
        affectedIndices.add(Math.floor(Math.random() * prev.length));
      }

      return prev.map((f, i) => {
        if (!affectedIndices.has(i)) return f;

        switch (type) {
          case 'ransomware':
            return { ...f, status: 'encrypted' as const };
          case 'deletion':
            return { ...f, status: 'deleted' as const };
          case 'crash':
            return { ...f, status: 'corrupted' as const };
          default:
            return f;
        }
      });
    });
  };

  const restoreFiles = () => {
    setPhase('restoring');
    setAnimatingRestore(true);

    setFiles((prev) =>
      prev.map((f) =>
        f.hasBackup
          ? { ...f, status: 'safe' as const, version: f.version + 1 }
          : f
      )
    );

    // Clear any previous timeout to prevent duplicates
    if (restoreTimeoutRef.current) clearTimeout(restoreTimeoutRef.current);

    restoreTimeoutRef.current = setTimeout(() => {
      setAnimatingRestore(false);
      setPhase('recovered');
      setRecoveries((prev) => prev + 1);
      // Use functional update to avoid stale closure
      setScore((prev) => {
        const newScore = prev + 200;
        const clampedScore = Math.max(0, Math.min(500, newScore));
        onScoreChangeRef.current(clampedScore);
        return clampedScore;
      });
      setEducationalTip('🎉 Recovery successful! Files restored from backup. Always test your backups to make sure they work!');
      setTimeout(() => setEducationalTip(''), 5000);
    }, 2500);
  };

  const resetGame = () => {
    // Clear pending restore timeout
    if (restoreTimeoutRef.current) {
      clearTimeout(restoreTimeoutRef.current);
      restoreTimeoutRef.current = null;
    }
    setFiles(INITIAL_FILES);
    setBackups([]);
    setScore(0);
    setPhase('idle');
    setDisaster(null);
    setBackupCount(0);
    setRecoveries(0);
    setEducationalTip('');
    setShowBackupTypes(false);
    setBackupIdCounter(0);
    setAnimatingRestore(false);
    setDisasterMessage('');
    setShow321Rule(false);
    onScoreChangeRef.current(0);
  };

  const backedUpFiles = files.filter((f) => f.hasBackup).length;
  const damagedFiles = files.filter((f) => f.status !== 'safe').length;
  const recoverableFiles = files.filter((f) => f.status !== 'safe' && f.hasBackup).length;

  const currentDisaster = DISASTER_SCENARIOS.find((d) => d.type === disaster);

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <HardDrive size={20} strokeWidth={3} className="text-blue-info" />
          <span className="font-fredoka font-bold text-sm text-white">Backup System</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-nunito text-xs font-bold text-yellow-accent">Score: {score}</span>
          <span className="font-nunito text-xs text-green-success">Backups: {backupCount}</span>
          <span className="font-nunito text-xs text-blue-info">Recoveries: {recoveries}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetGame}
          className="flex items-center gap-1 px-2 py-1 bg-red-alert border-[2px] border-black rounded-full font-nunito text-[9px] font-bold text-white"
        >
          <RotateCcw size={10} strokeWidth={3} />
          Reset
        </motion.button>
      </div>

      {/* Educational Tip */}
      <AnimatePresence>
        {educationalTip && (
          <motion.div
            initial={{ scale: 0.8, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: -10 }}
            className="w-full max-w-2xl bg-yellow-accent border-[3px] border-black rounded-xl px-4 py-2"
          >
            <p className="font-nunito text-xs font-bold text-black text-center">{educationalTip}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-2-1 Rule Banner */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => setShow321Rule((s) => !s)}
        className="w-full max-w-2xl bg-green-success border-[3px] border-black rounded-xl px-4 py-2 flex items-center justify-center gap-2"
      >
        <ShieldCheck size={18} strokeWidth={3} className="text-black" />
        <span className="font-fredoka text-sm font-bold text-black">
          The 3-2-1 Backup Rule (click to learn!)
        </span>
      </motion.button>

      <AnimatePresence>
        {show321Rule && (
          <motion.div
            initial={{ height: 0, opacity: 1 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 1 }}
            className="w-full max-w-2xl overflow-hidden"
          >
            <div className="bg-white border-[3px] border-black rounded-2xl p-4 flex gap-3 justify-center flex-wrap">
              <div className="flex flex-col items-center p-2 bg-purple-pale border-[3px] border-black rounded-xl w-24">
                <span className="font-fredoka text-2xl font-bold text-purple-primary">3</span>
                <span className="font-nunito text-[10px] font-bold text-purple-dark text-center">Copies of Data</span>
              </div>
              <ArrowRight size={20} strokeWidth={3} className="text-purple-light self-center" />
              <div className="flex flex-col items-center p-2 bg-purple-pale border-[3px] border-black rounded-xl w-24">
                <span className="font-fredoka text-2xl font-bold text-purple-primary">2</span>
                <span className="font-nunito text-[10px] font-bold text-purple-dark text-center">Different Media</span>
              </div>
              <ArrowRight size={20} strokeWidth={3} className="text-purple-light self-center" />
              <div className="flex flex-col items-center p-2 bg-purple-pale border-[3px] border-black rounded-xl w-24">
                <span className="font-fredoka text-2xl font-bold text-purple-primary">1</span>
                <span className="font-nunito text-[10px] font-bold text-purple-dark text-center">Offsite Copy</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="w-full max-w-2xl flex gap-3 flex-col lg:flex-row">
        {/* File System */}
        <div className="flex-1 bg-white rounded-2xl border-4 border-black p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-fredoka font-bold text-sm text-purple-dark flex items-center gap-1">
              <Monitor size={16} strokeWidth={3} className="text-purple-primary" />
              File System
            </h4>
            <div className="flex gap-1 flex-wrap">
              <span className="font-nunito text-[8px] bg-green-success border-2 border-black rounded-full px-2 py-0.5 font-bold">
                Safe: {files.filter((f) => f.status === 'safe').length}
              </span>
              {damagedFiles > 0 && (
                <span className="font-nunito text-[8px] bg-red-alert border-2 border-black rounded-full px-2 py-0.5 font-bold text-white">
                  Damaged: {damagedFiles}
                </span>
              )}
              <span className="font-nunito text-[8px] bg-blue-info border-2 border-black rounded-full px-2 py-0.5 font-bold text-white">
                Backed Up: {backedUpFiles}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {files.map((file) => {
              const Icon = getFileIcon(file.icon);
              const fileColor = getFileColor(file.icon);

              return (
                <motion.div
                  key={file.id}
                  layout
                  animate={animatingRestore && file.hasBackup && file.status !== 'safe' ? {
                    scale: [1, 1.2, 1],
                    y: [0, -5, 0],
                  } : {}}
                  transition={{ duration: 0.5, delay: file.id * 0.1 }}
                  className="relative flex flex-col items-center p-2 rounded-xl border-[3px] border-black"
                  style={{
                    backgroundColor:
                      file.status === 'encrypted'
                        ? '#FEF2F2'
                        : file.status === 'deleted'
                        ? '#E5E7EB'
                        : file.status === 'corrupted'
                        ? '#FEF3C7'
                        : '#F0FDF4',
                  }}
                >
                  <div className="relative">
                    <Icon
                      size={24}
                      strokeWidth={2.5}
                      style={{ color: file.status === 'safe' ? fileColor : '#9CA3AF' }}
                    />
                    {file.hasBackup && file.status === 'safe' && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-info border-[2px] border-black rounded-full flex items-center justify-center">
                        <Check size={7} strokeWidth={4} className="text-white" />
                      </div>
                    )}
                    {file.status === 'encrypted' && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="absolute -bottom-1 -right-1"
                      >
                        <Lock size={14} strokeWidth={3} className="text-red-alert" />
                      </motion.div>
                    )}
                    {file.status === 'deleted' && (
                      <div className="absolute -bottom-1 -right-1">
                        <Trash2 size={14} strokeWidth={3} className="text-gray-400" />
                      </div>
                    )}
                    {file.status === 'corrupted' && (
                      <div className="absolute -bottom-1 -right-1">
                        <AlertTriangle size={14} strokeWidth={3} className="text-yellow-accent" />
                      </div>
                    )}
                  </div>
                  <span
                    className="font-nunito text-[8px] font-bold mt-1 truncate max-w-full"
                    style={{
                      color: file.status === 'safe' ? '#3B0764' : '#9CA3AF',
                      textDecoration: file.status === 'deleted' ? 'line-through' : 'none',
                    }}
                  >
                    {file.name}
                  </span>
                  {file.hasBackup && (
                    <span className="font-nunito text-[7px] text-blue-info font-bold">
                      v{file.version}
                    </span>
                  )}

                  {/* Restore animation overlay */}
                  {animatingRestore && file.hasBackup && file.status !== 'safe' && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 1.5 }}
                      className="absolute inset-0 bg-green-success/30 rounded-xl border-2 border-green-success"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Backup Timeline + Controls */}
        <div className="w-full lg:w-64 flex flex-col gap-3">
          {/* Backup Timeline */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 flex-1">
            <h4 className="font-fredoka font-bold text-sm text-purple-dark mb-2 flex items-center gap-1">
              <Clock size={16} strokeWidth={3} className="text-purple-primary" />
              Backup Timeline
            </h4>

            {backups.length === 0 ? (
              <div className="text-center py-3">
                <Archive size={24} strokeWidth={2} className="text-purple-light mx-auto mb-1" />
                <p className="font-nunito text-[10px] text-purple-light">No backups yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {backups.map((backup) => (
                  <motion.div
                    key={backup.id}
                    initial={{ x: -20 }}
                    animate={{ x: 0 }}
                    className="flex items-center gap-2 p-1.5 rounded-lg border-2 border-black"
                    style={{
                      backgroundColor: backup.type === 'full' ? '#F5F3FF' : '#E0F2FE',
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: backup.type === 'full' ? '#7C3AED' : '#60A5FA',
                      }}
                    >
                      {backup.type === 'full' ? (
                        <HardDrive size={10} strokeWidth={3} className="text-white" />
                      ) : (
                        <Zap size={10} strokeWidth={3} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-nunito text-[9px] font-bold text-purple-dark block">
                        {backup.type === 'full' ? 'Full Backup' : 'Incremental'}
                      </span>
                      <span className="font-nunito text-[8px] text-purple-light">
                        {backup.timestamp} — {backup.filesBackedUp} files
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Backup dots timeline */}
            {backups.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {backups.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 rounded-full border-2 border-black"
                    style={{
                      backgroundColor: b.type === 'full' ? '#7C3AED' : '#60A5FA',
                    }}
                    title={`${b.type} backup at ${b.timestamp}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Action Panel */}
          <div className="bg-white rounded-2xl border-4 border-black p-3">
            <h4 className="font-fredoka font-bold text-sm text-purple-dark mb-2 flex items-center gap-1">
              <Play size={16} strokeWidth={3} className="text-purple-primary" />
              Actions
            </h4>

            {phase === 'idle' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => createBackup('full')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-purple-primary border-[3px] border-black rounded-xl font-nunito text-[10px] font-bold text-white hover:bg-purple-dark transition-colors"
                  >
                    <HardDrive size={12} strokeWidth={3} />
                    Full Backup
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => createBackup('incremental')}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-blue-info border-[3px] border-black rounded-xl font-nunito text-[10px] font-bold text-white hover:bg-blue-500 transition-colors"
                  >
                    <Zap size={12} strokeWidth={3} />
                    Incremental
                  </motion.button>
                </div>

                <p className="font-nunito text-[9px] text-purple-light text-center">
                  Create backups before a disaster strikes!
                </p>

                {/* Disaster Buttons */}
                <div className="border-t-2 border-purple-lighter pt-2 mt-2">
                  <p className="font-nunito text-[9px] font-bold text-purple-dark mb-1 text-center">
                    Simulate Disaster:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {DISASTER_SCENARIOS.map((scenario) => {
                      const Icon = scenario.icon;
                      return (
                        <motion.button
                          key={scenario.type}
                          whileHover={{ scale: 1.03, x: 2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => triggerDisaster(scenario.type)}
                          className="flex items-center gap-2 px-2 py-1.5 border-[3px] border-black rounded-xl font-nunito text-[10px] font-bold text-white transition-colors"
                          style={{ backgroundColor: scenario.color }}
                        >
                          <Icon size={12} strokeWidth={3} />
                          {scenario.title}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {phase === 'disaster' && currentDisaster && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="space-y-2"
              >
                <div
                  className="p-2 border-[3px] border-black rounded-xl"
                  style={{ backgroundColor: currentDisaster.color + '20' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <currentDisaster.icon
                      size={20}
                      strokeWidth={3}
                      style={{ color: currentDisaster.color }}
                    />
                    <span className="font-nunito text-xs font-bold" style={{ color: currentDisaster.color }}>
                      {currentDisaster.title}
                    </span>
                  </div>
                  <p className="font-nunito text-[10px] text-purple-dark">{disasterMessage}</p>
                  <p className="font-nunito text-[10px] text-purple-dark mt-1">
                    Recoverable: {recoverableFiles}/{damagedFiles} files
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={restoreFiles}
                  disabled={recoverableFiles === 0}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-success border-[3px] border-black rounded-xl font-nunito text-xs font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  <RefreshCw size={14} strokeWidth={3} />
                  Restore from Backup
                </motion.button>

                {recoverableFiles === 0 && (
                  <p className="font-nunito text-[9px] text-red-alert text-center">
                    No backups! Some files are unrecoverable.
                  </p>
                )}
              </motion.div>
            )}

            {phase === 'restoring' && (
              <div className="text-center py-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="inline-block"
                >
                  <RefreshCw size={32} strokeWidth={3} className="text-green-success" />
                </motion.div>
                <p className="font-nunito text-xs font-bold text-purple-dark mt-2">
                  Restoring files...
                </p>
                <p className="font-nunito text-[10px] text-purple-light">
                  Recovering from backup snapshot
                </p>
              </div>
            )}

            {phase === 'recovered' && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center py-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ShieldCheck size={36} strokeWidth={3} className="text-green-success mx-auto" />
                </motion.div>
                <p className="font-fredoka text-sm font-bold text-green-success mt-1">
                  Recovery Complete!
                </p>
                <p className="font-nunito text-[10px] text-purple-dark mb-2">
                  +200 points for disaster recovery!
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPhase('idle')}
                  className="flex items-center gap-1 mx-auto px-3 py-1.5 bg-purple-primary border-[3px] border-black rounded-full font-nunito text-xs font-bold text-white"
                >
                  <ArrowLeft size={12} strokeWidth={3} />
                  Continue
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full max-w-2xl flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-success border-2 border-black" />
          <span className="font-nunito text-[10px] font-semibold text-purple-dark">Safe</span>
        </div>
        <div className="flex items-center gap-1">
          <Lock size={10} strokeWidth={3} className="text-red-alert" />
          <span className="font-nunito text-[10px] font-semibold text-purple-dark">Encrypted</span>
        </div>
        <div className="flex items-center gap-1">
          <Trash2 size={10} strokeWidth={3} className="text-gray-400" />
          <span className="font-nunito text-[10px] font-semibold text-purple-dark">Deleted</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle size={10} strokeWidth={3} className="text-yellow-accent" />
          <span className="font-nunito text-[10px] font-semibold text-purple-dark">Corrupted</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-info border-2 border-black" />
          <span className="font-nunito text-[10px] font-semibold text-purple-dark">Backed Up</span>
        </div>
        <div className="flex items-center gap-1">
          <HardDrive size={10} strokeWidth={3} className="text-purple-primary" />
          <span className="font-nunito text-[10px] font-semibold text-purple-dark">Full Backup</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap size={10} strokeWidth={3} className="text-blue-info" />
          <span className="font-nunito text-[10px] font-semibold text-purple-dark">Incremental</span>
        </div>
      </div>
    </div>
  );
}
