import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderSearch, Check, X, Zap, Trophy, ChevronRight,
  RotateCcw, Play, Search, Globe, FileText, Lock,
  AlertTriangle, Code, FolderOpen, FileCode, BookOpen,
  Shield, Clock, Layers, Sparkles, TreePine, FileLock2
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type ScanMode = 'quick' | 'deep' | 'files';
type ScanStatus = 'idle' | 'scanning' | 'paused' | 'completed';

interface FoundPath {
  id: string;
  path: string;
  statusCode: number;
  statusType: 'success' | 'forbidden' | 'notfound' | 'redirect';
  size: string;
  timestamp: number;
  interesting: boolean;
}

interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
  statusType: FoundPath['statusType'];
  interesting: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  success:   { bg: '#4ADE80', text: '#FFFFFF', label: '200 OK' },
  forbidden: { bg: '#FACC15', text: '#000000', label: '403 FORBIDDEN' },
  notfound:  { bg: '#F87171', text: '#FFFFFF', label: '404 NOT FOUND' },
  redirect:  { bg: '#60A5FA', text: '#FFFFFF', label: '301 REDIRECT' },
};

const MODE_CONFIG: Record<ScanMode, { label: string; color: string; wordlist: string[]; description: string }> = {
  quick: {
    label: 'Quick Scan',
    color: '#4ADE80',
    wordlist: ['admin', 'login', 'api', 'dashboard', 'config', 'backup', 'test', 'dev', 'wp-admin', 'phpmyadmin'],
    description: 'Common directories only',
  },
  deep: {
    label: 'Deep Scan',
    color: '#FACC15',
    wordlist: [
      'admin', 'administrator', 'api', 'assets', 'backup', 'bin', 'cgi-bin', 'config', 'dashboard',
      'data', 'db', 'debug', 'dev', 'download', 'files', 'images', 'includes', 'install',
      'js', 'lib', 'logs', 'media', 'modules', 'old', 'panel', 'phpmyadmin', 'plugins',
      'private', 'public', 'resources', 'scripts', 'secure', 'src', 'temp', 'test',
      'tmp', 'upload', 'uploads', 'user', 'users', 'vendor', 'wp-admin', 'wp-content', 'wp-includes',
      '.env', '.git', '.htaccess', '.svn', 'robots.txt', 'sitemap.xml',
    ],
    description: 'Full wordlist (50+ paths)',
  },
  files: {
    label: 'File Hunt',
    color: '#F472B6',
    wordlist: [
      'index.php', 'config.php', 'database.sql', 'backup.zip', '.env', 'readme.txt',
      'robots.txt', 'sitemap.xml', 'admin.php', 'login.php', 'wp-config.php',
      '.htaccess', 'web.config', 'credentials.json', 'secrets.yml', 'dump.sql',
    ],
    description: 'Specific file extensions',
  },
};

