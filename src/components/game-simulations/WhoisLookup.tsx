import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, Calendar, Shield, Lock, Unlock, Star,
  Server, User, Building, MapPin, Check, X, Clock, ChevronRight,
  Award, Trophy
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

interface WhoisData {
  domain: string;
  registrar: { name: string; ianaId: string; url: string; color: string };
  dates: { created: string; updated: string; expires: string; color: string };
  owner: { organization: string; country: string; state: string; color: string };
  nameservers: string[];
  dnssec: boolean;
  status: string[];
  favorites: boolean;
}

const DEMO_DOMAINS: WhoisData[] = [
  {
    domain: 'cyberpaws.kids',
    registrar: { name: 'Paw registrar LLC', ianaId: '1234', url: 'https://pawreg.kids', color: '#60A5FA' },
    dates: { created: '2023-01-15', updated: '2024-11-01', expires: '2026-01-15', color: '#7C3AED' },
    owner: { organization: 'CyberPaws Academy', country: 'US', state: 'California', color: '#4ADE80' },
    nameservers: ['ns1.cyberpaws.kids', 'ns2.cyberpaws.kids', 'ns-cloud1.pawsdns.com'],
    dnssec: true,
    status: ['clientTransferProhibited', 'serverDeleteProhibited'],
    favorites: false,
  },
  {
    domain: 'google.com',
    registrar: { name: 'MarkMonitor Inc.', ianaId: '292', url: 'https://www.markmonitor.com', color: '#60A5FA' },
    dates: { created: '1997-09-15', updated: '2024-09-20', expires: '2028-09-14', color: '#7C3AED' },
    owner: { organization: 'Google LLC', country: 'US', state: 'California', color: '#4ADE80' },
    nameservers: ['ns1.google.com', 'ns2.google.com', 'ns3.google.com', 'ns4.google.com'],
    dnssec: true,
    status: ['clientDeleteProhibited', 'clientTransferProhibited', 'clientUpdateProhibited'],
    favorites: false,
  },
  {
    domain: 'github.com',
    registrar: { name: 'Cloudflare Inc.', ianaId: '1910', url: 'https://www.cloudflare.com', color: '#60A5FA' },
    dates: { created: '2007-10-09', updated: '2024-09-07', expires: '2027-10-09', color: '#7C3AED' },
    owner: { organization: 'GitHub Inc.', country: 'US', state: 'California', color: '#4ADE80' },
    nameservers: ['dns1.p08.nsone.net', 'dns2.p08.nsone.net', 'ns-1707.awsdns-21.co.uk'],
    dnssec: true,
    status: ['clientTransferProhibited'],
    favorites: false,
  },
];

