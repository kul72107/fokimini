import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, ShieldAlert, Lock, Unlock, Check, X,
  Zap, Trophy, ChevronRight, RotateCcw, Globe, Fingerprint,
  KeyRound, Calendar, Clock, Hash, Award, AlertTriangle,
  Sparkles, Download, Crown, Medal, Server, Search
} from 'lucide-react';
import type { OpsContextProps } from '@/lib/opsContext';

interface Props extends OpsContextProps {
  onScoreChange: (score: number) => void;
}

interface CertData {
  id: string;
  label: string;
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  fingerprint: string;
  sigAlgo: string;
  keySize: number;
  keyUsage: string[];
  isExpired: boolean;
  isSelfSigned: boolean;
  domainMatch: boolean;
  strongSig: boolean;
  grade: 'A+' | 'A' | 'B' | 'C' | 'F';
  gradeColor: string;
  type: 'root' | 'intermediate' | 'server';
}

interface CertChain {
  id: string;
  domain: string;
  description: string;
  certs: CertData[];
}

const CERT_CHAINS: CertChain[] = [
  {
    id: 'valid',
    domain: 'cyberpaw-arena.com',
    description: 'A properly configured certificate chain',
    certs: [
      {
        id: 'root1', label: 'DigiCert Global Root CA', type: 'root',
        subject: 'CN=DigiCert Global Root CA, OU=www.digicert.com, O=DigiCert Inc, C=US',
        issuer: 'CN=DigiCert Global Root CA, OU=www.digicert.com, O=DigiCert Inc, C=US',
        validFrom: '2006-11-10', validTo: '2031-11-10',
        serialNumber: '08:3B:E0:56:90:42:46:B1:A1:75:6A:C9:59:91:C7:4A',
        fingerprint: 'A8:98:5D:3A:65:E5:E5:C4:B2:D7:D6:6D:38:61:7C:07:7B:12:20:FB:9D:24:6E:6F:18:8E:30:DE:E9:C9:CB',
        sigAlgo: 'sha256WithRSAEncryption', keySize: 2048,
        keyUsage: ['Certificate Sign', 'CRL Sign'],
        isExpired: false, isSelfSigned: true, domainMatch: true, strongSig: true,
        grade: 'A+', gradeColor: '#4ADE80',
      },
      {
        id: 'int1', label: 'DigiCert SHA2 Secure Server CA', type: 'intermediate',
        subject: 'CN=DigiCert SHA2 Secure Server CA, O=DigiCert Inc, C=US',
        issuer: 'CN=DigiCert Global Root CA, OU=www.digicert.com, O=DigiCert Inc, C=US',
        validFrom: '2013-09-04', validTo: '2028-09-04',
        serialNumber: '01:FD:A3:EB:6E:CA:75:C8:20:0C:AD:AE:47:76:F5:1F',
        fingerprint: '1F:B8:6B:11:68:EC:3C:5F:48:C5:5F:6E:11:75:D0:9B:89:F3:91:AC:74:da:92:D3:76:D4:AB:37:A1:5A:4D',
        sigAlgo: 'sha256WithRSAEncryption', keySize: 2048,
        keyUsage: ['Certificate Sign', 'CRL Sign'],
        isExpired: false, isSelfSigned: false, domainMatch: true, strongSig: true,
        grade: 'A', gradeColor: '#4ADE80',
      },
      {
        id: 'srv1', label: 'cyberpaw-arena.com', type: 'server',
        subject: 'CN=cyberpaw-arena.com, O=CyberPaw Inc, L=San Francisco, ST=CA, C=US',
        issuer: 'CN=DigiCert SHA2 Secure Server CA, O=DigiCert Inc, C=US',
        validFrom: '2024-01-15', validTo: '2025-01-15',
        serialNumber: '0C:4A:F2:E1:8D:3B:7C:5A:9E:2F:01:6D:4B:8C:3E:7A',
        fingerprint: '2A:3B:4C:5D:6E:7F:8G:9H:0I:1J:2K:3L:4M:5N:6O:7P:8Q:9R:0S:1T:2U:3V:4W:5X:6Y:7Z:8A:9B:0C:1D',
        sigAlgo: 'sha256WithRSAEncryption', keySize: 2048,
        keyUsage: ['Digital Signature', 'Key Encipherment'],
        isExpired: false, isSelfSigned: false, domainMatch: true, strongSig: true,
        grade: 'A+', gradeColor: '#4ADE80',
      },
    ],
  },
  {
    id: 'expired',
    domain: 'old-site.example',
    description: 'An expired certificate - still chained properly',
    certs: [
      {
        id: 'root2', label: 'GlobalSign Root CA', type: 'root',
        subject: 'CN=GlobalSign Root CA, OU=Root CA, O=GlobalSign nv-sa, C=BE',
        issuer: 'CN=GlobalSign Root CA, OU=Root CA, O=GlobalSign nv-sa, C=BE',
        validFrom: '1998-09-01', validTo: '2028-09-01',
        serialNumber: '04:00:00:00:00:01:15:4B:5A:C3:94',
        fingerprint: 'B1:BC:96:8B:D4:F4:9D:62:2A:A8:9A:81:F2:15:01:52:A4:1D:82:9C:44:7C:0D:3C:8A:5E:30:5B:6E:DC:48',
        sigAlgo: 'sha256WithRSAEncryption', keySize: 2048,
        keyUsage: ['Certificate Sign', 'CRL Sign'],
        isExpired: false, isSelfSigned: true, domainMatch: true, strongSig: true,
        grade: 'A', gradeColor: '#4ADE80',
      },
      {
        id: 'srv2', label: 'old-site.example', type: 'server',
        subject: 'CN=old-site.example, O=Old Corp, C=US',
        issuer: 'CN=GlobalSign Root CA, OU=Root CA, O=GlobalSign nv-sa, C=BE',
        validFrom: '2020-01-01', validTo: '2021-01-01',
        serialNumber: '12:34:56:78:9A:BC:DE:F0:11:22:33:44:55:66:77:88',
        fingerprint: '3C:4D:5E:6F:7G:8H:9I:0J:1K:2L:3M:4N:5O:6P:7Q:8R:9S:0T:1U:2V:3W:4X:5Y:6Z:7A:8B:9C:0D:1E',
        sigAlgo: 'sha1WithRSAEncryption', keySize: 1024,
        keyUsage: ['Digital Signature'],
        isExpired: true, isSelfSigned: false, domainMatch: false, strongSig: false,
        grade: 'F', gradeColor: '#F87171',
      },
    ],
  },
  {
    id: 'selfsigned',
    domain: 'localhost.dev',
    description: 'A self-signed certificate (not from a trusted CA)',
    certs: [
      {
        id: 'srv3', label: 'localhost.dev', type: 'server',
        subject: 'CN=localhost.dev, O=Dev Local, C=US',
        issuer: 'CN=localhost.dev, O=Dev Local, C=US',
        validFrom: '2024-06-01', validTo: '2025-06-01',
        serialNumber: 'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99',
        fingerprint: '4D:5E:6F:7G:8H:9I:0J:1K:2L:3M:4N:5O:6P:7Q:8R:9S:0T:1U:2V:3W:4X:5Y:6Z:7A:8B:9C:0D:1E:2F',
        sigAlgo: 'sha256WithRSAEncryption', keySize: 2048,
        keyUsage: ['Digital Signature', 'Key Encipherment', 'Certificate Sign'],
        isExpired: false, isSelfSigned: true, domainMatch: true, strongSig: true,
        grade: 'C', gradeColor: '#FB923C',
      },
    ],
  },
];

