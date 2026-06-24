import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Server,
  Monitor,
  ArrowRight,
  ArrowLeft,
  Zap,
  Trash2,
  Play,
  RotateCcw,
  Clock,
  Database,
  Shield,
  Check,
  X,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ProxyServerProps {
  onScoreChange: (score: number) => void;
}

interface Website {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
}

interface CacheEntry {
  websiteId: string;
  timestamp: number;
  hitCount: number;
}

interface RequestFlow {
  id: number;
  stage: 'client-to-proxy' | 'proxy-check' | 'proxy-to-internet' | 'internet-to-proxy' | 'proxy-to-client' | 'cache-hit';
  websiteId: string;
  isCacheHit: boolean;
}

const WEBSITES: Website[] = [
  { id: 'google', name: 'Google', url: 'google.com', icon: 'G', color: '#4ADE80' },
  { id: 'youtube', name: 'YouTube', url: 'youtube.com', icon: 'Y', color: '#F87171' },
  { id: 'wikipedia', name: 'Wikipedia', url: 'wikipedia.org', icon: 'W', color: '#A78BFA' },
  { id: 'github', name: 'GitHub', url: 'github.com', icon: 'H', color: '#333333' },
  { id: 'reddit', name: 'Reddit', url: 'reddit.com', icon: 'R', color: '#FB923C' },
  { id: 'amazon', name: 'Amazon', url: 'amazon.com', icon: 'A', color: '#60A5FA' },
];

const PROXY_IP = '203.0.113.10';

