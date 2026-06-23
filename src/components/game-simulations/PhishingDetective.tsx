import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Mail, User, Link as LinkIcon, Paperclip } from 'lucide-react';

interface PhishingDetectiveProps {
  onScoreChange: (score: number) => void;
}

interface EmailChallenge {
  id: number;
  from: string;
  fromDisplay: string;
  subject: string;
  body: string;
  isPhishing: boolean;
  suspiciousElements: {
    id: string;
    label: string;
    x: number;
    y: number;
    description: string;
  }[];
}

const emailChallenges: EmailChallenge[] = [
  {
    id: 1,
    from: 'security@paypa1-verify.com',
    fromDisplay: 'PayPal Security Team',
    subject: 'Urgent: Your account has been compromised!',
    body: 'Dear valued customer,\n\nWe have detected unusual activity on your account. Your account will be suspended in 24 hours unless you verify your information immediately.\n\nClick here to verify: http://paypa1-verify.com/secure\n\nBest regards,\nPayPal Security Team',
    isPhishing: true,
    suspiciousElements: [
      { id: 'sender', label: 'Sender', x: 15, y: 15, description: 'Fake email domain: "paypa1-verify.com" instead of paypal.com' },
      { id: 'urgency', label: 'Urgency', x: 50, y: 35, description: 'Creates false urgency: "suspended in 24 hours"' },
      { id: 'link', label: 'Link', x: 30, y: 65, description: 'Suspicious link: paypa1-verify.com is not the real PayPal domain' },
    ],
  },
  {
    id: 2,
    from: 'noreply@amazon.com',
    fromDisplay: 'Amazon',
    subject: 'Your order #12345 has shipped',
    body: 'Hello,\n\nYour recent order has been shipped and is on its way!\n\nOrder: #12345\nItem: Wireless Headphones\nEstimated delivery: Dec 15-18\n\nTrack your package: https://amazon.com/gp/orders\n\nThanks for shopping with us!',
    isPhishing: false,
    suspiciousElements: [],
  },
  {
    id: 3,
    from: 'prizes@lucky-winner.xyz',
    fromDisplay: 'Congratulations! You Won!',
    subject: 'You have won $1,000,000! Claim now!',
    body: 'CONGRATULATIONS!!!\n\nYou have been selected as the lucky winner of $1,000,000 in our international lottery!\n\nTo claim your prize, simply:\n1. Send us your bank details\n2. Pay a small processing fee of $50\n3. Receive your millions!\n\nReply NOW with your info!',
    isPhishing: true,
    suspiciousElements: [
      { id: 'sender', label: 'Sender', x: 15, y: 15, description: 'Unknown sender from suspicious domain: lucky-winner.xyz' },
      { id: 'prize', label: 'Too Good', x: 50, y: 30, description: 'If it sounds too good to be true, it probably is!' },
      { id: 'fee', label: 'Fee Scam', x: 30, y: 75, description: 'Asking for money to claim a prize is a classic scam' },
    ],
  },
];

