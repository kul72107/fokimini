import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, MapPin, Heart, Users, Camera, MessageCircle,
  Globe, ShieldAlert, ShieldCheck, Trophy, RotateCcw, Sparkles,
  AlertTriangle, Check, X, Eye, Lock, FileText, Link2, Clock,
  Mail, Phone, Briefcase, GraduationCap, Calendar, Star, Wifi
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

interface DataPoint {
  id: string;
  category: 'photo' | 'interest' | 'friend' | 'location' | 'habit' | 'work' | 'contact';
  label: string;
  value: string;
  source: string;
  risk: 'low' | 'medium' | 'high';
  found: boolean;
}

interface ProfileTarget {
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  dataPoints: DataPoint[];
}

const TARGET_PROFILES: ProfileTarget[] = [
  {
    username: 'sarah_gamer99',
    displayName: 'Sarah Chen',
    avatar: 'SC',
    bio: 'Esports fanatic | Coffee addict | NYC',
    dataPoints: [
      { id: 'p1', category: 'photo', label: 'Profile Photo', value: 'Public selfie at Central Park', source: 'Social Media', risk: 'low', found: false },
      { id: 'p2', category: 'photo', label: 'Vacation Photos', value: 'Beach photos from Miami - geotagged', source: 'Social Media', risk: 'medium', found: false },
      { id: 'p3', category: 'interest', label: 'Gaming', value: 'Plays Valorant, League daily 8pm-2am', source: 'Forums', risk: 'low', found: false },
      { id: 'p4', category: 'interest', label: 'Coffee Shops', value: 'Frequents Starbucks on 5th Ave', source: 'Social Media', risk: 'medium', found: false },
      { id: 'p5', category: 'friend', label: 'Best Friend', value: 'Connected to @jessica_l - visible', source: 'Social Media', risk: 'low', found: false },
      { id: 'p6', category: 'friend', label: 'Family', value: 'Mom tagged in photos: Linda Chen', source: 'Social Media', risk: 'medium', found: false },
      { id: 'p7', category: 'location', label: 'Home City', value: 'New York, Manhattan', source: 'Public Records', risk: 'medium', found: false },
      { id: 'p8', category: 'location', label: 'School', value: 'Attends Lincoln High School', source: 'Public Records', risk: 'low', found: false },
      { id: 'p9', category: 'habit', label: 'Daily Routine', value: 'Posts coffee check-in every morning at 8:30 AM', source: 'Social Media', risk: 'high', found: false },
      { id: 'p10', category: 'habit', label: 'Birthday', value: 'March 15, 2009 - public on profile', source: 'Social Media', risk: 'high', found: false },
      { id: 'p11', category: 'contact', label: 'Email Pattern', value: 'Uses sarahchen99@... pattern', source: 'Forums', risk: 'high', found: false },
      { id: 'p12', category: 'work', label: 'Part-time Job', value: 'Works at GameStop weekends', source: 'Social Media', risk: 'low', found: false },
    ],
  },
  {
    username: 'mike_builder',
    displayName: 'Mike Rodriguez',
    avatar: 'MR',
    bio: 'Builder | Dog dad | Austin TX | Go Longhorns!',
    dataPoints: [
      { id: 'm1', category: 'photo', label: 'Dog Photos', value: 'Golden retriever named "Max" - visible', source: 'Social Media', risk: 'low', found: false },
      { id: 'm2', category: 'photo', label: 'License Plate', value: 'Car plate visible in parking photo', source: 'Photo Metadata', risk: 'high', found: false },
      { id: 'm3', category: 'interest', label: 'Sports', value: 'UT Longhorns season ticket holder', source: 'Social Media', risk: 'low', found: false },
      { id: 'm4', category: 'interest', label: 'Restaurants', value: 'Reviews on Yelp: Tacodeli, Franklin BBQ', source: 'Forums', risk: 'low', found: false },
      { id: 'm5', category: 'friend', label: 'Coworkers', value: 'Connected to 12 construction workers', source: 'Social Media', risk: 'medium', found: false },
      { id: 'm6', category: 'location', label: 'Neighborhood', value: 'Posts from East Austin consistently', source: 'Social Media', risk: 'medium', found: false },
      { id: 'm7', category: 'location', label: 'Work Site', value: 'Construction site photos show building address', source: 'Photo Metadata', risk: 'high', found: false },
      { id: 'm8', category: 'habit', label: 'Gym Routine', value: 'Checks in at Golds Gym MWF 6am', source: 'Social Media', risk: 'medium', found: false },
      { id: 'm9', category: 'habit', label: 'Pet Info', value: 'Dog tag has phone number visible', source: 'Photo Metadata', risk: 'high', found: false },
      { id: 'm10', category: 'contact', label: 'Phone', value: 'Number visible in marketplace listing', source: 'Public Records', risk: 'high', found: false },
      { id: 'm11', category: 'work', label: 'Company', value: 'Works for AustinBuild Co.', source: 'Public Records', risk: 'low', found: false },
      { id: 'm12', category: 'work', label: 'Schedule', value: 'Regular work hours posted: 7am-4pm', source: 'Social Media', risk: 'medium', found: false },
    ],
  },
];

