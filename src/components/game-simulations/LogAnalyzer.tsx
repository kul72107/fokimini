import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Play, RotateCcw, ChevronRight, Trophy, Star,
  Search, Filter, TrendingUp, Award, HelpCircle, Lock, Unlock,
  AlertTriangle, Info, Zap, Eye, EyeOff, Flag, Pin, Crosshair,
  UserCheck, UserX, FileSearch, Globe, Shield, ShieldAlert,
  Clock, Activity, Server, Wifi, Terminal, Bug
} from 'lucide-react';
import SimuleToolTrainingPanel from './SimuleToolTrainingPanel';

// ─── Types ───────────────────────────────────────────────

interface LogEntry {
  id: string;
  timestamp: string;
  timeNum: number; // for sorting 0-1440 (minutes in day)
  type: LogType;
  sourceIP: string;
  user: string;
  description: string;
  suspicious: boolean; // is this a suspicious log?
  clue: string; // hint about why it's suspicious
}

type LogType =
  | 'login_success'
  | 'login_failed'
  | 'file_access'
  | 'network'
  | 'permission_change'
  | 'admin_action';

interface CaseData {
  id: number;
  name: string;
  description: string;
  attackType: AttackType;
  attackExplanation: string;
  logs: LogEntry[];
  hints: string[];
  learningTopic: string;
  learningContent: string;
}

type AttackType =
  | 'brute_force'
  | 'data_exfiltration'
  | 'privilege_escalation'
  | 'insider_threat';

// ─── Constants ───────────────────────────────────────────

const LOG_COLORS: Record<LogType, string> = {
  login_success: '#4ADE80',
  login_failed: '#F87171',
  file_access: '#FACC15',
  network: '#60A5FA',
  permission_change: '#A78BFA',
  admin_action: '#FB923C',
};

const LOG_LABELS: Record<LogType, string> = {
  login_success: 'Login OK',
  login_failed: 'Login Fail',
  file_access: 'File Access',
  network: 'Network',
  permission_change: 'Permission',
  admin_action: 'Admin',
};

const LOG_ICONS: Record<LogType, React.ElementType> = {
  login_success: UserCheck,
  login_failed: UserX,
  file_access: FileSearch,
  network: Wifi,
  permission_change: Shield,
  admin_action: Terminal,
};

const ATTACK_OPTIONS: { type: AttackType; label: string; icon: React.ElementType }[] = [
  { type: 'brute_force', label: 'Brute Force Attack', icon: Bug },
  { type: 'data_exfiltration', label: 'Data Exfiltration', icon: Server },
  { type: 'privilege_escalation', label: 'Privilege Escalation', icon: ShieldAlert },
  { type: 'insider_threat', label: 'Insider Threat', icon: UserX },
];

const LOG_SIMULETOOLS = [
  'log-analyzer',
  'network-packet-tracer',
  'ids-alert',
  'stego-spy',
  'phishing-detective',
] as const;

// ─── Case Generators ─────────────────────────────────────

function makeLog(
  id: string,
  time: string,
  timeNum: number,
  type: LogType,
  ip: string,
  user: string,
  desc: string,
  suspicious = false,
  clue = ''
): LogEntry {
  return { id, timestamp: time, timeNum, type, sourceIP: ip, user, description: desc, suspicious, clue };
}