export default function ProxyServer({ onScoreChange }: ProxyServerProps) {
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [cache, setCache] = useState<CacheEntry[]>([]);
  const [activeFlow, setActiveFlow] = useState<RequestFlow | null>(null);
  const [clientRealIp, setClientRealIp] = useState('192.168.1.50');
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null);
  const [message, setMessage] = useState('Select a website to start the request flow!');
  const [requestCount, setRequestCount] = useState(0);
  const [cacheHits, setCacheHits] = useState(0);
  const [cacheMisses, setCacheMisses] = useState(0);
  const [totalResponseTime, setTotalResponseTime] = useState(0);
  const [showStart, setShowStart] = useState(true);
  const [contentFilterOn, setContentFilterOn] = useState(false);
  const [blockedSites] = useState<string[]>(['reddit']);
  const [responseTimeWithoutProxy, setResponseTimeWithoutProxy] = useState(0);
  const [requestIdCounter, setRequestIdCounter] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const levelTitles = ['Forward Proxy', 'Reverse Proxy', 'Transparent Proxy'];

  // FIX: Cleanup all pending timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const addTimeout = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  const isCached = useCallback(
    (websiteId: string) => cache.some((entry) => entry.websiteId === websiteId),
    [cache]
  );

  const getResponseTime = (websiteId: string) => {
    if (isCached(websiteId)) return Math.floor(Math.random() * 50 + 20);
    return Math.floor(Math.random() * 300 + 200);
  };

  const getResponseTimeNoProxy = () => Math.floor(Math.random() * 400 + 300);

  const handleRequest = (websiteId: string) => {
    if (!gameActive || activeFlow) return;

    if (contentFilterOn && blockedSites.includes(websiteId)) {
      setMessage(`Blocked by content filter! ${WEBSITES.find((w) => w.id === websiteId)?.name} is not allowed.`);
      // FIX: Use functional update for score
      setScore((prev) => {
        const newScore = Math.max(0, prev - 5);
        onScoreChange(newScore);
        return newScore;
      });
      return;
    }

    const cached = isCached(websiteId);
    const newId = requestIdCounter + 1;
    setRequestIdCounter(newId);
    setSelectedWebsite(websiteId);

    const flow: RequestFlow = {
      id: newId,
      stage: 'client-to-proxy',
      websiteId,
      isCacheHit: cached,
    };

    setActiveFlow(flow);
    setMessage(`Request to ${WEBSITES.find((w) => w.id === websiteId)?.name} started...`);

    // Animate through stages
    const stages: RequestFlow['stage'][] = cached
      ? ['client-to-proxy', 'proxy-check', 'cache-hit', 'proxy-to-client']
      : ['client-to-proxy', 'proxy-check', 'proxy-to-internet', 'internet-to-proxy', 'proxy-to-client'];

    // FIX: Clear any existing timeouts before starting new ones
    clearAllTimeouts();

    stages.forEach((stage, i) => {
      addTimeout(() => {
        setActiveFlow((prev) => (prev ? { ...prev, stage } : null));

        if (stage === 'proxy-to-client') {
          addTimeout(() => {
            finishRequest(websiteId, cached);
          }, 600);
        }
      }, i * 800);
    });
  };

  const finishRequest = (websiteId: string, cached: boolean) => {
    setActiveFlow(null);
    setRequestCount((prev) => prev + 1);

    const responseTime = getResponseTime(websiteId);
    const noProxyTime = getResponseTimeNoProxy();
    setTotalResponseTime((prev) => prev + responseTime);
    setResponseTimeWithoutProxy((prev) => prev + noProxyTime);

    if (cached) {
      setCacheHits((prev) => prev + 1);
      setCache((prev) =>
        prev.map((entry) =>
          entry.websiteId === websiteId ? { ...entry, hitCount: entry.hitCount + 1, timestamp: Date.now() } : entry
        )
      );
      // FIX: Use functional update to avoid stale score
      setScore((prev) => {
        const newScore = prev + 15;
        onScoreChange(Math.min(100, newScore));
        return newScore;
      });
      setMessage(`Cache HIT! ${WEBSITES.find((w) => w.id === websiteId)?.name} loaded instantly from cache. (${responseTime}ms)`);
    } else {
      setCacheMisses((prev) => prev + 1);
      setCache((prev) => [...prev, { websiteId, timestamp: Date.now(), hitCount: 0 }]);
      // FIX: Use functional update to avoid stale score
      setScore((prev) => {
        const newScore = prev + 10;
        onScoreChange(Math.min(100, newScore));
        return newScore;
      });
      setMessage(`Cache MISS. Fetched ${WEBSITES.find((w) => w.id === websiteId)?.name} from Internet. (${responseTime}ms)`);
    }

    // FIX: Use functional update to get latest requestCount
    setRequestCount((prevCount) => {
      const newCount = prevCount + 1;
      if (newCount >= 6 && level < 3) {
        addTimeout(() => {
          setLevel((prev) => {
            const nextLevel = prev + 1;
            setCache([]);
            setRequestCount(0);
            setMessage(`Level ${nextLevel}: ${levelTitles[nextLevel - 1]}! Try requesting more sites.`);
            return nextLevel;
          });
        }, 2000);
      }
      return newCount;
    });
  };

  const clearCache = () => {
    setCache([]);
    setMessage('Cache cleared! All subsequent requests will fetch from the Internet.');
  };

  const startGame = () => {
    clearAllTimeouts();
    setGameActive(true);
    setScore(0);
    setLevel(1);
    setCache([]);
    setActiveFlow(null);
    setRequestCount(0);
    setCacheHits(0);
    setCacheMisses(0);
    setTotalResponseTime(0);
    setResponseTimeWithoutProxy(0);
    setShowStart(false);
    onScoreChange(0);
    setMessage('Forward Proxy Mode: Click a website to see the request flow!');
  };

  const resetGame = () => {
    clearAllTimeouts();
    setGameActive(false);
    setShowStart(true);
    setScore(0);
    setLevel(1);
    setCache([]);
    setActiveFlow(null);
    setRequestCount(0);
    setCacheHits(0);
    setCacheMisses(0);
    setTotalResponseTime(0);
    setResponseTimeWithoutProxy(0);
    onScoreChange(0);
    setMessage('');
  };

  const hitRatio = cacheHits + cacheMisses > 0 ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100) : 0;
  const avgWithProxy = requestCount > 0 ? Math.round(totalResponseTime / requestCount) : 0;
  const avgWithoutProxy = requestCount > 0 ? Math.round(responseTimeWithoutProxy / requestCount) : 0;
  const bandwidthSaved = responseTimeWithoutProxy - totalResponseTime;

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'client-to-proxy':
        return 'Client → Proxy';
      case 'proxy-check':
        return 'Proxy checks cache...';
      case 'proxy-to-internet':
        return 'Proxy → Internet';
      case 'internet-to-proxy':
        return 'Internet → Proxy';
      case 'proxy-to-client':
        return 'Proxy → Client';
      case 'cache-hit':
        return 'CACHE HIT! Instant response!';
      default:
        return '';
    }
  };

  const getStageColor = (stage: string) => {
    if (stage.includes('cache-hit')) return 'text-green-success';
    if (stage.includes('internet')) return 'text-blue-info';
    if (stage.includes('proxy-check')) return 'text-yellow-accent';
    return 'text-purple-dark';
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 max-w-3xl mx-auto">
      {/* HUD */}
      <div className="w-full flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <Server size={18} strokeWidth={3} className="text-yellow-accent" />
          <span className="font-nunito text-sm font-bold text-white">{levelTitles[level - 1]}</span>
        </div>
        <div className="font-nunito text-sm font-bold text-yellow-accent">Score: {score}</div>
        <div className="font-nunito text-xs text-purple-lighter">
          L{level} | {requestCount} reqs
        </div>
      </div>

      {/* Message */}
      <div className="w-full bg-blue-info/20 rounded-xl border-[3px] border-blue-info p-2 text-center">
        <p className="font-nunito text-sm text-purple-dark">{message}</p>
      </div>

      {/* Start Screen */}
      {showStart && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-full bg-purple-pale rounded-2xl border-4 border-black p-6 text-center"
        >
          <Server size={48} strokeWidth={3} className="text-purple-primary mx-auto mb-3" />
          <h3 className="font-fredoka text-xl font-bold text-purple-dark mb-2">
            Proxy Server Simulator
          </h3>
          <p className="font-nunito text-sm text-purple-dark mb-4">
            Learn how proxy servers work! Watch requests flow through the proxy,
            see cache hits/misses, and understand IP anonymization.
          </p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark transition-colors hover:scale-105"
          >
            <Play size={18} strokeWidth={3} className="inline mr-2" />
            Start Simulation
          </button>
        </motion.div>
      )}

      {!showStart && (
        <>
          {/* Three-Column Diagram */}
          <div className="w-full bg-white rounded-2xl border-4 border-black overflow-hidden p-4">
            {/* Column Labels */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <span className="font-fredoka text-sm font-bold text-purple-dark">Client</span>
                <span className="font-mono text-[9px] text-purple-light block">{clientRealIp}</span>
              </div>
              <div className="text-center">
                <span className="font-fredoka text-sm font-bold text-purple-primary">Proxy Server</span>
                <span className="font-mono text-[9px] text-purple-light block">{PROXY_IP}</span>
              </div>
              <div className="text-center">
                <span className="font-fredoka text-sm font-bold text-purple-dark">Internet</span>
                <span className="font-mono text-[9px] text-purple-light block">Websites</span>
              </div>
            </div>

            {/* Diagram Boxes */}
            <div className="grid grid-cols-3 gap-4 relative" style={{ minHeight: 200 }}>
              {/* Client Column */}
              <div className="flex flex-col items-center justify-center">
                <motion.div
                  animate={activeFlow?.stage === 'client-to-proxy' ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="w-20 h-20 rounded-2xl border-[3px] border-black bg-blue-info flex flex-col items-center justify-center card-shadow-sm"
                >
                  <Monitor size={28} strokeWidth={3} className="text-white" />
                  <span className="font-nunito text-[9px] font-bold text-white">User</span>
                </motion.div>
                {activeFlow?.stage === 'client-to-proxy' && (
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: 60 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-10 left-[30%] z-10"
                  >
                    <div className="bg-yellow-accent border-2 border-black rounded-full px-2 py-1 font-mono text-[9px] font-bold">
                      GET /
                    </div>
                  </motion.div>
                )}
                {activeFlow?.stage === 'proxy-to-client' && (
                  <motion.div
                    initial={{ x: 60 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-24 left-[30%] z-10"
                  >
                    <div className="bg-green-success border-2 border-black rounded-full px-2 py-1 font-mono text-[9px] font-bold">
                      200 OK
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Proxy Column */}
              <div className="flex flex-col items-center justify-center">
                <motion.div
                  animate={
                    activeFlow && ['proxy-check', 'cache-hit', 'proxy-to-internet', 'internet-to-proxy'].includes(activeFlow.stage)
                      ? { scale: [1, 1.08, 1] }
                      : {}
                  }
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-24 h-28 rounded-2xl border-[3px] border-black bg-purple-primary flex flex-col items-center justify-center card-shadow"
                >
                  <Server size={32} strokeWidth={3} className="text-yellow-accent" />
                  <span className="font-nunito text-[9px] font-bold text-white mt-1">Proxy</span>
                  <span className="font-mono text-[7px] text-purple-lighter">{PROXY_IP}</span>
                </motion.div>

                {/* Cache indicator */}
                <div className="mt-2 bg-purple-pale rounded-lg border-2 border-black p-2 w-full max-w-[100px]">
                  <div className="flex items-center gap-1 mb-1">
                    <Database size={10} strokeWidth={3} className="text-purple-primary" />
                    <span className="font-nunito text-[8px] font-bold text-purple-dark">Cache</span>
                    <span className="font-mono text-[8px] ml-auto">{cache.length}</span>
                  </div>
                  <div className="space-y-0.5">
                    {cache.map((entry) => {
                      const site = WEBSITES.find((w) => w.id === entry.websiteId)!;
                      return (
                        <motion.div
                          key={entry.websiteId}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1"
                        >
                          <div
                            className="w-3 h-3 rounded-full border border-black flex items-center justify-center"
                            style={{ backgroundColor: site.color }}
                          >
                            <span className="text-[5px] font-bold text-white">{site.icon}</span>
                          </div>
                          <span className="font-mono text-[7px] text-purple-dark">{site.name}</span>
                        </motion.div>
                      );
                    })}
                    {cache.length === 0 && (
                      <span className="font-nunito text-[7px] text-purple-light">Empty</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Internet Column */}
              <div className="flex flex-col items-center justify-center">
                <motion.div
                  animate={activeFlow?.stage === 'proxy-to-internet' ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="w-20 h-20 rounded-2xl border-[3px] border-black bg-green-success flex flex-col items-center justify-center card-shadow-sm"
                >
                  <Globe size={28} strokeWidth={3} className="text-black" />
                  <span className="font-nunito text-[9px] font-bold text-black">Web</span>
                </motion.div>
                {activeFlow?.stage === 'proxy-to-internet' && (
                  <motion.div
                    initial={{ x: -60 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-10 right-[30%] z-10"
                  >
                    <div className="bg-yellow-accent border-2 border-black rounded-full px-2 py-1 font-mono text-[9px] font-bold">
                      GET / (from {PROXY_IP})
                    </div>
                  </motion.div>
                )}
                {activeFlow?.stage === 'internet-to-proxy' && (
                  <motion.div
                    initial={{ x: 0 }}
                    animate={{ x: -60 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-24 right-[30%] z-10"
                  >
                    <div className="bg-green-success border-2 border-black rounded-full px-2 py-1 font-mono text-[9px] font-bold">
                      200 OK + HTML
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Flow Stage Indicator */}
            {activeFlow && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                className="mt-3 bg-purple-pale rounded-xl border-[3px] border-purple-light p-2 text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <Zap size={14} strokeWidth={3} className={getStageColor(activeFlow.stage)} />
                  <span className={`font-nunito text-sm font-bold ${getStageColor(activeFlow.stage)}`}>
                    {getStageLabel(activeFlow.stage)}
                  </span>
                  {activeFlow.isCacheHit && activeFlow.stage === 'cache-hit' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-green-success rounded-full border-2 border-black px-2 py-0.5 font-nunito text-[10px] font-bold"
                    >
                      <Check size={10} strokeWidth={4} className="inline mr-1" />
                      INSTANT
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Website Selection */}
          <div className="w-full bg-white rounded-xl border-[3px] border-black p-3">
            <span className="font-nunito text-[10px] font-bold text-purple-dark mb-2 block">
              Click a website to request:
            </span>
            <div className="grid grid-cols-6 gap-2">
              {WEBSITES.map((site) => {
                const cached = isCached(site.id);
                const blocked = contentFilterOn && blockedSites.includes(site.id);
                return (
                  <motion.button
                    key={site.id}
                    whileHover={!activeFlow ? { scale: 1.1 } : {}}
                    whileTap={!activeFlow ? { scale: 0.95 } : {}}
                    onClick={() => handleRequest(site.id)}
                    disabled={!!activeFlow}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-[3px] transition-colors ${
                      blocked
                        ? 'border-red-alert bg-red-alert/20 opacity-50'
                        : cached
                        ? 'border-green-success bg-green-success/20'
                        : 'border-black bg-purple-pale hover:bg-purple-lighter'
                    } ${activeFlow ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center"
                      style={{ backgroundColor: site.color }}
                    >
                      <span className="font-nunito text-[10px] font-bold text-white">{site.icon}</span>
                    </div>
                    <span className="font-nunito text-[8px] font-bold text-purple-dark">{site.name}</span>
                    {cached && (
                      <span className="font-mono text-[7px] bg-green-success border border-black rounded-full px-1 text-black">
                        CACHED
                      </span>
                    )}
                    {blocked && (
                      <span className="font-mono text-[7px] bg-red-alert border border-black rounded-full px-1 text-white">
                        BLOCKED
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Stats Panel */}
          <div className="w-full grid grid-cols-4 gap-2">
            <div className="bg-white rounded-xl border-[3px] border-black p-2 text-center">
              <span className="font-nunito text-[9px] text-purple-light block">Cache Hit Ratio</span>
              <span className="font-fredoka text-lg font-bold text-purple-dark">{hitRatio}%</span>
            </div>
            <div className="bg-white rounded-xl border-[3px] border-black p-2 text-center">
              <span className="font-nunito text-[9px] text-purple-light block">Avg w/ Proxy</span>
              <span className="font-fredoka text-lg font-bold text-green-success">{avgWithProxy}ms</span>
            </div>
            <div className="bg-white rounded-xl border-[3px] border-black p-2 text-center">
              <span className="font-nunito text-[9px] text-purple-light block">Avg w/o Proxy</span>
              <span className="font-fredoka text-lg font-bold text-red-alert">{avgWithoutProxy}ms</span>
            </div>
            <div className="bg-white rounded-xl border-[3px] border-black p-2 text-center">
              <span className="font-nunito text-[9px] text-purple-light block">Time Saved</span>
              <span className="font-fredoka text-lg font-bold text-purple-primary">{bandwidthSaved}ms</span>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full flex gap-2 justify-center flex-wrap">
            <button
              onClick={clearCache}
              className="flex items-center gap-2 px-3 py-2 bg-purple-pale text-purple-dark border-[3px] border-black rounded-full font-nunito text-xs font-bold hover:bg-purple-lighter transition-colors hover:scale-105"
            >
              <Trash2 size={14} strokeWidth={3} /> Clear Cache
            </button>
            <button
              onClick={() => {
                // FIX: Use the callback form to get the latest state
                setContentFilterOn((prev) => {
                  const newValue = !prev;
                  setMessage(newValue ? 'Content filter enabled! Reddit is now blocked.' : 'Content filter disabled.');
                  return newValue;
                });
              }}
              className={`flex items-center gap-2 px-3 py-2 border-[3px] border-black rounded-full font-nunito text-xs font-bold transition-colors hover:scale-105 ${
                contentFilterOn ? 'bg-green-success text-black' : 'bg-purple-pale text-purple-dark'
              }`}
            >
              <Filter size={14} strokeWidth={3} />
              {contentFilterOn ? 'Filter: ON' : 'Filter: OFF'}
            </button>
            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-3 py-2 bg-red-alert text-white border-[3px] border-black rounded-full font-nunito text-xs font-bold hover:scale-105 transition-transform"
            >
              <RotateCcw size={14} strokeWidth={3} /> Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}
