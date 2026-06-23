import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle, MessageSquare, Phone, Mail, ShieldCheck, ShieldAlert,
  Trophy, RotateCcw, Sparkles, Check, X, AlertTriangle, Eye, Lock,
  User, Building2, Crown, Wifi, FileText, Send, Target, Star,
  ChevronRight, ThumbsUp, ThumbsDown, Lightbulb, Fingerprint
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type RoleType = 'it_support' | 'coworker' | 'boss' | 'vendor' | 'friend';
type ScenarioType = 'password_reset' | 'urgent_request' | 'prize' | 'tech_issue' | 'update';
type CommType = 'email' | 'call' | 'sms';

interface TargetProfile {
  id: number;
  name: string;
  role: string;
  company: string;
  traits: string[];
  weaknesses: string[];
  avatar: string;
}

interface PretextResult {
  believability: number;
  identifiedRisks: string[];
  feedback: string;
}

const TARGETS: TargetProfile[] = [
  {
    id: 1, name: 'Emily Watson', role: 'Marketing Manager', company: 'TechCorp',
    traits: ['Busy schedule', 'Trusts IT team', 'Clicks links quickly', 'Hates technical problems'],
    weaknesses: ['Urgency', 'Authority figures', 'Fear of losing data'],
    avatar: 'EW',
  },
  {
    id: 2, name: 'James Park', role: 'Junior Developer', company: 'StartupXYZ',
    traits: ['Eager to please', 'New to the team', 'Uses same passwords', 'Works late hours'],
    weaknesses: ['Peer pressure', 'Wants to impress', 'Afraid to ask questions'],
    avatar: 'JP',
  },
  {
    id: 3, name: 'Linda Garcia', role: 'HR Director', company: 'BigEnterprise',
    traits: ['Process-oriented', 'Handles sensitive data', 'Trusts colleagues', 'Always available'],
    weaknesses: ['Too helpful', 'Trusts too easily', 'Worries about compliance'],
    avatar: 'LG',
  },
  {
    id: 4, name: 'Tom Baker', role: 'Sales Rep', company: 'GlobalSales Inc',
    traits: ['Competitive', 'Always on phone', 'Loves prizes', 'Shares too much'],
    weaknesses: ['Greed', 'Competitions', 'Does not verify sources'],
    avatar: 'TB',
  },
];

const ROLES: { id: RoleType; label: string; icon: typeof User; desc: string }[] = [
  { id: 'it_support', label: 'IT Support', icon: Wifi, desc: 'Pretend to be the IT help desk' },
  { id: 'coworker', label: 'Coworker', icon: User, desc: 'Act like a friendly colleague' },
  { id: 'boss', label: 'Boss/CEO', icon: Crown, desc: 'Impersonate a manager or executive' },
  { id: 'vendor', label: 'Vendor', icon: Building2, desc: 'Pretend to be a service provider' },
  { id: 'friend', label: 'Friend', icon: UserCircle, desc: 'Act like someone they know' },
];

const SCENARIOS: { id: ScenarioType; label: string; icon: typeof FileText; desc: string }[] = [
  { id: 'password_reset', label: 'Password Reset', icon: Lock, desc: 'Ask them to reset their password via a fake link' },
  { id: 'urgent_request', label: 'Urgent Request', icon: AlertTriangle, desc: 'Create an emergency that requires immediate action' },
  { id: 'prize', label: 'Prize Notification', icon: Trophy, desc: 'Tell them they won something and need to claim it' },
  { id: 'tech_issue', label: 'Tech Problem', icon: Wifi, desc: 'Claim their account has suspicious activity' },
  { id: 'update', label: 'Software Update', icon: FileText, desc: 'Ask them to install a fake update' },
];

const COMMS: { id: CommType; label: string; icon: typeof Mail; desc: string }[] = [
  { id: 'email', label: 'Email', icon: Mail, desc: 'Send a deceptive email message' },
  { id: 'call', label: 'Phone Call', icon: Phone, desc: 'Make a convincing phone call' },
  { id: 'sms', label: 'SMS/Text', icon: MessageSquare, desc: 'Send a text message' },
];