const CASES: CaseData[] = [
  // ── Case 1: The Brute ──
  {
    id: 1,
    name: 'The Brute',
    description: 'Someone is trying to break into an account by guessing passwords!',
    attackType: 'brute_force',
    attackExplanation:
      'A brute force attack happens when someone tries many passwords in rapid succession. Here, 15 failed login attempts came from the same IP (192.168.1.50) in under 2 minutes, followed by a successful login — they guessed the password!',
    hints: [
      'Look for many failed logins from the same IP address...',
      'Count how many times 192.168.1.50 appears in failed logins.',
      'After many failures, a success from the same IP is very suspicious!',
    ],
    learningTopic: 'What is a Brute Force Attack?',
    learningContent:
      'Brute force attacks use trial-and-error to guess passwords. Attackers use automated tools to try thousands of passwords quickly. Protection: strong passwords, account lockouts, and multi-factor authentication (MFA).',
    logs: [
      makeLog('c1-1', '09:00', 540, 'login_success', '192.168.1.10', 'alice', 'User alice logged in from workstation', false),
      makeLog('c1-2', '09:15', 555, 'file_access', '192.168.1.10', 'alice', 'alice accessed /docs/report.pdf'),
      makeLog('c1-3', '09:30', 570, 'network', '192.168.1.20', 'server', 'DNS query to ns1.company.com'),
      makeLog('c1-4', '14:00', 840, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "admin"', true, 'Failed login for admin account'),
      makeLog('c1-5', '14:00', 841, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "root"', true, 'Failed login for root account'),
      makeLog('c1-6', '14:01', 842, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "admin"', true, 'Another failed login from same IP!'),
      makeLog('c1-7', '14:01', 843, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "test"', true, 'Pattern: same IP, rapid attempts'),
      makeLog('c1-8', '14:01', 844, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "user"', true, '5th failure in 2 minutes!'),
      makeLog('c1-9', '14:01', 845, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "admin"', true, 'They keep trying admin!'),
      makeLog('c1-10', '14:02', 846, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "password"', true, 'Attempting common username'),
      makeLog('c1-11', '14:02', 847, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "root"', true, '7th failure from 192.168.1.50'),
      makeLog('c1-12', '14:02', 848, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "admin"', true, 'Still hammering the admin account'),
      makeLog('c1-13', '14:02', 849, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "ubuntu"', true, '9th attempt'),
      makeLog('c1-14', '14:03', 850, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "pi"', true, '10th attempt!'),
      makeLog('c1-15', '14:03', 851, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "admin"', true, 'This IP will not give up!'),
      makeLog('c1-16', '14:03', 852, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "root"', true, '12th failure in ~3 minutes'),
      makeLog('c1-17', '14:03', 853, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "test1"', true, 'Pattern continues...'),
      makeLog('c1-18', '14:04', 854, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "admin"', true, '14th attempt!'),
      makeLog('c1-19', '14:04', 855, 'login_failed', '192.168.1.50', 'unknown', 'Failed login for user "root"', true, '15th failed attempt!'),
      makeLog('c1-20', '14:05', 856, 'login_success', '192.168.1.50', 'admin', 'User admin logged in successfully', true, 'SUCCESS after 15 failures! They cracked it!'),
      makeLog('c1-21', '14:06', 857, 'file_access', '192.168.1.50', 'admin', 'admin accessed /etc/shadow file', true, 'Accessing password hashes immediately!'),
      makeLog('c1-22', '14:07', 858, 'admin_action', '192.168.1.50', 'admin', 'admin created new user "backdoor"', true, 'Creating a backdoor account!'),
      makeLog('c1-23', '14:30', 870, 'network', '192.168.1.20', 'server', 'Regular backup upload started'),
      makeLog('c1-24', '15:00', 900, 'login_success', '192.168.1.30', 'charlie', 'User charlie logged in'),
    ],
  },
  // ── Case 2: The Midnight Transfer ──
  {
    id: 2,
    name: 'The Midnight Transfer',
    description: 'Data is leaving the network when nobody is watching...',
    attackType: 'data_exfiltration',
    attackExplanation:
      'Data exfiltration is when someone steals data from a network. In this case, a large data transfer happened at 3AM to an unknown external IP (185.220.101.44) — when no employees should be working.',
    hints: [
      'Look at the timestamps — anything unusual about the time?',
      'Check for connections to external IP addresses.',
      'A 2GB transfer at 3AM is very suspicious!',
    ],
    learningTopic: 'What is Data Exfiltration?',
    learningContent:
      'Data exfiltration is unauthorized data transfer from a network. Attackers often do this during off-hours to avoid detection. Protection: network monitoring, DLP (Data Loss Prevention) tools, and access logging.',
    logs: [
      makeLog('c2-1', '08:00', 480, 'login_success', '192.168.1.10', 'alice', 'User alice logged in'),
      makeLog('c2-2', '08:30', 510, 'file_access', '192.168.1.10', 'alice', 'alice accessed /projects/alpha.docx'),
      makeLog('c2-3', '10:00', 600, 'login_success', '192.168.1.40', 'bob', 'User bob logged in'),
      makeLog('c2-4', '10:15', 615, 'file_access', '192.168.1.40', 'bob', 'bob accessed /code/app.js'),
      makeLog('c2-5', '12:00', 720, 'network', '192.168.1.20', 'server', 'DNS query to google.com'),
      makeLog('c2-6', '13:00', 780, 'login_success', '192.168.1.10', 'alice', 'User alice logged in again'),
      makeLog('c2-7', '14:00', 840, 'file_access', '192.168.1.40', 'bob', 'bob saved /code/app.js'),
      makeLog('c2-8', '17:00', 1020, 'login_success', '192.168.1.50', 'diana', 'User diana logged in'),
      makeLog('c2-9', '17:30', 1050, 'network', '192.168.1.50', 'diana', 'HTTP request to company.com'),
      makeLog('c2-10', '18:00', 1080, 'login_success', '192.168.1.10', 'alice', 'alice logged out'),
      makeLog('c2-11', '03:00', 180, 'login_success', '192.168.1.60', 'unknown', 'Login from workstation WS-99', true, '3AM login? Nobody should be working!'),
      makeLog('c2-12', '03:01', 181, 'network', '192.168.1.60', 'unknown', 'Connection to 185.220.101.44:443', true, 'External connection to unknown IP!'),
      makeLog('c2-13', '03:02', 182, 'file_access', '192.168.1.60', 'unknown', 'Accessed /data/customer_db.sql', true, 'Accessing the customer database!'),
      makeLog('c2-14', '03:05', 185, 'network', '192.168.1.60', 'unknown', 'Data transfer: 2.1GB to 185.220.101.44', true, '2GB transfer to external IP = DATA THEFT!'),
      makeLog('c2-15', '03:06', 186, 'network', '192.168.1.60', 'unknown', 'Connection to 185.220.101.44 closed', true, 'Connection closed after transfer complete'),
      makeLog('c2-16', '03:07', 187, 'login_success', '192.168.1.60', 'unknown', 'User logged out from WS-99', true, 'Quick logout after data transfer'),
      makeLog('c2-17', '09:00', 540, 'login_success', '192.168.1.10', 'alice', 'User alice logged in (morning)'),
      makeLog('c2-18', '09:30', 570, 'file_access', '192.168.1.10', 'alice', 'alice accessed email'),
    ],
  },
  // ── Case 3: The Rogue Admin ──
  {
    id: 3,
    name: 'The Rogue Admin',
    description: 'An employee is abusing their privileges...',
    attackType: 'privilege_escalation',
    attackExplanation:
      'Privilege escalation is when someone gains more access than they should have. Bob, a developer, changed permissions on sensitive files, accessed employee records, and created a new admin account — all beyond his normal role.',
    hints: [
      'Follow Bob\'s actions throughout the day.',
      'Did Bob do anything outside his normal developer duties?',
      'Creating new admin accounts is a major red flag!',
    ],
    learningTopic: 'What is Privilege Escalation?',
    learningContent:
      'Privilege escalation occurs when a user gains access beyond their authorized level. Insiders may abuse existing privileges or exploit vulnerabilities. Protection: principle of least privilege, regular access reviews, and separation of duties.',
    logs: [
      makeLog('c3-1', '08:00', 480, 'login_success', '192.168.1.40', 'bob', 'User bob logged in'),
      makeLog('c3-2', '08:15', 495, 'file_access', '192.168.1.40', 'bob', 'bob accessed /code/app.js'),
      makeLog('c3-3', '09:00', 540, 'file_access', '192.168.1.40', 'bob', 'bob accessed /code/utils.py'),
      makeLog('c3-4', '10:00', 600, 'permission_change', '192.168.1.40', 'bob', 'bob changed permissions on /data/ to 777', true, 'Developer changing data folder permissions to 777!'),
      makeLog('c3-5', '10:05', 605, 'file_access', '192.168.1.40', 'bob', 'bob accessed /data/salaries.xlsx', true, 'Accessing salary data! Not a developer task.'),
      makeLog('c3-6', '10:10', 610, 'file_access', '192.168.1.40', 'bob', 'bob accessed /data/employee_records.csv', true, 'Accessing employee records! Suspicious!'),
      makeLog('c3-7', '10:15', 615, 'file_access', '192.168.1.40', 'bob', 'bob downloaded employee_records.csv', true, 'Downloading sensitive data!'),
      makeLog('c3-8', '10:30', 630, 'admin_action', '192.168.1.40', 'bob', 'bob ran command: useradd -m superuser', true, 'Creating a new admin account!'),
      makeLog('c3-9', '10:31', 631, 'admin_action', '192.168.1.40', 'bob', 'bob added superuser to sudoers group', true, 'Granting sudo privileges to new account!'),
      makeLog('c3-10', '10:32', 632, 'permission_change', '192.168.1.40', 'bob', 'bob changed /etc/sudoers', true, 'Modifying sudo configuration!'),
      makeLog('c3-11', '11:00', 660, 'file_access', '192.168.1.40', 'bob', 'bob accessed /code/app.js'),
      makeLog('c3-12', '12:00', 720, 'network', '192.168.1.20', 'server', 'Regular system update check'),
      makeLog('c3-13', '13:00', 780, 'login_success', '192.168.1.10', 'alice', 'User alice logged in'),
      makeLog('c3-14', '13:15', 795, 'file_access', '192.168.1.10', 'alice', 'alice reviewed quarterly report'),
      makeLog('c3-15', '14:00', 840, 'admin_action', '192.168.1.40', 'bob', 'bob logged out from terminal'),
    ],
  },
  // ── Case 4: Mixed Signals ──
  {
    id: 4,
    name: 'Mixed Signals',
    description: 'Multiple attacks happening at once! The ultimate challenge.',
    attackType: 'brute_force',
    attackExplanation:
      'This case has TWO attacks! First, a brute force attack from 192.168.1.99 against the admin account (10 failed attempts, then success). Then the attacker accessed customer_db.sql and transferred 800MB to an external IP. This is a combined brute force + data exfiltration attack!',
    hints: [
      'There is more than one attack happening here.',
      'Look for the brute force pattern first — many failed logins.',
      'After the login success, look for unusual file access and network activity.',
    ],
    learningTopic: 'Combined Attack Patterns',
    learningContent:
      'Real attacks often combine multiple techniques. First, attackers gain access (brute force), then they steal data (exfiltration). Detection requires correlating different log types across time. This is why SIEM (Security Information and Event Management) tools are critical.',
    logs: [
      makeLog('c4-1', '08:00', 480, 'login_success', '192.168.1.10', 'alice', 'User alice logged in'),
      makeLog('c4-2', '08:30', 510, 'file_access', '192.168.1.10', 'alice', 'alice accessed /projects/report.docx'),
      makeLog('c4-3', '09:00', 540, 'network', '192.168.1.20', 'server', 'DNS query to company-cdn.com'),
      makeLog('c4-4', '11:00', 660, 'login_failed', '192.168.1.99', 'unknown', 'Failed login for "admin"', true, 'Failed login from unknown IP'),
      makeLog('c4-5', '11:00', 661, 'login_failed', '192.168.1.99', 'unknown', 'Failed login for "root"', true, 'Another failure from same IP'),
      makeLog('c4-6', '11:01', 662, 'login_failed', '192.168.1.99', 'unknown', 'Failed login for "admin"', true, 'Pattern: targeting admin account'),
      makeLog('c4-7', '11:01', 663, 'login_failed', '192.168.1.99', 'unknown', 'Failed login for "admin"', true, '4th attempt from 192.168.1.99'),
      makeLog('c4-8', '11:01', 664, 'login_failed', '192.168.1.99', 'unknown', 'Failed login for "root"', true, 'Brute force continues...'),
      makeLog('c4-9', '11:02', 665, 'login_failed', '192.168.1.99', 'unknown', 'Failed login for "test"', true, 'Trying common usernames'),
      makeLog('c4-10', '11:02', 666, 'login_failed', '192.168.1.99', 'unknown', 'Failed login for "user"', true, '7th failure in 2 minutes'),
      makeLog('c4-11', '11:02', 667, 'login_failed', '192.168.1.99', 'unknown', 'Failed login for "admin"', true, 'Back to admin account'),
      makeLog('c4-12', '11:03', 668, 'login_failed', '192.168.1.99', 'unknown', 'Failed login for "admin"', true, '9th failed attempt'),
      makeLog('c4-13', '11:03', 669, 'login_failed', '192.168.1.99', 'unknown', 'Failed login for "root"', true, '10th attempt!'),
      makeLog('c4-14', '11:04', 670, 'login_success', '192.168.1.99', 'admin', 'User admin logged in successfully', true, 'SUCCESS! Password cracked!'),
      makeLog('c4-15', '11:05', 671, 'file_access', '192.168.1.99', 'admin', 'Accessed /data/customer_db.sql', true, 'Accessing database immediately!'),
      makeLog('c4-16', '11:06', 672, 'file_access', '192.168.1.99', 'admin', 'Downloaded customer_db.sql', true, 'Downloading entire customer database!'),
      makeLog('c4-17', '11:07', 673, 'network', '192.168.1.99', 'admin', 'Connection to 45.142.214.58:443', true, 'External connection!'),
      makeLog('c4-18', '11:10', 676, 'network', '192.168.1.99', 'admin', 'Data transfer: 856MB to 45.142.214.58', true, 'Large data transfer to external IP!'),
      makeLog('c4-19', '11:12', 678, 'network', '192.168.1.99', 'admin', 'Connection to 45.142.214.58 closed', true, 'Transfer complete, connection closed'),
      makeLog('c4-20', '11:13', 679, 'login_success', '192.168.1.99', 'admin', 'User logged out', true, 'Quick logout after theft'),
      makeLog('c4-21', '13:00', 780, 'login_success', '192.168.1.10', 'alice', 'User alice logged in'),
      makeLog('c4-22', '14:00', 840, 'file_access', '192.168.1.10', 'alice', 'alice accessed /docs/budget.xlsx'),
      makeLog('c4-23', '15:00', 900, 'network', '192.168.1.20', 'server', 'Scheduled backup to backup.company.com'),
      makeLog('c4-24', '16:00', 960, 'login_success', '192.168.1.40', 'bob', 'User bob logged in'),
    ],
  },
];

// ─── Main Component ──────────────────────────────────────

export default function LogAnalyzer({ onScoreChange }: { onScoreChange: (score: number) => void }) {
  const [currentCase, setCurrentCase] = useState(0);
  const [showCaseSelect, setShowCaseSelect] = useState(true);
  const [flaggedLogs, setFlaggedLogs] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);
  const [selectedAttack, setSelectedAttack] = useState<AttackType | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [caseScores, setCaseScores] = useState<(number | null)[]>(new Array(4).fill(null));
  const [hintIdx, setHintIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showLearning, setShowLearning] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<LogType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false);
  const [sortByTime, setSortByTime] = useState(true);

  // Use ref to always access latest currentCase in async callbacks
  const currentCaseRef = useRef(currentCase);
  useEffect(() => {
    currentCaseRef.current = currentCase;
  }, [currentCase]);

  // Filtered logs - use useMemo with CASES directly to avoid stale closure
  const filteredLogs = useMemo(() => {
    const caseData = CASES[currentCase];
    let logs = [...caseData.logs];
    if (filterType !== 'all') logs = logs.filter((l) => l.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.description.toLowerCase().includes(q) ||
          l.sourceIP.toLowerCase().includes(q) ||
          l.user.toLowerCase().includes(q) ||
          l.type.toLowerCase().includes(q)
      );
    }
    if (showSuspiciousOnly) logs = logs.filter((l) => l.suspicious);
    if (sortByTime) logs.sort((a, b) => a.timeNum - b.timeNum);
    return logs;
  }, [currentCase, filterType, searchQuery, showSuspiciousOnly, sortByTime]);

  // Stats
  const flaggedCount = flaggedLogs.size;
  const suspiciousCount = CASES[currentCase].logs.filter((l) => l.suspicious).length;
  const progress = suspiciousCount > 0
    ? Math.min(100, Math.round((flaggedCount / suspiciousCount) * 100))
    : 0;

  // Reset on case change
  const startCase = useCallback(
    (idx: number) => {
      setCurrentCase(idx);
      setFlaggedLogs(new Set());
      setSolved(false);
      setSelectedAttack(null);
      setShowResult(false);
      setHintIdx(0);
      setShowHint(false);
      setShowLearning(false);
      setFilterType('all');
      setSearchQuery('');
      setShowSuspiciousOnly(false);
      setShowCaseSelect(false);
    },
    []
  );

  const toggleFlag = useCallback((logId: string) => {
    setFlaggedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  }, []);

  const handleSolve = useCallback(() => {
    if (!selectedAttack) return;
    // Use ref to get the latest currentCase, avoiding stale closure
    const caseIdx = currentCaseRef.current;
    const currentCaseData = CASES[caseIdx];
    const correct = selectedAttack === currentCaseData.attackType;
    // Guard against division by zero
    const caseSuspiciousCount = currentCaseData.logs.filter((l) => l.suspicious).length;
    const score = correct ? 100 : (caseSuspiciousCount > 0 ? Math.round((flaggedCount / caseSuspiciousCount) * 50) : 0);

    setSolved(true);
    setShowResult(true);
    onScoreChange(score);

    if (correct) {
      setCaseScores((prev) => {
        const u = [...prev];
        u[caseIdx] = score;
        return u;
      });
    }
  }, [selectedAttack, flaggedCount, onScoreChange]);

  const handleNextCase = () => {
    if (currentCase < CASES.length - 1) {
      startCase(currentCase + 1);
    } else {
      setShowCaseSelect(true);
    }
  };

  // ─── Case Select Screen ────────────────────────────────

  if (showCaseSelect) {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="text-center mb-1">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Crosshair size={28} strokeWidth={3} className="text-purple-primary" />
            <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Log Analyzer</h2>
          </div>
          <p className="font-nunito text-sm text-purple-dark">
            Be a cybersecurity detective! Find the attack hidden in system logs.
          </p>
        </div>

        {/* Progress */}
        <div className="w-full max-w-lg bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2 flex items-center justify-between">
          <span className="font-nunito text-xs font-bold text-yellow-accent">Cases Solved:</span>
          <div className="flex gap-1">
            {caseScores.map((s, i) => (
              <Star
                key={i}
                size={14}
                strokeWidth={2}
                className={s !== null ? 'text-yellow-accent' : 'text-purple-lighter'}
                fill={s !== null ? '#FACC15' : '#DDD6FE'}
              />
            ))}
          </div>
          <span className="font-nunito text-[10px] text-purple-lighter">{caseScores.filter((s) => s !== null).length}/{CASES.length}</span>
        </div>

        {/* Case Grid */}
        <div className="w-full max-w-lg grid grid-cols-2 gap-3">
          {CASES.map((cs, idx) => {
            const isUnlocked = idx === 0 || caseScores[idx - 1] !== null;
            const isSolved = caseScores[idx] !== null;

            return (
              <motion.button
                key={cs.id}
                whileHover={isUnlocked ? { scale: 1.03 } : {}}
                whileTap={isUnlocked ? { scale: 0.97 } : {}}
                onClick={() => isUnlocked && startCase(idx)}
                className={`relative flex flex-col items-center gap-1.5 p-4 rounded-2xl border-4 border-black transition-colors ${
                  isSolved
                    ? 'bg-green-success'
                    : isUnlocked
                    ? 'bg-white hover:bg-purple-pale'
                    : 'bg-gray-200 cursor-not-allowed'
                }`}
                style={{ opacity: isUnlocked ? 1 : 0.5, boxShadow: isUnlocked ? '6px 6px 0px 0px #000' : 'none' }}
              >
                {isSolved && (
                  <div className="absolute -top-2 -right-2 bg-yellow-accent border-[3px] border-black rounded-full p-0.5">
                    <Check size={14} strokeWidth={4} className="text-black" />
                  </div>
                )}
                {!isUnlocked && <Lock size={20} strokeWidth={3} className="text-gray-500" />}
                {isUnlocked && !isSolved && <Eye size={20} strokeWidth={3} className="text-purple-primary" />}
                {isSolved && <Trophy size={20} strokeWidth={3} className="text-yellow-accent" />}
                <span className="font-fredoka text-sm font-bold text-purple-dark">Case {cs.id}</span>
                <span className="font-nunito text-[10px] text-purple-dark text-center leading-tight">{cs.name}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Log Types Legend */}
        <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-3" style={{ boxShadow: '6px 6px 0px 0px #000' }}>
          <p className="font-nunito text-xs font-bold text-purple-dark mb-2 text-center">Log Types Guide</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['login_success', 'Login OK', '#4ADE80', UserCheck],
              ['login_failed', 'Login Fail', '#F87171', UserX],
              ['file_access', 'File Access', '#FACC15', FileSearch],
              ['network', 'Network', '#60A5FA', Wifi],
              ['permission_change', 'Permission', '#A78BFA', Shield],
              ['admin_action', 'Admin', '#FB923C', Terminal],
            ] as [LogType, string, string, React.ElementType][]).map(([type, label, color, Icon]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-5 h-5 rounded border-[2px] border-black flex items-center justify-center" style={{ backgroundColor: color }}>
                  <Icon size={8} strokeWidth={3} className="text-black" />
                </div>
                <span className="font-nunito text-[9px] text-purple-dark">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Game Screen ──────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <Crosshair size={16} strokeWidth={3} className="text-yellow-accent" />
          <span className="font-fredoka text-sm font-bold text-white">Case {CASES[currentCase].id}: {CASES[currentCase].name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-nunito text-[10px] text-purple-lighter">Clues:</span>
          <span className="font-nunito text-xs font-bold text-yellow-accent">{flaggedCount}/{suspiciousCount}</span>
          {solved && caseScores[currentCase] !== null && (
            <Trophy size={14} strokeWidth={3} className="text-yellow-accent" />
          )}
        </div>
        <button
          onClick={() => setShowCaseSelect(true)}
          className="px-2 py-0.5 bg-purple-lighter border-[2px] border-black rounded-full font-nunito text-[9px] font-bold text-purple-dark hover:scale-105 transition-transform"
        >
          Cases
        </button>
      </div>

      {/* Description */}
      <div className="w-full max-w-2xl bg-blue-info rounded-xl border-[3px] border-black px-3 py-1.5 flex items-center gap-2">
        <Info size={14} strokeWidth={3} className="text-white flex-shrink-0" />
        <p className="font-nunito text-xs text-white font-semibold">{CASES[currentCase].description}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl bg-white rounded-xl border-[3px] border-black p-2 flex items-center gap-2">
        <span className="font-nunito text-[9px] text-purple-dark font-bold flex-shrink-0">Progress:</span>
        <div className="flex-1 h-4 bg-purple-pale rounded-full border-[2px] border-black overflow-hidden">
          <motion.div
            className="h-full bg-green-success rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="font-nunito text-[9px] text-purple-dark font-bold flex-shrink-0">{progress}%</span>
      </div>

      {/* Investigation Tools */}
      <div className="w-full max-w-2xl bg-white rounded-2xl border-4 border-black p-3" style={{ boxShadow: '5px 5px 0px 0px #000' }}>
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} strokeWidth={3} className="text-purple-primary" />
          <span className="font-fredoka text-xs font-bold text-purple-dark">Investigation Tools</span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 mb-2">
          <Search size={14} strokeWidth={3} className="text-purple-primary flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search: admin, 192.168, password..."
            className="flex-1 h-8 px-2 font-nunito text-[10px] text-purple-dark bg-purple-pale border-[2px] border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-primary"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-0.5 hover:scale-110 transition-transform">
              <X size={12} strokeWidth={4} className="text-red-alert" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded-full border-[2px] border-black font-nunito text-[8px] font-bold transition-colors ${
              filterType === 'all' ? 'bg-purple-primary text-white' : 'bg-purple-pale text-purple-dark hover:bg-purple-lighter'
            }`}
          >
            All
          </button>
          {(['login_success', 'login_failed', 'file_access', 'network', 'permission_change', 'admin_action'] as LogType[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setFilterType(filterType === t ? 'all' : t)}
                className={`px-2 py-0.5 rounded-full border-[2px] border-black font-nunito text-[8px] font-bold transition-colors flex items-center gap-0.5 ${
                  filterType === t ? 'text-white' : 'text-purple-dark bg-white hover:bg-purple-pale'
                }`}
                style={filterType === t ? { backgroundColor: LOG_COLORS[t] } : {}}
              >
                {LOG_LABELS[t]}
              </button>
            )
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowSuspiciousOnly(!showSuspiciousOnly)}
            className={`px-2 py-0.5 rounded-full border-[2px] border-black font-nunito text-[8px] font-bold transition-colors ${
              showSuspiciousOnly ? 'bg-red-alert text-white' : 'bg-purple-pale text-purple-dark hover:bg-purple-lighter'
            }`}
          >
            <AlertTriangle size={10} strokeWidth={3} className="inline mr-0.5" />
            Suspicious Only
          </button>
          <button
            onClick={() => {
              const suspicious = CASES[currentCase].logs.filter((l) => l.suspicious);
              setFlaggedLogs(new Set(suspicious.map((l) => l.id)));
            }}
            className="px-2 py-0.5 rounded-full border-[2px] border-black font-nunito text-[8px] font-bold bg-yellow-accent text-black hover:scale-105 transition-transform"
          >
            <TrendingUp size={10} strokeWidth={3} className="inline mr-0.5" />
            Auto-Flag Pattern
          </button>
          <button
            onClick={() => {
              setFilterType('login_failed');
              setShowSuspiciousOnly(true);
            }}
            className="px-2 py-0.5 rounded-full border-[2px] border-black font-nunito text-[8px] font-bold bg-blue-info text-white hover:scale-105 transition-transform"
          >
            <Filter size={10} strokeWidth={3} className="inline mr-0.5" />
            Failed Logins
          </button>
          <button
            onClick={() => {
              setShowHint(!showHint);
              if (!showHint) setHintIdx((prev) => Math.min(prev, CASES[currentCase].hints.length - 1));
            }}
            className="px-2 py-0.5 rounded-full border-[2px] border-black font-nunito text-[8px] font-bold bg-purple-lighter text-purple-dark hover:scale-105 transition-transform"
          >
            <HelpCircle size={10} strokeWidth={3} className="inline mr-0.5" />
            Hint
          </button>
        </div>

        {/* Hint Box */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 bg-yellow-accent rounded-lg border-[2px] border-black p-2 flex items-start gap-2">
                <HelpCircle size={14} strokeWidth={3} className="text-black flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-nunito text-[9px] text-black font-semibold">{CASES[currentCase].hints[hintIdx]}</p>
                  <div className="flex gap-1 mt-1">
                    {CASES[currentCase].hints.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setHintIdx(i)}
                        className={`w-5 h-5 rounded-full border border-black font-nunito text-[7px] font-bold ${
                          i === hintIdx ? 'bg-purple-primary text-white' : 'bg-white text-purple-dark'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Log Timeline ──────────────────────────────── */}

      <div className="w-full max-w-2xl bg-white rounded-2xl border-4 border-black overflow-hidden" style={{ boxShadow: '6px 6px 0px 0px #000' }}>
        <div className="bg-purple-dark px-3 py-2 border-b-[3px] border-black flex items-center justify-between">
          <span className="font-fredoka text-xs font-bold text-white">Log Timeline</span>
          <span className="font-nunito text-[9px] text-purple-lighter">{filteredLogs.length} entries</span>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-1.5">
          <AnimatePresence mode="popLayout">
            {filteredLogs.map((log, idx) => {
              const Icon = LOG_ICONS[log.type];
              const isFlagged = flaggedLogs.has(log.id);
              return (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ x: -20, scale: 0.95 }}
                  animate={{ x: 0, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => toggleFlag(log.id)}
                  className={`relative flex items-start gap-2 rounded-xl border-[3px] border-black px-2.5 py-1.5 cursor-pointer transition-colors ${
                    isFlagged ? 'bg-red-alert/15' : 'bg-white hover:bg-purple-pale'
                  }`}
                >
                  {/* Flag indicator */}
                  {isFlagged && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-alert border-[2px] border-black rounded-full flex items-center justify-center"
                    >
                      <Flag size={8} strokeWidth={3} className="text-white" />
                    </motion.div>
                  )}

                  {/* Color stripe */}
                  <div
                    className="w-1.5 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: LOG_COLORS[log.type] }}
                  />

                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg border-[2px] border-black flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: LOG_COLORS[log.type] }}
                  >
                    <Icon size={14} strokeWidth={3} className="text-black" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[9px] font-bold text-purple-dark bg-purple-pale px-1 py-0.5 rounded border border-black">
                        {log.timestamp}
                      </span>
                      <span className="font-nunito text-[8px] font-bold text-purple-primary bg-purple-pale px-1 py-0.5 rounded border border-black">
                        {LOG_LABELS[log.type]}
                      </span>
                      <span className="font-mono text-[8px] text-blue-info bg-blue-info/10 px-1 py-0.5 rounded border border-black">
                        {log.sourceIP}
                      </span>
                      {log.user !== 'unknown' && (
                        <span className="font-nunito text-[8px] text-purple-dark bg-purple-lighter px-1 py-0.5 rounded border border-black">
                          {log.user}
                        </span>
                      )}
                    </div>
                    <p className="font-nunito text-[10px] text-purple-dark mt-0.5 leading-tight">
                      {log.description}
                    </p>

                    {/* Clue (if flagged) */}
                    <AnimatePresence>
                      {isFlagged && log.clue && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 bg-yellow-accent rounded-lg border-[2px] border-black px-2 py-1 flex items-start gap-1">
                            <AlertTriangle size={10} strokeWidth={3} className="text-black flex-shrink-0 mt-0.5" />
                            <span className="font-nunito text-[8px] text-black font-semibold">{log.clue}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Flag button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFlag(log.id);
                    }}
                    className={`w-7 h-7 rounded-full border-[2px] border-black flex items-center justify-center flex-shrink-0 transition-colors ${
                      isFlagged ? 'bg-red-alert' : 'bg-gray-100 hover:bg-red-alert/30'
                    }`}
                  >
                    <Flag size={10} strokeWidth={3} className={isFlagged ? 'text-white' : 'text-gray-400'} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Search size={24} strokeWidth={3} className="text-purple-light" />
              <p className="font-nunito text-xs text-purple-light">No logs match your filters.</p>
              <button
                onClick={() => {
                  setFilterType('all');
                  setSearchQuery('');
                  setShowSuspiciousOnly(false);
                }}
                className="px-3 py-1 bg-purple-lighter border-[2px] border-black rounded-full font-nunito text-[9px] font-bold text-purple-dark hover:scale-105 transition-transform"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Clue Board ────────────────────────────────── */}

      {flaggedCount > 0 && (
        <div className="w-full max-w-2xl bg-purple-pale rounded-2xl border-4 border-black p-3" style={{ boxShadow: '5px 5px 0px 0px #000' }}>
          <div className="flex items-center gap-2 mb-2">
            <Pin size={14} strokeWidth={3} className="text-red-alert" />
            <span className="font-fredoka text-xs font-bold text-purple-dark">Clue Board</span>
            <span className="font-nunito text-[9px] text-purple-primary font-semibold">({flaggedCount} pinned)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(flaggedLogs).map((logId) => {
              const log = CASES[currentCase].logs.find((l) => l.id === logId);
              if (!log) return null;
              return (
                <motion.div
                  key={logId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1 bg-white border-[2px] border-black rounded-full px-2 py-0.5"
                >
                  <div className="w-4 h-4 rounded-full border border-black flex-shrink-0" style={{ backgroundColor: LOG_COLORS[log.type] }} />
                  <span className="font-nunito text-[8px] text-purple-dark font-semibold">{log.timestamp}</span>
                  <span className="font-nunito text-[7px] text-purple-primary">{LOG_LABELS[log.type]}</span>
                  <button onClick={() => toggleFlag(logId)} className="hover:scale-125 transition-transform ml-0.5">
                    <X size={10} strokeWidth={4} className="text-red-alert" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <SimuleToolTrainingPanel
        mission="Incident timelines, traffic evidence, suspicious-object handling, tripwire alerts, and decoy signals."
        toolIds={LOG_SIMULETOOLS}
      />

      {/* ─── Solve Section ─────────────────────────────── */}

      {!solved ? (
        <div className="w-full max-w-2xl bg-white rounded-2xl border-4 border-black p-4" style={{ boxShadow: '6px 6px 0px 0px #000' }}>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={16} strokeWidth={3} className="text-red-alert" />
            <span className="font-fredoka text-sm font-bold text-purple-dark">Solve the Case</span>
          </div>

          <p className="font-nunito text-[10px] text-purple-dark mb-2">What type of attack occurred? Select your answer:</p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {ATTACK_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.type}
                  onClick={() => setSelectedAttack(opt.type)}
                  className={`flex items-center gap-2 p-2 rounded-xl border-[3px] transition-colors ${
                    selectedAttack === opt.type
                      ? 'bg-purple-primary text-white border-black'
                      : 'bg-purple-pale text-purple-dark border-purple-light hover:border-black'
                  }`}
                >
                  <Icon size={16} strokeWidth={3} className={selectedAttack === opt.type ? 'text-white' : 'text-purple-primary'} />
                  <span className="font-nunito text-[10px] font-bold">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSolve}
            disabled={!selectedAttack}
            className="w-full py-2.5 bg-red-alert border-[3px] border-black rounded-xl font-fredoka text-sm font-bold text-white hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Crosshair size={16} strokeWidth={3} />
            Solve Case
          </button>
        </div>
      ) : (
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              className={`w-full max-w-2xl rounded-2xl border-4 border-black p-4 flex flex-col items-center gap-2 ${
                selectedAttack === CASES[currentCase].attackType ? 'bg-green-success' : 'bg-red-alert'
              }`}
              style={{ boxShadow: '6px 6px 0px 0px #000' }}
            >
              {selectedAttack === CASES[currentCase].attackType ? (
                <>
                  <Trophy size={32} strokeWidth={3} className="text-yellow-accent" />
                  <h3 className="font-fredoka text-lg font-bold text-black">Case Solved!</h3>
                  <p className="font-nunito text-xs text-black text-center font-semibold">{CASES[currentCase].attackExplanation}</p>
                  <button
                    onClick={handleNextCase}
                    className="px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito text-xs font-bold text-white hover:scale-105 transition-transform flex items-center gap-1 mt-1"
                  >
                    {currentCase < CASES.length - 1 ? 'Next Case' : 'All Cases Complete!'}
                    <ChevronRight size={14} strokeWidth={3} />
                  </button>
                </>
              ) : (
                <>
                  <X size={32} strokeWidth={4} className="text-white" />
                  <h3 className="font-fredoka text-lg font-bold text-white">Not Quite Right</h3>
                  <p className="font-nunito text-xs text-white text-center">
                    This was actually a <strong>{ATTACK_OPTIONS.find((a) => a.type === CASES[currentCase].attackType)?.label}</strong>.
                  </p>
                  <p className="font-nunito text-[10px] text-white/80 text-center">{CASES[currentCase].attackExplanation}</p>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => {
                        setSolved(false);
                        setShowResult(false);
                        setSelectedAttack(null);
                      }}
                      className="px-4 py-2 bg-white border-[3px] border-black rounded-full font-nunito text-xs font-bold text-red-alert hover:scale-105 transition-transform flex items-center gap-1"
                    >
                      <RotateCcw size={14} strokeWidth={3} />
                      Try Again
                    </button>
                    <button
                      onClick={() => setShowLearning(true)}
                      className="px-4 py-2 bg-purple-dark border-[3px] border-black rounded-full font-nunito text-xs font-bold text-white hover:scale-105 transition-transform flex items-center gap-1"
                    >
                      <Award size={14} strokeWidth={3} />
                      Learn More
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ─── Learning Panel ────────────────────────────── */}

      <AnimatePresence>
        {showLearning && (
          <motion.div
            initial={{ height: 0, opacity: 1 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 1 }}
            className="w-full max-w-2xl bg-yellow-accent rounded-2xl border-4 border-black overflow-hidden"
            style={{ boxShadow: '5px 5px 0px 0px #000' }}
          >
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Award size={14} strokeWidth={3} className="text-black" />
                <span className="font-fredoka text-xs font-bold text-black">{CASES[currentCase].learningTopic}</span>
              </div>
              <p className="font-nunito text-[10px] text-black font-semibold">{CASES[currentCase].learningContent}</p>
              <button
                onClick={() => setShowLearning(false)}
                className="mt-2 px-3 py-1 bg-white border-[2px] border-black rounded-full font-nunito text-[9px] font-bold text-purple-dark hover:scale-105 transition-transform"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Controls ──────────────────────────────────── */}

      <div className="flex gap-2">
        <button
          onClick={() => {
            setFlaggedLogs(new Set());
            setSolved(false);
            setSelectedAttack(null);
            setShowResult(false);
            setFilterType('all');
            setSearchQuery('');
            setShowSuspiciousOnly(false);
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:scale-105 transition-transform"
        >
          <RotateCcw size={14} strokeWidth={3} />
          Reset
        </button>
        <button
          onClick={() => setShowCaseSelect(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:scale-105 transition-transform"
        >
          <Clock size={14} strokeWidth={3} />
          Cases
        </button>
      </div>
    </div>
  );
}
