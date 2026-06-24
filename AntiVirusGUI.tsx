import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileSearch,
  Folder,
  File,
  FileCode,
  FileImage,
  FileMusic,
  FileVideo,
  Skull,
  Check,
  Trash2,
  AlertTriangle,
  Scan,
  Zap,
  Lock,
  Unlock,
  RotateCcw,
  Play,
  Pause,
  Settings,
  Info,
  Bug,
  Activity,
  PawPrint,
  X,
} from 'lucide-react';

interface AntiVirusGUIProps {
  onScoreChange: (score: number) => void;
}

interface FileItem {
  id: number;
  name: string;
  type: 'folder' | 'doc' | 'code' | 'image' | 'music' | 'video' | 'exe';
  infected: boolean;
  virusName?: string;
  scanned: boolean;
  quarantined: boolean;
  size: string;
}

interface ThreatInfo {
  name: string;
  type: 'trojan' | 'worm' | 'ransomware' | 'spyware' | 'adware';
  description: string;
}

const THREAT_TYPES: ThreatInfo[] = [
  { name: 'PurrTrojan.JS', type: 'trojan', description: 'Disguises itself as legitimate software' },
  { name: 'WhiskerWorm.EXE', type: 'worm', description: 'Self-replicates across network shares' },
  { name: 'MeowCrypt.LOCK', type: 'ransomware', description: 'Encrypts files and demands ransom' },
  { name: 'KittySpy.DLL', type: 'spyware', description: 'Steals sensitive user information' },
  { name: 'FurAd.POP', type: 'adware', description: 'Displays unwanted advertisements' },
  { name: 'CatPhish.PDF', type: 'trojan', description: 'Opens backdoor for remote access' },
  { name: 'PawLogger.KEY', type: 'spyware', description: 'Records keystrokes and passwords' },
  { name: 'TabbyMiner.CPU', type: 'trojan', description: 'Uses CPU for cryptocurrency mining' },
];

const FILE_NAMES = [
  { name: 'Documents', type: 'folder' as const },
  { name: 'Photos', type: 'folder' as const },
  { name: 'Music', type: 'folder' as const },
  { name: 'Downloads', type: 'folder' as const },
  { name: 'homework.docx', type: 'doc' as const },
  { name: 'project.tsx', type: 'code' as const },
  { name: 'notes.txt', type: 'doc' as const },
  { name: 'cat.png', type: 'image' as const },
  { name: 'avatar.jpg', type: 'image' as const },
  { name: 'song.mp3', type: 'music' as const },
  { name: 'video.mp4', type: 'video' as const },
  { name: 'app.exe', type: 'exe' as const },
  { name: 'script.js', type: 'code' as const },
  { name: 'report.pdf', type: 'doc' as const },
  { name: 'game.exe', type: 'exe' as const },
  { name: 'data.json', type: 'code' as const },
  { name: 'banner.png', type: 'image' as const },
  { name: 'intro.mp4', type: 'video' as const },
  { name: 'readme.md', type: 'doc' as const },
  { name: 'setup.exe', type: 'exe' as const },
  { name: 'theme.css', type: 'code' as const },
  { name: 'backup.zip', type: 'doc' as const },
  { name: 'logo.svg', type: 'image' as const },
  { name: 'alarm.mp3', type: 'music' as const },
];

const FILE_SIZES = ['12KB', '45KB', '128KB', '256KB', '512KB', '1MB', '2MB', '5MB', '10MB', '15MB'];

function getFileIcon(type: string) {
  switch (type) {
    case 'folder': return Folder;
    case 'doc': return File;
    case 'code': return FileCode;
    case 'image': return FileImage;
    case 'music': return FileMusic;
    case 'video': return FileVideo;
    case 'exe': return File;
    default: return File;
  }
}

const generateFiles = (): FileItem[] => {
  return FILE_NAMES.map((fn, i) => {
    const isInfected = Math.random() < 0.25;
    return {
      id: i,
      name: fn.name,
      type: fn.type,
      infected: isInfected,
      virusName: isInfected ? THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)].name : undefined,
      scanned: false,
      quarantined: false,
      size: FILE_SIZES[Math.floor(Math.random() * FILE_SIZES.length)],
    };
  });
};

type ScanType = 'quick' | 'full' | 'custom';

