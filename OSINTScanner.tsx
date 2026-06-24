import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserSearch, Globe, Mail, Link2, FileText, Image, Search,
  CheckCircle, XCircle, Sparkles, Star, ChevronRight, Info,
  Play, Download, Users, AtSign, MapPin, Calendar, Lock,
  RotateCcw
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type DataCategory = 'social' | 'email' | 'domain' | 'records' | 'images';

interface DataPoint {
  category: DataCategory;
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

interface TargetProfile {
  username: string;
  displayName: string;
  description: string;
  color: string;
  avatar: string;
  dataPoints: DataPoint[];
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Twitter: <Users size={14} strokeWidth={3} />,
  GitHub: <Users size={14} strokeWidth={3} />,
  LinkedIn: <Users size={14} strokeWidth={3} />,
  Instagram: <Users size={14} strokeWidth={3} />,
  YouTube: <Users size={14} strokeWidth={3} />,
  Reddit: <Users size={14} strokeWidth={3} />,
};

const CATEGORY_CONFIG: Record<DataCategory, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  social: { label: 'Social Profiles', icon: <Users size={16} strokeWidth={3} />, color: 'text-purple-700', bgColor: 'bg-purple-light/30' },
  email: { label: 'Email Addresses', icon: <Mail size={16} strokeWidth={3} />, color: 'text-blue-700', bgColor: 'bg-blue-info/30' },
  domain: { label: 'Domain Associations', icon: <Link2 size={16} strokeWidth={3} />, color: 'text-green-700', bgColor: 'bg-green-success/30' },
  records: { label: 'Public Records', icon: <FileText size={16} strokeWidth={3} />, color: 'text-yellow-700', bgColor: 'bg-yellow-accent/40' },
  images: { label: 'Image Analysis', icon: <Image size={16} strokeWidth={3} />, color: 'text-pink-700', bgColor: 'bg-pink-accent/30' },
};