function buildOpsCertChains({ target }: NonNullable<OpsContextProps['opsContext']>): CertChain[] {
  return [
    {
      id: 'target-valid',
      domain: target.certificate.host,
      description: `${target.platformName} active certificate chain`,
      certs: [
        {
          id: 'root-target',
          label: `${target.orgName} Root CA`,
          type: 'root',
          subject: `CN=${target.orgName} Root CA, O=${target.orgName}, C=US`,
          issuer: `CN=${target.orgName} Root CA, O=${target.orgName}, C=US`,
          validFrom: '2025-01-01',
          validTo: '2031-01-01',
          serialNumber: `ROOT:${target.targetId}`,
          fingerprint: target.certificate.fingerprint,
          sigAlgo: 'sha256WithRSAEncryption',
          keySize: 2048,
          keyUsage: ['Certificate Sign', 'CRL Sign'],
          isExpired: false,
          isSelfSigned: true,
          domainMatch: true,
          strongSig: true,
          grade: 'A+',
          gradeColor: '#4ADE80',
        },
        {
          id: 'srv-target',
          label: target.certificate.host,
          type: 'server',
          subject: target.certificate.subject,
          issuer: `CN=${target.certificate.issuer}, O=${target.orgName}, C=US`,
          validFrom: target.certificate.validFrom,
          validTo: target.certificate.validTo,
          serialNumber: target.certificate.serialNumber,
          fingerprint: target.certificate.fingerprint,
          sigAlgo: 'sha256WithRSAEncryption',
          keySize: 2048,
          keyUsage: ['Digital Signature', 'Key Encipherment'],
          isExpired: false,
          isSelfSigned: false,
          domainMatch: true,
          strongSig: true,
          grade: 'A+',
          gradeColor: '#4ADE80',
        },
      ],
    },
    {
      id: 'target-stale',
      domain: target.certificate.staleHost,
      description: `${target.platformName} stale legacy certificate`,
      certs: [
        {
          id: 'srv-stale',
          label: target.certificate.staleHost,
          type: 'server',
          subject: target.certificate.staleSubject,
          issuer: `CN=${target.certificate.staleIssuer}, O=${target.orgName}, C=US`,
          validFrom: '2023-02-01',
          validTo: target.certificate.staleValidTo,
          serialNumber: `STALE:${target.targetId}`,
          fingerprint: target.certificate.fingerprint.split(':').reverse().join(':'),
          sigAlgo: 'sha1WithRSAEncryption',
          keySize: 1024,
          keyUsage: ['Digital Signature'],
          isExpired: true,
          isSelfSigned: false,
          domainMatch: false,
          strongSig: false,
          grade: 'F',
          gradeColor: '#F87171',
        },
      ],
    },
    {
      id: 'target-vendor',
      domain: target.hosts.vendor,
      description: `${target.widgetName} partner certificate`,
      certs: [
        {
          id: 'srv-vendor',
          label: target.hosts.vendor,
          type: 'server',
          subject: `CN=${target.hosts.vendor}, O=${target.vendorName}, C=US`,
          issuer: `CN=${target.certificate.issuer}, O=${target.orgName}, C=US`,
          validFrom: '2026-01-10',
          validTo: '2026-12-10',
          serialNumber: `VENDOR:${target.targetId}`,
          fingerprint: target.certificate.fingerprint.slice(0, 23),
          sigAlgo: 'sha256WithRSAEncryption',
          keySize: 2048,
          keyUsage: ['Digital Signature', 'Key Encipherment'],
          isExpired: false,
          isSelfSigned: false,
          domainMatch: true,
          strongSig: true,
          grade: 'A',
          gradeColor: '#4ADE80',
        },
      ],
    },
  ];
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#4ADE80', 'A': '#4ADE80', 'B': '#FACC15', 'C': '#FB923C', 'F': '#F87171',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  root: <Crown size={20} strokeWidth={3} />,
  intermediate: <Medal size={20} strokeWidth={3} />,
  server: <Server size={20} strokeWidth={3} />,
};

