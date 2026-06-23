import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Check,
  X,
  Play,
  RotateCcw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Award,
  AlertTriangle,
} from 'lucide-react';

interface CertificateChainProps {
  onScoreChange: (score: number) => void;
}

interface Certificate {
  id: string;
  name: string;
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  signatureAlgo: string;
  publicKey: string;
  isValid: boolean;
  issue?: 'expired' | 'self-signed' | 'wrong-issuer' | 'revoked';
  level: number;
  color: string;
}

interface ChainLevel {
  level: number;
  title: string;
  description: string;
  certificates: Certificate[];
}

const CHAIN_LEVELS: ChainLevel[] = [
  {
    level: 1,
    title: 'Valid Chain',
    description: 'All certificates in this chain are valid. Verify each one!',
    certificates: [
      {
        id: 'root-1',
        name: 'Root CA',
        subject: 'CN=CyberPaw Root CA, O=CyberPaw Inc',
        issuer: 'CN=CyberPaw Root CA, O=CyberPaw Inc',
        validFrom: '2020-01-01',
        validTo: '2040-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 4096-bit',
        isValid: true,
        level: 0,
        color: '#FACC15',
      },
      {
        id: 'inter-1',
        name: 'Intermediate CA',
        subject: 'CN=CyberPaw Intermediate CA, O=CyberPaw Inc',
        issuer: 'CN=CyberPaw Root CA, O=CyberPaw Inc',
        validFrom: '2022-06-01',
        validTo: '2032-06-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 2048-bit',
        isValid: true,
        level: 1,
        color: '#7C3AED',
      },
      {
        id: 'server-1',
        name: 'Server Certificate',
        subject: 'CN=game.cyberpaw.kids',
        issuer: 'CN=CyberPaw Intermediate CA, O=CyberPaw Inc',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 2048-bit',
        isValid: true,
        level: 2,
        color: '#4ADE80',
      },
    ],
  },
  {
    level: 2,
    title: 'Expired Certificate',
    description: 'One certificate has expired! Find it and identify the issue.',
    certificates: [
      {
        id: 'root-2',
        name: 'Root CA',
        subject: 'CN=Global Trust Root',
        issuer: 'CN=Global Trust Root',
        validFrom: '2015-01-01',
        validTo: '2035-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 4096-bit',
        isValid: true,
        level: 0,
        color: '#FACC15',
      },
      {
        id: 'inter-2',
        name: 'Intermediate CA',
        subject: 'CN=Global Trust Secure CA',
        issuer: 'CN=Global Trust Root',
        validFrom: '2019-03-01',
        validTo: '2023-03-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 2048-bit',
        isValid: false,
        issue: 'expired',
        level: 1,
        color: '#7C3AED',
      },
      {
        id: 'server-2',
        name: 'Server Certificate',
        subject: 'CN=expired.example.com',
        issuer: 'CN=Global Trust Secure CA',
        validFrom: '2023-01-01',
        validTo: '2024-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 2048-bit',
        isValid: true,
        level: 2,
        color: '#4ADE80',
      },
    ],
  },
  {
    level: 3,
    title: 'Wrong Issuer',
    description: 'The chain has a broken link! Find the issuer mismatch.',
    certificates: [
      {
        id: 'root-3',
        name: 'Root CA',
        subject: 'CN=Trusted Root CA',
        issuer: 'CN=Trusted Root CA',
        validFrom: '2018-01-01',
        validTo: '2038-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 4096-bit',
        isValid: true,
        level: 0,
        color: '#FACC15',
      },
      {
        id: 'inter-3',
        name: 'Intermediate CA',
        subject: 'CN=Trusted Secure CA',
        issuer: 'CN=Wrong Root CA, O=Evil Corp',
        validFrom: '2022-01-01',
        validTo: '2032-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 2048-bit',
        isValid: false,
        issue: 'wrong-issuer',
        level: 1,
        color: '#7C3AED',
      },
      {
        id: 'server-3',
        name: 'Server Certificate',
        subject: 'CN=broken.example.com',
        issuer: 'CN=Trusted Secure CA',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 2048-bit',
        isValid: true,
        level: 2,
        color: '#4ADE80',
      },
    ],
  },
  {
    level: 4,
    title: 'Self-Signed Certificate',
    description: 'A certificate claims to be trusted but is self-signed!',
    certificates: [
      {
        id: 'root-4',
        name: 'Root CA',
        subject: 'CN=Official Root CA',
        issuer: 'CN=Official Root CA',
        validFrom: '2016-01-01',
        validTo: '2036-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 4096-bit',
        isValid: true,
        level: 0,
        color: '#FACC15',
      },
      {
        id: 'inter-4',
        name: 'Intermediate CA',
        subject: 'CN=Official Secure CA',
        issuer: 'CN=Official Root CA',
        validFrom: '2021-01-01',
        validTo: '2031-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 2048-bit',
        isValid: true,
        level: 1,
        color: '#7C3AED',
      },
      {
        id: 'server-4',
        name: 'Server Certificate',
        subject: 'CN=selfsigned.example.com',
        issuer: 'CN=selfsigned.example.com',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 1024-bit',
        isValid: false,
        issue: 'self-signed',
        level: 2,
        color: '#4ADE80',
      },
    ],
  },
  {
    level: 5,
    title: 'Mixed Chain Challenge',
    description: 'A complex chain with multiple issues. Find all problems!',
    certificates: [
      {
        id: 'root-5',
        name: 'Root CA',
        subject: 'CN=MegaTrust Root',
        issuer: 'CN=MegaTrust Root',
        validFrom: '2017-01-01',
        validTo: '2019-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 4096-bit',
        isValid: false,
        issue: 'expired',
        level: 0,
        color: '#FACC15',
      },
      {
        id: 'inter-5',
        name: 'Intermediate CA',
        subject: 'CN=MegaTrust Intermediate',
        issuer: 'CN=FakeRoot CA',
        validFrom: '2023-01-01',
        validTo: '2033-01-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 2048-bit',
        isValid: false,
        issue: 'wrong-issuer',
        level: 1,
        color: '#7C3AED',
      },
      {
        id: 'server-5',
        name: 'Server Certificate',
        subject: 'CN=challenge.example.com',
        issuer: 'CN=challenge.example.com',
        validFrom: '2024-06-01',
        validTo: '2025-06-01',
        signatureAlgo: 'RSA-SHA256',
        publicKey: 'RSA 1024-bit',
        isValid: false,
        issue: 'self-signed',
        level: 2,
        color: '#4ADE80',
      },
    ],
  },
];