export default function AntiVirusGUI({ onScoreChange }: AntiVirusGUIProps) {
  const [files, setFiles] = useState<FileItem[]>(generateFiles);
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState<ScanType>('quick');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [threatsFound, setThreatsFound] = useState(0);
  const [filesScanned, setFilesScanned] = useState(0);
  const [realtimeProtection, setRealtimeProtection] = useState(true);
  const [selectedThreat, setSelectedThreat] = useState<number | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [scanComplete, setScanComplete] = useState(false);
  const [educationalTip, setEducationalTip] = useState('');
  const scanRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Use ref to track threatsFound in scanning effect without causing restarts
  const threatsFoundRef = useRef(threatsFound);

  useEffect(() => {
    threatsFoundRef.current = threatsFound;
  }, [threatsFound]);

  const infectedCount = files.filter((f) => f.infected && !f.quarantined).length;
  const quarantinedCount = files.filter((f) => f.quarantined).length;
  const cleanCount = files.filter((f) => f.scanned && !f.infected).length;
  const totalFiles = scanType === 'quick' ? Math.min(10, files.length) : files.length;

  const startScan = (type: ScanType) => {
    setScanType(type);
    setScanning(true);
    setScanComplete(false);
    setShowIntro(false);
    setCurrentIndex(0);
    setFilesScanned(0);
    setThreatsFound(0);
    threatsFoundRef.current = 0;
    setScore(0);
    onScoreChange(0);

    // Reset scan state for files
    setFiles((prev) =>
      prev.map((f) => ({ ...f, scanned: false, quarantined: false }))
    );

    if (type === 'quick') {
      setEducationalTip('💡 Quick Scan checks the most common areas where threats hide. It\'s fast but may miss deeper infections!');
    } else if (type === 'full') {
      setEducationalTip('💡 Full Scan checks every single file. It takes longer but finds hidden threats that quick scans miss!');
    } else {
      setEducationalTip('💡 Custom Scan lets you choose specific areas. Target suspicious folders for efficient scanning!');
    }
    setTimeout(() => setEducationalTip(''), 6000);
  };

  useEffect(() => {
    if (!scanning) return;

    if (currentIndex >= totalFiles) {
      setScanning(false);
      setScanComplete(true);
      // Use ref to avoid stale closure - read latest threatsFound
      setEducationalTip(`✅ Scan complete! Found ${threatsFoundRef.current} threats. Quarantine them to keep your system safe!`);
      setTimeout(() => setEducationalTip(''), 5000);
      return;
    }

    const delay = scanType === 'quick' ? 400 : scanType === 'full' ? 600 : 500;

    scanRef.current = setTimeout(() => {
      setFiles((prev) => {
        const fileIndex = scanType === 'custom' ? currentIndex * 2 % prev.length : currentIndex;
        const updated = prev.map((f, i) =>
          i === fileIndex ? { ...f, scanned: true } : f
        );
        return updated;
      });

      setFilesScanned((prev) => prev + 1);
      setCurrentIndex((prev) => prev + 1);
    }, delay);

    return () => {
      if (scanRef.current) clearTimeout(scanRef.current);
    };
    // Removed threatsFound from deps to prevent effect restart storm
  }, [scanning, currentIndex, totalFiles, scanType]);

  // When files are marked as scanned, update score and threat count
  useEffect(() => {
    const newlyScanned = files.filter((f) => f.scanned);
    const foundThreats = newlyScanned.filter((f) => f.infected).length;
    setThreatsFound(foundThreats);

    const scanScore = newlyScanned.length * 10;
    const threatScore = foundThreats * 100;
    const newTotal = scanScore + threatScore;
    // Clamp score to 0-500 bounds
    const clampedTotal = Math.max(0, Math.min(500, newTotal));
    setScore(clampedTotal);
    onScoreChange(clampedTotal);
  }, [files, onScoreChange]);

  const quarantineFile = (fileId: number) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, quarantined: true } : f
      )
    );
    setSelectedThreat(null);
    setEducationalTip('🛡️ File quarantined! Quarantine isolates threats so they cannot harm your system.');
    setTimeout(() => setEducationalTip(''), 4000);
  };

  const removeFile = (fileId: number) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedThreat(null);
  };

  const restoreAll = () => {
    setFiles(generateFiles());
    setScanning(false);
    setScanComplete(false);
    setShowIntro(true);
    setCurrentIndex(0);
    setScore(0);
    setThreatsFound(0);
    threatsFoundRef.current = 0;
    setFilesScanned(0);
    setSelectedThreat(null);
    setEducationalTip('');
    // Clear any pending scan timeout
    if (scanRef.current) clearTimeout(scanRef.current);
    onScoreChange(0);
  };

  const scannedFiles = files.filter((f) => f.scanned);
  const progress = totalFiles > 0 ? (scannedFiles.length / totalFiles) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <Shield size={20} strokeWidth={3} className="text-green-success" />
          <span className="font-fredoka font-bold text-sm text-white">CyberPaw AV</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-nunito text-xs font-bold text-yellow-accent">Score: {score}</span>
          <span className="font-nunito text-xs text-green-success">Scanned: {filesScanned}</span>
          <span className="font-nunito text-xs text-red-alert">Threats: {threatsFound}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRealtimeProtection((p) => !p)}
            className="flex items-center gap-1 px-2 py-1 border-[2px] border-black rounded-full transition-colors"
            style={{ backgroundColor: realtimeProtection ? '#4ADE80' : '#F87171' }}
          >
            {realtimeProtection ? <Lock size={10} strokeWidth={3} /> : <Unlock size={10} strokeWidth={3} />}
            <span className="font-nunito text-[9px] font-bold">
              {realtimeProtection ? 'RT On' : 'RT Off'}
            </span>
          </button>
        </div>
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

      {/* Scan Controls */}
      <div className="w-full max-w-2xl flex gap-2 justify-center">
        {[
          { type: 'quick' as ScanType, label: 'Quick Scan', icon: Zap },
          { type: 'full' as ScanType, label: 'Full Scan', icon: Scan },
          { type: 'custom' as ScanType, label: 'Custom Scan', icon: FileSearch },
        ].map((scan) => {
          const Icon = scan.icon;
          return (
            <motion.button
              key={scan.type}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startScan(scan.type)}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 border-[3px] border-black rounded-full font-nunito text-xs font-bold transition-colors disabled:opacity-50"
              style={{
                backgroundColor: scanType === scan.type && scanning ? '#A78BFA' : '#7C3AED',
                color: '#fff',
              }}
            >
              <Icon size={14} strokeWidth={3} />
              {scan.label}
            </motion.button>
          );
        })}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={restoreAll}
          className="flex items-center gap-1 px-3 py-2 bg-red-alert border-[3px] border-black rounded-full font-nunito text-xs font-bold text-white hover:scale-105 transition-transform"
        >
          <RotateCcw size={12} strokeWidth={3} />
          Reset
        </motion.button>
      </div>

      {/* Progress Bar */}
      {(scanning || scanComplete) && (
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="font-nunito text-xs font-bold text-purple-dark">
              {scanning ? 'Scanning...' : 'Scan Complete!'}
            </span>
            <span className="font-nunito text-xs text-purple-dark">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-4 bg-purple-lighter rounded-full border-[3px] border-black overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full rounded-full"
              style={{
                backgroundColor: threatsFound > 0 ? '#FACC15' : '#4ADE80',
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content: File Grid + Details */}
      <div className="w-full max-w-2xl flex gap-3 flex-col lg:flex-row">
        {/* File Grid */}
        <div className="flex-1 bg-white rounded-2xl border-4 border-black p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-fredoka font-bold text-sm text-purple-dark flex items-center gap-1">
              <Folder size={16} strokeWidth={3} className="text-purple-primary" />
              File System
            </h4>
            <div className="flex gap-2">
              <span className="font-nunito text-[9px] bg-green-success border-2 border-black rounded-full px-2 py-0.5 font-bold">
                Clean: {cleanCount}
              </span>
              <span className="font-nunito text-[9px] bg-red-alert border-2 border-black rounded-full px-2 py-0.5 font-bold text-white">
                Infected: {infectedCount}
              </span>
              <span className="font-nunito text-[9px] bg-purple-lighter border-2 border-black rounded-full px-2 py-0.5 font-bold">
                Quarantined: {quarantinedCount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {files.map((file) => {
              const Icon = getFileIcon(file.type);
              return (
                <motion.div
                  key={file.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    if (file.scanned && file.infected) {
                      setSelectedThreat(file.id);
                    }
                  }}
                  className="relative flex flex-col items-center p-2 rounded-xl border-[3px] border-black cursor-pointer transition-colors"
                  style={{
                    backgroundColor: file.quarantined
                      ? '#DDD6FE'
                      : file.scanned && file.infected
                      ? '#FEF2F2'
                      : file.scanned
                      ? '#F0FDF4'
                      : '#F5F3FF',
                  }}
                >
                  {/* File Icon */}
                  <div className="relative">
                    <Icon
                      size={28}
                      strokeWidth={2.5}
                      style={{
                        color: file.quarantined
                          ? '#A78BFA'
                          : file.scanned && file.infected
                          ? '#F87171'
                          : file.scanned
                          ? '#4ADE80'
                          : '#7C3AED',
                      }}
                    />
                    {/* Scan Status Overlay */}
                    {file.scanned && !file.infected && !file.quarantined && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-success border-2 border-black rounded-full flex items-center justify-center"
                      >
                        <Check size={8} strokeWidth={4} className="text-white" />
                      </motion.div>
                    )}
                    {file.scanned && file.infected && !file.quarantined && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="absolute -bottom-1 -right-1"
                      >
                        <Skull size={14} strokeWidth={3} className="text-red-alert" />
                      </motion.div>
                    )}
                    {file.quarantined && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-primary border-2 border-black rounded-full flex items-center justify-center">
                        <Lock size={8} strokeWidth={3} className="text-white" />
                      </div>
                    )}
                  </div>
                  <span className="font-nunito text-[9px] font-bold text-purple-darker mt-1 truncate max-w-full">
                    {file.name}
                  </span>
                  <span className="font-nunito text-[8px] text-purple-light">{file.size}</span>

                  {/* Currently scanning indicator */}
                  {scanning && !file.scanned && files.findIndex((f) => f.scanned) === file.id - 1 && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl"
                    >
                      <Scan size={20} strokeWidth={3} className="text-purple-primary" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Threat Details Panel */}
        <div className="w-full lg:w-56 bg-white rounded-2xl border-4 border-black p-3">
          <h4 className="font-fredoka font-bold text-sm text-purple-dark mb-2 flex items-center gap-1">
            <Bug size={16} strokeWidth={3} className="text-red-alert" />
            Threat Details
          </h4>

          {selectedThreat !== null ? (
            (() => {
              const file = files.find((f) => f.id === selectedThreat);
              if (!file || !file.virusName) return null;
              const threat = THREAT_TYPES.find((t) => t.name === file.virusName);
              return (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="space-y-2"
                >
                  <div className="p-2 bg-red-alert/10 border-[3px] border-red-alert rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Skull size={20} strokeWidth={3} className="text-red-alert" />
                      <span className="font-nunito text-xs font-bold text-red-alert">{file.virusName}</span>
                    </div>
                    <p className="font-nunito text-[10px] text-purple-dark">
                      {threat?.description || 'Unknown threat detected'}
                    </p>
                    <p className="font-nunito text-[9px] text-purple-light mt-1">
                      Type: {threat?.type || 'unknown'}
                    </p>
                    <p className="font-nunito text-[9px] text-purple-light">
                      File: {file.name}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => quarantineFile(file.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-purple-primary border-[3px] border-black rounded-full font-nunito text-[10px] font-bold text-white hover:bg-purple-dark transition-colors"
                    >
                      <Lock size={10} strokeWidth={3} />
                      Quarantine
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => removeFile(file.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-alert border-[3px] border-black rounded-full font-nunito text-[10px] font-bold text-white hover:bg-red-500 transition-colors"
                    >
                      <Trash2 size={10} strokeWidth={3} />
                      Delete
                    </motion.button>
                  </div>

                  <button
                    onClick={() => setSelectedThreat(null)}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-purple-lighter border-[2px] border-black rounded-full font-nunito text-[10px] font-bold text-purple-dark hover:bg-purple-light transition-colors"
                  >
                    <X size={10} strokeWidth={3} />
                    Close
                  </button>
                </motion.div>
              );
            })()
          ) : (
            <div className="text-center py-4">
              <ShieldCheck size={32} strokeWidth={2} className="text-purple-light mx-auto mb-2" />
              <p className="font-nunito text-xs text-purple-light">
                {threatsFound > 0
                  ? `Select an infected file to view details`
                  : scanComplete
                  ? 'No threats found!'
                  : 'Start a scan to find threats'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="w-full max-w-2xl flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-success border-2 border-black" />
          <span className="font-nunito text-[10px] font-semibold text-purple-dark">Clean</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-alert border-2 border-black" />
          <span className="font-nunito text-[10px] font-semibold text-purple-dark">Infected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-purple-lighter border-2 border-black" />
          <span className="font-nunito text-[10px] font-semibold text-purple-dark">Quarantined</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-purple-pale border-2 border-black" />
          <span className="font-nunito text-[10px] font-semibold text-purple-dark">Unscanned</span>
        </div>
      </div>
    </div>
  );
}
