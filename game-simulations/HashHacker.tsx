import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash, Link2, Zap, Sparkles, Trophy, ChevronRight, RotateCcw,
  Check, X, Lock, Unlock, ArrowRight, ArrowLeft, Shuffle,
  FlaskConical, Droplets, Eye, AlertTriangle, Settings
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type HashAlgo = 'md5' | 'sha1' | 'sha256';
type GameMode = 'menu' | 'matching' | 'oneway' | 'salting' | 'levelComplete' | 'allComplete';

interface DataItem {
  id: number;
  text: string;
  hash: string;
  algo: HashAlgo;
  salt?: string;
}

interface MatchPair {
  dataId: number | null;
  hashId: number | null;
}

// Simple deterministic hash function for the game (not cryptographically secure - just for education)
function simpleHash(input: string, algo: HashAlgo): string {
  let hash = 0;
  const seed = algo === 'md5' ? 31 : algo === 'sha1' ? 53 : 97;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char * seed) & 0xffffffff;
  }

  const prefix = algo === 'md5' ? 'd4' : algo === 'sha1' ? 'a9' : 'ef';
  const hexChars = '0123456789abcdef';
  let result = prefix;
  const hashAbs = Math.abs(hash);
  for (let i = 0; i < 30; i++) {
    result += hexChars[(hashAbs + i * seed) % 16];
  }
  return result;
}

function truncateHash(hash: string): string {
  return hash.slice(0, 8) + '...' + hash.slice(-4);
}

const MATCHING_DATA: Record<number, { items: { text: string; algo: HashAlgo }[] }> = {
  1: {
    items: [
      { text: 'password123', algo: 'sha256' },
      { text: 'hello', algo: 'sha256' },
      { text: 'cyberpaws', algo: 'sha256' },
    ],
  },
  2: {
    items: [
      { text: 'admin', algo: 'sha256' },
      { text: 'letmein', algo: 'sha256' },
      { text: 'password', algo: 'sha256' },
      { text: 'qwerty', algo: 'sha256' },
      { text: 'dragon', algo: 'sha256' },
    ],
  },
};

const SALTS = ['x7#K', 'm@9P', 'Z$2q', 'b!4R', 'Nw0&'];

function clampScore(val: number): number {
  return Math.min(100, Math.max(0, val));
}