const CATEGORY_CONFIG: Record<string, { icon: typeof User; color: string; bg: string; label: string }> = {
  photo: { icon: Camera, color: '#F472B6', bg: '#FCE7F3', label: 'Photos' },
  interest: { icon: Heart, color: '#F87171', bg: '#FEE2E2', label: 'Interests' },
  friend: { icon: Users, color: '#60A5FA', bg: '#DBEAFE', label: 'Connections' },
  location: { icon: MapPin, color: '#4ADE80', bg: '#DCFCE7', label: 'Locations' },
  habit: { icon: Clock, color: '#FACC15', bg: '#FEF9C3', label: 'Habits' },
  work: { icon: Briefcase, color: '#A78BFA', bg: '#F5F3FF', label: 'Work' },
  contact: { icon: Mail, color: '#F472B6', bg: '#FCE7F3', label: 'Contact' },
};

const SOURCES = [
  { id: 'social', label: 'Social Media', icon: Globe, color: '#60A5FA' },
  { id: 'forums', label: 'Forums', icon: MessageCircle, color: '#A78BFA' },
  { id: 'records', label: 'Public Records', icon: FileText, color: '#4ADE80' },
  { id: 'metadata', label: 'Photo Metadata', icon: Camera, color: '#F472B6' },
];

type SearchPhase = 'idle' | 'searching' | 'found';

