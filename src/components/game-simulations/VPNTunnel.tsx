import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Unlock, Shield, Key, Server, Wifi, Globe, ArrowRight,
  Check, X, RotateCcw, ChevronRight, Trophy, Star, Zap, Eye, EyeOff,
  Monitor, Building2, Fingerprint, FileKey
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type VPNStep = 'idle' | 'initiate' | 'auth' | 'key_exchange' | 'tunnel' | 'send_packet' | 'complete';
type VPNType = 'remote_access' | 'site_to_site' | 'ssl_vpn';
type AuthMethod = 'password' | 'certificate';
type TunnelMode = 'full' | 'split';

interface VPNLevel {
  id: number;
  name: string;
  description: string;
  vpnType: VPNType;
  label: string;
}

const VPN_LEVELS: VPNLevel[] = [
  {
    id: 1,
    name: 'Remote Access VPN',
    description: 'A remote worker connects to the office network securely.',
    vpnType: 'remote_access',
    label: 'Remote Access',
  },
  {
    id: 2,
    name: 'Site-to-Site VPN',
    description: 'Two office locations connect their networks together.',
    vpnType: 'site_to_site',
    label: 'Site-to-Site',
  },
  {
    id: 3,
    name: 'SSL VPN',
    description: 'Secure web-based VPN using the browser.',
    vpnType: 'ssl_vpn',
    label: 'SSL VPN',
  },
];