export default function HashHacker({ onScoreChange }: Props) {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [hashAlgo, setHashAlgo] = useState<HashAlgo>('sha256');

  // Matching mode state
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [selectedData, setSelectedData] = useState<number | null>(null);
  const [selectedHash, setSelectedHash] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<MatchPair[]>([]);
  const [wrongPair, setWrongPair] = useState(false);

  // One-way mode state
  const [inputText, setInputText] = useState('');
  const [generatedHash, setGeneratedHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [showReverseWarning, setShowReverseWarning] = useState(false);

  // Salting mode state
  const [saltInput, setSaltInput] = useState('mypassword');
  const [selectedSalt, setSelectedSalt] = useState('');
  const [saltHash, setSaltHash] = useState('');
  const [unsaltedHash, setUnsaltedHash] = useState('');
  const [showSaltAnim, setShowSaltAnim] = useState(false);
  const [saltChallengeMode, setSaltChallengeMode] = useState(false);
  const [saltChallengeTarget, setSaltChallengeTarget] = useState('');
  const [saltSolved, setSaltSolved] = useState(false);

  // Refs for timeout cleanup
  const matchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongPairTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saltTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
      if (wrongPairTimeoutRef.current) clearTimeout(wrongPairTimeoutRef.current);
      if (saltTimeoutRef.current) clearTimeout(saltTimeoutRef.current);
    };
  }, []);

  const generateLevelData = useCallback((level: number) => {
    const config = MATCHING_DATA[level];
    if (!config) return;

    const items: DataItem[] = config.items.map((item, i) => ({
      id: i,
      text: item.text,
      hash: simpleHash(item.text, item.algo),
      algo: item.algo,
    }));

    setDataItems(items);
    setMatchedPairs([]);
    setSelectedData(null);
    setSelectedHash(null);
    setWrongPair(false);
  }, []);

  const startLevel = (level: number) => {
    setCurrentLevel(level);
    setGameMode('matching');
    generateLevelData(level);
  };

  const startGame = () => {
    setScore(0);
    onScoreChange(0);
    startLevel(1);
  };

  const startOneWay = () => {
    setGameMode('oneway');
    setInputText('');
    setGeneratedHash('');
    setShowReverseWarning(false);
  };

  const startSalting = () => {
    setGameMode('salting');
    setSaltInput('mypassword');
    setSelectedSalt('');
    setSaltHash('');
    setUnsaltedHash(simpleHash('mypassword', hashAlgo));
    setShowSaltAnim(false);
    setSaltChallengeMode(false);
    setSaltSolved(false);
  };

  const startSaltChallenge = () => {
    setSaltChallengeMode(true);
    setSaltSolved(false);
    // Pick a random salt
    const randomSalt = SALTS[Math.floor(Math.random() * SALTS.length)];
    setSelectedSalt(randomSalt);
    const target = simpleHash('mypassword' + randomSalt, hashAlgo);
    setSaltChallengeTarget(target);
    setSaltHash('');
  };

  // Hash generation with animation
  useEffect(() => {
    if (inputText.length > 0) {
      setIsHashing(true);
      const timer = setTimeout(() => {
        setGeneratedHash(simpleHash(inputText, hashAlgo));
        setIsHashing(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setGeneratedHash('');
      setIsHashing(false);
    }
  }, [inputText, hashAlgo]);

  // Handle data item click
  const handleDataClick = (id: number) => {
    if (matchedPairs.some((p) => p.dataId === id)) return;
    if (selectedData === id) {
      setSelectedData(null);
      return;
    }
    setSelectedData(id);
    // Use a ref for selectedHash to avoid stale closure
    setSelectedHash((prevSelectedHash) => {
      checkMatch(id, prevSelectedHash);
      return prevSelectedHash;
    });
  };

  // Handle hash click
  const handleHashClick = (id: number) => {
    if (matchedPairs.some((p) => p.hashId === id)) return;
    if (selectedHash === id) {
      setSelectedHash(null);
      return;
    }
    setSelectedHash(id);
    checkMatch(selectedData, id);
  };

  const checkMatch = (dataId: number | null, hashId: number | null) => {
    if (dataId === null || hashId === null) return;

    const dataItem = dataItems.find((d) => d.id === dataId);
    if (dataItem && dataItem.id === hashId) {
      // Correct match!
      const newPairs = [...matchedPairs, { dataId, hashId }];
      setMatchedPairs(newPairs);
      setSelectedData(null);
      setSelectedHash(null);

      // Use functional state update to avoid stale closure
      setScore((prevScore) => {
        const newScore = clampScore(prevScore + 20);
        onScoreChange(newScore);
        return newScore;
      });

      // Check if all matched
      if (newPairs.length === dataItems.length) {
        if (matchTimeoutRef.current) clearTimeout(matchTimeoutRef.current);
        matchTimeoutRef.current = setTimeout(() => {
          if (currentLevel < 2) {
            setGameMode('levelComplete');
          } else {
            setGameMode('allComplete');
          }
        }, 800);
      }
    } else {
      // Wrong match
      setWrongPair(true);
      if (wrongPairTimeoutRef.current) clearTimeout(wrongPairTimeoutRef.current);
      wrongPairTimeoutRef.current = setTimeout(() => {
        setWrongPair(false);
        setSelectedData(null);
        setSelectedHash(null);
      }, 600);
    }
  };

  const applySalt = (salt: string) => {
    setSelectedSalt(salt);
    setShowSaltAnim(true);
    if (saltTimeoutRef.current) clearTimeout(saltTimeoutRef.current);
    saltTimeoutRef.current = setTimeout(() => {
      const hash = simpleHash(saltInput + salt, hashAlgo);
      setSaltHash(hash);
      setShowSaltAnim(false);

      if (saltChallengeMode && hash === saltChallengeTarget) {
        setSaltSolved(true);
        setScore((prevScore) => {
          const newScore = clampScore(prevScore + 25);
          onScoreChange(newScore);
          return newScore;
        });
      }
    }, 600);
  };

  // Scrambled hashes for display
  const scrambledHashes = useMemo(() => {
    return [...dataItems].sort(() => Math.random() - 0.5);
  }, [dataItems]);

  // Menu screen
  if (gameMode === 'menu') {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="w-full max-w-lg bg-purple-dark rounded-2xl border-4 border-black p-6 flex flex-col items-center gap-3 card-shadow">
          <div className="relative">
            <Hash size={48} strokeWidth={3} className="text-yellow-accent" />
            <Zap size={20} strokeWidth={3} className="text-pink-accent absolute -top-1 -right-2" />
          </div>
          <h2 className="font-fredoka text-2xl text-white text-outline-sm">Hash Hacker</h2>
          <p className="font-nunito text-sm text-purple-lighter text-center">
            Discover the magic of hash functions! Match data to hashes, see one-way magic, and learn about salting!
          </p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <Link2 size={16} strokeWidth={3} className="text-green-success" />
              <span className="font-nunito text-xs text-purple-lighter">Match</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowRight size={16} strokeWidth={3} className="text-blue-info" />
              <span className="font-nunito text-xs text-purple-lighter">One-Way</span>
            </div>
            <div className="flex items-center gap-1">
              <FlaskConical size={16} strokeWidth={3} className="text-pink-accent" />
              <span className="font-nunito text-xs text-purple-lighter">Salt</span>
            </div>
          </div>
          <button
            onClick={startGame}
            className="mt-2 px-8 py-3 bg-green-success text-black border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Zap size={20} strokeWidth={3} />
            Start Learning
          </button>
        </div>

        {/* Mode Cards */}
        <div className="w-full max-w-lg grid grid-cols-3 gap-2">
          <button
            onClick={startGame}
            className="flex flex-col items-center gap-1 p-3 bg-white rounded-2xl border-4 border-black hover:bg-green-success/20 transition-colors card-shadow"
          >
            <Link2 size={24} strokeWidth={3} className="text-green-success" />
            <span className="font-nunito text-[10px] font-bold text-purple-dark">Match</span>
          </button>
          <button
            onClick={startOneWay}
            className="flex flex-col items-center gap-1 p-3 bg-white rounded-2xl border-4 border-black hover:bg-blue-info/20 transition-colors card-shadow"
          >
            <ArrowRight size={24} strokeWidth={3} className="text-blue-info" />
            <span className="font-nunito text-[10px] font-bold text-purple-dark">One-Way</span>
          </button>
          <button
            onClick={startSalting}
            className="flex flex-col items-center gap-1 p-3 bg-white rounded-2xl border-4 border-black hover:bg-pink-accent/20 transition-colors card-shadow"
          >
            <FlaskConical size={24} strokeWidth={3} className="text-pink-accent" />
            <span className="font-nunito text-[10px] font-bold text-purple-dark">Salt Lab</span>
          </button>
        </div>

        {/* What is Hashing */}
        <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4 card-shadow">
          <h3 className="font-fredoka text-lg text-purple-dark mb-2 text-center">What is a Hash?</h3>
          <p className="font-nunito text-xs text-purple-dark text-center mb-3">
            A hash function turns any text into a fixed-length fingerprint. It&apos;s a ONE-WAY street!
          </p>
          <div className="bg-purple-pale rounded-xl border-[3px] border-black p-3">
            <div className="flex items-center justify-center gap-2">
              <div className="bg-white border-2 border-black rounded-lg px-3 py-1">
                <span className="font-mono text-xs text-purple-dark">&quot;hello&quot;</span>
              </div>
              <ArrowRight size={20} strokeWidth={3} className="text-green-success" />
              <div className="bg-purple-dark border-2 border-black rounded-lg px-3 py-1">
                <span className="font-mono text-xs text-green-success">ef92b...</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="bg-purple-dark border-2 border-black rounded-lg px-3 py-1">
                <span className="font-mono text-xs text-red-alert">ef92b...</span>
              </div>
              <ArrowLeft size={20} strokeWidth={3} className="text-red-alert" />
              <div className="bg-red-alert border-2 border-black rounded-lg px-3 py-1">
                <span className="font-mono text-xs text-white font-bold">NOPE!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Matching Mode
  if (gameMode === 'matching') {
    return (
      <div className="flex flex-col items-center gap-3 p-4">
        {/* HUD */}
        <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
          <div className="flex items-center gap-2">
            <Link2 size={16} strokeWidth={3} className="text-green-success" />
            <span className="font-nunito text-xs font-bold text-white">Match Mode</span>
          </div>
          <span className="font-nunito text-xs text-purple-lighter">Level {currentLevel}</span>
          <div className="font-nunito text-xs font-bold text-green-success">Score: {score}</div>
        </div>

        {/* Progress */}
        <div className="w-full max-w-lg flex items-center gap-2">
          {dataItems.map((item) => {
            const matched = matchedPairs.some((p) => p.dataId === item.id);
            return (
              <div
                key={item.id}
                className={`h-2 flex-1 rounded-full border-2 border-black transition-colors ${
                  matched ? 'bg-green-success' : 'bg-purple-lighter'
                }`}
              />
            );
          })}
        </div>

        {/* Matching Area */}
        <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4 card-shadow">
          <p className="font-nunito text-xs text-purple-dark text-center mb-3">
            Match each data item to its hash! Click one from each column.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Data Column */}
            <div className="space-y-2">
              <p className="font-fredoka text-sm text-purple-dark text-center border-b-[3px] border-black pb-1">
                Original Data
              </p>
              {dataItems.map((item) => {
                const isMatched = matchedPairs.some((p) => p.dataId === item.id);
                const isSelected = selectedData === item.id;

                return (
                  <motion.button
                    key={`data-${item.id}`}
                    whileHover={!isMatched ? { scale: 1.03 } : {}}
                    whileTap={!isMatched ? { scale: 0.97 } : {}}
                    onClick={() => !isMatched && handleDataClick(item.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-xl border-[3px] border-black font-mono text-xs transition-all ${
                      isMatched
                        ? 'bg-green-success text-black'
                        : isSelected
                        ? 'bg-yellow-accent text-black'
                        : 'bg-purple-pale text-purple-dark hover:bg-purple-lighter'
                    } ${isMatched ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {isMatched && <Check size={14} strokeWidth={4} className="text-black flex-shrink-0" />}
                    <span className="truncate">&quot;{item.text}&quot;</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Hash Column */}
            <div className="space-y-2">
              <p className="font-fredoka text-sm text-purple-dark text-center border-b-[3px] border-black pb-1">
                Hash Values
              </p>
              {scrambledHashes.map((item) => {
                const isMatched = matchedPairs.some((p) => p.hashId === item.id);
                const isSelected = selectedHash === item.id;

                return (
                  <motion.button
                    key={`hash-${item.id}`}
                    whileHover={!isMatched ? { scale: 1.03 } : {}}
                    whileTap={!isMatched ? { scale: 0.97 } : {}}
                    onClick={() => !isMatched && handleHashClick(item.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-xl border-[3px] border-black font-mono text-xs transition-all ${
                      isMatched
                        ? 'bg-green-success text-black'
                        : isSelected
                        ? 'bg-yellow-accent text-black'
                        : 'bg-purple-dark text-green-success hover:bg-purple-primary'
                    } ${isMatched ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {isMatched && <Check size={14} strokeWidth={4} className="text-black flex-shrink-0" />}
                    <span className="truncate">{truncateHash(item.hash)}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Connection lines visualization */}
          {matchedPairs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {matchedPairs.map((pair, i) => {
                const dataItem = dataItems.find((d) => d.id === pair.dataId);
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 bg-green-success rounded-full border-2 border-black px-2 py-0.5"
                  >
                    <Check size={10} strokeWidth={4} className="text-black" />
                    <span className="font-nunito text-[9px] font-bold text-black">
                      {dataItem?.text}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Wrong pair flash */}
          <AnimatePresence>
            {wrongPair && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-center py-1.5 bg-red-alert rounded-xl border-[3px] border-black font-nunito text-xs font-bold text-white"
              >
                Not a match! Try again!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back to Menu */}
        <button
          onClick={() => setGameMode('menu')}
          className="flex items-center gap-1 px-4 py-2 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light transition-colors hover:scale-105"
        >
          <Shuffle size={14} strokeWidth={3} />
          Menu
        </button>
      </div>
    );
  }

  // One-Way Mode
  if (gameMode === 'oneway') {
    return (
      <div className="flex flex-col items-center gap-3 p-4">
        {/* HUD */}
        <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
          <div className="flex items-center gap-2">
            <ArrowRight size={16} strokeWidth={3} className="text-blue-info" />
            <span className="font-nunito text-xs font-bold text-white">One-Way Demo</span>
          </div>
          <div className="font-nunito text-xs font-bold text-green-success">Score: {score}</div>
        </div>

        {/* Hash Machine */}
        <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4 card-shadow">
          <div className="flex flex-col items-center gap-4">
            {/* Hash Algorithm Selector */}
            <div className="flex gap-2">
              {(['md5', 'sha1', 'sha256'] as HashAlgo[]).map((algo) => (
                <button
                  key={algo}
                  onClick={() => setHashAlgo(algo)}
                  className={`px-3 py-1 rounded-full border-[3px] border-black font-nunito text-xs font-bold transition-colors ${
                    hashAlgo === algo
                      ? 'bg-purple-primary text-white'
                      : 'bg-purple-pale text-purple-dark hover:bg-purple-lighter'
                  }`}
                >
                  {algo.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Hash Machine Visual */}
            <div className="flex items-center gap-3 w-full">
              {/* Input */}
              <div className="flex-1">
                <label className="font-nunito text-xs font-bold text-purple-dark mb-1 block">Input:</label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setShowReverseWarning(false);
                  }}
                  placeholder="Type anything..."
                  className="w-full px-3 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-xs text-purple-dark focus:outline-none focus:ring-2 focus:ring-purple-primary"
                />
              </div>

              {/* Arrow + Machine */}
              <div className="flex flex-col items-center gap-1 pt-5">
                <motion.div
                  animate={isHashing ? { rotate: 360 } : { rotate: 0 }}
                  transition={isHashing ? { duration: 0.3, repeat: Infinity, ease: 'linear' } : {}}
                >
                  <Settings size={24} strokeWidth={3} className="text-purple-primary" />
                </motion.div>
                <ArrowRight size={20} strokeWidth={3} className="text-green-success" />
              </div>

              {/* Output */}
              <div className="flex-1">
                <label className="font-nunito text-xs font-bold text-purple-dark mb-1 block">Hash:</label>
                <div className="w-full px-3 py-2 bg-purple-dark border-[3px] border-black rounded-xl font-mono text-xs text-green-success min-h-[36px] break-all">
                  {generatedHash || '...'}
                </div>
              </div>
            </div>

            {/* One-way explanation */}
            <div className="w-full bg-purple-pale rounded-xl border-[3px] border-black p-3">
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="font-nunito text-[10px] text-purple-dark font-bold">Text &rarr; Hash</span>
                  <div className="flex items-center gap-1">
                    <Check size={14} strokeWidth={4} className="text-green-success" />
                    <span className="font-nunito text-[10px] text-green-success font-bold">EASY!</span>
                  </div>
                </div>
                <div className="w-[3px] h-8 bg-black" />
                <button
                  onClick={() => setShowReverseWarning(true)}
                  className="flex flex-col items-center"
                >
                  <span className="font-nunito text-[10px] text-purple-dark font-bold">Hash &rarr; Text</span>
                  <div className="flex items-center gap-1">
                    <X size={14} strokeWidth={4} className="text-red-alert" />
                    <span className="font-nunito text-[10px] text-red-alert font-bold">IMPOSSIBLE!</span>
                  </div>
                </button>
              </div>

              <AnimatePresence>
                {showReverseWarning && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-2 text-center"
                  >
                    <span className="inline-block bg-red-alert text-white font-fredoka text-sm px-4 py-1 rounded-full border-[3px] border-black">
                      NOPE! Hashing is ONE-WAY!
                    </span>
                    <p className="font-nunito text-[10px] text-purple-dark mt-1">
                      You can&apos;t turn a hash back into the original text. That&apos;s what makes it secure!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Fun Facts */}
            <div className="w-full bg-yellow-accent/20 rounded-xl border-[3px] border-black p-3">
              <p className="font-nunito text-xs text-purple-dark font-bold text-center">
                <Zap size={14} strokeWidth={3} className="inline text-yellow-accent mr-1" />
                Fun Fact
              </p>
              <p className="font-nunito text-[10px] text-purple-dark text-center mt-1">
                {hashAlgo === 'sha256'
                  ? 'SHA-256 produces 64-character hashes. There are more possible hashes than atoms in the observable universe!'
                  : hashAlgo === 'sha1'
                  ? 'SHA-1 was used for years, but now it\'s considered weak. Always use SHA-256 or better!'
                  : 'MD5 is fast but NOT secure! It was broken in 2004. Never use MD5 for passwords!'}
              </p>
            </div>
          </div>
        </div>

        {/* Back to Menu */}
        <button
          onClick={() => setGameMode('menu')}
          className="flex items-center gap-1 px-4 py-2 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light transition-colors hover:scale-105"
        >
          <Shuffle size={14} strokeWidth={3} />
          Menu
        </button>
      </div>
    );
  }

  // Salting Mode
  if (gameMode === 'salting') {
    return (
      <div className="flex flex-col items-center gap-3 p-4">
        {/* HUD */}
        <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
          <div className="flex items-center gap-2">
            <FlaskConical size={16} strokeWidth={3} className="text-pink-accent" />
            <span className="font-nunito text-xs font-bold text-white">
              {saltChallengeMode ? 'Salt Challenge' : 'Salt Lab'}
            </span>
          </div>
          <div className="font-nunito text-xs font-bold text-green-success">Score: {score}</div>
        </div>

        <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4 card-shadow">
          {!saltChallengeMode ? (
            <>
              {/* Salt Lab Intro */}
              <h3 className="font-fredoka text-lg text-purple-dark text-center mb-2">
                <FlaskConical size={20} strokeWidth={3} className="inline text-pink-accent mr-1" />
                Salt Shaker Lab
              </h3>
              <p className="font-nunito text-xs text-purple-dark text-center mb-3">
                Adding &quot;salt&quot; (random text) to a password completely changes its hash! This protects against rainbow table attacks.
              </p>

              {/* Password Input */}
              <div className="mb-3">
                <label className="font-nunito text-xs font-bold text-purple-dark mb-1 block">Password:</label>
                <input
                  type="text"
                  value={saltInput}
                  onChange={(e) => {
                    setSaltInput(e.target.value);
                    setUnsaltedHash(simpleHash(e.target.value, hashAlgo));
                    setSaltHash('');
                    setSelectedSalt('');
                  }}
                  className="w-full px-3 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-sm text-purple-dark focus:outline-none focus:ring-2 focus:ring-pink-accent"
                />
              </div>

              {/* Unsalted Hash */}
              <div className="bg-purple-pale rounded-xl border-[3px] border-black p-2 mb-3">
                <p className="font-nunito text-[10px] font-bold text-purple-dark mb-1">Without Salt (WEAK!):</p>
                <p className="font-mono text-xs text-red-alert break-all">{unsaltedHash}</p>
              </div>

              {/* Salt Buttons */}
              <p className="font-nunito text-xs font-bold text-purple-dark mb-1">Pick a salt to add:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {SALTS.map((salt) => (
                  <motion.button
                    key={salt}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => applySalt(salt)}
                    className={`px-3 py-2 border-[3px] border-black rounded-xl font-mono text-xs font-bold transition-colors ${
                      selectedSalt === salt
                        ? 'bg-pink-accent text-white'
                        : 'bg-purple-pale text-purple-dark hover:bg-pink-accent/30'
                    }`}
                  >
                    <span className="mr-1">🧂</span>
                    {salt}
                  </motion.button>
                ))}
              </div>

              {/* Salt Animation */}
              <AnimatePresence>
                {showSaltAnim && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center mb-2"
                  >
                    <motion.span
                      animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block font-fredoka text-2xl"
                    >
                      🧂✨
                    </motion.span>
                    <p className="font-nunito text-xs text-pink-accent font-bold">Adding salt...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Salted Hash Result */}
              {saltHash && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-green-success/20 rounded-xl border-[3px] border-black p-2"
                >
                  <p className="font-nunito text-[10px] font-bold text-purple-dark mb-1">
                    With Salt &quot;{selectedSalt}&quot; (STRONG!):
                  </p>
                  <p className="font-mono text-xs text-green-success break-all">{saltHash}</p>
                  <p className="font-nunito text-[10px] text-purple-dark mt-1">
                    Same password, completely different hash! Hackers can&apos;t use pre-made tables anymore.
                  </p>
                </motion.div>
              )}

              {/* Rainbow Table Warning */}
              <div className="mt-3 bg-red-alert/10 rounded-xl border-[3px] border-red-alert p-2">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle size={14} strokeWidth={3} className="text-red-alert" />
                  <p className="font-nunito text-[10px] font-bold text-red-alert">Why Salting Matters:</p>
                </div>
                <p className="font-nunito text-[10px] text-purple-dark">
                  Without salt, hackers can use &quot;rainbow tables&quot; — pre-calculated lists of common passwords and their hashes. Salt makes each hash unique!
                </p>
              </div>

              {/* Start Challenge Button */}
              <button
                onClick={startSaltChallenge}
                className="mt-3 w-full py-2 bg-pink-accent text-white border-[3px] border-black rounded-full font-nunito font-bold text-xs hover:scale-105 transition-transform flex items-center justify-center gap-1"
              >
                <Zap size={14} strokeWidth={3} />
                Try Salt Challenge!
              </button>
            </>
          ) : (
            <>
              {/* Salt Challenge */}
              <h3 className="font-fredoka text-lg text-purple-dark text-center mb-2">
                <Zap size={20} strokeWidth={3} className="inline text-yellow-accent mr-1" />
                Salt Challenge
              </h3>
              <p className="font-nunito text-xs text-purple-dark text-center mb-3">
                Find which salt makes this hash! Password: &quot;mypassword&quot;
              </p>

              {/* Target Hash */}
              <div className="bg-purple-dark rounded-xl border-[3px] border-black p-3 mb-3">
                <p className="font-nunito text-[10px] text-purple-lighter mb-1">Target Hash:</p>
                <p className="font-mono text-sm text-green-success break-all">{saltChallengeTarget}</p>
              </div>

              {/* Password Display */}
              <div className="bg-purple-pale rounded-xl border-[3px] border-black p-2 mb-3">
                <p className="font-nunito text-[10px] text-purple-dark mb-1">Password:</p>
                <p className="font-mono text-sm text-purple-dark">&quot;mypassword&quot;</p>
              </div>

              {/* Salt Options */}
              <p className="font-nunito text-xs font-bold text-purple-dark mb-1">Try a salt:</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {SALTS.map((salt) => (
                  <motion.button
                    key={salt}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => applySalt(salt)}
                    disabled={saltSolved}
                    className={`px-3 py-2 border-[3px] border-black rounded-xl font-mono text-xs font-bold transition-colors ${
                      saltSolved && salt === selectedSalt
                        ? 'bg-green-success text-black'
                        : 'bg-purple-pale text-purple-dark hover:bg-pink-accent/30'
                    } ${saltSolved ? 'cursor-not-allowed' : ''}`}
                  >
                    <span className="mr-1">🧂</span>
                    {salt}
                  </motion.button>
                ))}
              </div>

              {/* Salt Animation */}
              <AnimatePresence>
                {showSaltAnim && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center mb-2"
                  >
                    <motion.span
                      animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block font-fredoka text-2xl"
                    >
                      🧂✨
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result */}
              {saltHash && !saltSolved && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-red-alert/20 rounded-xl border-[3px] border-red-alert p-2 mb-3"
                >
                  <p className="font-nunito text-[10px] text-red-alert font-bold">Not the right salt!</p>
                  <p className="font-mono text-xs text-purple-dark break-all">{saltHash}</p>
                </motion.div>
              )}

              {/* Solved */}
              <AnimatePresence>
                {saltSolved && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-green-success rounded-xl border-[3px] border-black p-3 text-center"
                  >
                    <Check size={24} strokeWidth={4} className="text-black mx-auto mb-1" />
                    <p className="font-fredoka text-sm text-black">Correct!</p>
                    <p className="font-nunito text-[10px] text-black">
                      Salt &quot;{selectedSalt}&quot; produces the target hash!
                    </p>
                    <p className="font-nunito text-xs font-bold text-black mt-1">+25 Points!</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Back to Menu */}
        <button
          onClick={() => setGameMode('menu')}
          className="flex items-center gap-1 px-4 py-2 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light transition-colors hover:scale-105"
        >
          <Shuffle size={14} strokeWidth={3} />
          Menu
        </button>
      </div>
    );
  }

  // Level Complete
  if (gameMode === 'levelComplete') {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-lg bg-green-success rounded-2xl border-4 border-black p-5 flex flex-col items-center gap-2 card-shadow"
        >
          <Check size={40} strokeWidth={4} className="text-black" />
          <h3 className="font-fredoka text-xl text-black">Level {currentLevel} Complete!</h3>
          <p className="font-nunito text-xs text-black text-center">
            You matched all {dataItems.length} data-hash pairs!
          </p>
          <div className="font-nunito text-sm font-bold text-black">Score: {score}</div>
          <button
            onClick={() => startLevel(currentLevel + 1)}
            className="mt-1 px-6 py-2 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform flex items-center gap-1"
          >
            Next Level
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </motion.div>
      </div>
    );
  }

  // All Complete
  if (gameMode === 'allComplete') {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-lg bg-yellow-accent rounded-2xl border-4 border-black p-5 flex flex-col items-center gap-2 card-shadow"
        >
          <Trophy size={40} strokeWidth={3} className="text-purple-dark" />
          <h3 className="font-fredoka text-xl text-purple-dark">Hash Hacker Master!</h3>
          <p className="font-nunito text-xs text-purple-dark text-center">
            You understand hash functions, one-way properties, and salting!
          </p>
          <div className="font-nunito text-lg font-bold text-purple-dark">Final Score: {score}</div>
          <button
            onClick={() => setGameMode('menu')}
            className="mt-1 px-6 py-2 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform flex items-center gap-1"
          >
            <RotateCcw size={16} strokeWidth={3} />
            Play Again
          </button>
        </motion.div>
      </div>
    );
  }

  return null;
}