const TYPE_COLORS: Record<string, string> = {
  root: '#FACC15',
  intermediate: '#A78BFA',
  server: '#4ADE80',
};

export default function CertViewer({ onScoreChange, opsContext }: Props) {
  const chains = useMemo(() => opsContext ? buildOpsCertChains(opsContext) : CERT_CHAINS, [opsContext]);
  const [domainInput, setDomainInput] = useState('');
  const [selectedChain, setSelectedChain] = useState<CertChain | null>(null);
  const [selectedCert, setSelectedCert] = useState<CertData | null>(null);
  const [score, setScore] = useState(0);
  const [inspectedCount, setInspectedCount] = useState(0);
  const [issuesFound, setIssuesFound] = useState(0);
  const [validatedChains, setValidatedChains] = useState<string[]>([]);
  const [animatingChain, setAnimatingChain] = useState(false);

  const addScore = useCallback((points: number) => {
    setScore(prev => {
      const next = prev + points;
      onScoreChange(next);
      return next;
    });
  }, [onScoreChange]);

  const inspectDomain = useCallback(() => {
    if (!domainInput) return;
    const chain = chains.find(c => c.domain === domainInput);
    if (chain) {
      setSelectedChain(chain);
      setSelectedCert(null);
      setInspectedCount(prev => prev + 1);
      addScore(30);
      const issues = chain.certs.filter(c => c.isExpired || c.isSelfSigned || !c.domainMatch || !c.strongSig).length;
      if (issues > 0) {
        setIssuesFound(prev => prev + issues);
        addScore(50);
      }
    }
  }, [domainInput, chains, addScore]);

  const loadChain = useCallback((chain: CertChain) => {
    setSelectedChain(chain);
    setDomainInput(chain.domain);
    setSelectedCert(null);
    setInspectedCount(prev => prev + 1);
    addScore(30);
  }, [addScore]);

  const runChainValidation = useCallback(() => {
    if (!selectedChain) return;
    setAnimatingChain(true);
    setSelectedCert(null);

    setTimeout(() => {
      setAnimatingChain(false);
      if (!validatedChains.includes(selectedChain.id)) {
        setValidatedChains(prev => [...prev, selectedChain.id]);
      }
    }, selectedChain.certs.length * 600);
  }, [selectedChain, validatedChains]);

  const reset = useCallback(() => {
    setDomainInput('');
    setSelectedChain(null);
    setSelectedCert(null);
    setValidatedChains([]);
  }, []);

  const overallGrade = selectedChain
    ? selectedChain.certs.reduce((worst, cert) => {
        const gradeOrder = ['A+', 'A', 'B', 'C', 'F'];
        return gradeOrder.indexOf(cert.grade) > gradeOrder.indexOf(worst) ? cert.grade : worst;
      }, 'A+' as string)
    : null;

  return (
    <div className="w-full min-h-[600px] bg-purple-pale p-4 font-nunito">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-success rounded-2xl border-4 border-black flex items-center justify-center">
            <ShieldCheck size={24} color="#FFFFFF" strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka text-purple-darker text-outline-sm">Cert Viewer</h2>
            <p className="text-sm text-purple-dark font-nunito">Inspect SSL certificates and their chains!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-accent px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2">
            <Trophy size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{score}</span>
          </div>
          <div className="bg-blue-info px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2 text-white">
            <Search size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{inspectedCount}</span>
          </div>
          <div className="bg-red-alert px-4 py-2 rounded-2xl border-4 border-black flex items-center gap-2 text-white">
            <AlertTriangle size={20} strokeWidth={3} />
            <span className="font-fredoka text-lg">{issuesFound}</span>
          </div>
          <button onClick={reset} className="p-2 bg-purple-light rounded-2xl border-4 border-black hover:bg-purple-primary transition-colors">
            <RotateCcw size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Domain Input */}
      <div className="bg-white rounded-2xl border-4 border-black p-3 mb-4 card-shadow">
        <div className="flex items-center gap-3">
          <Globe size={20} strokeWidth={3} color="#7C3AED" />
          <input
            type="text"
            value={domainInput}
            onChange={e => setDomainInput(e.target.value)}
            placeholder={`Enter domain (e.g., ${chains[0]?.domain ?? 'cyberpaw-arena.com'})`}
            className="flex-1 px-4 py-2 rounded-xl border-4 border-black font-mono text-sm focus:outline-none focus:ring-4 focus:ring-purple-primary bg-purple-pale"
          />
          <button
            onClick={inspectDomain}
            disabled={!domainInput}
            className="px-6 py-2 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center gap-2 bg-green-success transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            <Search size={16} strokeWidth={3} />
            INSPECT
          </button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {chains.map(chain => (
            <button
              key={chain.id}
              onClick={() => loadChain(chain)}
              className={`px-3 py-1.5 rounded-xl border-[3px] border-black font-fredoka text-xs transition-transform ${
                selectedChain?.id === chain.id ? 'bg-purple-primary text-white scale-105' : 'bg-purple-pale hover:bg-purple-lighter'
              }`}
            >
              {chain.domain}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Certificate Details */}
        <div className="lg:col-span-4 space-y-3">
          <AnimatePresence mode="wait">
            {selectedCert ? (
              <motion.div
                key={selectedCert.id}
                initial={{ x: -30, scale: 0.95 }}
                animate={{ x: 0, scale: 1 }}
                className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center"
                    style={{ backgroundColor: TYPE_COLORS[selectedCert.type] }}
                  >
                    {TYPE_ICONS[selectedCert.type]}
                  </div>
                  <div>
                    <h3 className="font-fredoka text-sm text-purple-darker">{selectedCert.label}</h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold border-2 border-black text-white"
                      style={{ backgroundColor: selectedCert.gradeColor }}
                    >
                      Grade {selectedCert.grade}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-nunito">
                  <DetailRow label="Subject" value={selectedCert.subject} icon={<Fingerprint size={12} strokeWidth={3} />} />
                  <DetailRow label="Issuer" value={selectedCert.issuer} icon={<Shield size={12} strokeWidth={3} />} />
                  <DetailRow label="Serial" value={selectedCert.serialNumber} icon={<Hash size={12} strokeWidth={3} />} />
                  <DetailRow label="Fingerprint" value={selectedCert.fingerprint.slice(0, 40) + '...'} icon={<Fingerprint size={12} strokeWidth={3} />} />
                  <DetailRow label="Signature" value={selectedCert.sigAlgo} icon={<KeyRound size={12} strokeWidth={3} />} />
                  <DetailRow label="Key Size" value={`${selectedCert.keySize} bits`} icon={<Lock size={12} strokeWidth={3} />} />

                  {/* Validity Timeline */}
                  <div className="bg-purple-pale rounded-lg border-2 border-purple-lighter p-2 mt-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar size={12} strokeWidth={3} color="#5B21B6" />
                      <span className="font-bold text-purple-darker">Validity Period</span>
                    </div>
                    <div className="relative h-6 bg-purple-lighter rounded-full border-2 border-black overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: selectedCert.isExpired ? '100%' : '60%' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: selectedCert.isExpired ? '#F87171' : '#4ADE80' }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                      <span>{selectedCert.validFrom}</span>
                      <span className={selectedCert.isExpired ? 'text-red-alert font-bold' : 'text-green-success font-bold'}>
                        {selectedCert.isExpired ? 'EXPIRED' : 'Valid'}
                      </span>
                      <span>{selectedCert.validTo}</span>
                    </div>
                  </div>

                  {/* Key Usage Badges */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedCert.keyUsage.map((usage, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold border-2 border-black bg-blue-info text-white">
                        {usage}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border-4 border-black p-8 card-shadow flex flex-col items-center justify-center text-center min-h-[200px]"
              >
                <ShieldCheck size={48} strokeWidth={2} color="#A78BFA" />
                <p className="font-fredoka text-lg text-purple-light mt-3">Click a certificate</p>
                <p className="text-sm text-purple-lighter font-nunito">Select any certificate in the chain to view details</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Export Button */}
          <button
            onClick={() => { if (selectedCert) addScore(10); }}
            disabled={!selectedCert}
            className="w-full px-4 py-2 rounded-2xl border-[3px] border-black font-fredoka text-sm flex items-center justify-center gap-2 bg-blue-info text-white transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            <Download size={16} strokeWidth={3} />
            Export PEM
          </button>
        </div>

        {/* Center Panel: Certificate Chain Visualization */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
            <h3 className="font-fredoka text-lg text-purple-darker mb-4 flex items-center gap-2">
              <Shield size={18} strokeWidth={3} />
              Certificate Chain
            </h3>

            {selectedChain ? (
              <div className="flex flex-col items-center gap-2">
                {selectedChain.certs.map((cert, i) => {
                  const isValidated = validatedChains.includes(selectedChain.id) && !animatingChain;
                  const isCurrentAnimating = animatingChain && i <= Math.floor((Date.now() % (selectedChain.certs.length * 600)) / 600);
                  const showCheck = isValidated || (animatingChain && i < selectedChain.certs.length);

                  return (
                    <div key={cert.id} className="flex flex-col items-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCert(cert)}
                        className={`w-full max-w-[360px] p-3 rounded-2xl border-[3px] border-black transition-all ${
                          selectedCert?.id === cert.id ? 'ring-4 ring-purple-primary scale-[1.02]' : ''
                        }`}
                        style={{ backgroundColor: cert.isExpired ? '#FEF2F2' : cert.isSelfSigned ? '#FFF7ED' : '#F5F3FF' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-full border-[3px] border-black flex items-center justify-center shrink-0"
                            style={{ backgroundColor: TYPE_COLORS[cert.type] }}
                          >
                            {TYPE_ICONS[cert.type]}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-fredoka text-sm text-purple-darker truncate">{cert.label}</p>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] font-mono text-purple-dark">{cert.type}</span>
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-black text-white"
                                style={{ backgroundColor: cert.gradeColor }}
                              >
                                {cert.grade}
                              </span>
                              {cert.isExpired && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-black bg-red-alert text-white">
                                  EXPIRED
                                </span>
                              )}
                              {cert.isSelfSigned && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-black bg-yellow-accent">
                                  Self-Signed
                                </span>
                              )}
                            </div>
                          </div>
                          {isValidated && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300, delay: i * 0.1 }}
                            >
                              <Check size={20} strokeWidth={3} color="#4ADE80" />
                            </motion.div>
                          )}
                        </div>
                      </motion.button>

                      {/* Connector Line */}
                      {i < selectedChain.certs.length - 1 && (
                        <div className="flex flex-col items-center py-1">
                          <motion.div
                            animate={isValidated ? { scaleY: [0, 1] } : {}}
                            className="w-1 h-6 bg-purple-light border-x-2 border-black origin-top"
                          />
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={isValidated ? { scale: 1 } : { scale: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <ShieldCheck size={14} strokeWidth={3} color="#4ADE80" />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Validate Chain Button */}
                <button
                  onClick={runChainValidation}
                  disabled={animatingChain}
                  className="mt-3 px-6 py-2 rounded-2xl border-4 border-black font-fredoka text-sm flex items-center gap-2 bg-green-success transition-transform hover:scale-[1.02] disabled:opacity-50"
                >
                  <ShieldCheck size={16} strokeWidth={3} />
                  {animatingChain ? 'Validating...' : 'Validate Chain'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                <Shield size={48} strokeWidth={2} color="#A78BFA" />
                <p className="font-fredoka text-lg text-purple-light mt-3">Select a domain to inspect</p>
                <p className="text-sm text-purple-lighter font-nunito">Choose from the buttons above or enter a domain</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Security Analysis */}
        <div className="lg:col-span-3 space-y-3">
          {selectedChain && overallGrade && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
            >
              <h3 className="font-fredoka text-lg text-purple-darker mb-3 flex items-center gap-2">
                <Award size={18} strokeWidth={3} />
                Security Analysis
              </h3>

              {/* Overall Grade */}
              <div className="text-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-black"
                  style={{ backgroundColor: GRADE_COLORS[overallGrade] || '#A78BFA' }}
                >
                  <span className="font-fredoka text-3xl text-white text-outline-sm">{overallGrade}</span>
                </motion.div>
                <p className="font-fredoka text-sm text-purple-darker mt-2">Overall Grade</p>
              </div>

              {/* Check List */}
              <div className="space-y-2">
                {selectedChain.certs.flatMap(cert => [
                  { label: 'Not expired', pass: !cert.isExpired, cert: cert.label },
                  { label: 'Valid chain', pass: !cert.isSelfSigned || cert.type === 'root', cert: cert.label },
                  { label: 'Strong signature (SHA-256+)', pass: cert.strongSig, cert: cert.label },
                  { label: 'Domain matches', pass: cert.domainMatch, cert: cert.label },
                  { label: 'Not self-signed', pass: !cert.isSelfSigned, cert: cert.label },
                  { label: 'Key size sufficient', pass: cert.keySize >= 2048, cert: cert.label },
                ]).map((check, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    {check.pass ? (
                      <Check size={16} strokeWidth={3} color="#4ADE80" />
                    ) : (
                      <X size={16} strokeWidth={3} color="#F87171" />
                    )}
                    <span className={`text-xs font-nunito ${check.pass ? 'text-green-700' : 'text-red-700'}`}>
                      {check.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Warnings */}
              {selectedChain.certs.some(c => c.isExpired || c.isSelfSigned) && (
                <div className="mt-3 bg-yellow-accent/20 rounded-xl border-[3px] border-yellow-accent p-2">
                  <h4 className="font-fredoka text-xs text-purple-darker flex items-center gap-1 mb-1">
                    <AlertTriangle size={12} strokeWidth={3} />
                    Warnings
                  </h4>
                  {selectedChain.certs.filter(c => c.isExpired).map(c => (
                    <p key={c.id} className="text-[10px] font-nunito text-red-700">
                      • {c.label}: Certificate has expired!
                    </p>
                  ))}
                  {selectedChain.certs.filter(c => c.isSelfSigned && c.type !== 'root').map(c => (
                    <p key={c.id} className="text-[10px] font-nunito text-orange-700">
                      • {c.label}: Self-signed certificate not trusted
                    </p>
                  ))}
                  {selectedChain.certs.filter(c => !c.strongSig).map(c => (
                    <p key={c.id} className="text-[10px] font-nunito text-orange-700">
                      • {c.label}: Weak signature algorithm
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {!selectedChain && (
            <div className="bg-white rounded-2xl border-4 border-black p-8 card-shadow flex flex-col items-center justify-center text-center min-h-[200px]">
              <Award size={48} strokeWidth={2} color="#A78BFA" />
              <p className="font-fredoka text-lg text-purple-light mt-3">Security Analysis</p>
              <p className="text-sm text-purple-lighter font-nunito">Inspect a certificate to see analysis</p>
            </div>
          )}

          {/* Status */}
          <div className="bg-white rounded-2xl border-4 border-black p-3 card-shadow">
            <h3 className="font-fredoka text-sm text-purple-darker mb-2">Status</h3>
            <div className="space-y-1 text-xs font-nunito">
              <div className="flex items-center justify-between">
                <span>Inspected:</span>
                <span className="font-bold text-purple-primary">{inspectedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Issues Found:</span>
                <span className="font-bold text-red-alert">{issuesFound}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Chains Validated:</span>
                <span className="font-bold text-green-success">{validatedChains.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-purple-pale rounded-lg border border-purple-lighter p-2">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-purple-primary">{icon}</span>
        <span className="font-bold text-purple-dark">{label}</span>
      </div>
      <p className="font-mono text-[10px] text-purple-darker break-all">{value}</p>
    </div>
  );
}
