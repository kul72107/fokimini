import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Terminal, Shield, ShieldAlert, Skull, Check, X,
  ChevronRight, RotateCcw, Lock, Unlock, AlertTriangle,
  BookOpen, Zap, Trophy, Star, Code, Fingerprint
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type GameMode = 'menu' | 'tutorial' | 'attack' | 'defense' | 'result';
type LevelId = 1 | 2 | 3 | 4;

interface UserRecord {
  id: number;
  username: string;
  password: string;
  role: string;
  avatar: string;
}

const USERS_DB: UserRecord[] = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', avatar: '👑' },
  { id: 2, username: 'buddy', password: 'paw123', role: 'user', avatar: '🐕' },
  { id: 3, username: 'mittens', password: 'meow456', role: 'user', avatar: '🐱' },
  { id: 4, username: 'daisy', password: 'quack789', role: 'moderator', avatar: '🦆' },
  { id: 5, username: 'thumper', password: 'hop000', role: 'user', avatar: '🐰' },
  { id: 6, username: 'shadow', password: 'dark999', role: 'hacker', avatar: '🦹' },
];

const LEVELS = [
  {
    id: 1 as LevelId,
    name: 'The Sneaky Quote',
    description: 'Learn the classic \' OR \'1\'=\'1 attack to bypass login!',
    attackQuery: "SELECT * FROM users WHERE username = '' OR '1'='1'",
    hint: "Try: ' OR '1'='1",
    educational: "The ' OR '1'='1 trick makes the WHERE condition always TRUE, so ALL rows are returned!",
  },
  {
    id: 2 as LevelId,
    name: 'Union Strike',
    description: 'Use UNION to combine data from another table!',
    attackQuery: "SELECT * FROM users UNION SELECT * FROM passwords--",
    hint: "Try: ' UNION SELECT * FROM passwords--",
    educational: "UNION combines results from two SELECT statements. Hackers use it to steal data from other tables!",
  },
  {
    id: 3 as LevelId,
    name: 'True or False?',
    description: 'Use blind injection to ask the database yes/no questions!',
    attackQuery: "SELECT * FROM users WHERE username = 'admin' AND SUBSTRING(password,1,1)='a'",
    hint: "Use SUBSTRING to guess one letter at a time!",
    educational: "Blind injection lets hackers extract data one character at a time by asking true/false questions!",
  },
  {
    id: 4 as LevelId,
    name: 'Build the Shield',
    description: 'Choose the correct defense to stop SQL injection!',
    attackQuery: "",
    hint: "Pick the strongest defense!",
    educational: "Parameterized queries separate code from data, making injection impossible!",
  },
];

const DEFENSE_OPTIONS = [
  {
    id: 'parameterized',
    label: 'Use Parameterized Queries',
    desc: 'Separate SQL code from user data using placeholders like ?',
    correct: true,
    code: "db.query('SELECT * FROM users WHERE username = ?', [userInput])",
  },
  {
    id: 'escape',
    label: 'Escape Input Strings',
    desc: 'Add backslashes before special characters like quotes',
    correct: false,
    code: "db.query(`SELECT * FROM users WHERE username = '${escape(input)}'`)",
  },
  {
    id: 'nothing',
    label: 'Do Nothing',
    desc: 'My code is already safe enough!',
    correct: false,
    code: "db.query(`SELECT * FROM users WHERE username = '${input}'`)",
  },
];

const BINARY_QUESTIONS = [
  { q: "Does password start with 'a'?", answer: false, bit: '0' },
  { q: "Does password start with 'p'?", answer: true, bit: '1' },
  { q: "Is the 2nd letter 'a'?", answer: true, bit: '1' },
  { q: "Is the password longer than 5 chars?", answer: true, bit: '1' },
];