const TARGETS: TargetProfile[] = [
  {
    username: 'JohnDoe123',
    displayName: 'John Doe',
    description: 'Easy target - lots of public info',
    color: '#4ADE80',
    avatar: 'JD',
    dataPoints: [
      { category: 'social', label: 'Twitter', value: '@JohnDoe123 (1,240 followers)', icon: SOCIAL_ICONS['Twitter'], color: '#60A5FA' },
      { category: 'social', label: 'Instagram', value: '@johndoe_photos (856 followers)', icon: SOCIAL_ICONS['Instagram'], color: '#F472B6' },
      { category: 'email', label: 'Personal Email', value: 'johndoe123@gmail.com', icon: <Mail size={14} strokeWidth={3} />, color: '#60A5FA' },
      { category: 'email', label: 'Work Email', value: 'john.d@oldcompany.com', icon: <Mail size={14} strokeWidth={3} />, color: '#60A5FA' },
      { category: 'domain', label: 'Personal Blog', value: 'johndoe-blog.wordpress.com', icon: <Globe size={14} strokeWidth={3} />, color: '#4ADE80' },
      { category: 'domain', label: 'Portfolio', value: 'johndoe-portfolio.github.io', icon: <Users size={14} strokeWidth={3} />, color: '#7C3AED' },
      { category: 'records', label: 'Location', value: 'Springfield, IL (from Twitter bio)', icon: <MapPin size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'records', label: 'Joined', value: 'Twitter: March 2015, Instagram: June 2017', icon: <Calendar size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'images', label: 'Profile Photo', value: 'Found on 3 platforms - same photo', icon: <Image size={14} strokeWidth={3} />, color: '#F472B6' },
      { category: 'images', label: 'EXIF Data', value: 'Photos contain GPS coordinates (home!)', icon: <Image size={14} strokeWidth={3} />, color: '#F87171' },
    ],
  },
  {
    username: 'CyberAdmin',
    displayName: 'Alex Chen',
    description: 'Medium target - IT professional, some exposure',
    color: '#60A5FA',
    avatar: 'AC',
    dataPoints: [
      { category: 'social', label: 'GitHub', value: 'CyberAdmin (47 repos, 234 stars)', icon: SOCIAL_ICONS['GitHub'], color: '#7C3AED' },
      { category: 'social', label: 'LinkedIn', value: 'Alex Chen - Systems Administrator', icon: SOCIAL_ICONS['LinkedIn'], color: '#60A5FA' },
      { category: 'social', label: 'Reddit', value: 'u/CyberAdmin (r/sysadmin, r/netsec)', icon: SOCIAL_ICONS['Reddit'], color: '#FACC15' },
      { category: 'email', label: 'Work Email', value: 'alex.chen@techcorp.example', icon: <Mail size={14} strokeWidth={3} />, color: '#60A5FA' },
      { category: 'email', label: 'Personal Email', value: 'alexc.dev@protonmail.com', icon: <Mail size={14} strokeWidth={3} />, color: '#60A5FA' },
      { category: 'email', label: 'Alternate', value: 'cyberadmin@yahoo.com (from forum leak)', icon: <Mail size={14} strokeWidth={3} />, color: '#F87171' },
      { category: 'domain', label: 'Company Domain', value: 'techcorp.example (A: 203.0.113.0/24)', icon: <Globe size={14} strokeWidth={3} />, color: '#4ADE80' },
      { category: 'domain', label: 'Personal Site', value: 'alexchen.dev (NS: cloudflare)', icon: <Globe size={14} strokeWidth={3} />, color: '#4ADE80' },
      { category: 'domain', label: 'Certificate Transparency', value: 'Found 8 certs for *.techcorp.example', icon: <Lock size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'records', label: 'Employment', value: 'TechCorp Inc. (2020-present), NetSys LLC (2017-2020)', icon: <FileText size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'records', label: 'Skills', value: 'AWS, Linux, Python, Docker, Kubernetes', icon: <FileText size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'records', label: 'Education', value: 'BS Computer Science, State University', icon: <FileText size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'records', label: 'Location', value: 'Austin, TX (from LinkedIn)', icon: <MapPin size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'images', label: 'Profile Photos', value: 'GitHub avatar found on Gravatar too', icon: <Image size={14} strokeWidth={3} />, color: '#F472B6' },
      { category: 'images', label: 'Conference Photo', value: 'DEF CON 2023 - name badge visible', icon: <Image size={14} strokeWidth={3} />, color: '#F87171' },
      { category: 'images', label: 'Screenshot Leak', value: 'Terminal screenshot shows internal IP range', icon: <Image size={14} strokeWidth={3} />, color: '#F87171' },
    ],
  },
  {
    username: 'GhostHacker',
    displayName: 'Ghost',
    description: 'Hard target - minimal footprint, but still traces exist',
    color: '#FACC15',
    avatar: 'GH',
    dataPoints: [
      { category: 'social', label: 'GitHub', value: 'GhostHacker99 (12 repos, private)', icon: SOCIAL_ICONS['GitHub'], color: '#7C3AED' },
      { category: 'social', label: 'Twitter (Deleted)', value: '@GhostHacker99 (archived on Wayback)', icon: SOCIAL_ICONS['Twitter'], color: '#60A5FA' },
      { category: 'social', label: 'Hacker News', value: 'ghosthckr (47 comments, 12 submissions)', icon: <Users size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'social', label: 'YouTube', value: 'GhostSec (channel, 2 videos uploaded)', icon: SOCIAL_ICONS['YouTube'], color: '#F87171' },
      { category: 'email', label: 'Found Email', value: 'ghost@securemail.example (from commit log)', icon: <Mail size={14} strokeWidth={3} />, color: '#60A5FA' },
      { category: 'email', label: 'Breached Email', value: 'ghosthacker99@mail.ru (Have I Been Pwned)', icon: <Mail size={14} strokeWidth={3} />, color: '#F87171' },
      { category: 'domain', label: 'Personal Domain', value: 'ghostsec.example (privacy protected WHOIS)', icon: <Globe size={14} strokeWidth={3} />, color: '#4ADE80' },
      { category: 'domain', label: 'Pastebin', value: '3 pastes linked to username (2 deleted)', icon: <FileText size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'records', label: 'Writing Style', value: 'Uses British spelling (colour, analyse)', icon: <FileText size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'records', label: 'Timezone Analysis', value: 'Posts cluster around UTC+0 (UK hours)', icon: <Calendar size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'records', label: 'Programming', value: 'Python, Go, Rust (from GitHub repos)', icon: <FileText size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'records', label: 'Interests', value: 'CTF competitions, lockpicking, radio', icon: <FileText size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'records', label: 'OPSEC Fail', value: 'Used same avatar hash on 2 forums', icon: <Lock size={14} strokeWidth={3} />, color: '#F87171' },
      { category: 'images', label: 'Avatar', value: 'Custom skull logo - found on 3 platforms', icon: <Image size={14} strokeWidth={3} />, color: '#F472B6' },
      { category: 'images', label: 'YouTube Thumbnail', value: 'EXIF: Created with GIMP 2.10 on Linux', icon: <Image size={14} strokeWidth={3} />, color: '#FACC15' },
      { category: 'images', label: 'Screenshot Analysis', value: 'Desktop shows timezone: Europe/London', icon: <Image size={14} strokeWidth={3} />, color: '#F87171' },
      { category: 'images', label: 'Photo Background', value: 'Landmark identified: London Eye visible', icon: <Image size={14} strokeWidth={3} />, color: '#F87171' },
      { category: 'images', label: 'Embedded QR', value: 'Video frame 234 contains QR to pastebin', icon: <Image size={14} strokeWidth={3} />, color: '#F87171' },
    ],
  },
];

