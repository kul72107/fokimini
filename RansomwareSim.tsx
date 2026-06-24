import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, File, Lock, Unlock, HardDrive, ShieldCheck, ShieldAlert,
  Trophy, RotateCcw, AlertTriangle, Check, X, Sparkles, Download,
  KeyRound, DollarSign, Database, FileText, Image, Music, Video,
  Archive, Code, Globe, Eye, Zap
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

interface FileItem {
  id: number;
  name: string;
  encryptedName: string;
  type: 'doc' | 'image' | 'music' | 'video' | 'archive' | 'code';
  encrypted: boolean;
  size: string;
}

const FILE_TEMPLATES: FileItem[] = [
  { id: 1, name: 'homework.docx', encryptedName: 'hwX9k!m.docx.LOCKED', type: 'doc', encrypted: false, size: '245 KB' },
  { id: 2, name: 'family_photo.jpg', encryptedName: 'f@m_Z7x.jpg.LOCKED', type: 'image', encrypted: false, size: '3.2 MB' },
  { id: 3, name: 'my_song.mp3', encryptedName: 's#G2v$.mp3.LOCKED', type: 'music', encrypted: false, size: '8.1 MB' },
  { id: 4, name: 'project.py', encryptedName: 'pr!Q8z.py.LOCKED', type: 'code', encrypted: false, size: '12 KB' },
  { id: 5, name: 'vacation.mp4', encryptedName: 'v@c_K3p.mp4.LOCKED', type: 'video', encrypted: false, size: '45 MB' },
  { id: 6, name: 'notes.txt', encryptedName: 'n*F4w#.txt.LOCKED', type: 'doc', encrypted: false, size: '5 KB' },
  { id: 7, name: 'game.zip', encryptedName: 'g^m@2q.zip.LOCKED', type: 'archive', encrypted: false, size: '120 MB' },
  { id: 8, name: 'website.html', encryptedName: 'w!B9r$.html.LOCKED', type: 'code', encrypted: false, size: '18 KB' },
  { id: 9, name: 'birthday.jpg', encryptedName: 'bDay!X7.jpg.LOCKED', type: 'image', encrypted: false, size: '2.8 MB' },
  { id: 10, name: 'resume.pdf', encryptedName: 'r$E5t&.pdf.LOCKED', type: 'doc', encrypted: false, size: '156 KB' },
  { id: 11, name: 'budget.xlsx', encryptedName: 'bDg@3m.xlsx.LOCKED', type: 'doc', encrypted: false, size: '89 KB' },
  { id: 12, name: 'backup.zip', encryptedName: 'bKp!Z8w.zip.LOCKED', type: 'archive', encrypted: false, size: '500 MB' },
];

const FILE_ICONS = {
  doc: { icon: FileText, color: '#60A5FA', bg: '#DBEAFE' },
  image: { icon: Image, color: '#F472B6', bg: '#FCE7F3' },
  music: { icon: Music, color: '#A78BFA', bg: '#F5F3FF' },
  video: { icon: Video, color: '#F87171', bg: '#FEE2E2' },
  archive: { icon: Archive, color: '#FACC15', bg: '#FEF9C3' },
  code: { icon: Code, color: '#4ADE80', bg: '#DCFCE7' },
};

type GamePhase = 'safe' | 'encrypting' | 'ransom' | 'recovery' | 'resolved';

