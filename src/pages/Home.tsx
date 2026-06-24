import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Terminal } from 'lucide-react';
import {
  PawDecoration,
  IconPasswordGame,
  IconPhishingGame,
  IconFirewallGame,
  IconEncryptionGame,
  IconNetworkGame,
  IconMalwareGame,
  BadgeStar,
  BadgePaw,
  BadgeShield,
} from '../components/icons';

/* ─── Animation helpers ─── */
const springConfig = { type: 'spring' as const, stiffness: 120, damping: 14 };

const fadeInUp = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { ...springConfig, duration: 0.5 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerContainerSlow = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/* ─── Data ─── */
const stats = [
  { icon: '🎮', value: 24, suffix: '+', label: 'Security Games' },
  { icon: '👤', value: 50, suffix: 'K+', label: 'Young Hackers' },
  { icon: '🌍', value: 120, suffix: '', label: 'Countries' },
  { icon: '⭐', value: 5, suffix: '.0', label: 'Safety Rating' },
];

const featuredGames = [
  {
    id: 'password-quest',
    title: 'Password Quest',
    thumbnail: asset('thumb-password-quest.jpg'),
    category: 'Passwords',
    difficulty: 1,
    description: 'Learn to create super-strong passwords that no one can crack!',
    Icon: IconPasswordGame,
  },
  {
    id: 'phishing-detective',
    title: 'Phishing Detective',
    thumbnail: asset('thumb-phishing-detective.jpg'),
    category: 'Phishing',
    difficulty: 1,
    description: 'Spot fake emails and messages before they trick you!',
    Icon: IconPhishingGame,
  },
  {
    id: 'firewall-defender',
    title: 'Firewall Defender',
    thumbnail: asset('thumb-firewall-defender.jpg'),
    category: 'Firewall',
    difficulty: 2,
    description: 'Build walls to stop bad data from entering your network!',
    Icon: IconFirewallGame,
  },
  {
    id: 'crypto-cat',
    title: 'Crypto Cat',
    thumbnail: asset('thumb-crypto-cat.jpg'),
    category: 'Encryption',
    difficulty: 2,
    description: 'Learn secret codes that keep messages safe from spies!',
    Icon: IconEncryptionGame,
  },
  {
    id: 'network-navigator',
    title: 'Network Navigator',
    thumbnail: asset('thumb-network-navigator.jpg'),
    category: 'Networks',
    difficulty: 2,
    description: 'Explore how computers talk to each other safely!',
    Icon: IconNetworkGame,
  },
  {
    id: 'malware-hunter',
    title: 'Malware Hunter',
    thumbnail: asset('thumb-malware-hunter.jpg'),
    category: 'Malware',
    difficulty: 3,
    description: 'Find and remove nasty bugs hiding in the system!',
    Icon: IconMalwareGame,
  },
];

const steps = [
  {
    num: '1',
    color: 'bg-yellow-accent',
    title: 'Pick a Game',
    description: 'Choose from 24+ cybersecurity missions. Each one is a mini-game!',
  },
  {
    num: '2',
    color: 'bg-green-success',
    title: 'Learn by Doing',
    description: 'Solve puzzles, crack codes, and defend networks. Real skills, real fun!',
  },
  {
    num: '3',
    color: 'bg-pink-accent',
    title: 'Collect Badges',
    description: 'Earn XP, unlock badges, and climb the leaderboard. Show off your skills!',
  },
];

const categories = [
  {
    title: 'Passwords',
    color: 'bg-yellow-accent',
    Icon: IconPasswordGame,
    description: 'Create unbreakable passwords and learn why they matter.',
    count: 5,
  },
  {
    title: 'Phishing',
    color: 'bg-blue-info',
    Icon: IconPhishingGame,
    description: 'Recognize tricky messages that try to steal your info.',
    count: 4,
  },
  {
    title: 'Firewalls',
    color: 'bg-red-alert',
    Icon: IconFirewallGame,
    description: 'Understand how networks keep bad traffic out.',
    count: 3,
  },
  {
    title: 'Encryption',
    color: 'bg-purple-primary',
    Icon: IconEncryptionGame,
    description: 'Discover how secret codes protect your messages.',
    count: 4,
  },
  {
    title: 'Malware',
    color: 'bg-green-success',
    Icon: IconMalwareGame,
    description: 'Learn to spot and stop harmful software.',
    count: 4,
  },
  {
    title: 'Networking',
    color: 'bg-pink-accent',
    Icon: IconNetworkGame,
    description: 'Explore how data travels safely across the internet.',
    count: 4,
  },
];

const terminalLines = [
  { text: 'user@cyberpaws:~$ ls missions/', color: 'text-green-success' },
  { text: 'password-quest  phishing-detect  firewall-build', color: 'text-purple-dark' },
  { text: '', color: '' },
  { text: 'user@cyberpaws:~$ scan --network', color: 'text-green-success' },
  { text: 'Scanning... 3 devices found!', color: 'text-purple-dark' },
  { text: 'All secure ✓', color: 'text-green-success' },
  { text: '', color: '' },
  { text: 'user@cyberpaws:~$ ', color: 'text-green-success', cursor: true },
];

/* ─── Animated Counter ─── */
function StatCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20% 0px' });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ─── Difficulty Paws ─── */
function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <ellipse
            cx="8"
            cy="10"
            rx="4"
            ry="3.5"
            fill={i <= level ? '#A78BFA' : '#DDD6FE'}
            stroke="#000"
            strokeWidth="1.5"
          />
          <ellipse
            cx="4.5"
            cy="5.5"
            rx="2"
            ry="2.5"
            fill={i <= level ? '#A78BFA' : '#DDD6FE'}
            stroke="#000"
            strokeWidth="1.5"
          />
          <ellipse
            cx="8"
            cy="4"
            rx="2"
            ry="3"
            fill={i <= level ? '#A78BFA' : '#DDD6FE'}
            stroke="#000"
            strokeWidth="1.5"
          />
          <ellipse
            cx="11.5"
            cy="5.5"
            rx="2"
            ry="2.5"
            fill={i <= level ? '#A78BFA' : '#DDD6FE'}
            stroke="#000"
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </div>
  );
}