export default function SocialProfiler({ onScoreChange }: Props) {
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(TARGET_PROFILES[0].dataPoints);
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const [score, setScore] = useState(0);
  const [dataFound, setDataFound] = useState(0);
  const [risksFound, setRisksFound] = useState(0);
  const [searchSource, setSearchSource] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef = useRef(0);

  const profile = TARGET_PROFILES[selectedProfile];
  const foundPoints = dataPoints.filter(dp => dp.found);
  const highRiskFound = foundPoints.filter(dp => dp.risk === 'high');

  // Keep score ref in sync
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = Math.min(100, prev + points);
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  const searchSourceAction = (sourceId: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setSearchSource(sourceId);
    setPhase('searching');

    // Capture current dataPoints and profile index to avoid stale closure
    const currentProfileIndex = selectedProfile;
    const currentDataPoints = TARGET_PROFILES[currentProfileIndex].dataPoints;

    // Simulate search delay
    timeoutRef.current = setTimeout(() => {
      const sourceLabel = SOURCES.find(s => s.id === sourceId)?.label || '';
      // Use functional update to ensure we're working with latest state
      setDataPoints(prev => {
        // Only apply if profile hasn't changed
        if (selectedProfile !== currentProfileIndex) return prev;
        const found = prev.filter(dp => dp.source === sourceLabel && !dp.found);
        if (found.length === 0) return prev;

        const updated = prev.map(dp => {
          if (dp.source === sourceLabel && !dp.found) {
            return { ...dp, found: true };
          }
          return dp;
        });

        setDataFound(prevFound => prevFound + found.length);
        const riskPoints = found.filter(f => f.risk === 'high').length;
        if (riskPoints > 0) {
          setRisksFound(prevRisks => prevRisks + riskPoints);
          // Use scoreRef for immediate score calculation
          const pointsToAdd = 15 * found.length + 50 * riskPoints;
          setScore(prevScore => {
            const next = Math.min(100, prevScore + pointsToAdd);
            onScoreChange(next);
            return next;
          });
        } else {
          const pointsToAdd = 15 * found.length;
          setScore(prevScore => {
            const next = Math.min(100, prevScore + pointsToAdd);
            onScoreChange(next);
            return next;
          });
        }

        return updated;
      });

      setPhase('found');
      timeoutRef.current = setTimeout(() => {
        setPhase('idle');
        timeoutRef.current = null;
      }, 1500);
    }, 1500);
  };

  const selectProfile = (index: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setSelectedProfile(index);
    setDataPoints(TARGET_PROFILES[index].dataPoints.map(dp => ({ ...dp, found: false })));
    setPhase('idle');
    setDataFound(0);
    setRisksFound(0);
    setSearchSource(null);
    setShowConnections(false);
    setScore(0);
    scoreRef.current = 0;
    onScoreChange(0);
  };

  const reset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDataPoints(profile.dataPoints.map(dp => ({ ...dp, found: false })));
    setPhase('idle');
    setDataFound(0);
    setRisksFound(0);
    setSearchSource(null);
    setScore(0);
    scoreRef.current = 0;
    onScoreChange(0);
  };

  const categories = Object.keys(CATEGORY_CONFIG);

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-12 h-12 bg-purple-primary rounded-2xl border-4 border-black flex items-center justify-center"
          >
            <Search size={24} color="#FFFFFF" strokeWidth={3} />
          </motion.div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">Social Profiler</h2>
            <p className="text-sm text-purple-dark font-nunito">Discover digital footprint dangers!</p>
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
            className="bg-blue-info px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2 text-white"
          >
            <Eye size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{dataFound}</span>
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

      {/* Profile Selector */}
      <div className="flex gap-2 mb-4">
        {TARGET_PROFILES.map((p, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => selectProfile(i)}
            className={`flex-1 px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-colors ${
              selectedProfile === i ? 'bg-purple-primary text-white' : 'bg-white text-purple-darker'
            }`}
          >
            <User size={16} strokeWidth={3} />
            @{p.username}
          </motion.button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
          <div className="text-center mb-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: '#A78BFA' }}
            >
              <span className="font-fredoka text-xl text-white">{profile.avatar}</span>
            </motion.div>
            <h3 className="font-fredoka text-lg text-purple-darker">{profile.displayName}</h3>
            <p className="font-mono text-xs text-purple-dark">@{profile.username}</p>
            <p className="text-xs text-purple-dark mt-1">{profile.bio}</p>
          </div>

          {/* Stats */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between bg-purple-pale rounded-xl border-2 border-black px-3 py-2">
              <span className="flex items-center gap-1 text-xs font-nunito text-purple-dark">
                <Eye size={12} strokeWidth={3} /> Data Found
              </span>
              <span className="font-fredoka text-sm">{foundPoints.length}/{dataPoints.length}</span>
            </div>
            <div className="flex items-center justify-between bg-red-50 rounded-xl border-2 border-red-alert px-3 py-2">
              <span className="flex items-center gap-1 text-xs font-nunito text-red-600">
                <ShieldAlert size={12} strokeWidth={3} /> High Risk
              </span>
              <span className="font-fredoka text-sm text-red-600">{highRiskFound.length}</span>
            </div>
          </div>

          {/* Connection Web Toggle */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowConnections(!showConnections)}
            className={`w-full px-4 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center justify-center gap-2 mb-3 ${
              showConnections ? 'bg-blue-info text-white' : 'bg-purple-pale text-purple-darker'
            }`}
          >
            <Link2 size={14} strokeWidth={3} />
            {showConnections ? 'Hide' : 'Show'} Connection Web
          </motion.button>

          {/* Privacy Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`w-full px-4 py-2 rounded-xl border-[3px] border-black font-fredoka text-xs flex items-center justify-center gap-2 ${
              privacyMode ? 'bg-green-success' : 'bg-purple-pale text-purple-darker'
            }`}
          >
            <Lock size={14} strokeWidth={3} />
            {privacyMode ? 'Privacy Tips ON' : 'Show Privacy Tips'}
          </motion.button>
        </div>

        {/* Search & Data Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Sources */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-base text-purple-darker mb-3 flex items-center gap-2">
              <Wifi size={18} strokeWidth={3} />
              Data Sources
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SOURCES.map((source) => {
                const Icon = source.icon;
                const hasData = dataPoints.some(dp => dp.source === source.label && !dp.found);
                return (
                  <motion.button
                    key={source.id}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => searchSourceAction(source.id)}
                    disabled={phase === 'searching' || !hasData}
                    className={`rounded-xl border-[3px] border-black p-3 text-center transition-colors ${
                      phase === 'searching' && searchSource === source.id
                        ? 'bg-yellow-accent'
                        : !hasData
                          ? 'bg-gray-100 opacity-50'
                          : 'bg-purple-pale hover:bg-purple-lighter'
                    }`}
                  >
                    <motion.div
                      animate={phase === 'searching' && searchSource === source.id ? { rotate: 360 } : {}}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Icon size={24} strokeWidth={3} style={{ color: source.color }} className="mx-auto mb-1" />
                    </motion.div>
                    <p className="font-fredoka text-xs text-purple-darker">{source.label}</p>
                    <p className="text-[9px] text-purple-dark">
                      {dataPoints.filter(dp => dp.source === source.label && dp.found).length}/{dataPoints.filter(dp => dp.source === source.label).length} found
                    </p>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {phase === 'found' && searchSource && (
                <motion.div
                  initial={{ height: 0, scale: 0.9 }}
                  animate={{ height: 'auto', scale: 1 }}
                  exit={{ height: 0, scale: 0.9 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="bg-green-50 rounded-xl border-2 border-green-success p-3 flex items-center gap-2">
                    <Check size={18} strokeWidth={3} className="text-green-success" />
                    <p className="font-fredoka text-xs text-green-700">
                      Found {dataPoints.filter(dp => dp.source === SOURCES.find(s => s.id === searchSource)?.label && dp.found).length} new data points!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Connection Web */}
          <AnimatePresence>
            {showConnections && (
              <motion.div
                initial={{ height: 0, scale: 0.9 }}
                animate={{ height: 'auto', scale: 1 }}
                exit={{ height: 0, scale: 0.9 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
                  <h3 className="font-fredoka text-base text-purple-darker mb-3 flex items-center gap-2">
                    <Link2 size={18} strokeWidth={3} />
                    Connection Web
                  </h3>
                  <div className="relative h-48 bg-purple-pale rounded-xl border-2 border-black overflow-hidden">
                    {/* Center node */}
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-purple-primary rounded-full border-[3px] border-black flex items-center justify-center z-10"
                    >
                      <User size={20} strokeWidth={3} color="#FFF" />
                    </motion.div>
                    {/* Connected nodes */}
                    {foundPoints.slice(0, 6).map((dp, i) => {
                      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                      const x = 50 + Math.cos(angle) * 35;
                      const y = 50 + Math.sin(angle) * 35;
                      const cfg = CATEGORY_CONFIG[dp.category];
                      const CatIcon = cfg.icon;
                      return (
                        <motion.div
                          key={dp.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                          className="absolute w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center z-10"
                        >
                          <div style={{ backgroundColor: cfg.color }} className="w-full h-full rounded-full flex items-center justify-center">
                            <CatIcon size={16} strokeWidth={3} color="#FFF" />
                          </div>
                          {/* Label below */}
                          <span className="absolute -bottom-5 whitespace-nowrap text-[8px] font-fredoka text-purple-darker bg-white px-1 rounded border border-black">
                            {dp.label}
                          </span>
                        </motion.div>
                      );
                    })}
                    {/* Connection lines */}
                    {foundPoints.slice(0, 6).map((dp, i) => {
                      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                      const x2 = 50 + Math.cos(angle) * 35;
                      const y2 = 50 + Math.sin(angle) * 35;
                      return (
                        <svg key={`line-${dp.id}`} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                          <motion.line
                            x1="50%"
                            y1="50%"
                            x2={`${x2}%`}
                            y2={`${y2}%`}
                            stroke="#A78BFA"
                            strokeWidth="2"
                            strokeDasharray="4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                          />
                        </svg>
                      );
                    })}
                    {foundPoints.length === 0 && (
                      <p className="absolute inset-0 flex items-center justify-center text-xs font-nunito text-purple-dark">
                        Search sources to reveal connections
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Found Data Points */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-base text-purple-darker mb-3 flex items-center gap-2">
              <Sparkles size={18} strokeWidth={3} />
              Discovered Data
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {categories.map(cat => {
                const catPoints = foundPoints.filter(dp => dp.category === cat);
                const cfg = CATEGORY_CONFIG[cat];
                const CatIcon = cfg.icon;
                if (catPoints.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center" style={{ backgroundColor: cfg.color }}>
                        <CatIcon size={12} strokeWidth={3} color="#FFF" />
                      </div>
                      <span className="font-fredoka text-xs text-purple-darker">{cfg.label}</span>
                    </div>
                    <div className="space-y-1 ml-8">
                      {catPoints.map(dp => (
                        <motion.div
                          key={dp.id}
                          initial={{ x: -20 }}
                          animate={{ x: 0 }}
                          className={`rounded-lg border-2 border-black px-3 py-2 ${
                            dp.risk === 'high' ? 'bg-red-50' : dp.risk === 'medium' ? 'bg-yellow-50' : 'bg-purple-pale'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-fredoka text-xs text-purple-darker">{dp.label}</span>
                            <div className="flex items-center gap-1">
                              {dp.risk === 'high' && (
                                <span className="flex items-center gap-1 text-[9px] font-fredoka text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-alert">
                                  <AlertTriangle size={10} strokeWidth={3} />
                                  HIGH RISK
                                </span>
                              )}
                              {privacyMode && dp.risk === 'high' && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-[9px] font-fredoka text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-success flex items-center gap-1"
                                >
                                  <Lock size={10} strokeWidth={3} />
                                  Make Private!
                                </motion.span>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] font-nunito text-purple-dark">{dp.value}</p>
                          <p className="text-[9px] font-mono text-purple-light">Source: {dp.source}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {foundPoints.length === 0 && (
                <div className="text-center py-8">
                  <Search size={32} strokeWidth={3} className="text-purple-light mx-auto mb-2" />
                  <p className="font-fredoka text-sm text-purple-dark">No data found yet</p>
                  <p className="text-xs font-nunito text-purple-light">Click on data sources above to start searching</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Education Panel */}
      <motion.div
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        className="mt-4 bg-white rounded-2xl border-4 border-black p-4 card-shadow"
      >
        <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
          <ShieldCheck size={18} strokeWidth={3} />
          Digital Footprint Safety
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { title: 'Oversharing', icon: <Eye size={20} strokeWidth={3} />, color: '#F87171', tip: 'Posting your location, routines, or personal info makes you an easy target.' },
            { title: 'Privacy Settings', icon: <Lock size={20} strokeWidth={3} />, color: '#60A5FA', tip: 'Set your profiles to private. Only friends should see your posts.' },
            { title: 'Photo Metadata', icon: <Camera size={20} strokeWidth={3} />, color: '#F472B6', tip: 'Photos contain hidden data: GPS location, camera info, timestamps!' },
            { title: 'Think Before Posting', icon: <ShieldCheck size={20} strokeWidth={3} />, color: '#4ADE80', tip: 'Once online, always online. Future employers and strangers can find it.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-purple-pale rounded-xl border-[3px] border-black p-3"
            >
              <div className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center mb-2" style={{ backgroundColor: item.color }}>
                {item.icon}
              </div>
              <p className="font-fredoka text-xs text-purple-darker">{item.title}</p>
              <p className="text-[10px] font-nunito text-purple-dark mt-1">{item.tip}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