const COUNTERMEASURES = [
  { id: 'verify', label: 'Verify Identity', desc: 'Call back using a known number' },
  { id: 'check_url', label: 'Check URLs', desc: 'Hover over links to see real addresses' },
  { id: 'question', label: 'Ask Questions', desc: 'Ask details only the real person would know' },
  { id: 'escalate', label: 'Escalate', desc: 'Report to IT/security team' },
  { id: 'slow_down', label: 'Slow Down', desc: 'Urgency is a red flag - take your time' },
  { id: 'channel', label: 'Use Known Channel', desc: 'Contact through official channels only' },
];

export default function PretextEngine({ onScoreChange }: Props) {
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [selectedComm, setSelectedComm] = useState<CommType | null>(null);
  const [selectedCounters, setSelectedCounters] = useState<string[]>([]);
  const [result, setResult] = useState<PretextResult | null>(null);
  const [score, setScore] = useState(0);
  const [scenariosBuilt, setScenariosBuilt] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const target = TARGETS[selectedTarget];

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = prev + points;
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  const calculateResult = () => {
    if (!selectedRole || !selectedScenario || !selectedComm) return;

    let believability = 20;
    const risks: string[] = [];

    // Role matching with target
    if (selectedRole === 'it_support' && target.weaknesses.includes('Trusts IT team')) {
      believability += 25;
      risks.push('Target trusts IT team - high vulnerability!');
    }
    if (selectedRole === 'boss' && target.weaknesses.includes('Authority figures')) {
      believability += 25;
      risks.push('Authority pressure makes this very effective!');
    }
    if (selectedRole === 'coworker' && target.weaknesses.includes('Peer pressure')) {
      believability += 20;
      risks.push('Peer trust makes this dangerous!');
    }
    if (selectedRole === 'friend') {
      believability += 15;
      risks.push('Personal relationships lower defenses!');
    }

    // Scenario effectiveness
    if (selectedScenario === 'password_reset') {
      believability += 15;
      risks.push('Password resets are common and trusted!');
    }
    if (selectedScenario === 'urgent_request' && target.weaknesses.includes('Urgency')) {
      believability += 20;
      risks.push('Urgency bypasses critical thinking!');
    }
    if (selectedScenario === 'prize' && target.weaknesses.includes('Greed')) {
      believability += 20;
      risks.push('Greed makes people ignore red flags!');
    }
    if (selectedScenario === 'tech_issue') {
      believability += 15;
      risks.push('Fear of data loss triggers panic!');
    }

    // Communication channel
    if (selectedComm === 'email') believability += 10;
    if (selectedComm === 'sms') believability += 15; // SMS feels more personal
    if (selectedComm === 'call') believability += 20; // Voice is most convincing

    // Countermeasures reduce believability (they are defenses)
    const countersEffective = selectedCounters.length;
    believability -= countersEffective * 15;

    if (countersEffective > 0) {
      risks.push(`${countersEffective} countermeasure(s) would stop this attack!`);
    }

    const clamped = Math.max(5, Math.min(95, believability));

    let feedback = '';
    if (clamped >= 70) feedback = 'This pretext is highly convincing! The target would likely fall for it.';
    else if (clamped >= 40) feedback = 'Moderately convincing. Some targets might fall for it.';
    else feedback = 'Low effectiveness. Countermeasures would likely prevent this attack.';

    setResult({ believability: clamped, identifiedRisks: risks, feedback });
    setScenariosBuilt(prev => prev + 1);
    addScore(30);
    if (countersEffective >= 2) addScore(60);
    setShowPreview(true);
  };

  const toggleCountermeasure = (id: string) => {
    setSelectedCounters(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const reset = () => {
    setSelectedRole(null);
    setSelectedScenario(null);
    setSelectedComm(null);
    setSelectedCounters([]);
    setResult(null);
    setShowPreview(false);
  };

  const getPretextMessage = () => {
    const role = ROLES.find(r => r.id === selectedRole);
    const scenario = SCENARIOS.find(s => s.id === selectedScenario);
    const comm = COMMS.find(c => c.id === selectedComm);
    if (!role || !scenario || !comm) return '';

    const messages: Record<string, string> = {
      'password_reset_email': `From: ${role.label} <${role.id}@${target.company.toLowerCase().replace(' ', '')}.com>\n\nSubject: Action Required: Password Reset\n\nHi ${target.name.split(' ')[0]},\n\nOur system detected an expired password on your account. Please reset it within 2 hours to avoid account suspension.\n\nClick here to reset: http://${role.id}-portal.${target.company.toLowerCase().replace(' ', '')}-verify.com/reset\n\nThanks,\n${role.label} Team`,
      'urgent_request_email': `From: ${role.label} <${role.id}@${target.company.toLowerCase().replace(' ', '')}.com>\n\nSubject: URGENT: Need immediate response\n\nHi ${target.name.split(' ')[0]},\n\nThis is urgent! I need you to send me the client files ASAP. The deadline is in 30 minutes!\n\nPlease reply with the documents attached.\n\nThanks!`,
      'prize_email': `From: Prizes <winners@prize-${target.company.toLowerCase().replace(' ', '')}.com>\n\nSubject: CONGRATULATIONS ${target.name}!\n\nYou won a $500 gift card! Click here to claim your prize:\n\nhttp://prize-claim-center.com/winner\n\nHurry! Offer expires in 24 hours!`,
      'tech_issue_email': `From: ${role.label} <security@${target.company.toLowerCase().replace(' ', '')}.com>\n\nSubject: Suspicious login detected on your account\n\nHi ${target.name.split(' ')[0]},\n\nWe noticed a login from an unusual location. Please verify your account immediately:\n\nhttp://security-verify-${target.company.toLowerCase().replace(' ', '')}.com/verify\n\nIf you do not respond, your account will be locked.`,
      'update_email': `From: IT Team <updates@${target.company.toLowerCase().replace(' ', '')}.com>\n\nSubject: Critical Software Update Required\n\nPlease install the urgent security update:\n\nhttp://update-${target.company.toLowerCase().replace(' ', '')}.com/patch\n\nFailure to update within 24 hours may result in data loss.`,
    };

    return messages[`${scenario.id}_${comm.id}`] || `[${scenario.label} via ${comm.label}]\n\nThis is a simulated ${scenario.label.toLowerCase()} message sent as a ${comm.label.toLowerCase()} from ${role.label}.`;
  };

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-12 h-12 bg-purple-primary rounded-2xl border-4 border-black flex items-center justify-center"
          >
            <Fingerprint size={24} color="#FFFFFF" strokeWidth={3} />
          </motion.div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">Pretext Engine</h2>
            <p className="text-sm text-purple-dark font-nunito">Learn to recognize social engineering!</p>
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
            className="bg-purple-primary px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2 text-white"
          >
            <Target size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{scenariosBuilt}</span>
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

      {/* Main 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Target Profile */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-base text-purple-darker mb-3 flex items-center gap-2">
              <Target size={18} strokeWidth={3} />
              Select Target
            </h3>
            <div className="space-y-2">
              {TARGETS.map((t, i) => (
                <motion.button
                  key={t.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedTarget(i); reset(); }}
                  className={`w-full px-3 py-2 rounded-xl border-[3px] border-black flex items-center gap-3 text-left transition-colors ${
                    selectedTarget === i ? 'bg-purple-primary text-white' : 'bg-purple-pale text-purple-darker'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center ${
                    selectedTarget === i ? 'bg-white' : 'bg-purple-light'
                  }`}>
                    <span className={`font-fredoka text-sm ${selectedTarget === i ? 'text-purple-primary' : 'text-white'}`}>
                      {t.avatar}
                    </span>
                  </div>
                  <div>
                    <p className="font-fredoka text-xs">{t.name}</p>
                    <p className="text-[10px] opacity-80">{t.role} @ {t.company}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Target Details */}
          <motion.div
            layout
            className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full border-[3px] border-black bg-purple-light flex items-center justify-center">
                <span className="font-fredoka text-lg text-white">{target.avatar}</span>
              </div>
              <div>
                <h4 className="font-fredoka text-sm text-purple-darker">{target.name}</h4>
                <p className="text-[10px] font-nunito text-purple-dark">{target.role} at {target.company}</p>
              </div>
            </div>

            <div className="mb-3">
              <p className="font-fredoka text-xs text-purple-darker mb-1 flex items-center gap-1">
                <User size={12} strokeWidth={3} /> Traits
              </p>
              <div className="flex flex-wrap gap-1">
                {target.traits.map((trait, i) => (
                  <span key={i} className="text-[10px] bg-purple-pale border-2 border-black rounded-lg px-2 py-0.5 font-nunito text-purple-dark">
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-fredoka text-xs text-red-600 mb-1 flex items-center gap-1">
                <AlertTriangle size={12} strokeWidth={3} /> Weaknesses
              </p>
              <div className="flex flex-wrap gap-1">
                {target.weaknesses.map((w, i) => (
                  <motion.span
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    className="text-[10px] bg-red-50 border-2 border-red-alert rounded-lg px-2 py-0.5 font-nunito text-red-600"
                  >
                    {w}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Center: Pretext Builder */}
        <div className="space-y-4">
          {/* Role Selection */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-base text-purple-darker mb-3 flex items-center gap-2">
              <UserCircle size={18} strokeWidth={3} />
              Pretender Role
            </h3>
            <div className="space-y-2">
              {ROLES.map(role => {
                const Icon = role.icon;
                return (
                  <motion.button
                    key={role.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedRole(role.id); setResult(null); }}
                    className={`w-full px-3 py-2 rounded-xl border-[3px] border-black flex items-center gap-3 text-left transition-colors ${
                      selectedRole === role.id ? 'bg-purple-primary text-white' : 'bg-purple-pale text-purple-darker'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center ${
                      selectedRole === role.id ? 'bg-white' : 'bg-purple-light'
                    }`}>
                      <Icon size={16} strokeWidth={3} className={selectedRole === role.id ? 'text-purple-primary' : 'text-white'} />
                    </div>
                    <div>
                      <p className="font-fredoka text-xs">{role.label}</p>
                      <p className="text-[9px] opacity-80">{role.desc}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Scenario Selection */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-base text-purple-darker mb-3 flex items-center gap-2">
              <FileText size={18} strokeWidth={3} />
              Scenario
            </h3>
            <div className="space-y-2">
              {SCENARIOS.map(scenario => {
                const Icon = scenario.icon;
                return (
                  <motion.button
                    key={scenario.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedScenario(scenario.id); setResult(null); }}
                    className={`w-full px-3 py-2 rounded-xl border-[3px] border-black flex items-center gap-3 text-left transition-colors ${
                      selectedScenario === scenario.id ? 'bg-red-alert text-white' : 'bg-purple-pale text-purple-darker'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center ${
                      selectedScenario === scenario.id ? 'bg-white' : 'bg-purple-light'
                    }`}>
                      <Icon size={16} strokeWidth={3} className={selectedScenario === scenario.id ? 'text-red-alert' : 'text-white'} />
                    </div>
                    <div>
                      <p className="font-fredoka text-xs">{scenario.label}</p>
                      <p className="text-[9px] opacity-80">{scenario.desc}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Communication Method */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-base text-purple-darker mb-3 flex items-center gap-2">
              <MessageSquare size={18} strokeWidth={3} />
              Communication
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {COMMS.map(comm => {
                const Icon = comm.icon;
                return (
                  <motion.button
                    key={comm.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedComm(comm.id); setResult(null); }}
                    className={`p-3 rounded-xl border-[3px] border-black text-center transition-colors ${
                      selectedComm === comm.id ? 'bg-blue-info text-white' : 'bg-purple-pale text-purple-darker'
                    }`}
                  >
                    <Icon size={20} strokeWidth={3} className="mx-auto mb-1" />
                    <p className="font-fredoka text-[10px]">{comm.label}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Build Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={calculateResult}
            disabled={!selectedRole || !selectedScenario || !selectedComm}
            className={`w-full px-4 py-3 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 ${
              selectedRole && selectedScenario && selectedComm
                ? 'bg-green-success hover:brightness-105'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            <Send size={18} strokeWidth={3} />
            Test Pretext
          </motion.button>
        </div>

        {/* Right: Preview & Countermeasures */}
        <div className="space-y-4">
          {/* Preview Panel */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-base text-purple-darker mb-3 flex items-center gap-2">
              <Eye size={18} strokeWidth={3} />
              Message Preview
            </h3>
            <div className="bg-purple-pale rounded-xl border-2 border-black p-3 min-h-[180px]">
              {selectedRole && selectedScenario && selectedComm ? (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                >
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-lighter">
                    <div className="w-8 h-8 rounded-full border-2 border-black bg-purple-light flex items-center justify-center">
                      {ROLES.find(r => r.id === selectedRole)?.icon && (
                        <span className="text-[10px] text-white">
                          {ROLES.find(r => r.id === selectedRole)!.label.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-fredoka text-xs text-purple-darker">
                        {ROLES.find(r => r.id === selectedRole)?.label}
                      </p>
                      <p className="text-[9px] font-mono text-purple-dark">
                        via {COMMS.find(c => c.id === selectedComm)?.label}
                      </p>
                    </div>
                  </div>
                  <pre className="text-[10px] font-nunito text-purple-darker whitespace-pre-wrap overflow-y-auto max-h-48">
                    {getPretextMessage()}
                  </pre>
                </motion.div>
              ) : (
                <div className="text-center py-8">
                  <Eye size={32} strokeWidth={3} className="text-purple-light mx-auto mb-2" />
                  <p className="font-fredoka text-sm text-purple-dark">Select options to preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Countermeasures */}
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-base text-purple-darker mb-3 flex items-center gap-2">
              <ShieldCheck size={18} strokeWidth={3} />
              Countermeasures
              <span className="text-[10px] font-nunito text-purple-dark">(+60 pts for 2+)</span>
            </h3>
            <div className="space-y-2">
              {COUNTERMEASURES.map(cm => (
                <motion.button
                  key={cm.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleCountermeasure(cm.id)}
                  className={`w-full px-3 py-2 rounded-xl border-[3px] border-black flex items-center gap-3 text-left transition-colors ${
                    selectedCounters.includes(cm.id) ? 'bg-green-success' : 'bg-purple-pale'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center ${
                    selectedCounters.includes(cm.id) ? 'bg-white' : 'bg-purple-light'
                  }`}>
                    {selectedCounters.includes(cm.id) ? (
                      <Check size={12} strokeWidth={3} className="text-green-600" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-fredoka text-xs text-purple-darker">{cm.label}</p>
                    <p className="text-[9px] font-nunito text-purple-dark">{cm.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
              >
                <h3 className="font-fredoka text-base text-purple-darker mb-3 flex items-center gap-2">
                  <Star size={18} strokeWidth={3} />
                  Analysis Result
                </h3>

                {/* Believability Meter */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-fredoka text-xs text-purple-darker">Convincing Level</span>
                    <span className={`font-fredoka text-sm ${
                      result.believability >= 70 ? 'text-red-600' : result.believability >= 40 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {result.believability}%
                    </span>
                  </div>
                  <div className="w-full bg-purple-lighter rounded-full h-4 border-[3px] border-black overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.believability}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: result.believability >= 70 ? '#F87171' : result.believability >= 40 ? '#FACC15' : '#4ADE80',
                      }}
                    />
                  </div>
                </div>

                {/* Risks */}
                <div className="space-y-1 mb-3">
                  {result.identifiedRisks.map((risk, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -10 }}
                      animate={{ x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-start gap-2 rounded-lg border-2 px-3 py-1.5 ${
                        risk.includes('stop') || risk.includes('countermeasure')
                          ? 'bg-green-50 border-green-success'
                          : 'bg-red-50 border-red-alert'
                      }`}
                    >
                      {risk.includes('stop') || risk.includes('countermeasure') ? (
                        <ShieldCheck size={14} strokeWidth={3} className="text-green-success shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={14} strokeWidth={3} className="text-red-alert shrink-0 mt-0.5" />
                      )}
                      <span className="text-[10px] font-nunito text-purple-darker">{risk}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Feedback */}
                <div className="bg-purple-pale rounded-xl border-2 border-black p-3">
                  <p className="text-xs font-nunito text-purple-darker flex items-start gap-2">
                    <Lightbulb size={14} strokeWidth={3} className="text-yellow-accent shrink-0 mt-0.5" />
                    {result.feedback}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Education Panel */}
      <motion.div
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        className="mt-4 bg-white rounded-2xl border-4 border-black p-4 card-shadow"
      >
        <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
          <ShieldCheck size={18} strokeWidth={3} />
          How to Spot Pretexting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { title: 'Unexpected Contact', icon: <Phone size={20} strokeWidth={3} />, color: '#F87171', tip: 'Be suspicious of unexpected calls, texts, or emails asking for info.' },
            { title: 'Too Much Urgency', icon: <AlertTriangle size={20} strokeWidth={3} />, color: '#FACC15', tip: 'Attackers pressure you to act fast so you do not think critically.' },
            { title: 'Verify Identity', icon: <Lock size={20} strokeWidth={3} />, color: '#60A5FA', tip: 'Always verify who someone is through a separate, trusted channel.' },
            { title: 'Never Share Secrets', icon: <ShieldCheck size={20} strokeWidth={3} />, color: '#4ADE80', tip: 'No legitimate company will ask for your password over email or phone.' },
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
