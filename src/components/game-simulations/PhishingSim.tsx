import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, ShieldAlert, Check, X, Zap, Trophy, ChevronRight, RotateCcw,
  Send, AlertTriangle, Eye, Sparkles, Lock, Unlock, Globe,
  UserCircle, Clock, Link2, FileText, Star, Fingerprint,
  MessageSquare, ThumbsUp, ThumbsDown, BadgeCheck, XCircle
} from 'lucide-react';
import type { OpsContextProps } from '@/lib/opsContext';

interface Props extends OpsContextProps {
  onScoreChange: (score: number) => void;
}

type EmailType = 'legit' | 'phishing';

interface EmailTemplate {
  id: number;
  type: EmailType;
  from: string;
  displayFrom: string;
  subject: string;
  body: string;
  urgency: boolean;
  hasFakeLink: boolean;
  hasSpellingErrors: boolean;
  requestsPersonalInfo: boolean;
  suspiciousSender: boolean;
  indicators: string[];
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 1, type: 'phishing',
    from: 'bank@secure-login.com', displayFrom: 'Your Bank',
    subject: 'URGENT: Your account will be suspended!',
    body: 'Dear Customer,\n\nYour account has been compromised. Click here immediately to verify your information or your account will be CLOSED within 24 hours.\n\nClick here: http://secure-bank-login.tk/verify\n\nThank you,\nBank Security Team',
    urgency: true, hasFakeLink: true, hasSpellingErrors: false, requestsPersonalInfo: true, suspiciousSender: true,
    indicators: ['Urgent language', 'Suspicious sender domain', 'Fake link', 'Requests personal info'],
  },
  {
    id: 2, type: 'legit',
    from: 'newsletter@github.com', displayFrom: 'GitHub',
    subject: 'New features in your GitHub dashboard',
    body: 'Hi there,\n\nWe wanted to let you know about some new features available in your GitHub dashboard. Check them out at https://github.com/dashboard.\n\nThanks for being part of the community!\n\nThe GitHub Team',
    urgency: false, hasFakeLink: false, hasSpellingErrors: false, requestsPersonalInfo: false, suspiciousSender: false,
    indicators: [],
  },
  {
    id: 3, type: 'phishing',
    from: 'paypal-security@paypa1-security.org', displayFrom: 'PayPal Security',
    subject: 'Your PayPal account has been limited!',
    body: 'Dear Valued Customer,\n\nWe noticed unusual activity on your account. Please log in to confirm your identity:\n\nhttp://paypa1-verify.com/login\n\nFailure to respond will result in permanent account suspension.\n\nPayPal Security Department',
    urgency: true, hasFakeLink: true, hasSpellingErrors: true, requestsPersonalInfo: true, suspiciousSender: true,
    indicators: ['Urgent language', 'Misspelled domain (paypa1)', 'Fake link', 'Requests login credentials'],
  },
  {
    id: 4, type: 'legit',
    from: 'support@amazon.com', displayFrom: 'Amazon Support',
    subject: 'Your order #12345 has shipped',
    body: 'Hello,\n\nYour recent order has been shipped and is on its way! Track your package at https://amazon.com/orders.\n\nExpected delivery: June 25th\n\nThanks for shopping with us!',
    urgency: false, hasFakeLink: false, hasSpellingErrors: false, requestsPersonalInfo: false, suspiciousSender: false,
    indicators: [],
  },
  {
    id: 5, type: 'phishing',
    from: 'it-support@company-helpdesk.net', displayFrom: 'IT Support',
    subject: 'Password expired - Immediate action required',
    body: 'Dear Employee,\n\nYour password has expired. Please reset it now using the link below:\n\nhttp://company-password-reset.xyz/reset\n\nNote: If you do not reset within 2 hours, your email access will be revoked.\n\nIT Department',
    urgency: true, hasFakeLink: true, hasSpellingErrors: false, requestsPersonalInfo: true, suspiciousSender: true,
    indicators: ['Urgent language (2 hours)', 'Suspicious sender domain', 'Fake reset link', 'Threat of revocation'],
  },
  {
    id: 6, type: 'legit',
    from: 'team@slack.com', displayFrom: 'Slack',
    subject: 'You have a new message in #general',
    body: 'Hey there,\n\nYou have a new message in the #general channel. Open Slack to check it out: https://slack.com/app\n\nHave a great day!\nSlack Team',
    urgency: false, hasFakeLink: false, hasSpellingErrors: false, requestsPersonalInfo: false, suspiciousSender: false,
    indicators: [],
  },
  {
    id: 7, type: 'phishing',
    from: 'prizes@winner-lottery.club', displayFrom: 'Lottery Winners',
    subject: 'CONGRATULATIONS! You won $1,000,000!',
    body: 'CONGRATULATIONS!!!\n\nYou have been selected as the lucky winner of $1,000,000! To claim your prize, please provide your bank account details and SSN:\n\nClaim now: http://lottery-claim-center.biz/claim\n\nHurry! Offer expires in 24 hours!\n\nLottery Department',
    urgency: true, hasFakeLink: true, hasSpellingErrors: false, requestsPersonalInfo: true, suspiciousSender: true,
    indicators: ['Too good to be true', 'Urgent (24 hours)', 'Requests bank details & SSN', 'Suspicious sender'],
  },
  {
    id: 8, type: 'legit',
    from: 'billing@stripe.com', displayFrom: 'Stripe',
    subject: 'Your monthly invoice is available',
    body: 'Hi,\n\nYour monthly invoice for June is now available. You can view it at https://dashboard.stripe.com/invoices.\n\nAmount due: $29.00\nDue date: July 1st\n\nThanks,\nStripe Billing',
    urgency: false, hasFakeLink: false, hasSpellingErrors: false, requestsPersonalInfo: false, suspiciousSender: false,
    indicators: [],
  },
  {
    id: 9, type: 'phishing',
    from: 'security@amaz0n-security.com', displayFrom: 'Amazon Security',
    subject: 'Unauthorized purchase detected on your account',
    body: 'Dear Amazon Customer,\n\nWe detected an unauthorized purchase of $499.99. If you did not make this purchase, please verify your account immediately:\n\nhttp://amaz0n-account-verify.com/signin\n\nClick here to cancel the order.\n\nAmazon Security',
    urgency: true, hasFakeLink: true, hasSpellingErrors: true, requestsPersonalInfo: true, suspiciousSender: true,
    indicators: ['Misspelled domain (amaz0n)', 'Urgent language', 'Fake link', 'Requests account verification'],
  },
  {
    id: 10, type: 'legit',
    from: 'hello@notion.so', displayFrom: 'Notion',
    subject: 'You were mentioned in a page',
    body: 'Hi,\n\nSomeone mentioned you in a Notion page. View it here: https://notion.so/shared\n\nHappy collaborating!\nThe Notion Team',
    urgency: false, hasFakeLink: false, hasSpellingErrors: false, requestsPersonalInfo: false, suspiciousSender: false,
    indicators: [],
  },
];