const RESULT_TEMPLATES: Omit<FoundPath, 'id' | 'timestamp'>[] = [
  { path: '/admin', statusCode: 200, statusType: 'success', size: '4.2KB', interesting: true },
  { path: '/login', statusCode: 200, statusType: 'success', size: '2.8KB', interesting: false },
  { path: '/api', statusCode: 403, statusType: 'forbidden', size: '0B', interesting: true },
  { path: '/dashboard', statusCode: 302, statusType: 'redirect', size: '0B', interesting: true },
  { path: '/config', statusCode: 403, statusType: 'forbidden', size: '0B', interesting: true },
  { path: '/backup', statusCode: 200, statusType: 'success', size: '12.5MB', interesting: true },
  { path: '/test', statusCode: 404, statusType: 'notfound', size: '0B', interesting: false },
  { path: '/dev', statusCode: 200, statusType: 'success', size: '6.1KB', interesting: true },
  { path: '/wp-admin', statusCode: 200, statusType: 'success', size: '8.3KB', interesting: true },
  { path: '/phpmyadmin', statusCode: 403, statusType: 'forbidden', size: '0B', interesting: true },
  { path: '/.env', statusCode: 200, statusType: 'success', size: '1.2KB', interesting: true },
  { path: '/.git', statusCode: 403, statusType: 'forbidden', size: '0B', interesting: true },
  { path: '/robots.txt', statusCode: 200, statusType: 'success', size: '0.5KB', interesting: false },
  { path: '/uploads', statusCode: 200, statusType: 'success', size: '24.8KB', interesting: false },
  { path: '/api/v1', statusCode: 200, statusType: 'success', size: '1.8KB', interesting: true },
  { path: '/api/v2', statusCode: 403, statusType: 'forbidden', size: '0B', interesting: true },
  { path: '/assets', statusCode: 200, statusType: 'success', size: '156KB', interesting: false },
  { path: '/cgi-bin', statusCode: 404, statusType: 'notfound', size: '0B', interesting: false },
  { path: '/database.sql', statusCode: 200, statusType: 'success', size: '2.4MB', interesting: true },
  { path: '/backup.zip', statusCode: 200, statusType: 'success', size: '18.7MB', interesting: true },
  { path: '/config.php', statusCode: 403, statusType: 'forbidden', size: '0B', interesting: true },
  { path: '/admin.php', statusCode: 200, statusType: 'success', size: '3.5KB', interesting: true },
  { path: '/wp-config.php', statusCode: 403, statusType: 'forbidden', size: '0B', interesting: true },
  { path: '/.htaccess', statusCode: 200, statusType: 'success', size: '0.8KB', interesting: false },
  { path: '/credentials.json', statusCode: 200, statusType: 'success', size: '2.1KB', interesting: true },
  { path: '/secrets.yml', statusCode: 403, statusType: 'forbidden', size: '0B', interesting: true },
  { path: '/dump.sql', statusCode: 200, statusType: 'success', size: '8.5MB', interesting: true },
  { path: '/readme.txt', statusCode: 200, statusType: 'success', size: '4.3KB', interesting: false },
  { path: '/old', statusCode: 200, statusType: 'success', size: '12.3KB', interesting: true },
  { path: '/private', statusCode: 403, statusType: 'forbidden', size: '0B', interesting: true },
  { path: '/secure', statusCode: 200, statusType: 'success', size: '5.6KB', interesting: true },
  { path: '/panel', statusCode: 200, statusType: 'success', size: '7.2KB', interesting: true },
  { path: '/logs', statusCode: 403, statusType: 'forbidden', size: '0B', interesting: true },
  { path: '/debug', statusCode: 200, statusType: 'success', size: '15.8KB', interesting: true },
  { path: '/install', statusCode: 404, statusType: 'notfound', size: '0B', interesting: false },
  { path: '/temp', statusCode: 200, statusType: 'success', size: '3.4KB', interesting: false },
  { path: '/js', statusCode: 200, statusType: 'success', size: '89KB', interesting: false },
  { path: '/css', statusCode: 200, statusType: 'success', size: '45KB', interesting: false },
  { path: '/images', statusCode: 200, statusType: 'success', size: '2.1MB', interesting: false },
  { path: '/media', statusCode: 200, statusType: 'success', size: '5.7MB', interesting: false },
  { path: '/plugins', statusCode: 200, statusType: 'success', size: '234KB', interesting: false },
  { path: '/modules', statusCode: 200, statusType: 'success', size: '178KB', interesting: false },
  { path: '/vendor', statusCode: 200, statusType: 'success', size: '1.2MB', interesting: false },
  { path: '/resources', statusCode: 200, statusType: 'success', size: '67KB', interesting: false },
  { path: '/scripts', statusCode: 200, statusType: 'success', size: '123KB', interesting: false },
  { path: '/lib', statusCode: 200, statusType: 'success', size: '345KB', interesting: false },
  { path: '/includes', statusCode: 200, statusType: 'success', size: '89KB', interesting: false },
  { path: '/download', statusCode: 200, statusType: 'success', size: '8.9KB', interesting: false },
  { path: '/public', statusCode: 200, statusType: 'success', size: '34KB', interesting: false },
  { path: '/user', statusCode: 200, statusType: 'success', size: '5.5KB', interesting: false },
  { path: '/users', statusCode: 403, statusType: 'forbidden', size: '0B', interesting: true },
];

function buildTree(paths: FoundPath[]): TreeNode {
  const root: TreeNode = { id: 'root', name: '/', children: [], statusType: 'success', interesting: false };
  paths.filter(p => p.statusType === 'success' || p.statusType === 'forbidden').forEach(p => {
    const parts = p.path.split('/').filter(Boolean);
    let current = root;
    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const existing = current.children.find(c => c.name === part);
      if (existing) {
        current = existing;
      } else {
        const newNode: TreeNode = {
          id: `${p.id}-${idx}`,
          name: part,
          children: [],
          statusType: isLast ? p.statusType : 'success',
          interesting: isLast ? p.interesting : false,
        };
        current.children.push(newNode);
        current = newNode;
      }
    });
  });
  return root;
}

function TreeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isRoot = depth === 0;

  return (
    <div style={{ marginLeft: isRoot ? 0 : 16 }}>
      <motion.button
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg border-[2px] border-black mb-1 transition-transform hover:scale-[1.02] ${isRoot ? 'bg-purple-primary text-white' : ''}`}
        style={!isRoot ? { backgroundColor: node.interesting ? '#F5F3FF' : '#FFFFFF' } : {}}
      >
        {hasChildren ? (
          <ChevronRight size={12} strokeWidth={3} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} style={{ color: isRoot ? '#FFF' : '#5B21B6' }} />
        ) : (
          <span className="w-3" />
        )}
        {isRoot ? (
          <Globe size={14} strokeWidth={3} className="text-white" />
        ) : node.children.length > 0 ? (
          <FolderOpen size={14} strokeWidth={3} style={{ color: '#FACC15' }} />
        ) : (
          <FileText size={14} strokeWidth={3} style={{ color: node.statusType === 'forbidden' ? '#FACC15' : '#4ADE80' }} />
        )}
        <span className={`font-mono text-[11px] ${isRoot ? 'text-white font-bold' : 'text-purple-darker'}`}>
          {node.name}
        </span>
        {!isRoot && node.interesting && (
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold border-[2px] border-black bg-yellow-accent">
            !
          </span>
        )}
      </motion.button>
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 1 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0, opacity: 1 }}
            className="overflow-hidden"
          >
            {node.children.map(child => (
              <TreeView key={child.id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DirectoryBuster({ onScoreChange }: Props) {
  const [targetUrl, setTargetUrl] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('quick');
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [foundPaths, setFoundPaths] = useState<FoundPath[]>([]);
  const [scanIndex, setScanIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [dirCount, setDirCount] = useState(0);
  const [interestingCount, setInterestingCount] = useState(0);
  const [showLearn, setShowLearn] = useState(false);
  const [selectedPath, setSelectedPath] = useState<FoundPath | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = prev + points;
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  const wordlist = MODE_CONFIG[scanMode].wordlist;

  const startScan = useCallback(() => {
    if (!targetUrl.trim()) return;
    setFoundPaths([]);
    setScanIndex(0);
    setScanStatus('scanning');
    setSelectedPath(null);
  }, [targetUrl]);

  const stopScan = useCallback(() => {
    setScanStatus('idle');
    setScanIndex(-1);
    if (intervalRef.current) clearTimeout(intervalRef.current);
  }, []);

  useEffect(() => {
    if (scanStatus !== 'scanning' || scanIndex < 0) return;
    if (scanIndex >= wordlist.length) {
      setScanStatus('completed');
      setScanIndex(-1);
      return;
    }

    const word = wordlist[scanIndex];
    const template = RESULT_TEMPLATES.find(t => t.path === `/${word}` || t.path === word);

    intervalRef.current = setTimeout(() => {
      if (template) {
        const newPath: FoundPath = {
          ...template,
          id: `${scanIndex}-${Date.now()}`,
          timestamp: Date.now(),
        };
        setFoundPaths(prev => [...prev, newPath]);

        if (template.statusType === 'success') {
          setDirCount(prev => prev + 1);
          addScore(template.interesting ? 30 : 15);
          if (template.interesting) {
            setInterestingCount(prev => prev + 1);
          }
        }
      }
      setScanIndex(prev => prev + 1);
    }, 300 + Math.random() * 500);

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [scanStatus, scanIndex, wordlist, addScore]);

  const reset = useCallback(() => {
    stopScan();
    setFoundPaths([]);
    setScore(0);
    setDirCount(0);
    setInterestingCount(0);
    setSelectedPath(null);
    onScoreChange(0);
  }, [stopScan, onScoreChange]);

  const treeRoot = buildTree(foundPaths);
  const successPaths = foundPaths.filter(p => p.statusType === 'success');
  const progress = scanIndex >= 0 ? (scanIndex / wordlist.length) * 100 : scanStatus === 'completed' ? 100 : 0;

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-primary rounded-2xl border-4 border-black flex items-center justify-center">
            <FolderSearch size={24} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">Directory Buster</h2>
            <p className="text-sm text-purple-dark font-nunito">Discover hidden paths & files!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </div>
          <div className="bg-green-success px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <FolderOpen size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{dirCount}</span>
          </div>
          <button onClick={reset} className="p-2 bg-purple-light rounded-2xl border-4 border-black hover:bg-purple-primary transition-colors">
            <RotateCcw size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Target URL + Mode Selection */}
      <div className="bg-white rounded-2xl border-4 border-black p-3 mb-4 card-shadow">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <span className="font-fredoka text-purple-darker">Target:</span>
          <input
            type="text"
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border-4 border-black font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-primary"
          />
          <button
            onClick={scanStatus === 'scanning' ? stopScan : startScan}
            disabled={!targetUrl.trim()}
            className="px-6 py-2 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-50"
            style={{ backgroundColor: scanStatus === 'scanning' ? '#F87171' : '#FACC15' }}
          >
            {scanStatus === 'scanning' ? <X size={16} strokeWidth={3} /> : <Play size={16} strokeWidth={3} />}
            {scanStatus === 'scanning' ? 'STOP' : 'SCAN'}
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-fredoka text-sm text-purple-dark">Mode:</span>
          {(Object.keys(MODE_CONFIG) as ScanMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => scanStatus !== 'scanning' && setScanMode(mode)}
              className={`px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-xs flex items-center gap-1.5 transition-transform ${
                scanMode === mode
                  ? 'text-white scale-105'
                  : 'bg-white text-purple-darker hover:bg-purple-pale'
              }`}
              style={scanMode === mode ? { backgroundColor: MODE_CONFIG[mode].color } : {}}
            >
              <Zap size={14} strokeWidth={3} />
              {MODE_CONFIG[mode].label}
            </button>
          ))}
          <span className="text-xs text-purple-light font-nunito ml-2">{MODE_CONFIG[scanMode].description}</span>
        </div>

        {/* Progress Bar */}
        {scanStatus !== 'idle' && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-nunito font-bold text-purple-dark">
                {scanStatus === 'completed' ? 'Scan Complete!' : `Scanning ${scanIndex + 1}/${wordlist.length}...`}
              </span>
              <span className="text-xs font-mono text-purple-light">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5 border-[3px] border-black overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: MODE_CONFIG[scanMode].color }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Tree + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Directory Tree */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-2 flex items-center gap-2">
              <TreePine size={18} strokeWidth={3} />
              Directory Tree
            </h3>
            <div className="bg-purple-pale rounded-xl border-[3px] border-black p-3 max-h-[400px] overflow-y-auto">
              {foundPaths.length === 0 ? (
                <div className="text-center py-8">
                  <FolderSearch size={40} strokeWidth={2} className="text-purple-light mx-auto mb-2" />
                  <p className="text-sm text-purple-light font-nunito">Start a scan to build the tree</p>
                </div>
              ) : (
                <TreeView node={treeRoot} />
              )}
            </div>
          </div>

          {/* Stats */}
          {foundPaths.length > 0 && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl border-4 border-black p-3 card-shadow"
            >
              <h3 className="font-fredoka text-sm text-purple-darker mb-2">Scan Stats</h3>
              <div className="space-y-1 text-xs font-nunito">
                <div className="flex items-center justify-between">
                  <span>Paths Found:</span>
                  <span className="font-bold text-purple-primary">{foundPaths.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Accessible (200):</span>
                  <span className="font-bold text-green-success">{foundPaths.filter(p => p.statusType === 'success').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Forbidden (403):</span>
                  <span className="font-bold text-yellow-accent">{foundPaths.filter(p => p.statusType === 'forbidden').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Not Found (404):</span>
                  <span className="font-bold text-red-alert">{foundPaths.filter(p => p.statusType === 'notfound').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Interesting Files:</span>
                  <span className="font-bold text-pink-accent">{interestingCount}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Center: Found Paths List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-2 flex items-center gap-2">
              <Search size={18} strokeWidth={3} />
              Discovered Paths
            </h3>
            <div className="space-y-1.5 max-h-[440px] overflow-y-auto">
              <AnimatePresence>
                {foundPaths.map((path, i) => (
                  <motion.div
                    key={path.id}
                    initial={{ x: -30, scale: 0.95 }}
                    animate={{ x: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={() => setSelectedPath(path)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-[3px] border-black cursor-pointer transition-transform hover:scale-[1.01] ${
                      selectedPath?.id === path.id ? 'ring-2 ring-purple-primary' : ''
                    }`}
                    style={{ backgroundColor: path.statusType === 'success' ? '#F0FDF4' : path.statusType === 'forbidden' ? '#FEFCE8' : '#FEF2F2' }}
                  >
                    <div
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold border-[2px] border-black whitespace-nowrap"
                      style={{ backgroundColor: STATUS_COLORS[path.statusType].bg, color: STATUS_COLORS[path.statusType].text }}
                    >
                      {path.statusCode}
                    </div>
                    <code className="flex-1 font-mono text-xs text-purple-darker truncate">{path.path}</code>
                    <span className="text-[10px] font-mono text-purple-light whitespace-nowrap">{path.size}</span>
                    {path.interesting && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold border-[2px] border-black bg-yellow-accent">
                        <Sparkles size={10} strokeWidth={3} />
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {foundPaths.length === 0 && scanStatus === 'idle' && (
                <div className="text-center py-8">
                  <Globe size={40} strokeWidth={2} className="text-purple-light mx-auto mb-2" />
                  <p className="text-sm text-purple-light font-nunito">Enter a URL and start scanning</p>
                </div>
              )}
              {scanStatus === 'scanning' && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <Clock size={16} strokeWidth={3} className="text-purple-primary animate-spin" />
                  <span className="text-xs font-nunito text-purple-light">Scanning {wordlist[Math.min(scanIndex, wordlist.length - 1)]}...</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Path Detail + Educational */}
        <div className="lg:col-span-3 space-y-3">
          {/* Selected Path Detail */}
          <AnimatePresence mode="wait">
            {selectedPath ? (
              <motion.div
                key={selectedPath.id}
                initial={{ y: 20, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, scale: 0.95 }}
                className="bg-white rounded-2xl border-4 border-black p-3 card-shadow"
              >
                <h3 className="font-fredoka text-sm text-purple-darker mb-2 flex items-center gap-2">
                  <FileCode size={16} strokeWidth={3} />
                  Path Details
                </h3>
                <div className="space-y-2">
                  <div className="bg-purple-pale rounded-xl border-[3px] border-black p-2">
                    <code className="block font-mono text-xs text-purple-darker break-all">{targetUrl}{selectedPath.path}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-fredoka text-xs text-purple-dark">Status:</span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold border-[2px] border-black"
                      style={{ backgroundColor: STATUS_COLORS[selectedPath.statusType].bg, color: STATUS_COLORS[selectedPath.statusType].text }}
                    >
                      {STATUS_COLORS[selectedPath.statusType].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-fredoka text-xs text-purple-dark">Size:</span>
                    <span className="font-mono text-xs text-purple-darker">{selectedPath.size}</span>
                  </div>
                  {selectedPath.interesting && (
                    <div className="bg-yellow-accent/20 rounded-xl border-[3px] border-yellow-accent p-2">
                      <p className="text-[11px] font-nunito text-purple-darker flex items-center gap-1">
                        <Sparkles size={12} strokeWidth={3} className="text-yellow-accent" />
                        <strong>Interesting!</strong> This path may contain sensitive data.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl border-4 border-black p-6 card-shadow flex flex-col items-center justify-center text-center min-h-[150px]">
                <FileText size={36} strokeWidth={2} className="text-purple-light mb-2" />
                <p className="font-fredoka text-sm text-purple-light">Select a path to view details</p>
              </div>
            )}
          </AnimatePresence>

          {/* Status Code Legend */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-darker mb-2 flex items-center gap-2">
              <Layers size={16} strokeWidth={3} />
              Status Codes
            </h3>
            <div className="space-y-1.5">
              {Object.entries(STATUS_COLORS).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-black" style={{ backgroundColor: val.bg }} />
                  <span className="text-[11px] font-nunito text-purple-dark">{val.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Button */}
          <button
            onClick={() => { setShowLearn(!showLearn); if (!showLearn) addScore(10); }}
            className="w-full px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] bg-purple-primary text-white"
          >
            <BookOpen size={16} strokeWidth={3} />
            {showLearn ? 'Hide' : 'What is this? (+10)'}
          </button>

          <AnimatePresence>
            {showLearn && (
              <motion.div
                initial={{ height: 0, opacity: 1 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0, opacity: 1 }}
                className="overflow-hidden"
              >
                <div className="bg-purple-pale rounded-2xl border-[3px] border-purple-primary p-3">
                  <p className="text-xs font-nunito text-purple-darker mb-2">
                    <strong>Directory Enumeration</strong> is like checking all the doors in a building to see which ones are unlocked!
                  </p>
                  <p className="text-xs font-nunito text-purple-darker mb-2">
                    Websites often have <strong>hidden paths</strong> like /admin, /backup, or /config that developers forget about. Attackers use tools like this to find them.
                  </p>
                  <p className="text-xs font-nunito text-purple-darker mb-2">
                    <strong>Why it matters:</strong> Finding /backup could reveal old database dumps. Finding /.env could leak passwords and API keys!
                  </p>
                  <div className="bg-yellow-accent/20 rounded-xl border-[3px] border-yellow-accent p-2 mt-1">
                    <p className="text-[11px] font-nunito font-bold text-purple-darker flex items-center gap-1">
                      <Shield size={12} strokeWidth={3} className="text-yellow-accent" />
                      Defense: Use robots.txt properly, remove test files, and require authentication for admin panels.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
