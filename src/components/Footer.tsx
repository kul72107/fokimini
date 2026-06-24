import { Link } from 'react-router';
import { LogoCatHacker, PawDecoration } from './icons';

const quickLinks = [
  { path: '/games', label: 'All Games' },
  { path: '/terminal', label: 'Linux Terminal' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/profile', label: 'My Profile' },
];

const gameLinks = [
  { path: '/games/password-quest', label: 'Password Quest' },
  { path: '/games/phishing-detective', label: 'Phishing Detective' },
  { path: '/games/firewall-defender', label: 'Firewall Defender' },
  { path: '/games/crypto-cat', label: 'Crypto Cat' },
];

const safetyLinks = [
  { label: 'Parent Guide' },
  { label: 'Safety Promise' },
  { label: 'Privacy Policy' },
  { label: 'Terms of Use' },
];

export default function Footer() {
  return (
    <footer className="bg-purple-dark border-t-4 border-black relative overflow-hidden">
      {/* Subtle paw decorations */}
      <div className="absolute top-4 left-4 opacity-10 pointer-events-none">
        <PawDecoration size={120} fill="#A78BFA" />
      </div>
      <div className="absolute bottom-16 right-4 opacity-10 pointer-events-none rotate-45">
        <PawDecoration size={100} fill="#A78BFA" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <LogoCatHacker size={40} />
              <span className="font-fredoka font-bold text-xl text-white text-outline-sm">
                CyberPaws
              </span>
            </div>
            <p className="font-nunito text-sm text-purple-lighter leading-relaxed">
              A gamified cybersecurity education platform where kids learn to be digital defenders through fun, cat-themed games.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-fredoka font-semibold text-lg text-yellow-accent mb-3">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="font-nunito text-sm text-white hover:text-yellow-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Games */}
          <div>
            <h4 className="font-fredoka font-semibold text-lg text-yellow-accent mb-3">
              Popular Games
            </h4>
            <ul className="flex flex-col gap-2">
              {gameLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="font-nunito text-sm text-white hover:text-yellow-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety Info */}
          <div>
            <h4 className="font-fredoka font-semibold text-lg text-yellow-accent mb-3">
              Safety
            </h4>
            <ul className="flex flex-col gap-2">
              {safetyLinks.map((link, i) => (
                <li key={i}>
                  <span className="font-nunito text-sm text-white hover:text-yellow-accent transition-colors cursor-pointer">
                    {link.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t-4 border-black flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <span className="font-nunito text-sm text-purple-lighter">
            Made for young hackers
          </span>
          <span className="hidden sm:inline text-purple-light">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline">
              <ellipse cx="8" cy="10" rx="4" ry="3.5" fill="#A78BFA" stroke="#000" strokeWidth="1" />
              <ellipse cx="4.5" cy="5.5" rx="2.5" ry="3" fill="#A78BFA" stroke="#000" strokeWidth="1" />
              <ellipse cx="8" cy="4" rx="2.5" ry="3.5" fill="#A78BFA" stroke="#000" strokeWidth="1" />
              <ellipse cx="11.5" cy="5.5" rx="2.5" ry="3" fill="#A78BFA" stroke="#000" strokeWidth="1" />
            </svg>
          </span>
          <span className="font-nunito text-sm text-purple-lighter">
            100% Safe
          </span>
          <span className="hidden sm:inline text-purple-light">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline">
              <ellipse cx="8" cy="10" rx="4" ry="3.5" fill="#A78BFA" stroke="#000" strokeWidth="1" />
              <ellipse cx="4.5" cy="5.5" rx="2.5" ry="3" fill="#A78BFA" stroke="#000" strokeWidth="1" />
              <ellipse cx="8" cy="4" rx="2.5" ry="3.5" fill="#A78BFA" stroke="#000" strokeWidth="1" />
              <ellipse cx="11.5" cy="5.5" rx="2.5" ry="3" fill="#A78BFA" stroke="#000" strokeWidth="1" />
            </svg>
          </span>
          <span className="font-nunito text-sm text-purple-lighter">
            Kid-Friendly
          </span>
          <span className="hidden sm:inline text-purple-light">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline">
              <ellipse cx="8" cy="10" rx="4" ry="3.5" fill="#A78BFA" stroke="#000" strokeWidth="1" />
              <ellipse cx="4.5" cy="5.5" rx="2.5" ry="3" fill="#A78BFA" stroke="#000" strokeWidth="1" />
              <ellipse cx="8" cy="4" rx="2.5" ry="3.5" fill="#A78BFA" stroke="#000" strokeWidth="1" />
              <ellipse cx="11.5" cy="5.5" rx="2.5" ry="3" fill="#A78BFA" stroke="#000" strokeWidth="1" />
            </svg>
          </span>
          <span className="font-nunito text-sm text-purple-lighter">
            Free Forever
          </span>
        </div>
      </div>
    </footer>
  );
}