function buildOpsTemplates({ target }: NonNullable<OpsContextProps['opsContext']>): EmailTemplate[] {
  const fakeDomain = `login-${target.rootDomain.replace('.', '-')}.ops`;
  return [
    {
      id: 1,
      type: 'phishing',
      from: `security@${fakeDomain}`,
      displayFrom: `${target.platformName} Security`,
      subject: `${target.sessionCookieName} expires in 24 minutes`,
      body: `Dear ${target.standardUser},\n\nYour ${target.platformName} session needs urgent verification. Confirm the ${target.sessionCookieName} token here:\n\nhttp://${fakeDomain}${target.adminPath}\n\nFailure to respond will lock ${target.adminEmail}.\n\n${target.platformName} Security`,
      urgency: true,
      hasFakeLink: true,
      hasSpellingErrors: false,
      requestsPersonalInfo: true,
      suspiciousSender: true,
      indicators: ['Urgent language', `Sender domain is not ${target.rootDomain}`, 'Fake link', `Requests ${target.sessionCookieName}`],
    },
    {
      id: 2,
      type: 'legit',
      from: target.supportEmail,
      displayFrom: `${target.platformName} Support`,
      subject: `${target.backupName} verification receipt`,
      body: `Hi,\n\nThe backup proof ${target.backupName} was verified from ${target.hosts.backup}. No action is needed.\n\nReference: ${target.logs.backupEvent}\n\n${target.platformName} Support`,
      urgency: false,
      hasFakeLink: false,
      hasSpellingErrors: false,
      requestsPersonalInfo: false,
      suspiciousSender: false,
      indicators: [],
    },
    {
      id: 3,
      type: 'phishing',
      from: `helpdesk@${target.hosts.old}`,
      displayFrom: `${target.orgName} Helpdesk`,
      subject: `Immediate ${target.apiKeyName} rotation required`,
      body: `Hello,\n\nWe need to rotate ${target.apiKeyName}. Send the current value and admin password for ${target.adminUser} to continue.\n\nPortal: http://${target.hosts.old}/reset\n\nThis request expires shortly.`,
      urgency: true,
      hasFakeLink: true,
      hasSpellingErrors: false,
      requestsPersonalInfo: true,
      suspiciousSender: true,
      indicators: ['Secret request', `Legacy host ${target.hosts.old}`, 'Fake reset link', 'Urgent language'],
    },
    {
      id: 4,
      type: 'legit',
      from: target.engineerEmail,
      displayFrom: `${target.platformName} Engineering`,
      subject: `${target.apiName} health check complete`,
      body: `Hello,\n\n${target.apiName} on ${target.hosts.api} passed the scheduled health check.\n\nNo credential or token action is required.\n\n${target.orgName}`,
      urgency: false,
      hasFakeLink: false,
      hasSpellingErrors: false,
      requestsPersonalInfo: false,
      suspiciousSender: false,
      indicators: [],
    },
  ];
}