const CARD_ICONS = {
  registrar: <Globe size={20} strokeWidth={3} />,
  dates: <Calendar size={20} strokeWidth={3} />,
  owner: <User size={20} strokeWidth={3} />,
  nameservers: <Server size={20} strokeWidth={3} />,
  dnssec: <Shield size={20} strokeWidth={3} />,
};

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function WhoisLookup({ onScoreChange }: Props) {
  const [domainInput, setDomainInput] = useState('');
  const [result, setResult] = useState<WhoisData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareResult, setCompareResult] = useState<WhoisData | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [lookupCount, setLookupCount] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const handleLookup = (domain?: string) => {
    const query = (domain || domainInput).toLowerCase().trim();
    if (!query) return;

    setIsSearching(true);
    setResult(null);
    setCompareResult(null);
    setShowTimeline(false);

    setTimeout(() => {
      const match = DEMO_DOMAINS.find(d => d.domain === query);
      if (match) {
        if (compareMode && result) {
          setCompareResult(match);
        } else {
          setResult(match);
          setTotalScore(prev => {
            const newScore = prev + 20;
            onScoreChange(Math.min(100, newScore));
            return newScore;
          });
          setLookupCount(c => c + 1);
        }
      } else {
        // Generate random whois data for unknown domains
        const generated: WhoisData = {
          domain: query,
          registrar: { name: 'Generic Registrar LLC', ianaId: '9999', url: 'https://example.com', color: '#60A5FA' },
          dates: { created: '2022-06-01', updated: '2024-01-01', expires: '2026-06-01', color: '#7C3AED' },
          owner: { organization: 'Private Registrant', country: 'US', state: 'Delaware', color: '#4ADE80' },
          nameservers: ['ns1.example.com', 'ns2.example.com'],
          dnssec: false,
          status: ['active'],
          favorites: false,
        };
        if (compareMode && result) {
          setCompareResult(generated);
        } else {
          setResult(generated);
          setTotalScore(prev => {
            const newScore = prev + 10;
            onScoreChange(Math.min(100, newScore));
            return newScore;
          });
          setLookupCount(c => c + 1);
        }
      }
      setIsSearching(false);
    }, 600);
  };

  const toggleFavorite = (domain: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

  const daysUntilExpiry = result ? getDaysUntil(result.dates.expires) : 0;
  const expiryPercent = Math.max(0, Math.min(100, 100 - (daysUntilExpiry / 365) * 100));

  return (
    <div className="flex flex-col gap-3 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <Search size={28} strokeWidth={3} className="text-purple-primary" />
        <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">WHOIS Lookup</h2>
      </div>

      {/* Top: Input + Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border-4 border-black p-4 card-shadow">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Globe size={20} strokeWidth={3} className="text-purple-primary" />
          <span className="font-nunito text-sm font-bold text-purple-dark">Domain:</span>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="cyberpaws.kids"
            className="flex-1 min-w-[120px] px-3 py-2 bg-purple-pale border-[3px] border-black rounded-xl font-mono text-sm text-purple-dark focus:outline-none focus:border-purple-primary"
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          />
        </div>

        <button
          onClick={() => handleLookup()}
          disabled={isSearching}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:scale-105 transition-transform disabled:opacity-50 card-shadow"
        >
          <Search size={16} strokeWidth={3} />
          {isSearching ? 'Searching...' : 'LOOKUP'}
        </button>

        <button
          onClick={() => {
            setCompareMode(!compareMode);
            setCompareResult(null);
          }}
          className={`flex items-center gap-1 px-3 py-2 border-[3px] border-black rounded-full font-nunito font-bold text-xs transition-all hover:scale-105 ${
            compareMode ? 'bg-yellow-accent text-black' : 'bg-purple-pale text-purple-dark'
          }`}
        >
          <Award size={14} strokeWidth={3} />
          {compareMode ? 'Compare ON' : 'Compare'}
        </button>
      </div>

      {/* Quick domains */}
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <span className="font-nunito text-xs font-bold text-purple-dark">Quick:</span>
        {DEMO_DOMAINS.map((d) => (
          <button
            key={d.domain}
            onClick={() => { setDomainInput(d.domain); handleLookup(d.domain); }}
            className="flex items-center gap-1 px-3 py-1 rounded-full border-[3px] border-black bg-white font-mono text-xs font-bold text-purple-dark hover:scale-105 transition-transform hover:bg-purple-pale"
          >
            {favorites.has(d.domain) && <Star size={10} strokeWidth={3} className="text-yellow-accent" fill="#FACC15" />}
            {d.domain}
          </button>
        ))}
      </div>

      {/* Compare mode hint */}
      {compareMode && result && !compareResult && (
        <div className="bg-yellow-accent/30 rounded-xl border-[3px] border-black px-4 py-2 text-center">
          <span className="font-nunito text-xs font-bold text-purple-dark">
            Enter a second domain and click LOOKUP to compare!
          </span>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {/* Domain header */}
            <div className="flex items-center justify-between bg-white rounded-2xl border-4 border-black p-4 card-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center">
                  <Globe size={20} strokeWidth={3} className="text-white" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg text-purple-dark">{result.domain}</h3>
                  <div className="flex items-center gap-1">
                    {result.status.map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-purple-pale border border-black rounded-full font-nunito text-[8px] font-bold text-purple-dark">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(result.domain)}
                  className="w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center hover:scale-110 transition-transform"
                  style={{ backgroundColor: favorites.has(result.domain) ? '#FACC15' : '#F5F3FF' }}
                >
                  <Star size={18} strokeWidth={3} className={favorites.has(result.domain) ? 'text-black' : 'text-purple-light'} fill={favorites.has(result.domain) ? '#FACC15' : 'transparent'} />
                </button>
                <button
                  onClick={() => setShowTimeline(!showTimeline)}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-info border-[3px] border-black rounded-full font-nunito font-bold text-xs text-white hover:scale-105 transition-transform"
                >
                  <Calendar size={12} strokeWidth={3} />
                  Timeline
                </button>
              </div>
            </div>

            {/* Timeline */}
            <AnimatePresence>
              {showTimeline && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white rounded-2xl border-4 border-black p-4 card-shadow">
                    <h4 className="font-fredoka text-sm text-purple-dark mb-3">Domain Lifecycle</h4>
                    <div className="relative flex items-center justify-between">
                      {/* Timeline line */}
                      <div className="absolute left-0 right-0 top-1/2 h-1 bg-purple-lighter border border-black rounded-full -translate-y-1/2" />
                      <div className="absolute left-0 top-1/2 h-1 bg-purple-primary border border-black rounded-full -translate-y-1/2" style={{ width: `${expiryPercent}%` }} />

                      {/* Created */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-green-success border-[3px] border-black flex items-center justify-center">
                          <Check size={14} strokeWidth={4} className="text-white" />
                        </div>
                        <span className="font-nunito text-[8px] font-bold text-purple-dark mt-1">Created</span>
                        <span className="font-mono text-[8px] text-purple-light">{formatDate(result.dates.created)}</span>
                      </div>

                      {/* Updated */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-info border-[3px] border-black flex items-center justify-center">
                          <Clock size={14} strokeWidth={3} className="text-white" />
                        </div>
                        <span className="font-nunito text-[8px] font-bold text-purple-dark mt-1">Updated</span>
                        <span className="font-mono text-[8px] text-purple-light">{formatDate(result.dates.updated)}</span>
                      </div>

                      {/* Expires */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-red-alert border-[3px] border-black flex items-center justify-center">
                          <Calendar size={14} strokeWidth={3} className="text-white" />
                        </div>
                        <span className="font-nunito text-[8px] font-bold text-purple-dark mt-1">Expires</span>
                        <span className="font-mono text-[8px] text-purple-light">{formatDate(result.dates.expires)}</span>
                      </div>
                    </div>

                    {/* Expiry countdown */}
                    <div className="mt-3 bg-purple-pale rounded-xl border-[3px] border-black p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-nunito text-xs font-bold text-purple-dark">Days until expiry:</span>
                        <span className="font-mono text-lg font-bold" style={{ color: daysUntilExpiry < 30 ? '#F87171' : '#4ADE80' }}>
                          {daysUntilExpiry}
                        </span>
                      </div>
                      <div className="h-3 bg-purple-lighter rounded-full border-2 border-black overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: daysUntilExpiry < 30 ? '#F87171' : '#4ADE80' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${expiryPercent}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Registrar Info */}
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0 }}
                onClick={() => setSelectedCard(selectedCard === 'registrar' ? null : 'registrar')}
                className={`rounded-2xl border-4 border-black p-4 text-left transition-all hover:scale-[1.02] ${
                  selectedCard === 'registrar' ? 'ring-2 ring-yellow-accent' : ''
                }`}
                style={{ backgroundColor: result.registrar.color + '20' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center" style={{ backgroundColor: result.registrar.color }}>
                    {CARD_ICONS.registrar}
                  </div>
                  <h4 className="font-fredoka text-sm text-purple-dark">Registrar Info</h4>
                </div>
                <div className="space-y-1">
                  <p className="font-nunito text-xs font-bold text-purple-dark">{result.registrar.name}</p>
                  <p className="font-mono text-[10px] text-purple-light">IANA ID: {result.registrar.ianaId}</p>
                  <p className="font-mono text-[10px] text-blue-info">{result.registrar.url}</p>
                </div>
              </motion.button>

              {/* Domain Info */}
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                onClick={() => setSelectedCard(selectedCard === 'dates' ? null : 'dates')}
                className={`rounded-2xl border-4 border-black p-4 text-left transition-all hover:scale-[1.02] ${
                  selectedCard === 'dates' ? 'ring-2 ring-yellow-accent' : ''
                }`}
                style={{ backgroundColor: result.dates.color + '20' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center" style={{ backgroundColor: result.dates.color }}>
                    {CARD_ICONS.dates}
                  </div>
                  <h4 className="font-fredoka text-sm text-purple-dark">Domain Dates</h4>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-nunito text-[10px] text-purple-light">Created:</span>
                    <span className="font-mono text-[10px] font-bold text-purple-dark">{formatDate(result.dates.created)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-nunito text-[10px] text-purple-light">Updated:</span>
                    <span className="font-mono text-[10px] font-bold text-purple-dark">{formatDate(result.dates.updated)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-nunito text-[10px] text-purple-light">Expires:</span>
                    <span className="font-mono text-[10px] font-bold text-red-alert">{formatDate(result.dates.expires)}</span>
                  </div>
                </div>
              </motion.button>

              {/* Owner Info */}
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => setSelectedCard(selectedCard === 'owner' ? null : 'owner')}
                className={`rounded-2xl border-4 border-black p-4 text-left transition-all hover:scale-[1.02] ${
                  selectedCard === 'owner' ? 'ring-2 ring-yellow-accent' : ''
                }`}
                style={{ backgroundColor: result.owner.color + '20' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center" style={{ backgroundColor: result.owner.color }}>
                    {CARD_ICONS.owner}
                  </div>
                  <h4 className="font-fredoka text-sm text-purple-dark">Owner Info</h4>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Building size={10} strokeWidth={3} className="text-purple-light" />
                    <span className="font-nunito text-xs font-bold text-purple-dark">{result.owner.organization}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={10} strokeWidth={3} className="text-purple-light" />
                    <span className="font-nunito text-[10px] text-purple-dark">{result.owner.state}, {result.owner.country}</span>
                  </div>
                </div>
              </motion.button>

              {/* Name Servers */}
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={() => setSelectedCard(selectedCard === 'ns' ? null : 'ns')}
                className={`rounded-2xl border-4 border-black p-4 text-left transition-all hover:scale-[1.02] ${
                  selectedCard === 'ns' ? 'ring-2 ring-yellow-accent' : ''
                }`}
                style={{ backgroundColor: '#FACC15' + '20' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center" style={{ backgroundColor: '#FACC15' }}>
                    {CARD_ICONS.nameservers}
                  </div>
                  <h4 className="font-fredoka text-sm text-purple-dark">Name Servers</h4>
                </div>
                <div className="space-y-1">
                  {result.nameservers.map((ns, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <Server size={10} strokeWidth={3} className="text-purple-light" />
                      <span className="font-mono text-[10px] text-purple-dark">{ns}</span>
                    </div>
                  ))}
                </div>
              </motion.button>
            </div>

            {/* DNSSEC Card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full border-[3px] border-black flex items-center justify-center ${
                    result.dnssec ? 'bg-green-success' : 'bg-red-alert'
                  }`}>
                    {result.dnssec ? <Lock size={18} strokeWidth={3} className="text-white" /> : <Unlock size={18} strokeWidth={3} className="text-white" />}
                  </div>
                  <div>
                    <h4 className="font-fredoka text-sm text-purple-dark">DNSSEC</h4>
                    <p className="font-nunito text-xs text-purple-light">
                      {result.dnssec ? 'DNSSEC is enabled - signatures verified!' : 'DNSSEC is disabled - vulnerable to spoofing!'}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full border-[3px] border-black font-nunito text-xs font-bold ${
                  result.dnssec ? 'bg-green-success text-green-800' : 'bg-red-alert text-white'
                }`}>
                  {result.dnssec ? 'SECURED' : 'UNSECURED'}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Results */}
      <AnimatePresence>
        {compareMode && result && compareResult && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="bg-white rounded-2xl border-4 border-black p-4 card-shadow"
          >
            <h3 className="font-fredoka text-sm text-purple-dark mb-3 flex items-center gap-2">
              <Trophy size={16} strokeWidth={3} className="text-yellow-accent" />
              Domain Comparison
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="font-nunito text-xs font-bold text-purple-dark">Property</div>
              <div className="font-mono text-xs font-bold text-purple-primary">{result.domain}</div>
              <div className="font-mono text-xs font-bold text-blue-info">{compareResult.domain}</div>

              {[
                ['Registrar', result.registrar.name, compareResult.registrar.name],
                ['Created', formatDate(result.dates.created), formatDate(compareResult.dates.created)],
                ['Expires', formatDate(result.dates.expires), formatDate(compareResult.dates.expires)],
                ['Owner', result.owner.organization, compareResult.owner.organization],
                ['DNSSEC', result.dnssec ? 'Yes' : 'No', compareResult.dnssec ? 'Yes' : 'No'],
              ].map(([label, val1, val2], i) => (
                <>
                  <div key={`l-${i}`} className="font-nunito text-[10px] font-bold text-purple-light py-1 border-t border-purple-lighter">{label}</div>
                  <div key={`v1-${i}`} className="font-nunito text-[10px] text-purple-dark py-1 border-t border-purple-lighter">{val1}</div>
                  <div key={`v2-${i}`} className="font-nunito text-[10px] text-purple-dark py-1 border-t border-purple-lighter">{val2}</div>
                </>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score */}
      <div className="flex items-center justify-center">
        <div className="bg-purple-dark rounded-2xl border-4 border-black px-6 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} strokeWidth={3} className="text-yellow-accent" />
            <span className="font-nunito text-xs font-bold text-purple-lighter">Score:</span>
            <span className="font-mono text-xl font-bold text-yellow-accent">{totalScore}</span>
          </div>
          <div className="w-px h-6 bg-purple-light" />
          <span className="font-nunito text-xs text-purple-lighter">Lookups: {lookupCount}</span>
          <div className="w-px h-6 bg-purple-light" />
          <div className="flex items-center gap-1">
            <Star size={14} strokeWidth={3} className="text-yellow-accent" fill="#FACC15" />
            <span className="font-nunito text-xs text-purple-lighter">{favorites.size} saved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