export default function VPNTunnel({ onScoreChange }: Props) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [step, setStep] = useState<VPNStep>('idle');
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [tunnelMode, setTunnelMode] = useState<TunnelMode>('full');
  const [packetsSent, setPacketsSent] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [levelScores, setLevelScores] = useState<(number | null)[]>([null, null, null]);
  const [levelStars, setLevelStars] = useState<(number | null)[]>([null, null, null]);
  const [message, setMessage] = useState('');
  const [showEncrypted, setShowEncrypted] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [keyExchanged, setKeyExchanged] = useState(false);

  const level = VPN_LEVELS[currentLevel];

  const initLevel = () => {
    setStep('idle');
    setAuthMethod(null);
    setTunnelMode('full');
    setPacketsSent(0);
    setShowEncrypted(false);
    setKeyExchanged(false);
    setMessage(`Level ${level.id}: ${level.name} - ${level.description}`);
  };

  useState(() => {
    initLevel();
  });

  const handleStep = (nextStep: VPNStep) => {
    setStep(nextStep);
    switch (nextStep) {
      case 'initiate':
        setMessage('Connection initiated! The VPN client contacts the server.');
        break;
      case 'auth':
        setMessage('Authentication required! Choose a method to prove your identity.');
        break;
      case 'key_exchange':
        if (!authMethod) return;
        setKeyExchanged(true);
        setMessage(`Key exchange complete! ${authMethod === 'password' ? 'Pre-shared key' : 'Certificate-based'} authentication successful. Encryption keys generated!`);
        break;
      case 'tunnel':
        setMessage('VPN Tunnel ESTABLISHED! All traffic is now encrypted. Choose tunnel mode.');
        break;
      case 'send_packet':
        setMessage('Sending encrypted packets through the tunnel!');
        break;
      case 'complete':
        {
          const pktBonus = packetsSent * 20;
          const baseScore = 100;
          const finalScore = Math.min(100, baseScore + pktBonus);
          const stars = finalScore >= 90 ? 3 : finalScore >= 60 ? 2 : 1;
          setTotalScore((prev) => prev + finalScore);
          onScoreChange(totalScore + finalScore);
          setLevelScores((prev) => {
            const u = [...prev];
            u[currentLevel] = finalScore;
            return u;
          });
          setLevelStars((prev) => {
            const u = [...prev];
            u[currentLevel] = stars;
            return u;
          });
          if (currentLevel >= VPN_LEVELS.length - 1) {
            setAllComplete(true);
            setMessage('All VPN types configured! You are a VPN master!');
          } else {
            setMessage(`Level ${level.id} Complete! Secure tunnel operational!`);
          }
        }
        break;
    }
  };

  const handleAuth = (method: AuthMethod) => {
    setAuthMethod(method);
    setStep('key_exchange');
    setKeyExchanged(true);
    setMessage(`Key exchange complete! ${method === 'password' ? 'Pre-shared key' : 'Certificate-based'} authentication successful. Encryption keys generated!`);
  };

  const handleSendPacket = () => {
    setStep('send_packet');
    setPacketsSent((p) => p + 1);
    setShowEncrypted(true);
    setTimeout(() => setShowEncrypted(false), 1500);
    if (packetsSent >= 2) {
      handleStep('complete');
    } else {
      setMessage(`Packet ${packetsSent + 1} sent securely! ${2 - packetsSent} more to complete.`);
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < VPN_LEVELS.length - 1) {
      setCurrentLevel((prev) => prev + 1);
      initLevel();
    }
  };

  const handleResetAll = () => {
    setCurrentLevel(0);
    setTotalScore(0);
    setLevelScores([null, null, null]);
    setLevelStars([null, null, null]);
    setAllComplete(false);
    initLevel();
    onScoreChange(0);
  };

  // Visual state helpers
  const isTunnelActive = step === 'tunnel' || step === 'send_packet' || step === 'complete';

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* Title */}
      <div className="text-center">
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">VPN Tunnel</h2>
        <p className="font-nunito text-xs text-purple-dark mt-1">
          Build a secure VPN tunnel step by step!
        </p>
      </div>

      {/* HUD */}
      <div className="w-full max-w-lg flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-nunito text-xs font-bold text-purple-lighter">Lvl {level.id}</span>
          <span className="font-nunito text-xs font-bold text-white">{level.name}</span>
        </div>
        <div className="font-nunito text-xs font-bold text-yellow-accent">Score: {totalScore}</div>
        {isTunnelActive && (
          <div className="flex items-center gap-1">
            <Lock size={12} strokeWidth={3} className="text-green-success" />
            <span className="font-nunito text-[10px] text-green-success">Encrypted</span>
          </div>
        )}
      </div>

      {/* Message */}
      <div className={`w-full max-w-lg rounded-xl border-[3px] border-black px-3 py-2 ${step === 'complete' ? 'bg-green-success' : 'bg-purple-pale'}`}>
        <p className={`font-nunito text-xs text-center font-bold ${step === 'complete' ? 'text-white' : 'text-purple-dark'}`}>
          {message}
        </p>
      </div>

      {/* Network Diagram */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4" style={{ minHeight: 320 }}>
        {/* Left Side */}
        <div className="absolute left-6 top-4 bottom-4 flex flex-col items-center justify-center gap-3">
          {/* Left device */}
          <div className="flex flex-col items-center">
            <motion.div
              animate={isTunnelActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-16 h-16 rounded-2xl border-[3px] border-black flex items-center justify-center ${
                isTunnelActive ? 'bg-green-success' : 'bg-blue-info'
              }`}
            >
              {level.vpnType === 'site_to_site' ? (
                <Building2 size={28} strokeWidth={3} className="text-white" />
              ) : (
                <Monitor size={28} strokeWidth={3} className="text-white" />
              )}
            </motion.div>
            <span className="font-nunito text-[10px] font-bold text-purple-dark mt-1 bg-white border-2 border-black rounded-full px-2 py-0.5">
              {level.vpnType === 'site_to_site' ? 'Office A' : 'Remote User'}
            </span>
            {isTunnelActive && (
              <span className="font-mono text-[8px] text-green-success mt-0.5">
                10.8.0.2
              </span>
            )}
          </div>

          {/* Auth method indicator */}
          {authMethod && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-purple-pale rounded-full border-[2px] border-purple-light px-2 py-0.5"
            >
              {authMethod === 'password' ? (
                <Key size={10} strokeWidth={3} className="text-purple-primary" />
              ) : (
                <Fingerprint size={10} strokeWidth={3} className="text-purple-primary" />
              )}
              <span className="font-nunito text-[8px] font-bold text-purple-dark capitalize">{authMethod}</span>
            </motion.div>
          )}
        </div>

        {/* Center - Internet & Tunnel */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 flex flex-col items-center justify-center w-32">
          {/* Internet label */}
          <div className="mb-2">
            <span className="font-nunito text-[10px] font-bold text-gray-400 bg-gray-100 border-2 border-gray-300 rounded-full px-2 py-0.5">
              INTERNET
            </span>
          </div>

          {/* Tunnel Pipe */}
          <div className="relative w-16 h-48 flex flex-col items-center justify-center">
            {/* Background pipe */}
            <div className="absolute inset-0 bg-gray-200 rounded-full border-[3px] border-gray-300" />

            {/* Active tunnel */}
            <AnimatePresence>
              {isTunnelActive && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  className="absolute inset-x-0 top-0 rounded-full border-[3px] border-black overflow-hidden"
                  style={{ backgroundColor: '#4ADE80' }}
                >
                  {/* Glowing effect */}
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-green-success"
                  />

                  {/* Packet animation */}
                  {showEncrypted && (
                    <motion.div
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{ duration: 1.2, ease: 'linear' }}
                      className="absolute left-1/2 -translate-x-1/2 w-8 h-6 bg-yellow-accent rounded border-2 border-black flex items-center justify-center"
                    >
                      <Lock size={10} strokeWidth={3} className="text-black" />
                    </motion.div>
                  )}

                  {/* Packet dots flowing */}
                  {step === 'send_packet' && !showEncrypted && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ top: '-10%' }}
                          animate={{ top: '110%' }}
                          transition={{
                            duration: 2,
                            delay: i * 0.6,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                          className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-accent rounded-full border-2 border-black"
                        />
                      ))}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tunnel labels */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 z-10">
              {isTunnelActive ? (
                <Lock size={16} strokeWidth={3} className="text-green-success" />
              ) : (
                <Unlock size={16} strokeWidth={3} className="text-gray-300" />
              )}
            </div>

            {/* Step indicators on tunnel */}
            <div className="absolute -right-10 top-0 flex flex-col gap-6 z-10">
              {['initiate', 'auth', 'key', 'tunnel'].map((s, i) => {
                const isActive =
                  (s === 'initiate' && (step !== 'idle')) ||
                  (s === 'auth' && (step === 'auth' || step === 'key_exchange' || step === 'tunnel' || step === 'send_packet' || step === 'complete')) ||
                  (s === 'key' && (step === 'key_exchange' || step === 'tunnel' || step === 'send_packet' || step === 'complete')) ||
                  (s === 'tunnel' && (step === 'tunnel' || step === 'send_packet' || step === 'complete'));
                return (
                  <motion.div
                    key={s}
                    animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                    className={`w-5 h-5 rounded-full border-[2px] border-black flex items-center justify-center ${
                      isActive ? 'bg-green-success' : 'bg-gray-300'
                    }`}
                  >
                    {isActive ? (
                      <Check size={10} strokeWidth={4} className="text-white" />
                    ) : (
                      <span className="font-nunito text-[7px] text-gray-500">{i + 1}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Key exchange animation */}
          <AnimatePresence>
            {keyExchanged && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-2 flex items-center gap-1 bg-yellow-accent rounded-full border-[2px] border-black px-2 py-0.5"
              >
                <Key size={10} strokeWidth={3} className="text-black" />
                <span className="font-nunito text-[8px] font-bold text-black">AES-256</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side */}
        <div className="absolute right-6 top-4 bottom-4 flex flex-col items-center justify-center gap-3">
          <div className="flex flex-col items-center">
            <motion.div
              animate={isTunnelActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className={`w-16 h-16 rounded-2xl border-[3px] border-black flex items-center justify-center ${
                isTunnelActive ? 'bg-green-success' : 'bg-purple-primary'
              }`}
            >
              {level.vpnType === 'site_to_site' ? (
                <Building2 size={28} strokeWidth={3} className="text-white" />
              ) : (
                <Server size={28} strokeWidth={3} className="text-white" />
              )}
            </motion.div>
            <span className="font-nunito text-[10px] font-bold text-purple-dark mt-1 bg-white border-2 border-black rounded-full px-2 py-0.5">
              {level.vpnType === 'site_to_site' ? 'Office B' : 'VPN Server'}
            </span>
            {isTunnelActive && (
              <span className="font-mono text-[8px] text-green-success mt-0.5">
                10.8.0.1
              </span>
            )}
          </div>
        </div>

        {/* Packet encryption demo */}
        <AnimatePresence>
          {showEncrypted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-2 left-2 right-2 bg-purple-dark rounded-xl border-[2px] border-black p-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Eye size={12} strokeWidth={3} className="text-green-success" />
                  <span className="font-mono text-[9px] text-green-success">Plain: "Hello!"</span>
                </div>
                <ArrowRight size={12} strokeWidth={3} className="text-yellow-accent" />
                <div className="flex items-center gap-1">
                  <Lock size={12} strokeWidth={3} className="text-yellow-accent" />
                  <span className="font-mono text-[9px] text-yellow-accent">Enc: "a9f3k..."</span>
                </div>
                <ArrowRight size={12} strokeWidth={3} className="text-yellow-accent" />
                <div className="flex items-center gap-1">
                  <EyeOff size={12} strokeWidth={3} className="text-green-success" />
                  <span className="font-mono text-[9px] text-green-success">Plain: "Hello!"</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Area */}
      <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-4">
        {/* Step: idle */}
        {step === 'idle' && (
          <div className="text-center">
            <button
              onClick={() => handleStep('initiate')}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark transition-colors hover:scale-105"
            >
              <Wifi size={18} strokeWidth={3} />
              Initiate Connection
            </button>
          </div>
        )}

        {/* Step: initiate -> auth */}
        {step === 'initiate' && (
          <div className="text-center">
            <button
              onClick={() => handleStep('auth')}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-info border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:brightness-110 transition-all hover:scale-105"
            >
              <Shield size={18} strokeWidth={3} />
              Proceed to Authentication
            </button>
          </div>
        )}

        {/* Step: auth -> choose method */}
        {step === 'auth' && (
          <div className="flex flex-col items-center gap-2">
            <p className="font-nunito text-xs font-bold text-purple-dark mb-1">Choose Authentication Method:</p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAuth('password')}
                className="flex flex-col items-center gap-1 px-4 py-3 bg-purple-pale border-[3px] border-black rounded-2xl hover:bg-purple-lighter transition-colors"
              >
                <Key size={24} strokeWidth={3} className="text-purple-primary" />
                <span className="font-nunito text-xs font-bold text-purple-dark">Password</span>
                <span className="font-nunito text-[9px] text-purple-light">Pre-shared key</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAuth('certificate')}
                className="flex flex-col items-center gap-1 px-4 py-3 bg-purple-pale border-[3px] border-black rounded-2xl hover:bg-purple-lighter transition-colors"
              >
                <FileKey size={24} strokeWidth={3} className="text-purple-primary" />
                <span className="font-nunito text-xs font-bold text-purple-dark">Certificate</span>
                <span className="font-nunito text-[9px] text-purple-light">X.509 cert</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Step: key_exchange -> establish tunnel */}
        {step === 'key_exchange' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              className="mb-3 flex items-center justify-center gap-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }}
                >
                  <Key size={20} strokeWidth={3} className="text-yellow-accent" />
                </motion.div>
              ))}
            </motion.div>
            <button
              onClick={() => handleStep('tunnel')}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-green-success border-[3px] border-black rounded-full font-nunito font-bold text-sm text-black hover:brightness-110 transition-all hover:scale-105"
            >
              <Lock size={18} strokeWidth={3} />
              Establish Tunnel
            </button>
          </div>
        )}

        {/* Step: tunnel -> choose mode & send packets */}
        {(step === 'tunnel' || step === 'send_packet') && (
          <div className="flex flex-col items-center gap-3">
            {/* Tunnel mode toggle */}
            <div className="flex items-center gap-2 bg-purple-pale rounded-xl border-[2px] border-purple-light p-2">
              <span className="font-nunito text-xs font-bold text-purple-dark">Tunnel Mode:</span>
              <button
                onClick={() => setTunnelMode('full')}
                className={`px-3 py-1 rounded-full border-[2px] border-black font-nunito text-[10px] font-bold transition-colors ${
                  tunnelMode === 'full' ? 'bg-purple-primary text-white' : 'bg-white text-purple-dark'
                }`}
              >
                Full Tunnel
              </button>
              <button
                onClick={() => setTunnelMode('split')}
                className={`px-3 py-1 rounded-full border-[2px] border-black font-nunito text-[10px] font-bold transition-colors ${
                  tunnelMode === 'split' ? 'bg-purple-primary text-white' : 'bg-white text-purple-dark'
                }`}
              >
                Split Tunnel
              </button>
            </div>

            <p className="font-nunito text-[10px] text-purple-light text-center">
              {tunnelMode === 'full'
                ? 'All traffic goes through the VPN tunnel'
                : 'Only work traffic goes through VPN, rest uses normal internet'}
            </p>

            {/* Send packet button */}
            {(step === 'tunnel' || step === 'send_packet') && (
              <button
                onClick={handleSendPacket}
                className="flex items-center gap-2 px-5 py-2 bg-yellow-accent border-[3px] border-black rounded-full font-nunito font-bold text-sm text-black hover:brightness-110 transition-all hover:scale-105"
              >
                <Zap size={16} strokeWidth={3} />
                Send Encrypted Packet
              </button>
            )}

            {/* Packets sent indicator */}
            <div className="flex items-center gap-1">
              <span className="font-nunito text-xs text-purple-dark">Packets sent:</span>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center ${
                    i <= packetsSent ? 'bg-green-success' : 'bg-gray-200'
                  }`}
                >
                  {i <= packetsSent ? (
                    <Check size={10} strokeWidth={4} className="text-white" />
                  ) : (
                    <span className="font-nunito text-[8px] text-gray-400">{i}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: complete */}
        {step === 'complete' && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Lock size={20} strokeWidth={3} className="text-green-success" />
              <span className="font-nunito text-sm font-bold text-purple-dark">VPN Active!</span>
            </div>
            {!allComplete && (
              <button
                onClick={handleNextLevel}
                className="flex items-center gap-1 mx-auto px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark transition-colors hover:scale-105"
              >
                Next VPN Type
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Complete Modal */}
      <AnimatePresence>
        {step === 'complete' && levelScores[currentLevel] !== null && (
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg bg-green-success rounded-2xl border-4 border-black p-4 flex flex-col items-center gap-2"
            style={{ boxShadow: '8px 8px 0px 0px #000000' }}
          >
            <Trophy size={32} strokeWidth={3} className="text-yellow-accent" />
            <h3 className="font-fredoka text-xl text-black text-outline-sm">
              {allComplete ? 'All VPN Types Complete!' : `Level ${level.id} Complete!`}
            </h3>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  size={24}
                  strokeWidth={2}
                  className={s <= (levelStars[currentLevel] || 0) ? 'text-yellow-accent' : 'text-black/20'}
                  fill={s <= (levelStars[currentLevel] || 0) ? '#FACC15' : 'transparent'}
                />
              ))}
            </div>
            <p className="font-nunito text-sm font-bold text-black">
              Score: {levelScores[currentLevel]}
            </p>
            {allComplete && (
              <button
                onClick={handleResetAll}
                className="flex items-center gap-1 px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark transition-colors hover:scale-105"
              >
                <RotateCcw size={16} strokeWidth={3} />
                Play Again
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset */}
      <button
        onClick={handleResetAll}
        className="flex items-center gap-1 px-3 py-1.5 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:bg-purple-light transition-colors hover:scale-105"
      >
        <RotateCcw size={14} strokeWidth={3} />
        Reset
      </button>

      {/* Legend */}
      <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-3">
        <p className="font-nunito text-xs font-bold text-purple-dark mb-2 text-center">VPN Types</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {VPN_LEVELS.map((v) => (
            <div key={v.id} className="flex items-center gap-1">
              <div
                className={`w-4 h-4 rounded-full border-2 border-black ${
                  v.id === currentLevel + 1 ? 'bg-green-success' : 'bg-gray-300'
                }`}
              >
                {v.id <= (levelScores.filter((s) => s !== null).length) && (
                  <Check size={10} strokeWidth={4} className="text-white" />
                )}
              </div>
              <span className="font-nunito text-[10px] text-purple-dark">{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