const SCAN_STEPS = [
  { label: 'Searching social platforms...', duration: 800 },
  { label: 'Checking email databases...', duration: 700 },
  { label: 'Analyzing domain records...', duration: 900 },
  { label: 'Querying public records...', duration: 600 },
  { label: 'Scanning image metadata...', duration: 1000 },
];

export default function OSINTScanner({ onScoreChange }: Props) {
  const [usernameInput, setUsernameInput] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [foundData, setFoundData] = useState<DataPoint[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<DataCategory | null>(null);
  const [showEducational, setShowEducational] = useState(true);

  // Use ref to track totalScore to avoid effect restart storms
  const totalScoreRef = useRef(0);
  const bonusAwardedRef = useRef(false);
  const targetRef = useRef(selectedTarget);

  // Keep refs in sync
  useEffect(() => {
    totalScoreRef.current = totalScore;
  }, [totalScore]);

  useEffect(() => {
    targetRef.current = selectedTarget;
  }, [selectedTarget]);

  const target = TARGETS[selectedTarget];

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanComplete(false);
    setScanProgress(0);
    setFoundData([]);
    setSelectedCategory(null);
    setScanStep('');
  };

  const resetGame = () => {
    setIsScanning(false);
    setScanComplete(false);
    setScanProgress(0);
    setScanStep('');
    setFoundData([]);
    setSelectedCategory(null);
    setTotalScore(0);
    totalScoreRef.current = 0;
    setScanCount(0);
    bonusAwardedRef.current = false;
    onScoreChange(0);
  };

  useEffect(() => {
    if (!isScanning) return;

    const allData = target.dataPoints;
    let currentStep = 0;
    let dataIdx = 0;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const advanceStep = () => {
      if (currentStep >= SCAN_STEPS.length) {
        setIsScanning(false);
        setScanComplete(true);
        setScanCount(c => c + 1);
        // Use functional update and ref for score
        const newScore = totalScoreRef.current + allData.length * 10 + 10;
        const clampedScore = Math.min(100, newScore);
        totalScoreRef.current = clampedScore;
        setTotalScore(clampedScore);
        onScoreChange(clampedScore);
        return;
      }

      const step = SCAN_STEPS[currentStep];
      setScanStep(step.label);

      const stepTimer = setTimeout(() => {
        const dataPerStep = Math.ceil(allData.length / SCAN_STEPS.length);
        const startIdx = currentStep * dataPerStep;
        const endIdx = Math.min(startIdx + dataPerStep, allData.length);
        const newData = allData.slice(startIdx, endIdx);

        setFoundData(prev => [...prev, ...newData]);
        setScanProgress(Math.round(((currentStep + 1) / SCAN_STEPS.length) * 100));
        dataIdx = endIdx;
        currentStep++;
        advanceStep();
      }, step.duration);

      timers.push(stepTimer);
    };

    advanceStep();

    return () => timers.forEach(clearTimeout);
    // Only depend on isScanning and target - NOT totalScore to avoid restart storms
  }, [isScanning, target, onScoreChange]);

  const getCategoryCount = (cat: DataCategory) => foundData.filter(d => d.category === cat).length;
  const categories = Object.keys(CATEGORY_CONFIG) as DataCategory[];

  return (
    <div className="flex flex-col gap-3 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <UserSearch size={28} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">OSINT Scanner</h2>
      </div>

      {/* Educational Banner */}
      <AnimatePresence>
        {showEducational && (
          <motion.div
            initial={{ scale: 0.9, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -10 }}
            className="bg-blue-info/20 rounded-2xl border-4 border-black p-3 card-shadow relative"
          >
            <button
              onClick={() => setShowEducational(false)}
              className="absolute top-2 right-2 text-blue-700 hover:scale-110 transition-transform"
            >
              <XCircle size={16} strokeWidth={3} />
            </button>
            <div className="flex items-start gap-2">
              <Info size={18} strokeWidth={3} className="text-blue-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-nunito text-xs font-bold text-blue-800">
                  What is OSINT? Open Source Intelligence (OSINT) is collecting information from publicly available sources.
                </p>
                <p className="font-nunito text-[10px] text-blue-700 mt-1">
                  Every photo, social post, and public record leaves a digital footprint. Security researchers use OSINT to understand what information attackers can find about a target. Each data point found is worth +10 points.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top: Input + Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border-4 border-black p-4 card-shadow">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={20} strokeWidth={3} className="text-purple-primary" />
          <span className="font-nunito text-sm font-bold text-purple-dark">Target:</span>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder={target.username}
            className="flex-1 min-w-[120px] px-3 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-sm text-purple-dark focus:outline-none focus:border-purple-primary"
          />
        </div>

        <button
          onClick={startScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-success border-[3px] border-black rounded-full font-nunito font-bold text-sm text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed card-shadow"
        >
          {isScanning ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Sparkles size={16} strokeWidth={3} />
            </motion.div>
          ) : (
            <Play size={16} strokeWidth={3} />
          )}
          {isScanning ? 'INVESTIGATING...' : 'INVESTIGATE'}
        </button>

        <button
          onClick={() => {
            const data = foundData.map(d => `[${d.category}] ${d.label}: ${d.value}`).join('\n');
            const blob = new Blob([`OSINT Report\nTarget: ${target.username}\n\n${data}`], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `osint-${target.username}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          disabled={!scanComplete}
          className="flex items-center gap-1 px-3 py-2 bg-blue-info border-[3px] border-black rounded-full font-nunito font-bold text-xs text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} strokeWidth={3} />
          Report
        </button>

        <button
          onClick={resetGame}
          className="flex items-center gap-1 px-3 py-2 bg-purple-pale border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:scale-105 transition-transform"
        >
          <RotateCcw size={14} strokeWidth={3} />
          Reset
        </button>
      </div>

      {/* Targets */}
      <div className="flex flex-wrap gap-2">
        {TARGETS.map((t, i) => (
          <button
            key={i}
            onClick={() => !isScanning && setSelectedTarget(i)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-[3px] border-black font-nunito text-xs font-bold transition-all hover:scale-105 ${
              selectedTarget === i
                ? 'text-white'
                : 'bg-white text-purple-dark hover:bg-purple-pale'
            }`}
            style={selectedTarget === i ? { backgroundColor: t.color } : {}}
          >
            <div className="w-6 h-6 bg-white/20 rounded-full border-2 border-black flex items-center justify-center">
              <span className="font-mono text-[9px] font-bold">{t.avatar}</span>
            </div>
            <div className="text-left">
              <div>{t.username}</div>
              <div className="font-nunito text-[9px] opacity-70">{t.dataPoints.length} data points</div>
            </div>
          </button>
        ))}
      </div>

      {/* Progress */}
      {isScanning && (
        <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="font-nunito text-xs font-bold text-purple-dark flex items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Sparkles size={14} strokeWidth={3} className="text-purple-primary" />
              </motion.div>
              {scanStep}
            </span>
            <span className="font-mono text-xs text-purple-primary">{scanProgress}%</span>
          </div>
          <div className="h-3 bg-purple-pale rounded-full border-2 border-black overflow-hidden">
            <motion.div
              className="h-full bg-purple-primary rounded-full"
              style={{ width: `${scanProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Data Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const count = getCategoryCount(cat);
          const items = foundData.filter(d => d.category === cat);
          const totalForCat = target.dataPoints.filter(d => d.category === cat).length;

          return (
            <motion.div
              key={cat}
              initial={false}
              animate={selectedCategory === cat ? { scale: 1.02 } : { scale: 1 }}
              className={`bg-white rounded-2xl border-4 border-black p-3 card-shadow cursor-pointer hover:scale-[1.02] transition-transform ${
                selectedCategory === cat ? 'ring-2 ring-purple-primary ring-offset-2' : ''
              }`}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${config.bgColor} rounded-lg border-[3px] border-black flex items-center justify-center`}>
                    {config.icon}
                  </div>
                  <div>
                    <h3 className="font-fredoka text-xs text-purple-dark">{config.label}</h3>
                    <span className="font-nunito text-[9px] text-purple-light">{count}/{totalForCat} found</span>
                  </div>
                </div>
                {count === totalForCat && count > 0 && (
                  <CheckCircle size={16} strokeWidth={3} className="text-green-success" />
                )}
                {count < totalForCat && count > 0 && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles size={16} strokeWidth={3} className="text-yellow-accent" />
                  </motion.div>
                )}
              </div>

              {/* Gathering indicator */}
              {isScanning && count === 0 && (
                <div className="flex items-center gap-1 py-4 justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <Search size={14} strokeWidth={3} className="text-purple-light" />
                  </motion.div>
                  <span className="font-nunito text-[10px] text-purple-light">Gathering data...</span>
                </div>
              )}

              {/* Data Items */}
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                <AnimatePresence>
                  {items.map((item, idx) => (
                    <motion.div
                      key={`${item.label}-${idx}`}
                      initial={{ x: -20, scale: 0.8 }}
                      animate={{ x: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15, delay: idx * 0.05 }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg border-2 border-black bg-purple-pale/50 hover:bg-purple-pale transition-colors"
                    >
                      <div style={{ color: item.color }}>{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-nunito text-[10px] font-bold text-purple-dark truncate">{item.label}</div>
                        <div className="font-mono text-[9px] text-purple-light truncate">{item.value}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Expanded Category Detail */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ y: 20, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white rounded-2xl border-4 border-black p-4 card-shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {CATEGORY_CONFIG[selectedCategory].icon}
                <h3 className="font-fredoka text-lg text-purple-dark">
                  {CATEGORY_CONFIG[selectedCategory].label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="w-8 h-8 bg-red-alert rounded-full border-[3px] border-black flex items-center justify-center hover:scale-110 transition-transform"
              >
                <XCircle size={16} strokeWidth={3} className="text-white" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {foundData
                .filter(d => d.category === selectedCategory)
                .map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ x: -10 }}
                    animate={{ x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-2 p-3 rounded-xl border-2 border-black bg-purple-pale/50"
                  >
                    <div style={{ color: item.color }} className="mt-0.5">{item.icon}</div>
                    <div>
                      <div className="font-nunito text-xs font-bold text-purple-dark">{item.label}</div>
                      <div className="font-mono text-xs text-purple-light mt-0.5">{item.value}</div>
                    </div>
                  </motion.div>
                ))}
            </div>
            <div className="mt-3 flex items-center gap-1 text-purple-light">
              <Info size={12} strokeWidth={3} />
              <span className="font-nunito text-[10px]">
                {selectedCategory === 'social' && 'Social profiles reveal personal interests, connections, and habits. Even private accounts leak metadata!'}
                {selectedCategory === 'email' && 'Email addresses connect accounts across services. Breached emails appear in public databases.'}
                {selectedCategory === 'domain' && 'Domain associations show digital infrastructure. Certificate transparency logs reveal all subdomains!'}
                {selectedCategory === 'records' && 'Public records include job history, education, location data - all freely available.'}
                {selectedCategory === 'images' && 'Photos contain EXIF data: GPS coordinates, camera model, creation date, and editing software.'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score */}
      <div className="bg-purple-dark rounded-2xl border-4 border-black p-3">
        <div className="flex items-center justify-between">
          <span className="font-nunito text-xs font-bold text-purple-lighter">Total Score</span>
          <span className="font-mono text-xl font-bold text-yellow-accent">{totalScore}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-nunito text-[9px] text-purple-lighter">Investigations: {scanCount}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3].map(s => (
              <Star key={s} size={12} strokeWidth={2} className={scanCount >= s ? 'text-yellow-accent' : 'text-purple-light'} fill={scanCount >= s ? '#FACC15' : 'transparent'} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