interface BuilderState {
  from: string;
  subject: string;
  body: string;
  urgency: boolean;
  spoofDomain: boolean;
}

export default function PhishingSim({ onScoreChange, opsContext }: Props) {
  const templates = useMemo(() => opsContext ? buildOpsTemplates(opsContext) : EMAIL_TEMPLATES, [opsContext]);
  const [score, setScore] = useState(0);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [builder, setBuilder] = useState<BuilderState>({
    from: '', subject: '', body: '', urgency: false, spoofDomain: false,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [analyzedEmails, setAnalyzedEmails] = useState<Record<number, { guess: EmailType; correct: boolean }>>({});
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [showIndicators, setShowIndicators] = useState<Record<number, boolean>>({});
  const [buildScore, setBuildScore] = useState(0);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = prev + points;
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  const makeGuess = useCallback((emailId: number, guess: EmailType) => {
    const email = templates.find(e => e.id === emailId);
    if (!email) return;
    if (analyzedEmails[emailId]) return; // Already guessed

    const correct = guess === email.type;
    setAnalyzedEmails(prev => ({ ...prev, [emailId]: { guess, correct } }));
    if (correct) {
      setCorrectGuesses(prev => prev + 1);
      addScore(20);
    }
  }, [analyzedEmails, templates, addScore]);

  const toggleIndicators = useCallback((emailId: number) => {
    setShowIndicators(prev => ({ ...prev, [emailId]: !prev[emailId] }));
  }, []);

  const calculateBuildScore = useCallback(() => {
    let pts = 0;
    if (builder.from.includes('@') && builder.from.includes('.')) pts += 10;
    if (builder.subject.length > 0) pts += 10;
    if (builder.body.length > 20) pts += 10;
    if (builder.urgency) pts += 10;
    if (builder.spoofDomain) pts += 10;
    setBuildScore(pts);
    if (pts >= 30) addScore(50);
  }, [builder, addScore]);

  const reset = useCallback(() => {
    setAnalyzedEmails({});
    setShowIndicators({});
    setSelectedEmailId(null);
    setCorrectGuesses(0);
    setBuilder({ from: '', subject: '', body: '', urgency: false, spoofDomain: false });
    setShowPreview(false);
    setBuildScore(0);
  }, []);

  const selectedEmail = templates.find(e => e.id === selectedEmailId);

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-info rounded-2xl border-4 border-black flex items-center justify-center">
            <Mail size={24} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">Phishing Simulator</h2>
            <p className="text-sm text-purple-dark font-nunito">Learn to spot phishing emails!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </div>
          <div className="bg-green-success px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Check size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{correctGuesses}/{templates.length}</span>
          </div>
          <button onClick={reset} className="p-2 bg-purple-light rounded-2xl border-4 border-black hover:bg-purple-primary transition-colors">
            <RotateCcw size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Email Builder + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Email Builder */}
        <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
          <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
            <Mail size={18} strokeWidth={3} />
            Email Builder
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-fredoka text-purple-darker flex items-center gap-1 mb-1">
                <UserCircle size={14} strokeWidth={3} />
                From:
              </label>
              <input
                type="text"
                value={builder.from}
                onChange={e => setBuilder(prev => ({ ...prev, from: e.target.value }))}
                placeholder={opsContext ? `security@${opsContext.target.rootDomain}` : 'bank@secure.com'}
                className="w-full px-3 py-2 rounded-xl border-[3px] border-black font-mono text-sm bg-purple-pale focus:outline-none focus:ring-4 focus:ring-purple-primary"
              />
            </div>
            <div>
              <label className="text-sm font-fredoka text-purple-darker flex items-center gap-1 mb-1">
                <FileText size={14} strokeWidth={3} />
                Subject:
              </label>
              <input
                type="text"
                value={builder.subject}
                onChange={e => setBuilder(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="URGENT: Action required!"
                className="w-full px-3 py-2 rounded-xl border-[3px] border-black font-mono text-sm bg-purple-pale focus:outline-none focus:ring-4 focus:ring-purple-primary"
              />
            </div>
            <div>
              <label className="text-sm font-fredoka text-purple-darker flex items-center gap-1 mb-1">
                <MessageSquare size={14} strokeWidth={3} />
                Body:
              </label>
              <textarea
                value={builder.body}
                onChange={e => setBuilder(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Write your email body..."
                rows={4}
                className="w-full px-3 py-2 rounded-xl border-[3px] border-black font-mono text-sm bg-purple-pale focus:outline-none focus:ring-4 focus:ring-purple-primary resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBuilder(prev => ({ ...prev, urgency: !prev.urgency }))}
                className={`flex-1 px-3 py-2 rounded-xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-all ${
                  builder.urgency ? 'bg-red-alert text-white' : 'bg-purple-pale text-purple-darker'
                }`}
              >
                <AlertTriangle size={16} strokeWidth={3} />
                Urgency {builder.urgency ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setBuilder(prev => ({ ...prev, spoofDomain: !prev.spoofDomain }))}
                className={`flex-1 px-3 py-2 rounded-xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 transition-all ${
                  builder.spoofDomain ? 'bg-purple-primary text-white' : 'bg-purple-pale text-purple-darker'
                }`}
              >
                <Link2 size={16} strokeWidth={3} />
                Spoof {builder.spoofDomain ? 'ON' : 'OFF'}
              </button>
            </div>
            <button
              onClick={() => { setShowPreview(true); calculateBuildScore(); }}
              className="w-full px-4 py-2 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center justify-center gap-2 bg-green-success transition-transform hover:scale-[1.02]"
            >
              <Eye size={16} strokeWidth={3} />
              Preview & Score
            </button>
          </div>
        </div>

        {/* Victim Preview */}
        <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
          <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
            <Eye size={18} strokeWidth={3} />
            Victim Preview
          </h3>
          <div className="bg-purple-pale rounded-xl border-[3px] border-black overflow-hidden">
            {/* Email client header */}
            <div className="bg-purple-primary px-4 py-2 flex items-center gap-2">
              <Mail size={14} strokeWidth={3} color="#FFFFFF" />
              <span className="text-xs font-fredoka text-white">Inbox (1)</span>
            </div>
            {/* Email content */}
            <div className="p-4">
              {builder.urgency && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-red-alert text-white px-3 py-2 rounded-xl border-[3px] border-black mb-3 text-center"
                >
                  <AlertTriangle size={16} strokeWidth={3} className="inline mr-1" />
                  <span className="font-fredoka text-sm">ACT NOW! URGENT!</span>
                </motion.div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-light rounded-full border-2 border-black flex items-center justify-center">
                  <UserCircle size={16} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-fredoka text-purple-darker">{builder.from || 'Unknown Sender'}</p>
                  <p className="text-[10px] font-mono text-purple-dark">{builder.from || 'unknown@email.com'}</p>
                </div>
              </div>
              <h4 className="font-fredoka text-base text-purple-darker mb-2">{builder.subject || '(No subject)'}</h4>
              <div className="bg-white rounded-lg border-2 border-purple-lighter p-3 min-h-[100px]">
                <p className="text-xs font-nunito text-purple-darker whitespace-pre-wrap">{builder.body || 'Email body...'}</p>
                {builder.spoofDomain && (
                  <p className="text-xs font-mono text-blue-info mt-2 underline cursor-pointer">
                    http://secure-bank-login.tk/verify
                  </p>
                )}
              </div>
            </div>
          </div>

          {showPreview && buildScore > 0 && (
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              className="mt-3 bg-yellow-accent/20 rounded-xl border-[3px] border-yellow-accent p-3"
            >
              <p className="text-sm font-fredoka text-purple-darker flex items-center gap-2">
                <Star size={16} strokeWidth={3} />
                Convincing Score: {buildScore}/50
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black mt-1 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(buildScore / 50) * 100}%` }}
                  className="h-full bg-yellow-accent rounded-full"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Spot the Phish Game */}
      <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow mb-4">
        <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
          <Fingerprint size={18} strokeWidth={3} />
          Spot the Phish!
        </h3>
        <p className="text-sm text-purple-dark mb-3 font-nunito">
          Click on each email card, then mark it as Legitimate ✅ or Phishing ❌
        </p>

        {/* Selected Email Detail */}
        <AnimatePresence>
          {selectedEmail && (
            <motion.div
              initial={{ scale: 0.9, height: 0 }}
              animate={{ scale: 1, height: 'auto' }}
              exit={{ scale: 0.9, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-purple-pale rounded-2xl border-[3px] border-black p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center ${
                      selectedEmail.type === 'phishing' ? 'bg-red-alert' : 'bg-green-success'
                    }`}>
                      {selectedEmail.type === 'phishing' ? <Mail size={20} color="#FFF" strokeWidth={3} /> : <BadgeCheck size={20} color="#FFF" strokeWidth={3} />}
                    </div>
                    <div>
                      <p className="font-fredoka text-sm text-purple-darker">{selectedEmail.displayFrom}</p>
                      <p className="text-[10px] font-mono text-purple-dark">{selectedEmail.from}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEmailId(null)} className="p-1 rounded-lg border-2 border-black hover:bg-purple-light">
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>

                <h4 className="font-fredoka text-base text-purple-darker mb-2">{selectedEmail.subject}</h4>
                <div className="bg-white rounded-lg border-2 border-purple-lighter p-3 mb-3">
                  <p className="text-xs font-nunito text-purple-darker whitespace-pre-wrap">{selectedEmail.body}</p>
                </div>

                {/* Guess Buttons */}
                {!analyzedEmails[selectedEmail.id] ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => makeGuess(selectedEmail.id, 'legit')}
                      className="flex-1 px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 bg-green-success transition-transform hover:scale-[1.02]"
                    >
                      <ThumbsUp size={16} strokeWidth={3} />
                      Legitimate
                    </button>
                    <button
                      onClick={() => makeGuess(selectedEmail.id, 'phishing')}
                      className="flex-1 px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 bg-red-alert text-white transition-transform hover:scale-[1.02]"
                    >
                      <ThumbsDown size={16} strokeWidth={3} />
                      Phishing
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className={`text-center px-4 py-3 rounded-2xl border-[3px] border-black ${
                      analyzedEmails[selectedEmail.id].correct ? 'bg-green-success' : 'bg-red-alert'
                    }`}
                  >
                    <span className="font-fredoka text-lg text-white flex items-center justify-center gap-2">
                      {analyzedEmails[selectedEmail.id].correct ? <Check size={24} strokeWidth={3} /> : <X size={24} strokeWidth={3} />}
                      {analyzedEmails[selectedEmail.id].correct ? 'CORRECT!' : 'WRONG!'}
                    </span>
                    <p className="text-xs text-white mt-1">
                      This is a <strong>{selectedEmail.type}</strong> email
                    </p>
                  </motion.div>
                )}

                {/* Analyze Button */}
                {analyzedEmails[selectedEmail.id]?.correct && (
                  <button
                    onClick={() => toggleIndicators(selectedEmail.id)}
                    className="w-full mt-2 px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 bg-yellow-accent transition-transform hover:scale-[1.02]"
                  >
                    <Sparkles size={16} strokeWidth={3} />
                    {showIndicators[selectedEmail.id] ? 'Hide' : 'Show'} Indicators
                  </button>
                )}

                {/* Indicators */}
                <AnimatePresence>
                  {showIndicators[selectedEmail.id] && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-1">
                        {selectedEmail.indicators.map((ind, i) => (
                          <motion.div
                            key={i}
                            initial={{ x: -20 }}
                            animate={{ x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-2 bg-red-alert/10 rounded-lg border-2 border-red-alert px-3 py-1.5"
                          >
                            <AlertTriangle size={14} strokeWidth={3} color="#F87171" />
                            <span className="text-xs font-nunito text-red-700">{ind}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {templates.map(email => {
            const guess = analyzedEmails[email.id];
            return (
              <motion.button
                key={email.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedEmailId(email.id)}
                className={`p-3 rounded-xl border-[3px] border-black text-left transition-all ${
                  selectedEmailId === email.id
                    ? 'bg-purple-primary text-white scale-105'
                    : guess?.correct
                      ? 'bg-green-success/20 border-green-success'
                      : guess && !guess.correct
                        ? 'bg-red-alert/20 border-red-alert'
                        : 'bg-purple-pale hover:bg-purple-lighter'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <Mail size={12} strokeWidth={3} />
                  <span className="text-[10px] font-mono truncate">{email.from}</span>
                </div>
                <p className="text-[10px] font-nunito truncate font-bold">{email.subject}</p>
                {guess && (
                  <div className="mt-1 flex items-center gap-1">
                    {guess.correct ? (
                      <Check size={12} strokeWidth={3} color="#4ADE80" />
                    ) : (
                      <X size={12} strokeWidth={3} color="#F87171" />
                    )}
                    <span className="text-[9px]">{guess.guess === 'phishing' ? 'Phishing' : 'Legit'}</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom: Phishing Indicators Checklist */}
      <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
        <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
          <ShieldAlert size={18} strokeWidth={3} />
          Phishing Indicators Checklist
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { label: 'Urgent language', icon: <Clock size={14} strokeWidth={3} />, desc: '"Act Now!", "Urgent!"' },
            { label: 'Suspicious sender', icon: <UserCircle size={14} strokeWidth={3} />, desc: 'Wrong domain name' },
            { label: 'Fake link', icon: <Link2 size={14} strokeWidth={3} />, desc: 'URLs that look similar' },
            { label: 'Spelling errors', icon: <FileText size={14} strokeWidth={3} />, desc: 'Typos in domain' },
            { label: 'Requests info', icon: <Lock size={14} strokeWidth={3} />, desc: 'Asks for passwords/SSN' },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="bg-purple-pale rounded-xl border-[3px] border-black p-2 text-center"
            >
              <div className="flex items-center justify-center gap-1 mb-1 text-purple-primary">
                {item.icon}
                <AlertTriangle size={14} strokeWidth={3} color="#FACC15" />
              </div>
              <p className="text-xs font-fredoka text-purple-darker">{item.label}</p>
              <p className="text-[9px] font-nunito text-purple-dark">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