export default function SQLSafari({ onScoreChange }: Props) {
  const [currentLevel, setCurrentLevel] = useState<LevelId>(1);
  const [mode, setMode] = useState<GameMode>('menu');
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<Set<LevelId>>(new Set());

  // Query building state
  const [queryParts, setQueryParts] = useState<string[]>(["SELECT * FROM users WHERE username ="]);
  const [userInput, setUserInput] = useState("''");
  const [showingResult, setShowingResult] = useState(false);
  const [matchedRows, setMatchedRows] = useState<number[]>([]);
  const [attackDetected, setAttackDetected] = useState(false);
  const [defenseSelected, setDefenseSelected] = useState<string | null>(null);
  const [showEducational, setShowEducational] = useState(false);
  const [binaryIndex, setBinaryIndex] = useState(0);
  const [collectedBits, setCollectedBits] = useState<string[]>([]);
  const [buildProgress, setBuildProgress] = useState(0);

  const level = LEVELS[currentLevel - 1];

  const resetLevel = useCallback(() => {
    setShowingResult(false);
    setMatchedRows([]);
    setAttackDetected(false);
    setDefenseSelected(null);
    setShowEducational(false);
    setBinaryIndex(0);
    setCollectedBits([]);
    setBuildProgress(0);
    if (currentLevel === 1) {
      setQueryParts(["SELECT * FROM users WHERE username ="]);
      setUserInput("''");
    } else if (currentLevel === 2) {
      setQueryParts(["SELECT * FROM users WHERE id ="]);
      setUserInput("''");
    } else if (currentLevel === 3) {
      setQueryParts(["SELECT * FROM users WHERE username = 'admin' AND"]);
      setUserInput("'1'='1'");
    } else {
      setQueryParts(["SELECT * FROM users WHERE username ="]);
      setUserInput("'user'");
    }
  }, [currentLevel]);

  useEffect(() => {
    resetLevel();
  }, [currentLevel, resetLevel]);

  const startLevel = (lvl: LevelId) => {
    setCurrentLevel(lvl);
    setMode('tutorial');
    onScoreChange(0);
    resetLevel();
  };

  const buildQueryStep = () => {
    if (buildProgress === 0) {
      setBuildProgress(1);
      if (currentLevel === 1) setUserInput("'admin'");
      else if (currentLevel === 2) setUserInput("'1'");
      else if (currentLevel === 3) setUserInput("SUBSTRING(password,1,1)='p'");
    } else if (buildProgress === 1) {
      runQuery();
    }
  };

  const runQuery = () => {
    setShowingResult(true);
    const input = userInput.toLowerCase();

    if (currentLevel === 1) {
      if (input.includes("or") && input.includes("1") && input.includes("=")) {
        setMatchedRows(USERS_DB.map((u) => u.id));
        setAttackDetected(true);
      } else if (input.includes("admin")) {
        setMatchedRows([1]);
        setAttackDetected(false);
      } else {
        setMatchedRows([]);
        setAttackDetected(false);
      }
    } else if (currentLevel === 2) {
      if (input.includes("union")) {
        setMatchedRows([...USERS_DB.map((u) => u.id), 7, 8, 9]);
        setAttackDetected(true);
      } else {
        setMatchedRows([1]);
        setAttackDetected(false);
      }
    } else if (currentLevel === 3) {
      setMatchedRows([1]);
      setAttackDetected(input.includes("substring") || input.includes("substr"));
    } else {
      setMatchedRows([1]);
      setAttackDetected(false);
    }
  };

  const injectPayload = (payload: string) => {
    setUserInput(payload);
    setBuildProgress(1);
  };

  const selectDefense = (id: string) => {
    setDefenseSelected(id);
    setShowingResult(true);
    const isCorrect = DEFENSE_OPTIONS.find((d) => d.id === id)?.correct ?? false;
    setAttackDetected(!isCorrect);

    if (isCorrect) {
      const newScore = score + 25;
      setScore(newScore);
      setStars((s) => Math.min(3, s + 1));
      onScoreChange(Math.min(100, newScore));
      setCompletedLevels((prev) => new Set(Array.from(prev).concat([currentLevel])));
    }
  };

  const askBinaryQuestion = (idx: number) => {
    setBinaryIndex(idx);
    const q = BINARY_QUESTIONS[idx];
    if (q.answer) {
      setCollectedBits((prev) => [...prev, q.bit]);
    }
    if (idx >= BINARY_QUESTIONS.length - 1) {
      setShowingResult(true);
      setMatchedRows([1]);
    }
  };

  const nextLevel = () => {
    if (currentLevel < 4) {
      startLevel((currentLevel + 1) as LevelId);
    } else {
      setMode('result');
    }
  };

  // ---- RENDER ----

  if (mode === 'menu') {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Database size={32} strokeWidth={3} className="text-purple-primary" />
            <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">SQL Safari</h2>
          </div>
          <p className="font-nunito text-sm text-purple-dark">
            Learn SQL Injection and how to stop it! Explore the database jungle safely.
          </p>
        </div>

        <div className="w-full max-w-lg bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={16} strokeWidth={3} className="text-yellow-accent" fill="#FACC15" />
            <span className="font-nunito text-xs font-bold text-yellow-accent">{stars}/12</span>
          </div>
          <span className="font-nunito text-xs font-bold text-white">Score: {score}</span>
          <span className="font-nunito text-xs text-purple-lighter">
            Cleared: {completedLevels.size}/4
          </span>
        </div>

        <div className="w-full max-w-lg grid grid-cols-2 gap-3">
          {LEVELS.map((lvl) => {
            const isUnlocked = lvl.id === 1 || completedLevels.has((lvl.id - 1) as LevelId);
            const isCompleted = completedLevels.has(lvl.id);
            return (
              <motion.button
                key={lvl.id}
                whileHover={isUnlocked ? { scale: 1.03 } : {}}
                whileTap={isUnlocked ? { scale: 0.97 } : {}}
                onClick={() => isUnlocked && startLevel(lvl.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-4 border-black transition-colors ${
                  isCompleted
                    ? 'bg-green-success'
                    : isUnlocked
                    ? 'bg-white hover:bg-purple-pale'
                    : 'bg-gray-200 cursor-not-allowed'
                }`}
                style={{ opacity: isUnlocked ? 1 : 0.4, boxShadow: isUnlocked ? '6px 6px 0px 0px #000' : 'none' }}
              >
                {!isUnlocked && <Lock size={20} strokeWidth={3} className="text-gray-500" />}
                {isCompleted && <Trophy size={20} strokeWidth={3} className="text-yellow-accent" />}
                {isUnlocked && !isCompleted && (
                  <div className="w-10 h-10 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center">
                    <span className="font-fredoka text-lg text-white">{lvl.id}</span>
                  </div>
                )}
                <span className="font-nunito text-xs font-bold text-purple-dark">{lvl.name}</span>
                <span className="font-nunito text-[10px] text-purple-dark text-center leading-tight">
                  {lvl.description.slice(0, 40)}...
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} strokeWidth={3} className="text-blue-info" />
            <span className="font-nunito text-xs font-bold text-purple-dark">What is SQL Injection?</span>
          </div>
          <p className="font-nunito text-[11px] text-purple-dark leading-relaxed">
            SQL Injection is when a hacker types special characters into a form to trick the database into revealing secrets. It is like sneaking a fake note into someone&apos;s mailbox!
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'result') {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-full max-w-lg bg-green-success rounded-2xl border-4 border-black p-6 flex flex-col items-center gap-3"
          style={{ boxShadow: '8px 8px 0px 0px #000' }}
        >
          <Trophy size={48} strokeWidth={3} className="text-yellow-accent" />
          <h3 className="font-fredoka text-2xl text-black text-outline-sm">SQL Safari Complete!</h3>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                size={32}
                strokeWidth={2}
                className={s <= stars ? 'text-yellow-accent' : 'text-black/20'}
                fill={s <= stars ? '#FACC15' : 'transparent'}
              />
            ))}
          </div>
          <p className="font-nunito text-lg font-bold text-black">Final Score: {score}</p>
          <p className="font-nunito text-xs text-black text-center">
            You learned how SQL injection works and how to defend against it!
          </p>
          <button
            onClick={() => { setMode('menu'); setScore(0); setStars(0); setCompletedLevels(new Set()); onScoreChange(0); }}
            className="px-6 py-3 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark hover:scale-105 transition-transform"
          >
            Play Again
          </button>
        </motion.div>
      </div>
    );
  }

  // ---- MAIN GAMEPLAY VIEW ----
  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* HUD */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('menu')}
            className="font-nunito text-[10px] text-purple-lighter hover:text-white underline"
          >
            Menu
          </button>
          <span className="font-nunito text-xs font-bold text-yellow-accent">
            Lvl {currentLevel}: {level.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Star size={14} strokeWidth={3} className="text-yellow-accent" fill="#FACC15" />
          <span className="font-nunito text-xs font-bold text-yellow-accent">{stars}</span>
        </div>
        <span className="font-nunito text-xs font-bold text-white">Score: {score}</span>
      </div>

      {/* Split Panels */}
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-3">
        {/* LEFT: Database Table */}
        <div className="flex-1 bg-white rounded-2xl border-4 border-black overflow-hidden">
          <div className="bg-purple-primary border-b-[3px] border-black px-3 py-2 flex items-center gap-2">
            <Database size={16} strokeWidth={3} className="text-white" />
            <span className="font-fredoka text-sm text-white">Users Database</span>
            <span className="font-mono text-[10px] text-purple-lighter ml-auto">users_table</span>
          </div>

          <div className="p-2 overflow-auto" style={{ maxHeight: 340 }}>
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-1 mb-1">
              {['ID', 'Username', 'Password', 'Role', ''].map((h) => (
                <div
                  key={h}
                  className="bg-purple-lighter border-[2px] border-black rounded-lg px-1 py-1 text-center"
                >
                  <span className="font-nunito text-[9px] font-bold text-purple-dark">{h}</span>
                </div>
              ))}
            </div>

            {/* Table Rows */}
            <AnimatePresence>
              {USERS_DB.map((user) => {
                const isMatched = matchedRows.includes(user.id);
                const isHighlighted = showingResult && isMatched;
                const isAdmin = user.role === 'admin';

                return (
                  <motion.div
                    key={user.id}
                    initial={isHighlighted ? { scale: 0.9 } : { scale: 1 }}
                    animate={
                      isHighlighted
                        ? { scale: [1, 1.05, 1], backgroundColor: attackDetected ? '#FEF2F2' : '#F0FDF4' }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.3 }}
                    className={`grid grid-cols-5 gap-1 mb-1 rounded-lg border-[2px] border-black px-1 py-1 items-center ${
                      isHighlighted
                        ? attackDetected
                          ? 'bg-red-alert'
                          : 'bg-green-success'
                        : 'bg-purple-pale'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-purple-dark text-center">{user.id}</span>
                    <span className="font-nunito text-[10px] font-bold text-purple-dark text-center flex items-center justify-center gap-0.5">
                      <span>{user.avatar}</span>
                      {user.username}
                    </span>
                    <span
                      className={`font-mono text-[10px] text-center ${
                        showingResult && isMatched ? 'text-black font-bold' : 'text-purple-light'
                      }`}
                      style={{
                        filter: !showingResult ? 'blur(3px)' : 'none',
                        transition: 'filter 0.3s',
                      }}
                    >
                      {user.password}
                    </span>
                    <span className="font-nunito text-[9px] text-purple-dark text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-full border-[2px] border-black ${
                          isAdmin ? 'bg-yellow-accent' : 'bg-purple-lighter'
                        }`}
                      >
                        {user.role}
                      </span>
                    </span>
                    <div className="flex justify-center">
                      {isHighlighted && attackDetected && user.role === 'admin' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-0.5"
                        >
                          <Unlock size={12} strokeWidth={3} className="text-white" />
                        </motion.div>
                      )}
                      {isHighlighted && !attackDetected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <Check size={12} strokeWidth={4} className="text-black" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Extra fake rows for UNION attack */}
            <AnimatePresence>
              {showingResult &&
                attackDetected &&
                currentLevel === 2 &&
                [7, 8, 9].map((id) => (
                  <motion.div
                    key={id}
                    initial={{ scale: 0, x: -20 }}
                    animate={{ scale: 1, x: 0 }}
                    className="grid grid-cols-5 gap-1 mb-1 rounded-lg border-[2px] border-black border-dashed px-1 py-1 items-center bg-yellow-accent"
                  >
                    <span className="font-mono text-[10px] text-black text-center">{id}</span>
                    <span className="font-nunito text-[10px] font-bold text-black text-center">
                      STOLEN!
                    </span>
                    <span className="font-mono text-[10px] text-black text-center font-bold">
                      secret{id}
                    </span>
                    <span className="font-nunito text-[9px] text-black text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded-full border-[2px] border-black bg-red-alert text-white">
                        leaked
                      </span>
                    </span>
                    <AlertTriangle size={12} strokeWidth={3} className="text-black mx-auto" />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>

          {/* Row count indicator */}
          {showingResult && (
            <motion.div
              initial={{ y: 10, opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              className="border-t-[3px] border-black bg-purple-pale px-3 py-1.5 flex items-center justify-between"
            >
              <span className="font-nunito text-[10px] font-bold text-purple-dark">
                Rows returned: {matchedRows.length}
              </span>
              {attackDetected && (
                <span className="font-nunito text-[10px] font-bold text-red-alert flex items-center gap-1">
                  <Skull size={12} strokeWidth={3} />
                  ALL DATA EXPOSED!
                </span>
              )}
            </motion.div>
          )}
        </div>

        {/* RIGHT: Query Console */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Query Builder */}
          <div className="bg-white rounded-2xl border-4 border-black overflow-hidden">
            <div className="bg-purple-darker border-b-[3px] border-black px-3 py-2 flex items-center gap-2">
              <Terminal size={16} strokeWidth={3} className="text-green-success" />
              <span className="font-fredoka text-sm text-white">Query Console</span>
              <span className="font-mono text-[10px] text-purple-lighter ml-auto">
                {mode.toUpperCase()}
              </span>
            </div>

            <div className="p-3">
              {/* Query Display */}
              <div className="bg-black rounded-xl border-[3px] border-black p-3 mb-3">
                <div className="flex flex-wrap items-center gap-1">
                  {queryParts.map((part, i) => (
                    <motion.span
                      key={i}
                      initial={{ x: -10 }}
                      animate={{ x: 0 }}
                      className="font-mono text-[11px] text-green-success"
                    >
                      {part}
                    </motion.span>
                  ))}
                  <motion.span
                    animate={
                      attackDetected
                        ? { scale: [1, 1.1, 1] }
                        : {}
                    }
                    transition={{ repeat: attackDetected ? Infinity : 0, duration: 0.5 }}
                    className={`font-mono text-[11px] font-bold px-1 rounded ${
                      attackDetected
                        ? 'bg-red-alert text-white'
                        : buildProgress > 0
                        ? 'bg-yellow-accent text-black'
                        : 'text-purple-light'
                    }`}
                  >
                    {userInput}
                  </motion.span>
                </div>
              </div>

              {/* Controls based on level */}
              {currentLevel <= 3 && mode !== 'defense' && (
                <>
                  {!showingResult ? (
                    <div className="flex flex-col gap-2">
                      {/* Input Display */}
                      <div className="flex items-center gap-2 bg-purple-pale rounded-xl border-[3px] border-black px-3 py-2">
                        <Fingerprint size={14} strokeWidth={3} className="text-purple-primary" />
                        <span className="font-mono text-xs text-purple-dark">Input:</span>
                        <span className="font-mono text-xs text-black font-bold flex-1">{userInput}</span>
                      </div>

                      {/* Payload Buttons for Attack Mode */}
                      {currentLevel === 1 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="font-nunito text-[10px] text-purple-dark font-bold py-1">Payloads:</span>
                          {[
                            "' OR '1'='1",
                            "' OR '1'='1' --",
                            "admin'--",
                            "' DROP TABLE--",
                          ].map((p) => (
                            <button
                              key={p}
                              onClick={() => injectPayload(p)}
                              className="px-2 py-1 bg-red-alert border-[2px] border-black rounded-lg font-mono text-[9px] text-white hover:scale-105 transition-transform"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}

                      {currentLevel === 2 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="font-nunito text-[10px] text-purple-dark font-bold py-1">Payloads:</span>
                          {[
                            "' UNION SELECT * FROM passwords--",
                            "' UNION SELECT null,null--",
                          ].map((p) => (
                            <button
                              key={p}
                              onClick={() => injectPayload(p)}
                              className="px-2 py-1 bg-red-alert border-[2px] border-black rounded-lg font-mono text-[9px] text-white hover:scale-105 transition-transform"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      )}

                      {currentLevel === 3 && (
                        <div className="flex flex-col gap-1.5">
                          <span className="font-nunito text-[10px] text-purple-dark font-bold">
                            Blind Injection: Ask yes/no questions!
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {BINARY_QUESTIONS.map((q, i) => (
                              <button
                                key={i}
                                onClick={() => askBinaryQuestion(i)}
                                disabled={binaryIndex > i}
                                className={`px-2 py-1 border-[2px] border-black rounded-lg font-nunito text-[9px] font-bold transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                  binaryIndex > i && q.answer
                                    ? 'bg-green-success text-black'
                                    : binaryIndex > i
                                    ? 'bg-gray-200 text-gray-500'
                                    : 'bg-blue-info text-white'
                                }`}
                              >
                                {q.q}
                              </button>
                            ))}
                          </div>
                          {collectedBits.length > 0 && (
                            <div className="flex items-center gap-2 bg-yellow-accent rounded-lg border-[2px] border-black px-2 py-1">
                              <Zap size={12} strokeWidth={3} className="text-black" />
                              <span className="font-mono text-xs text-black font-bold">
                                Bits: {collectedBits.join('')}
                              </span>
                              <span className="font-nunito text-[9px] text-purple-dark ml-auto">
                                ({collectedBits.length} collected)
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={buildQueryStep}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-xs text-white hover:bg-purple-dark hover:scale-105 transition-transform"
                        >
                          <Zap size={14} strokeWidth={3} />
                          {buildProgress === 0 ? 'Set Input' : 'Run Query'}
                        </button>
                        {buildProgress > 0 && (
                          <button
                            onClick={resetLevel}
                            className="flex items-center gap-1 px-3 py-2 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:scale-105 transition-transform"
                          >
                            <RotateCcw size={14} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* Attack/Result Banner */}
                      <AnimatePresence>
                        {attackDetected ? (
                          <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="bg-red-alert rounded-xl border-[3px] border-black px-3 py-2 flex items-center gap-2"
                          >
                            <Skull size={20} strokeWidth={3} className="text-white" />
                            <span className="font-fredoka text-sm text-white text-outline-sm">
                              Injection Detected!
                            </span>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="bg-green-success rounded-xl border-[3px] border-black px-3 py-2 flex items-center gap-2"
                          >
                            <Shield size={20} strokeWidth={3} className="text-black" />
                            <span className="font-fredoka text-sm text-black">
                              Query Safe!
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Result explanation */}
                      <div className="bg-purple-pale rounded-xl border-[3px] border-purple-light p-2">
                        <p className="font-nunito text-[10px] text-purple-dark leading-relaxed">
                          {level.educational}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (currentLevel === 4) {
                            setMode('defense');
                          } else {
                            setShowEducational(true);
                          }
                        }}
                        className="flex items-center justify-center gap-1 px-4 py-2 bg-yellow-accent border-[3px] border-black rounded-full font-nunito font-bold text-xs text-black hover:scale-105 transition-transform"
                      >
                        <BookOpen size={14} strokeWidth={3} />
                        {currentLevel === 4 ? 'Go to Defense' : 'Learn More'}
                      </button>

                      {showEducational && currentLevel < 4 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          className="bg-blue-info rounded-xl border-[3px] border-black p-3"
                        >
                          <p className="font-nunito text-[10px] text-white font-bold mb-1">
                            How to defend:
                          </p>
                          <p className="font-nunito text-[10px] text-white leading-relaxed">
                            Always use parameterized queries! Never put user input directly into SQL strings. In JavaScript with MySQL:
                          </p>
                          <div className="bg-black rounded-lg p-2 mt-1 border-[2px] border-white">
                            <code className="font-mono text-[9px] text-green-success">
                              db.query(&apos;SELECT * FROM users WHERE username = ?&apos;, [input])
                            </code>
                          </div>
                          <button
                            onClick={nextLevel}
                            className="mt-2 flex items-center justify-center gap-1 w-full px-3 py-2 bg-white border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:scale-105 transition-transform"
                          >
                            Next Level
                            <ChevronRight size={14} strokeWidth={3} />
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Defense Mode (Level 4) */}
              {currentLevel === 4 && (
                <div className="flex flex-col gap-2">
                  <div className="bg-purple-pale rounded-xl border-[3px] border-purple-light p-2">
                    <p className="font-nunito text-[11px] text-purple-dark font-bold text-center">
                      Choose the best defense against SQL Injection:
                    </p>
                  </div>

                  {DEFENSE_OPTIONS.map((opt) => (
                    <motion.button
                      key={opt.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectDefense(opt.id)}
                      disabled={showingResult}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border-[3px] border-black transition-colors ${
                        showingResult && defenseSelected === opt.id
                          ? opt.correct
                            ? 'bg-green-success'
                            : 'bg-red-alert'
                          : showingResult && opt.correct
                          ? 'bg-green-success'
                          : 'bg-white hover:bg-purple-pale'
                      } ${showingResult ? 'cursor-default' : 'cursor-pointer'}`}
                      style={{ boxShadow: showingResult && opt.correct ? '4px 4px 0px 0px #000' : 'none' }}
                    >
                      <div className="flex items-center gap-2">
                        {showingResult && opt.correct && (
                          <Check size={16} strokeWidth={4} className="text-black" />
                        )}
                        {showingResult && defenseSelected === opt.id && !opt.correct && (
                          <X size={16} strokeWidth={4} className="text-white" />
                        )}
                        <span
                          className={`font-nunito text-xs font-bold ${
                            showingResult && (opt.correct || defenseSelected === opt.id)
                              ? opt.correct
                                ? 'text-black'
                                : 'text-white'
                              : 'text-purple-dark'
                          }`}
                        >
                          {opt.label}
                        </span>
                      </div>
                      <span
                        className={`font-nunito text-[10px] ${
                          showingResult && (opt.correct || defenseSelected === opt.id)
                            ? opt.correct
                              ? 'text-purple-dark'
                              : 'text-white'
                            : 'text-purple-light'
                        }`}
                      >
                        {opt.desc}
                      </span>
                      <div
                        className={`w-full rounded-lg border-[2px] border-black p-1.5 mt-1 ${
                          showingResult && (opt.correct || defenseSelected === opt.id)
                            ? 'bg-black'
                            : 'bg-gray-100'
                        }`}
                      >
                        <code
                          className={`font-mono text-[8px] ${
                            showingResult && (opt.correct || defenseSelected === opt.id)
                              ? 'text-green-success'
                              : 'text-gray-500'
                          }`}
                        >
                          {opt.code}
                        </code>
                      </div>
                    </motion.button>
                  ))}

                  {showingResult && (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`rounded-xl border-[3px] border-black px-3 py-2 flex items-center gap-2 ${
                        defenseSelected === 'parameterized' ? 'bg-green-success' : 'bg-red-alert'
                      }`}
                    >
                      {defenseSelected === 'parameterized' ? (
                        <>
                          <Shield size={20} strokeWidth={3} className="text-black" />
                          <span className="font-fredoka text-sm text-black">
                            Correct! Parameterized queries are the best defense!
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={20} strokeWidth={3} className="text-white" />
                          <span className="font-fredoka text-sm text-white">
                            {defenseSelected === 'escape'
                              ? 'Escaping helps but is not enough! Use parameterized queries.'
                              : 'Doing nothing leaves you vulnerable!'}
                          </span>
                        </>
                      )}
                    </motion.div>
                  )}

                  {showingResult && (
                    <button
                      onClick={nextLevel}
                      className="flex items-center justify-center gap-1 px-4 py-2 bg-yellow-accent border-[3px] border-black rounded-full font-nunito font-bold text-xs text-black hover:scale-105 transition-transform"
                    >
                      Finish!
                      <Trophy size={14} strokeWidth={3} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hint Box */}
          {!showingResult && (
            <div className="bg-yellow-accent rounded-xl border-[3px] border-black px-3 py-2 flex items-start gap-2">
              <Zap size={14} strokeWidth={3} className="text-black flex-shrink-0 mt-0.5" />
              <span className="font-nunito text-[10px] text-black font-semibold">
                Hint: {level.hint}
              </span>
            </div>
          )}

          {/* Educational Sidebar */}
          <div className="bg-white rounded-2xl border-4 border-black p-3">
            <div className="flex items-center gap-2 mb-1">
              <Code size={14} strokeWidth={3} className="text-purple-primary" />
              <span className="font-nunito text-xs font-bold text-purple-dark">Code Lab</span>
            </div>
            <div className="bg-black rounded-lg border-[2px] border-black p-2">
              <p className="font-mono text-[9px] text-purple-lighter mb-1">Safe Example (Python):</p>
              <code className="font-mono text-[9px] text-green-success block leading-relaxed">
                cursor.execute(
                <br />
                &nbsp;&nbsp;&quot;SELECT * FROM users WHERE name = %s&quot;,
                <br />
                &nbsp;&nbsp;(user_input,)
                <br />
                )
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Switch mode buttons for levels 1-3 */}
      {currentLevel < 4 && (
        <div className="w-full max-w-4xl flex gap-2 justify-center">
          <button
            onClick={() => setMode(mode === 'attack' ? 'tutorial' : 'attack')}
            className="px-4 py-2 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light hover:scale-105 transition-transform"
          >
            {mode === 'attack' ? 'Tutorial Mode' : 'Attack Mode'}
          </button>
          {currentLevel < 3 && (
            <button
              onClick={nextLevel}
              className="flex items-center gap-1 px-4 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-xs text-white hover:bg-purple-dark hover:scale-105 transition-transform"
            >
              Skip Level
              <ChevronRight size={14} strokeWidth={3} />
            </button>
          )}
          {currentLevel === 3 && (
            <button
              onClick={() => setCurrentLevel(4)}
              className="flex items-center gap-1 px-4 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-xs text-white hover:bg-purple-dark hover:scale-105 transition-transform"
            >
              Go to Defense
              <Shield size={14} strokeWidth={3} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