export default function PhishingDetective({ onScoreChange }: PhishingDetectiveProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [foundElements, setFoundElements] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const currentEmail = emailChallenges[currentIndex];
  const totalScore = emailChallenges.reduce((sum, e) => sum + e.suspiciousElements.length * 25, 0);

  const handleElementClick = (elementId: string) => {
    if (foundElements.includes(elementId)) return;
    const newFound = [...foundElements, elementId];
    setFoundElements(newFound);
    setSelectedElement(elementId);
    const newScore = score + 25;
    setScore(newScore);
    onScoreChange((newScore / totalScore) * 100);

    setTimeout(() => setSelectedElement(null), 2000);
  };

  const handleNext = () => {
    if (currentIndex < emailChallenges.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFoundElements([]);
      setShowResult(false);
    }
  };

  const allFound = currentEmail.suspiciousElements.length > 0
    ? foundElements.filter((f) => currentEmail.suspiciousElements.some((e) => e.id === f)).length === currentEmail.suspiciousElements.length
    : true;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-nunito text-sm font-semibold text-purple-dark">
            Email {currentIndex + 1} of {emailChallenges.length}
          </span>
          <span className="font-nunito text-sm font-bold text-purple-primary">
            Score: {score}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentEmail.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white rounded-2xl border-4 border-black overflow-hidden"
          >
            {/* Email Header */}
            <div className="bg-purple-lighter border-b-[3px] border-black p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={18} strokeWidth={3} className="text-purple-primary" />
                <span className="font-nunito text-xs font-bold text-purple-dark uppercase tracking-wider">
                  Inbox
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User size={14} strokeWidth={3} className="text-purple-light" />
                  <span className="font-nunito text-sm text-purple-dark font-semibold">From:</span>
                  <button
                    onClick={() => {
                      const el = currentEmail.suspiciousElements.find((e) => e.id === 'sender');
                      if (el) handleElementClick('sender');
                    }}
                    className={`font-nunito text-sm px-2 py-0.5 rounded border-[2px] border-black transition-colors ${
                      foundElements.includes('sender')
                        ? 'bg-red-alert text-white'
                        : 'bg-white text-purple-dark hover:bg-yellow-accent'
                    }`}
                  >
                    {currentEmail.fromDisplay}
                    <span className="text-xs ml-1 opacity-70">&lt;{currentEmail.from}&gt;</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-nunito text-sm text-purple-dark font-semibold">Subject:</span>
                  <button
                    onClick={() => {
                      const el = currentEmail.suspiciousElements.find((e) => e.id === 'urgency');
                      if (el) handleElementClick('urgency');
                    }}
                    className={`font-nunito text-sm px-2 py-0.5 rounded border-[2px] border-black transition-colors ${
                      foundElements.includes('urgency')
                        ? 'bg-red-alert text-white'
                        : currentEmail.isPhishing
                        ? 'bg-white text-purple-dark hover:bg-yellow-accent'
                        : 'bg-transparent text-purple-dark'
                    }`}
                  >
                    {currentEmail.subject}
                  </button>
                </div>
              </div>
            </div>

            {/* Email Body - clickable area */}
            <div className="p-4 relative min-h-[200px]">
              <pre className="font-nunito text-sm text-purple-dark whitespace-pre-wrap leading-relaxed">
                {currentEmail.body.split('\n').map((line, i) => {
                  const hasLink = line.includes('http');
                  const hasFee = line.includes('processing fee') || line.includes('$50');
                  const hasPrize = line.includes('million') || line.includes('won');

                  if (hasLink) {
                    return (
                      <div key={i} className="my-2">
                        <button
                          onClick={() => handleElementClick('link')}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded border-[2px] border-black transition-colors ${
                            foundElements.includes('link')
                              ? 'bg-red-alert text-white'
                              : 'bg-blue-info/20 text-blue-info hover:bg-yellow-accent'
                          }`}
                        >
                          <LinkIcon size={12} strokeWidth={3} />
                          {line}
                        </button>
                      </div>
                    );
                  }

                  if (hasFee) {
                    return (
                      <div key={i} className="my-1">
                        <button
                          onClick={() => handleElementClick('fee')}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded border-[2px] border-black transition-colors ${
                            foundElements.includes('fee')
                              ? 'bg-red-alert text-white'
                              : 'bg-yellow-accent/30 text-purple-dark hover:bg-yellow-accent'
                          }`}
                        >
                          <AlertTriangle size={12} strokeWidth={3} />
                          {line}
                        </button>
                      </div>
                    );
                  }

                  if (hasPrize && currentEmail.isPhishing) {
                    return (
                      <div key={i} className="my-1">
                        <button
                          onClick={() => handleElementClick('prize')}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded border-[2px] border-black transition-colors ${
                            foundElements.includes('prize')
                              ? 'bg-red-alert text-white'
                              : 'bg-yellow-accent/30 text-purple-dark hover:bg-yellow-accent'
                          }`}
                        >
                          <AlertTriangle size={12} strokeWidth={3} />
                          {line}
                        </button>
                      </div>
                    );
                  }

                  return <div key={i}>{line}</div>;
                })}
              </pre>

              {/* Found indicators overlay */}
              <AnimatePresence>
                {selectedElement && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-4 left-4 right-4 bg-yellow-accent border-[3px] border-black rounded-xl p-3"
                  >
                    <p className="font-nunito text-sm font-bold text-black">
                      {currentEmail.suspiciousElements.find((e) => e.id === selectedElement)?.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t-[3px] border-black p-4 bg-purple-pale flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip size={16} strokeWidth={3} className="text-purple-light" />
                <span className="font-nunito text-xs text-purple-light">No attachments</span>
              </div>
              <div className="font-nunito text-xs text-purple-light">
                Found: {foundElements.filter((f) => currentEmail.suspiciousElements.some((e) => e.id === f)).length} / {currentEmail.suspiciousElements.length}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3 justify-center">
          {!showResult ? (
            <>
              <button
                onClick={() => {
                  setShowResult(true);
                  if (allFound) {
                    const bonus = score + 50;
                    setScore(bonus);
                    onScoreChange((bonus / totalScore) * 100);
                  }
                }}
                disabled={!allFound && currentEmail.isPhishing}
                className={`px-6 py-3 rounded-full border-[3px] border-black font-nunito font-bold text-sm transition-transform hover:scale-105 ${
                  allFound || !currentEmail.isPhishing
                    ? 'bg-purple-primary text-white hover:bg-purple-dark'
                    : 'bg-purple-lighter text-purple-light cursor-not-allowed'
                }`}
              >
                {currentEmail.isPhishing ? (
                  <span className="flex items-center gap-2">
                    <AlertTriangle size={16} strokeWidth={3} />
                    Mark as Phishing
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check size={16} strokeWidth={3} />
                    This looks Safe
                  </span>
                )}
              </button>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl border-[3px] border-black mb-3 ${
                currentEmail.isPhishing
                  ? foundElements.length >= currentEmail.suspiciousElements.length
                    ? 'bg-green-success text-black'
                    : 'bg-red-alert text-white'
                  : 'bg-green-success text-black'
              }`}>
                {currentEmail.isPhishing ? (
                  foundElements.length >= currentEmail.suspiciousElements.length ? (
                    <><Check size={20} strokeWidth={3} /> <span className="font-nunito font-bold">Correct! Good detective work!</span></>
                  ) : (
                    <><X size={20} strokeWidth={3} /> <span className="font-nunito font-bold">Missed some clues!</span></>
                  )
                ) : (
                  <><Check size={20} strokeWidth={3} /> <span className="font-nunito font-bold">Correct! This email is safe.</span></>
                )}
              </div>

              {currentIndex < emailChallenges.length - 1 && (
                <button
                  onClick={handleNext}
                  className="block mx-auto px-6 py-3 bg-yellow-accent border-[3px] border-black rounded-full font-nunito font-bold text-sm hover:scale-105 transition-transform"
                >
                  Next Email
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