export default function RansomwareSim({ onScoreChange }: Props) {
  const [files, setFiles] = useState<FileItem[]>(FILE_TEMPLATES);
  const [phase, setPhase] = useState<GamePhase>('safe');
  const [score, setScore] = useState(0);
  const [lessonsLearned, setLessonsLearned] = useState(0);
  const [encryptIndex, setEncryptIndex] = useState(0);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showLesson, setShowLesson] = useState(false);
  const [lessonType, setLessonType] = useState<'pay' | 'backup' | 'decrypt' | null>(null);
  const [hasBackupKey, setHasBackupKey] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref to prevent multiple ransom phase transitions
  const transitionScheduledRef = useRef(false);
  // Ref to track action timeouts for cleanup and race prevention
  const actionTimeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Ref to prevent multiple simultaneous action handlers
  const actionInProgressRef = useRef(false);

  const encryptedCount = files.filter(f => f.encrypted).length;
  const encryptPercent = Math.round((encryptedCount / files.length) * 100);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = Math.min(100, Math.max(0, prev + points));
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      actionTimeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  // Encryption animation
  useEffect(() => {
    if (phase === 'encrypting') {
      transitionScheduledRef.current = false;
      timerRef.current = setInterval(() => {
        setEncryptIndex(prev => {
          if (prev >= FILE_TEMPLATES.length) {
            // Ensure we only schedule the transition once
            if (!transitionScheduledRef.current) {
              transitionScheduledRef.current = true;
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = null;
              const t = setTimeout(() => setPhase('ransom'), 500);
              actionTimeoutRefs.current.push(t);
            }
            return prev;
          }
          setFiles(f => f.map((file, i) =>
            i === prev ? { ...file, encrypted: true } : file
          ));
          return prev + 1;
        });
      }, 400);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  const startEncryption = () => {
    setPhase('encrypting');
    setEncryptIndex(0);
    transitionScheduledRef.current = false;
  };

  const handleAction = (action: 'pay' | 'backup' | 'decrypt') => {
    // Prevent race condition: ignore if another action is being processed
    if (actionInProgressRef.current) return;
    actionInProgressRef.current = true;

    setSelectedAction(action);
    setLessonType(action);
    setShowLesson(true);

    // Clear any previous action timeouts
    actionTimeoutRefs.current.forEach(clearTimeout);
    actionTimeoutRefs.current = [];

    if (action === 'pay') {
      // Wrong choice - no points, files stay encrypted
    } else if (action === 'backup') {
      // Correct choice - restore all files
      const t1 = setTimeout(() => {
        setFiles(f => f.map(file => ({ ...file, encrypted: false })));
        addScore(100);
        setLessonsLearned(prev => prev + 1);
      }, 1000);
      actionTimeoutRefs.current.push(t1);
    } else if (action === 'decrypt') {
      if (hasBackupKey) {
        const t2 = setTimeout(() => {
          setFiles(f => f.map(file => ({ ...file, encrypted: false })));
          addScore(80);
          setLessonsLearned(prev => prev + 1);
        }, 1000);
        actionTimeoutRefs.current.push(t2);
      }
    }

    const t3 = setTimeout(() => {
      setPhase('resolved');
      actionInProgressRef.current = false;
    }, 1500);
    actionTimeoutRefs.current.push(t3);
  };

  const toggleBackupKey = () => {
    setHasBackupKey(prev => !prev);
  };

  const reset = () => {
    // Clear all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    actionTimeoutRefs.current.forEach(clearTimeout);
    actionTimeoutRefs.current = [];
    transitionScheduledRef.current = false;
    actionInProgressRef.current = false;

    setFiles(FILE_TEMPLATES);
    setPhase('safe');
    setEncryptIndex(0);
    setSelectedAction(null);
    setShowLesson(false);
    setLessonType(null);
    setScore(0);
    setLessonsLearned(0);
    setHasBackupKey(false);
    onScoreChange(0);
  };

  const getFileIcon = (file: FileItem) => {
    const config = FILE_ICONS[file.type];
    const Icon = config.icon;
    return { Icon, config };
  };

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-12 h-12 bg-red-alert rounded-2xl border-4 border-black flex items-center justify-center"
          >
            <ShieldAlert size={24} color="#FFFFFF" strokeWidth={3} />
          </motion.div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">Ransomware Sim</h2>
            <p className="text-sm text-purple-dark font-nunito">Learn why backups save the day!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2"
          >
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-green-success px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2"
          >
            <ShieldCheck size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{lessonsLearned}</span>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: -10 }}
            whileTap={{ scale: 0.9 }}
            onClick={reset}
            className="p-2 bg-purple-light rounded-2xl border-4 border-black hover:bg-purple-primary transition-colors"
          >
            <RotateCcw size={20} strokeWidth={3} />
          </motion.button>
        </div>
      </div>

      {/* Progress Bar - Encryption Status */}
      <div className="bg-white rounded-2xl border-4 border-black p-4 mb-4 card-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <HardDrive size={18} strokeWidth={3} className="text-purple-primary" />
            <span className="font-fredoka text-sm text-purple-darker">File System Status</span>
          </div>
          <div className="flex items-center gap-2">
            {phase === 'encrypting' && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Zap size={16} strokeWidth={3} className="text-yellow-accent" />
              </motion.div>
            )}
            <span className={`font-fredoka text-sm ${phase === 'ransom' ? 'text-red-alert' : phase === 'resolved' ? 'text-green-success' : 'text-purple-dark'}`}>
              {phase === 'safe' && 'All files safe'}
              {phase === 'encrypting' && `Encrypting... ${encryptPercent}%`}
              {phase === 'ransom' && 'All files encrypted!'}
              {phase === 'recovery' && 'Choose recovery method'}
              {phase === 'resolved' && 'Situation resolved'}
            </span>
          </div>
        </div>
        <div className="w-full bg-purple-lighter rounded-full h-4 border-[3px] border-black overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: phase === 'ransom' ? '#F87171' : phase === 'resolved' ? '#4ADE80' : '#7C3AED',
            }}
            animate={{ width: `${encryptPercent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* File System Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border-4 border-black p-4 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-fredoka text-lg text-purple-darker flex items-center gap-2">
              <Folder size={18} strokeWidth={3} />
              My Files
            </h3>
            <span className="font-fredoka text-xs bg-purple-pale px-3 py-1 rounded-xl border-2 border-black">
              {encryptedCount}/{files.length} encrypted
            </span>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((file, index) => {
              const { Icon, config } = getFileIcon(file);
              return (
                <motion.div
                  key={file.id}
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className={`relative rounded-xl border-[3px] border-black p-3 text-center transition-colors ${
                    file.encrypted ? 'bg-red-50' : 'bg-purple-pale'
                  }`}
                >
                  {file.encrypted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <Lock size={28} strokeWidth={3} className="text-red-alert mx-auto mb-1" />
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{ rotate: [0, -5, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 3, delay: index * 0.2 }}
                    >
                      <Icon size={28} strokeWidth={3} style={{ color: config.color }} className="mx-auto mb-1" />
                    </motion.div>
                  )}
                  <p className={`text-[10px] font-mono truncate ${file.encrypted ? 'text-red-600 line-through' : 'text-purple-darker'}`}>
                    {file.encrypted ? file.encryptedName : file.name}
                  </p>
                  <p className="text-[9px] text-purple-dark">{file.size}</p>
                  {file.encrypted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-alert rounded-full border-2 border-black flex items-center justify-center"
                    >
                      <AlertTriangle size={12} strokeWidth={3} color="#FFF" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-base text-purple-darker mb-3 flex items-center gap-2">
              <Sparkles size={18} strokeWidth={3} />
              Actions
            </h3>

            {phase === 'safe' && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={startEncryption}
                className="w-full px-4 py-3 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 bg-red-alert text-white mb-3"
              >
                <ShieldAlert size={18} strokeWidth={3} />
                Simulate Ransomware Attack
              </motion.button>
            )}

            {phase === 'encrypting' && (
              <div className="text-center py-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="inline-block mb-2"
                >
                  <Zap size={32} strokeWidth={3} className="text-yellow-accent" />
                </motion.div>
                <p className="font-fredoka text-sm text-purple-darker">Files being encrypted...</p>
                <p className="font-mono text-xs text-purple-dark mt-1">{encryptedCount} of {files.length}</p>
              </div>
            )}

            {phase === 'ransom' && (
              <div className="space-y-2">
                <p className="text-xs font-nunito text-purple-dark mb-2">Choose how to respond:</p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setPhase('recovery'); }}
                  className="w-full px-4 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center justify-center gap-2 bg-purple-primary text-white"
                >
                  <Eye size={14} strokeWidth={3} />
                  View Recovery Options
                </motion.button>
              </div>
            )}

            {phase === 'recovery' && (
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAction('pay')}
                  className="w-full px-3 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center justify-center gap-2 bg-red-alert text-white"
                >
                  <DollarSign size={14} strokeWidth={3} />
                  Pay the Ransom
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAction('backup')}
                  className="w-full px-3 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center justify-center gap-2 bg-green-success"
                >
                  <Database size={14} strokeWidth={3} />
                  Restore from Backup
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAction('decrypt')}
                  className={`w-full px-3 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center justify-center gap-2 ${
                    hasBackupKey ? 'bg-blue-info text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <KeyRound size={14} strokeWidth={3} />
                  Decrypt with Key
                  {!hasBackupKey && <span className="text-[9px]">(need key)</span>}
                </motion.button>
              </div>
            )}

            {phase === 'resolved' && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center py-2"
              >
                {selectedAction === 'backup' || (selectedAction === 'decrypt' && hasBackupKey) ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <Check size={40} strokeWidth={3} className="text-green-success mx-auto mb-2" />
                    </motion.div>
                    <p className="font-fredoka text-sm text-green-600">Files recovered!</p>
                  </>
                ) : selectedAction === 'pay' ? (
                  <>
                    <X size={40} strokeWidth={3} className="text-red-alert mx-auto mb-2" />
                    <p className="font-fredoka text-sm text-red-600">Scammers took the money!</p>
                  </>
                ) : null}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={reset}
                  className="mt-2 px-4 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center justify-center gap-2 bg-purple-light mx-auto"
                >
                  <RotateCcw size={14} strokeWidth={3} />
                  Try Again
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Backup Key Toggle */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-darker mb-2 flex items-center gap-2">
              <KeyRound size={16} strokeWidth={3} />
              Backup Key
            </h3>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={toggleBackupKey}
              className={`w-full px-3 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center justify-center gap-2 transition-colors ${
                hasBackupKey ? 'bg-green-success' : 'bg-purple-pale'
              }`}
            >
              {hasBackupKey ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  You have a backup key!
                </>
              ) : (
                <>
                  <Download size={14} strokeWidth={3} />
                  Create backup key first
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Ransom Note Popup */}
      <AnimatePresence>
        {phase === 'ransom' && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white rounded-3xl border-4 border-black p-6 max-w-md w-full card-shadow-lg"
            >
              <div className="text-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-16 h-16 bg-red-alert rounded-full border-4 border-black flex items-center justify-center mx-auto mb-3"
                >
                  <Lock size={32} color="#FFFFFF" strokeWidth={3} />
                </motion.div>
                <h2 className="text-2xl font-fredoka text-red-600 text-outline-sm">YOUR FILES ARE ENCRYPTED!</h2>
              </div>

              <div className="bg-red-50 rounded-2xl border-[3px] border-red-alert p-4 mb-4">
                <p className="font-fredoka text-sm text-purple-darker mb-2">All your important files have been encrypted.</p>
                <div className="space-y-1 mb-3">
                  {files.slice(0, 4).map(f => (
                    <div key={f.id} className="flex items-center gap-2 text-xs font-mono text-red-600">
                      <Lock size={10} strokeWidth={3} />
                      {f.encryptedName}
                    </div>
                  ))}
                  <p className="text-xs text-purple-dark">...and {files.length - 4} more</p>
                </div>
                <div className="bg-yellow-accent/20 rounded-xl border-2 border-yellow-accent p-3 text-center">
                  <p className="font-fredoka text-sm text-purple-darker">Pay 0.5 Bitcoin to unlock</p>
                  <p className="font-mono text-xs text-purple-dark mt-1">wallet: 1xScammer...1234</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-purple-pale rounded-xl border-2 border-purple-light p-3">
                <AlertTriangle size={18} strokeWidth={3} className="text-yellow-accent shrink-0 mt-0.5" />
                <p className="text-xs font-nunito text-purple-dark">
                  <strong className="text-purple-darker">Remember:</strong> In real life, paying the ransom does NOT guarantee you will get your files back. Scammers often demand more money!
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPhase('recovery')}
                className="w-full mt-4 px-4 py-3 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 bg-purple-primary text-white"
              >
                <ShieldCheck size={18} strokeWidth={3} />
                I understand - Show me options
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson Panel */}
      <AnimatePresence>
        {showLesson && lessonType && (
          <motion.div
            initial={{ y: 50, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 50, scale: 0.9 }}
            className="mt-4"
          >
            {lessonType === 'pay' && (
              <div className="bg-red-50 rounded-2xl border-4 border-red-alert p-4">
                <div className="flex items-center gap-2 mb-2">
                  <X size={20} strokeWidth={3} className="text-red-alert" />
                  <h4 className="font-fredoka text-base text-red-600">Wrong choice!</h4>
                </div>
                <p className="text-sm font-nunito text-purple-darker mb-2">
                  Scammers almost never give you the decryption key after you pay. They might demand even more money!
                </p>
                <div className="bg-white rounded-xl border-2 border-black p-3">
                  <p className="font-fredoka text-sm text-purple-darker flex items-center gap-2">
                    <AlertTriangle size={16} strokeWidth={3} className="text-yellow-accent" />
                    <strong>Rule #1: NEVER PAY THE RANSOM!</strong>
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setShowLesson(false); setPhase('ransom'); actionInProgressRef.current = false; }}
                  className="mt-3 px-4 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center justify-center gap-2 bg-purple-light"
                >
                  <RotateCcw size={14} strokeWidth={3} />
                  Try a different approach
                </motion.button>
              </div>
            )}
            {lessonType === 'backup' && (
              <div className="bg-green-50 rounded-2xl border-4 border-green-success p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={20} strokeWidth={3} className="text-green-success" />
                  <h4 className="font-fredoka text-base text-green-600">Excellent choice!</h4>
                </div>
                <p className="text-sm font-nunito text-purple-darker mb-2">
                  Backups are the best defense against ransomware! Keep regular backups on an external drive or cloud service.
                </p>
                <div className="bg-white rounded-xl border-2 border-black p-3">
                  <p className="font-fredoka text-sm text-purple-darker flex items-center gap-2">
                    <ShieldCheck size={16} strokeWidth={3} className="text-green-success" />
                    <strong>Rule #2: Always keep backups!</strong>
                  </p>
                </div>
                <p className="text-xs font-nunito text-purple-dark mt-2">
                  +50 points for choosing the right recovery method!
                </p>
              </div>
            )}
            {lessonType === 'decrypt' && (
              <div className="bg-blue-50 rounded-2xl border-4 border-blue-info p-4">
                <div className="flex items-center gap-2 mb-2">
                  {hasBackupKey ? <Check size={20} strokeWidth={3} className="text-green-success" /> : <X size={20} strokeWidth={3} className="text-red-alert" />}
                  <h4 className="font-fredoka text-base text-blue-600">
                    {hasBackupKey ? 'Good recovery!' : 'No decryption key available!'}
                  </h4>
                </div>
                <p className="text-sm font-nunito text-purple-darker mb-2">
                  {hasBackupKey
                    ? 'Having a backup decryption key saved you! But keys are rare - backups are more reliable.'
                    : 'Without the decryption key, you cannot recover files. This is why backups are essential!'}
                </p>
                <div className="bg-white rounded-xl border-2 border-black p-3">
                  <p className="font-fredoka text-sm text-purple-darker flex items-center gap-2">
                    <KeyRound size={16} strokeWidth={3} className="text-blue-info" />
                    <strong>Rule #3: Prevention is better than cure!</strong>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Education Panel */}
      {phase === 'safe' && (
        <motion.div
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          className="mt-4 bg-white rounded-2xl border-4 border-black p-4 card-shadow"
        >
          <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
            <ShieldCheck size={18} strokeWidth={3} />
            How Ransomware Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { step: '1', title: 'Infection', desc: 'Malware enters through email, download, or website', icon: <Globe size={20} strokeWidth={3} />, color: '#F87171' },
              { step: '2', title: 'Encryption', desc: 'Files are locked with a secret key you do not have', icon: <Lock size={20} strokeWidth={3} />, color: '#FACC15' },
              { step: '3', title: 'Ransom Note', desc: 'Attackers demand payment for the decryption key', icon: <FileText size={20} strokeWidth={3} />, color: '#F472B6' },
              { step: '4', title: 'Prevention', desc: 'Backups are your best protection - never pay!', icon: <Database size={20} strokeWidth={3} />, color: '#4ADE80' },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -4 }}
                className="bg-purple-pale rounded-xl border-[3px] border-black p-3 text-center"
              >
                <div className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: item.color }}>
                  {item.icon}
                </div>
                <p className="font-fredoka text-xs text-purple-darker">Step {item.step}: {item.title}</p>
                <p className="text-[10px] font-nunito text-purple-dark mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