const TRUSTED_ROOTS = [
  'CyberPaw Root CA',
  'Global Trust Root',
  'Trusted Root CA',
  'Official Root CA',
  'MegaTrust Root',
];

export default function CertificateChain({ onScoreChange }: CertificateChainProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [expandedCert, setExpandedCert] = useState<string | null>(null);
  const [verifiedCerts, setVerifiedCerts] = useState<Set<string>>(new Set());
  const [chainValidated, setChainValidated] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [gameStarted, setGameStarted] = useState(false);
  const [issuesFound, setIssuesFound] = useState(0);
  const [totalIssues, setTotalIssues] = useState(0);
  const [padlockLocked, setPadlockLocked] = useState<boolean | null>(null);

  const levelData = CHAIN_LEVELS[currentLevel];

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setCurrentLevel(0);
    setVerifiedCerts(new Set());
    setChainValidated(false);
    setFeedback('');
    setFeedbackType('');
    setIssuesFound(0);
    setTotalIssues(0);
    setPadlockLocked(null);
    setExpandedCert(null);
    onScoreChange(0);
  };

  const resetGame = () => {
    setGameStarted(false);
    setScore(0);
    setCurrentLevel(0);
    setVerifiedCerts(new Set());
    setChainValidated(false);
    setFeedback('');
    setFeedbackType('');
    setIssuesFound(0);
    setTotalIssues(0);
    setPadlockLocked(null);
    setExpandedCert(null);
    onScoreChange(0);
  };

  const handleVerify = (cert: Certificate) => {
    if (verifiedCerts.has(cert.id)) return;

    const newVerified = new Set(verifiedCerts);
    newVerified.add(cert.id);
    setVerifiedCerts(newVerified);

    if (cert.isValid) {
      const newScore = score + 10;
      setScore(newScore);
      onScoreChange(Math.min(100, newScore));
      setFeedback(`${cert.name} is valid! Issuer checks out.`);
      setFeedbackType('success');
    } else {
      const newIssues = issuesFound + 1;
      setIssuesFound(newIssues);
      const newTotal = totalIssues + 1;
      setTotalIssues(newTotal);

      let issueDesc = '';
      switch (cert.issue) {
        case 'expired':
          issueDesc = 'This certificate has EXPIRED! Check the Valid To date.';
          break;
        case 'self-signed':
          issueDesc = 'This certificate is SELF-SIGNED! Subject equals Issuer.';
          break;
        case 'wrong-issuer':
          issueDesc = 'Wrong Issuer! The parent certificate did not sign this one.';
          break;
        case 'revoked':
          issueDesc = 'This certificate has been REVOKED!';
          break;
      }

      const newScore = score + 15;
      setScore(newScore);
      onScoreChange(Math.min(100, newScore));
      setFeedback(`Issue found! ${issueDesc}`);
      setFeedbackType('error');
    }
  };

  const handleValidateChain = () => {
    if (chainValidated) return;

    const allCerts = levelData.certificates;
    const hasInvalid = allCerts.some((c) => !c.isValid);

    if (hasInvalid) {
      setPadlockLocked(false);
      setFeedback('Chain validation FAILED! There are invalid certificates in the chain.');
      setFeedbackType('error');
    } else {
      setPadlockLocked(true);
      const newScore = score + 20;
      setScore(newScore);
      onScoreChange(Math.min(100, newScore));
      setFeedback('Chain validation SUCCESSFUL! All certificates are trusted and valid.');
      setFeedbackType('success');
    }

    setChainValidated(true);
  };

  const handleNextLevel = () => {
    if (currentLevel < CHAIN_LEVELS.length - 1) {
      setCurrentLevel((prev) => prev + 1);
      setVerifiedCerts(new Set());
      setChainValidated(false);
      setFeedback('');
      setFeedbackType('');
      setPadlockLocked(null);
      setExpandedCert(null);
    }
  };

  const allVerified = levelData.certificates.every((c) => verifiedCerts.has(c.id));

  return (
    <div className="flex flex-col items-center gap-3 p-4 max-w-2xl mx-auto">
      {/* HUD */}
      <div className="w-full flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <Shield size={18} strokeWidth={3} className="text-yellow-accent" />
          <span className="font-nunito text-sm font-bold text-white">
            Level {currentLevel + 1}/5
          </span>
        </div>
        <div className="font-nunito text-sm font-bold text-yellow-accent">Score: {score}</div>
        <div className="font-nunito text-xs text-purple-lighter">
          Issues: {issuesFound}/{totalIssues || '?'}
        </div>
      </div>

      {/* Start Screen */}
      {!gameStarted && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-full bg-purple-pale rounded-2xl border-4 border-black p-6 text-center"
        >
          <Lock size={48} strokeWidth={3} className="text-purple-primary mx-auto mb-3" />
          <h3 className="font-fredoka text-xl font-bold text-purple-dark mb-2">
            Certificate Chain Validator
          </h3>
          <p className="font-nunito text-sm text-purple-dark mb-4">
            Inspect certificate chains and find security issues!
            Verify each certificate and validate the chain.
          </p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark transition-colors hover:scale-105"
          >
            <Play size={18} strokeWidth={3} className="inline mr-2" />
            Start Validation
          </button>
        </motion.div>
      )}

      {gameStarted && (
        <>
          {/* Level Info */}
          <div className="w-full bg-blue-info/20 rounded-xl border-[3px] border-blue-info p-2 text-center">
            <p className="font-fredoka text-sm font-bold text-purple-dark">{levelData.title}</p>
            <p className="font-nunito text-xs text-purple-dark">{levelData.description}</p>
          </div>

          {/* Certificate Chain Diagram */}
          <div className="w-full bg-white rounded-2xl border-4 border-black p-4">
            {/* Chain visualization */}
            <div className="flex flex-col items-center gap-2">
              {levelData.certificates.map((cert, index) => (
                <div key={cert.id} className="w-full flex flex-col items-center">
                  {/* Certificate Card */}
                  <motion.div
                    layout
                    className={`w-full max-w-md rounded-xl border-[3px] ${
                      verifiedCerts.has(cert.id)
                        ? cert.isValid
                          ? 'border-green-success'
                          : 'border-red-alert'
                        : 'border-black'
                    } overflow-hidden card-shadow-sm`}
                  >
                    {/* Certificate Header */}
                    <button
                      onClick={() => setExpandedCert(expandedCert === cert.id ? null : cert.id)}
                      className="w-full flex items-center gap-3 p-3"
                      style={{ backgroundColor: cert.color + '30' }}
                    >
                      <div
                        className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center"
                        style={{ backgroundColor: cert.color }}
                      >
                        {verifiedCerts.has(cert.id) ? (
                          cert.isValid ? (
                            <Check size={18} strokeWidth={4} className="text-white" />
                          ) : (
                            <AlertTriangle size={18} strokeWidth={3} className="text-white" />
                          )
                        ) : (
                          <Shield size={18} strokeWidth={3} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-nunito text-sm font-bold text-purple-dark block">
                          {cert.name}
                        </span>
                        <span className="font-mono text-[10px] text-purple-dark truncate block">
                          {cert.subject}
                        </span>
                      </div>
                      {verifiedCerts.has(cert.id) && (
                        <div
                          className={`px-2 py-0.5 rounded-full border border-black font-nunito text-[10px] font-bold ${
                            cert.isValid ? 'bg-green-success text-black' : 'bg-red-alert text-white'
                          }`}
                        >
                          {cert.isValid ? 'VALID' : 'INVALID'}
                        </div>
                      )}
                      {expandedCert === cert.id ? (
                        <ChevronUp size={16} strokeWidth={3} className="text-purple-dark" />
                      ) : (
                        <ChevronDown size={16} strokeWidth={3} className="text-purple-dark" />
                      )}
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedCert === cert.id && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 bg-purple-pale border-t-[2px] border-black space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white rounded-lg border-2 border-black p-2">
                                <span className="font-nunito text-[9px] text-purple-light">Subject</span>
                                <p className="font-mono text-[10px] text-purple-dark break-all">{cert.subject}</p>
                              </div>
                              <div className="bg-white rounded-lg border-2 border-black p-2">
                                <span className="font-nunito text-[9px] text-purple-light">Issuer</span>
                                <p className="font-mono text-[10px] text-purple-dark break-all">{cert.issuer}</p>
                              </div>
                              <div className="bg-white rounded-lg border-2 border-black p-2">
                                <span className="font-nunito text-[9px] text-purple-light">Valid From</span>
                                <p className="font-mono text-[10px] text-purple-dark">{cert.validFrom}</p>
                              </div>
                              <div className="bg-white rounded-lg border-2 border-black p-2">
                                <span className="font-nunito text-[9px] text-purple-light">Valid To</span>
                                <p className="font-mono text-[10px] text-purple-dark">{cert.validTo}</p>
                              </div>
                              <div className="bg-white rounded-lg border-2 border-black p-2">
                                <span className="font-nunito text-[9px] text-purple-light">Signature</span>
                                <p className="font-mono text-[10px] text-purple-dark">{cert.signatureAlgo}</p>
                              </div>
                              <div className="bg-white rounded-lg border-2 border-black p-2">
                                <span className="font-nunito text-[9px] text-purple-light">Public Key</span>
                                <p className="font-mono text-[10px] text-purple-dark">{cert.publicKey}</p>
                              </div>
                            </div>

                            {!verifiedCerts.has(cert.id) && (
                              <button
                                onClick={() => handleVerify(cert)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-primary text-white border-[3px] border-black rounded-xl font-nunito text-xs font-bold hover:bg-purple-dark transition-colors hover:scale-105"
                              >
                                <ShieldCheck size={14} strokeWidth={3} />
                                Verify Certificate
                              </button>
                            )}

                            {verifiedCerts.has(cert.id) && !cert.isValid && cert.issue && (
                              <div className="bg-red-alert/20 border-2 border-red-alert rounded-lg p-2">
                                <span className="font-nunito text-[10px] font-bold text-red-alert flex items-center gap-1">
                                  <AlertTriangle size={12} strokeWidth={3} />
                                  Issue: {cert.issue.toUpperCase().replace('-', ' ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Chain connector */}
                  {index < levelData.certificates.length - 1 && (
                    <div className="flex flex-col items-center py-1">
                      <motion.div
                        animate={
                          verifiedCerts.has(cert.id) && cert.isValid
                            ? { backgroundColor: '#4ADE80' }
                            : verifiedCerts.has(cert.id) && !cert.isValid
                            ? { backgroundColor: '#F87171' }
                            : {}
                        }
                        className="w-1 h-6 bg-purple-lighter border-l border-r border-black"
                      />
                      {verifiedCerts.has(cert.id) && cert.isValid && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-green-success border-2 border-black rounded-full p-0.5"
                        >
                          <Check size={10} strokeWidth={4} className="text-black" />
                        </motion.div>
                      )}
                      {verifiedCerts.has(cert.id) && !cert.isValid && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-red-alert border-2 border-black rounded-full p-0.5"
                        >
                          <X size={10} strokeWidth={4} className="text-white" />
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Padlock Result */}
            {padlockLocked !== null && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center mt-4"
              >
                {padlockLocked ? (
                  <div className="bg-green-success rounded-full border-[3px] border-black p-4">
                    <Lock size={36} strokeWidth={3} className="text-black" />
                  </div>
                ) : (
                  <div className="bg-red-alert rounded-full border-[3px] border-black p-4">
                    <Unlock size={36} strokeWidth={3} className="text-white" />
                  </div>
                )}
                <span
                  className={`font-fredoka text-sm font-bold mt-2 ${
                    padlockLocked ? 'text-green-success' : 'text-red-alert'
                  }`}
                >
                  {padlockLocked ? 'Connection Secure!' : 'Connection Insecure!'}
                </span>
              </motion.div>
            )}
          </div>

          {/* Trust Store */}
          <div className="w-full bg-white rounded-xl border-[3px] border-black p-3">
            <span className="font-nunito text-[10px] font-bold text-purple-dark mb-2 block">
              <Shield size={12} strokeWidth={3} className="inline mr-1" />
              Trust Store (Trusted Root CAs)
            </span>
            <div className="flex gap-2 flex-wrap">
              {TRUSTED_ROOTS.map((root) => (
                <span
                  key={root}
                  className="font-mono text-[9px] bg-yellow-accent/20 border border-black rounded-full px-2 py-0.5 text-purple-dark"
                >
                  {root}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-2 justify-center">
            {allVerified && !chainValidated && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleValidateChain}
                className="px-5 py-2 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark transition-colors hover:scale-105"
              >
                <ShieldCheck size={16} strokeWidth={3} className="inline mr-1" />
                Validate Chain
              </motion.button>
            )}
            {chainValidated && currentLevel < CHAIN_LEVELS.length - 1 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleNextLevel}
                className="px-5 py-2 bg-green-success text-black border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform"
              >
                <Award size={16} strokeWidth={3} className="inline mr-1" />
                Next Level
              </motion.button>
            )}
            {chainValidated && currentLevel === CHAIN_LEVELS.length - 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-green-success rounded-xl border-[3px] border-black px-4 py-2 flex items-center gap-2"
              >
                <Award size={20} strokeWidth={3} className="text-black" />
                <span className="font-nunito font-bold text-black">
                  All Levels Complete! Final Score: {score}
                </span>
              </motion.div>
            )}
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-4 py-2 bg-red-alert text-white border-[3px] border-black rounded-full font-nunito font-bold hover:scale-105 transition-transform"
            >
              <RotateCcw size={14} strokeWidth={3} /> Reset
            </button>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`w-full p-2 rounded-xl border-[3px] font-nunito text-sm text-center ${
                  feedbackType === 'success'
                    ? 'bg-green-success/20 border-green-success text-purple-dark'
                    : 'bg-red-alert/20 border-red-alert text-purple-dark'
                }`}
              >
                {feedback}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress */}
          <div className="w-full">
            <div className="flex items-center gap-1">
              {CHAIN_LEVELS.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-full border border-black ${
                    i < currentLevel ? 'bg-green-success' : i === currentLevel ? 'bg-yellow-accent' : 'bg-purple-lighter'
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