/* ─── Section 1: Hero ─── */
function HeroSection() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden px-4">
      {/* Floating paw decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[10%] left-[5%] opacity-15"
          animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PawDecoration size={160} />
        </motion.div>
        <motion.div
          className="absolute top-[20%] right-[8%] opacity-15"
          animate={{ y: [10, -20, 10], rotate: [5, -5, 5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PawDecoration size={120} />
        </motion.div>
        <motion.div
          className="absolute bottom-[15%] left-[10%] opacity-15"
          animate={{ y: [-15, 15, -15], rotate: [-10, 5, -10] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PawDecoration size={140} />
        </motion.div>
        <motion.div
          className="absolute bottom-[20%] right-[5%] opacity-15"
          animate={{ y: [15, -10, 15], rotate: [5, 10, 5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PawDecoration size={100} />
        </motion.div>
        <motion.div
          className="absolute top-[50%] left-[2%] opacity-10"
          animate={{ y: [-20, 20, -20], rotate: [-15, 10, -15] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PawDecoration size={80} />
        </motion.div>
        <motion.div
          className="absolute top-[40%] right-[2%] opacity-10"
          animate={{ y: [20, -15, 20], rotate: [10, -10, 10] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PawDecoration size={90} />
        </motion.div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Text Content */}
        <motion.div
          className="text-center lg:text-left"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1
            variants={fadeInUp}
            className="font-fredoka font-bold text-[40px] lg:text-[72px] leading-tight text-purple-dark text-outline mb-4"
          >
            Hack Like a Cat!
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="font-nunito font-semibold text-base lg:text-[22px] text-purple-dark max-w-[600px] mx-auto lg:mx-auto mb-8"
          >
            Learn cybersecurity by playing fun games — no boring lectures!
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6"
          >
            <Link
              to="/games"
              className="inline-flex items-center justify-center bg-yellow-accent text-black font-fredoka font-semibold text-lg lg:text-xl px-8 py-4 rounded-full border-4 border-black hover:scale-105 transition-transform shadow-solid"
            >
              Start Playing
            </Link>
            <Link
              to="/terminal"
              className="inline-flex items-center justify-center bg-white text-purple-dark font-fredoka font-semibold text-lg lg:text-xl px-8 py-4 rounded-full border-4 border-black hover:scale-105 transition-transform shadow-solid-sm"
            >
              Try Terminal
            </Link>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="flex items-center gap-2 justify-center lg:justify-start"
          >
            {[1, 2, 3].map((i) => (
              <svg key={i} width="20" height="20" viewBox="0 0 16 16" fill="none">
                <ellipse cx="8" cy="10" rx="4" ry="3.5" fill="#A78BFA" stroke="#000" strokeWidth="1.5" />
                <ellipse cx="4.5" cy="5.5" rx="2.5" ry="3" fill="#A78BFA" stroke="#000" strokeWidth="1.5" />
                <ellipse cx="8" cy="4" rx="2.5" ry="3.5" fill="#A78BFA" stroke="#000" strokeWidth="1.5" />
                <ellipse cx="11.5" cy="5.5" rx="2.5" ry="3" fill="#A78BFA" stroke="#000" strokeWidth="1.5" />
              </svg>
            ))}
            <span className="font-nunito text-sm text-purple-dark ml-2">
              100% Safe &bull; Kid-Friendly &bull; Free Forever
            </span>
          </motion.div>
        </motion.div>

        {/* Hero Mascot */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.6 }}
        >
          <motion.img
            src={asset('hero-cyber-cat.jpg')}
            alt="Cyber Cat Mascot"
            className="w-[280px] lg:w-[500px] h-auto rounded-3xl border-4 border-black shadow-solid-lg"
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Section 2: Stats Banner ─── */
function StatsBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20% 0px' });

  return (
    <section className="bg-purple-primary border-y-4 border-black py-6">
      <motion.div
        ref={ref}
        className="max-w-6xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-12"
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={staggerContainer}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className="text-center"
            variants={{
              hidden: { scale: 0.8, opacity: 0 },
              visible: {
                scale: 1,
                opacity: 1,
                transition: { type: 'spring', stiffness: 120, damping: 14 },
              },
            }}
          >
            <div className="mb-2">
              <svg width="32" height="32" viewBox="0 0 16 16" fill="none" className="mx-auto">
                <ellipse cx="8" cy="10" rx="4" ry="3.5" fill="#FFF" stroke="#000" strokeWidth="1.5" />
                <ellipse cx="4.5" cy="5.5" rx="2.5" ry="3" fill="#FFF" stroke="#000" strokeWidth="1.5" />
                <ellipse cx="8" cy="4" rx="2.5" ry="3.5" fill="#FFF" stroke="#000" strokeWidth="1.5" />
                <ellipse cx="11.5" cy="5.5" rx="2.5" ry="3" fill="#FFF" stroke="#000" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="font-fredoka font-bold text-3xl lg:text-5xl text-white text-outline-sm">
              <StatCounter target={stat.value} suffix={stat.suffix} />
            </div>
            <div className="font-nunito font-semibold text-sm text-purple-lighter mt-1">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ─── Section 3: Featured Games Carousel ─── */
function FeaturedGamesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-15% 0px' });

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -340 : 340, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, []);

  return (
    <section ref={sectionRef} className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center mb-10"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={springConfig}
        >
          <h2 className="font-fredoka font-semibold text-[32px] lg:text-5xl text-purple-dark text-outline-sm mb-3">
            Pick Your Mission
          </h2>
          <p className="font-nunito text-base lg:text-lg text-purple-dark">
            Choose a cybersecurity challenge and start learning!
          </p>
        </motion.div>

        <div className="relative">
          {/* Scroll buttons */}
          <button
            onClick={() => scroll('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center hover:scale-110 transition-transform ${
              !canScrollLeft ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <ChevronLeft size={24} className="text-white" strokeWidth={3} />
          </button>
          <button
            onClick={() => scroll('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center hover:scale-110 transition-transform ${
              !canScrollRight ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <ChevronRight size={24} className="text-white" strokeWidth={3} />
          </button>

          {/* Carousel */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide px-14 pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none' }}
          >
            {featuredGames.map((game, i) => (
              <motion.div
                key={game.id}
                className="flex-shrink-0 w-[300px] lg:w-[320px] snap-center"
                initial={{ x: 60, opacity: 0 }}
                animate={isInView ? { x: 0, opacity: 1 } : {}}
                transition={{ ...springConfig, delay: i * 0.1 }}
              >
                <Link to={`/games/${game.id}`} className="group block">
                  <div className="bg-purple-lighter rounded-2xl border-4 border-black overflow-hidden shadow-solid hover:shadow-solid-lg hover:scale-[1.03] transition-all duration-150">
                    {/* Thumbnail */}
                    <div className="relative h-[200px] overflow-hidden">
                      <img
                        src={game.thumbnail}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Content */}
                    <div className="p-4 text-center">
                      <div className="flex justify-center -mt-10 mb-2">
                        <div className="w-16 h-16 rounded-full bg-purple-pale border-[3px] border-black flex items-center justify-center">
                          <game.Icon size={40} />
                        </div>
                      </div>
                      <h3 className="font-fredoka font-semibold text-xl text-purple-dark mb-1">
                        {game.title}
                      </h3>
                      <span className="inline-block bg-blue-info text-white font-nunito font-semibold text-xs px-3 py-1 rounded-full border-2 border-black mb-2">
                        {game.category}
                      </span>
                      <p className="font-nunito text-sm text-purple-dark line-clamp-2 mb-3">
                        {game.description}
                      </p>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="font-nunito text-xs text-purple-dark font-semibold">Difficulty:</span>
                        <DifficultyDots level={game.difficulty} />
                      </div>
                      <div className="bg-yellow-accent text-black font-fredoka font-semibold text-base py-2.5 rounded-xl border-[3px] border-black group-hover:scale-[1.02] transition-transform">
                        Play Now
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 4: How It Works ─── */
function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-15% 0px' });

  return (
    <section ref={ref} className="bg-white py-16 lg:py-20 border-y-4 border-black">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={springConfig}
        >
          <h2 className="font-fredoka font-semibold text-[32px] lg:text-5xl text-purple-dark text-outline-sm">
            How CyberPaws Works
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connector line - desktop */}
          <div className="hidden lg:block absolute top-[60px] left-[16%] right-[16%] h-1">
            <svg width="100%" height="12" className="overflow-visible">
              <line
                x1="0"
                y1="6"
                x2="100%"
                y2="6"
                stroke="#A78BFA"
                strokeWidth="4"
                strokeDasharray="8 8"
                className="animate-dash"
              />
            </svg>
          </div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8"
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={staggerContainerSlow}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="text-center relative"
                variants={{
                  hidden: { y: 50, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: springConfig },
                }}
              >
                {/* Number circle */}
                <motion.div
                  className={`w-20 h-20 ${step.color} rounded-full border-4 border-black flex items-center justify-center mx-auto mb-6 relative z-10`}
                  variants={{
                    hidden: { scale: 0 },
                    visible: {
                      scale: 1,
                      transition: { type: 'spring', stiffness: 200, damping: 10 },
                    },
                  }}
                >
                  <span className="font-fredoka font-bold text-4xl text-black">
                    {step.num}
                  </span>
                </motion.div>

                {/* Illustration */}
                <div className="flex justify-center mb-4 h-[120px] items-center">
                  {i === 0 && (
                    <div className="relative">
                      <PawDecoration size={80} />
                      <div className="absolute -bottom-2 -right-2 bg-yellow-accent rounded-lg border-[3px] border-black p-1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="8" width="20" height="12" rx="2" />
                          <path d="M6 8V6a2 2 0 012-2h8a2 2 0 012 2v2" />
                          <line x1="12" y1="14" x2="12" y2="14.01" />
                          <line x1="8" y1="14" x2="8" y2="14.01" />
                          <line x1="16" y1="14" x2="16" y2="14.01" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {i === 1 && (
                    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                      <path d="M50 20C50 20 35 30 35 45C35 60 42 72 50 72C58 72 65 60 65 45C65 30 50 20 50 20Z" fill="#A78BFA" stroke="#000" strokeWidth="3" />
                      <path d="M40 30L30 18L45 26" fill="#F472B6" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
                      <path d="M60 30L70 18L55 26" fill="#F472B6" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
                      <circle cx="50" cy="12" r="8" fill="#FACC15" stroke="#000" strokeWidth="2.5" />
                      <line x1="50" y1="4" x2="50" y2="8" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                      <line x1="44" y1="6" x2="46" y2="10" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                      <line x1="56" y1="6" x2="54" y2="10" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="44" cy="42" r="3" fill="#FFF" stroke="#000" strokeWidth="1.5" />
                      <circle cx="56" cy="42" r="3" fill="#FFF" stroke="#000" strokeWidth="1.5" />
                    </svg>
                  )}
                  {i === 2 && (
                    <div className="flex gap-2 items-end">
                      <BadgeStar size={52} />
                      <BadgePaw size={56} />
                      <BadgeShield size={52} />
                    </div>
                  )}
                </div>

                <h3 className="font-fredoka font-semibold text-2xl text-purple-dark mb-2">
                  {step.title}
                </h3>
                <p className="font-nunito text-base text-purple-dark max-w-[280px] mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 5: Game Categories ─── */
function CategoriesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-15% 0px' });

  return (
    <section ref={ref} className="bg-purple-lighter py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={springConfig}
        >
          <h2 className="font-fredoka font-semibold text-[32px] lg:text-5xl text-purple-dark text-outline-sm">
            What Will You Learn?
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
        >
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              variants={{
                hidden: { y: 40, scale: 0.95, opacity: 0 },
                visible: {
                  y: 0,
                  scale: 1,
                  opacity: 1,
                  transition: { ...springConfig, delay: i * 0.08 },
                },
              }}
            >
              <Link to={`/games`} className="group block">
                <div className="bg-white rounded-2xl border-4 border-black p-5 min-h-[180px] shadow-solid hover:-translate-y-2 hover:shadow-solid-lg transition-all duration-150">
                  {/* Icon circle */}
                  <motion.div
                    className={`w-12 h-12 ${cat.color} rounded-full border-[3px] border-black flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform`}
                  >
                    <cat.Icon size={28} />
                  </motion.div>

                  <h3 className="font-fredoka font-semibold text-xl text-purple-dark mb-2">
                    {cat.title}
                  </h3>
                  <p className="font-nunito text-sm text-purple-dark line-clamp-2 mb-4">
                    {cat.description}
                  </p>

                  <div className="flex justify-end">
                    <span className={`inline-block ${cat.color} font-nunito font-bold text-xs px-3 py-1 rounded-full border-[2px] border-black`}>
                      {cat.count} Games
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Section 6: Terminal Teaser ─── */
function TerminalTeaserSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-15% 0px' });
  const features = [
    'Learn real Linux commands',
    'Practice security scanning',
    'Safe environment — nothing breaks!',
  ];

  return (
    <section ref={ref} className="bg-purple-dark py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={springConfig}
          >
            <h2 className="font-fredoka font-semibold text-3xl lg:text-[42px] text-white text-outline-sm mb-4 leading-tight">
              Become a Linux Wizard
            </h2>
            <p className="font-nunito text-base lg:text-lg text-purple-lighter mb-6">
              Type real commands in a safe terminal. Navigate files, run security scans, and feel like a real hacker!
            </p>
            <ul className="flex flex-col gap-3 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-success border-[2px] border-black flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-black" strokeWidth={3} />
                  </div>
                  <span className="font-nunito text-base text-purple-lighter">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/terminal"
              className="inline-flex items-center justify-center bg-green-success text-black font-fredoka font-semibold text-lg px-8 py-4 rounded-full border-4 border-black hover:scale-105 transition-transform shadow-solid"
            >
              <Terminal size={22} className="mr-2" strokeWidth={2.5} />
              Open Terminal
            </Link>
          </motion.div>

          {/* Right: Terminal Mockup */}
          <motion.div
            initial={{ x: 40, scale: 0.95, opacity: 0 }}
            animate={isInView ? { x: 0, scale: 1, opacity: 1 } : {}}
            transition={{ ...springConfig, delay: 0.2 }}
          >
            <div className="rounded-2xl border-4 border-black bg-white overflow-hidden shadow-solid-lg max-w-[500px] mx-auto">
              {/* Terminal header */}
              <div className="bg-purple-darker px-4 py-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-alert border-[2px] border-black" />
                  <div className="w-4 h-4 rounded-full bg-yellow-accent border-[2px] border-black" />
                  <div className="w-4 h-4 rounded-full bg-green-success border-[2px] border-black" />
                </div>
                <span className="font-jetbrains text-xs text-white ml-2">cyberpaws-terminal</span>
              </div>
              {/* Terminal body */}
              <div className="bg-white p-4 font-jetbrains text-sm min-h-[240px]">
                {terminalLines.map((line, i) => (
                  <div key={i} className={`${line.color || 'text-black'} mb-0.5`}>
                    {line.text}
                    {line.cursor && (
                      <span className="inline-block w-2.5 h-5 bg-green-success ml-0.5 animate-blink align-middle" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Section 7: CTA Footer ─── */
function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-15% 0px' });

  return (
    <section ref={ref} className="bg-yellow-accent border-t-4 border-black py-16 lg:py-20 relative overflow-hidden">
      {/* Floating paws */}
      <motion.div
        className="absolute top-4 left-8 opacity-20"
        animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PawDecoration size={100} />
      </motion.div>
      <motion.div
        className="absolute bottom-4 right-8 opacity-20"
        animate={{ y: [10, -10, 10], rotate: [5, -5, 5] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PawDecoration size={120} />
      </motion.div>
      <motion.div
        className="absolute top-8 right-16 opacity-15"
        animate={{ y: [-15, 15, -15] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PawDecoration size={80} />
      </motion.div>

      <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
        <motion.h2
          className="font-fredoka font-bold text-4xl lg:text-[56px] text-purple-dark text-outline mb-4"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: 'spring', stiffness: 150, damping: 12 }}
        >
          Ready to Start Hacking?
        </motion.h2>
        <motion.p
          className="font-nunito font-semibold text-base lg:text-xl text-purple-dark mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ ...springConfig, delay: 0.2 }}
        >
          Join thousands of young cybersecurity heroes. It&apos;s 100% free!
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ ...springConfig, delay: 0.3 }}
        >
          <Link
            to="/games"
            className="inline-flex items-center justify-center bg-purple-primary text-white font-fredoka font-semibold text-xl lg:text-[22px] px-10 py-5 rounded-full border-4 border-black hover:bg-purple-dark hover:scale-[1.08] transition-all duration-150 shadow-solid"
          >
            Play Now — It&apos;s Free!
          </Link>
        </motion.div>

        {/* Avatar row */}
        <motion.div
          className="flex items-center justify-center gap-1 mt-8"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
        >
          {[1, 2, 3, 4, 5].map((_, i) => (
            <motion.div
              key={i}
              className="w-8 h-8 rounded-full bg-purple-primary border-[2px] border-black -ml-2 first:ml-0 flex items-center justify-center overflow-hidden"
              variants={{
                hidden: { scale: 0 },
                visible: {
                  scale: 1,
                  transition: { type: 'spring', stiffness: 200, damping: 10, delay: 0.4 + i * 0.05 },
                },
              }}
            >
              <span className="font-fredoka text-xs text-white">
                {['😺', '😸', '😹', '😻', '😼'][i]}
              </span>
            </motion.div>
          ))}
          <span className="font-nunito font-semibold text-sm text-purple-dark ml-3">
            50,000+ players
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Main Home Page ─── */
export default function Home() {
  return (
    <div>
      <HeroSection />
      <StatsBanner />
      <FeaturedGamesCarousel />
      <HowItWorksSection />
      <CategoriesSection />
      <TerminalTeaserSection />
      <CTASection />
    </div>
  );
}
