import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, BookOpen, Gamepad2, Shield } from 'lucide-react';
import AccessAce from './game-simulations/AccessAce';
import CyberDuelArena from './game-simulations/CyberDuelArena';
import DNSResolver from './game-simulations/DNSResolver';
import FirewallDefender from './game-simulations/FirewallDefender';
import LogAnalyzer from './game-simulations/LogAnalyzer';
import MalwareHunter from './game-simulations/MalwareHunter';
import NetworkNavigator from './game-simulations/NetworkNavigator';
import './styles.css';

type TrainingGame = {
  id: string;
  title: string;
  mode: string;
  description: string;
  Component: (props: { onScoreChange: (score: number) => void }) => JSX.Element;
};

const GAMES: TrainingGame[] = [
  {
    id: 'cyber-duel',
    title: 'Cyber Duel Arena',
    mode: 'Duel',
    description: 'Build a six-slot simuletool loadout and defend service uptime round by round.',
    Component: CyberDuelArena,
  },
  {
    id: 'firewall',
    title: 'Firewall Defender',
    mode: 'Normal Play',
    description: 'Classify traffic and connect firewall decisions to operational simuletools.',
    Component: FirewallDefender,
  },
  {
    id: 'dns',
    title: 'DNS Resolver',
    mode: 'Normal Play',
    description: 'Trace resolver paths and connect DNS hygiene to topology and recovery tools.',
    Component: DNSResolver,
  },
  {
    id: 'network',
    title: 'Network Navigator',
    mode: 'Normal Play',
    description: 'Read safe paths, dependency risk, least privilege, and failure containment.',
    Component: NetworkNavigator,
  },
  {
    id: 'malware',
    title: 'Malware Hunter',
    mode: 'Normal Play',
    description: 'Practice containment, quarantine, patching, backup, and restart timing.',
    Component: MalwareHunter,
  },
  {
    id: 'access',
    title: 'Access Ace',
    mode: 'Normal Play',
    description: 'Train least privilege, tripwires, access review evidence, and response actions.',
    Component: AccessAce,
  },
  {
    id: 'logs',
    title: 'Log Analyzer',
    mode: 'Normal Play',
    description: 'Solve cases with timelines, traffic evidence, decoys, canaries, and quarantine.',
    Component: LogAnalyzer,
  },
];

function App() {
  const [activeGameId, setActiveGameId] = useState(GAMES[0].id);
  const [score, setScore] = useState(0);

  const activeGame = useMemo(
    () => GAMES.find((game) => game.id === activeGameId) ?? GAMES[0],
    [activeGameId]
  );
  const ActiveGame = activeGame.Component;

  return (
    <main className="min-h-screen bg-purple-pale text-purple-dark">
      <header className="border-b-4 border-black bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-black bg-yellow-accent shadow-[4px_4px_0_#111827]">
              <Shield size={26} strokeWidth={3} className="text-black" />
            </div>
            <div>
              <p className="font-nunito text-xs font-black uppercase tracking-wide text-purple-primary">
                Fokimini Cyber Training
              </p>
              <h1 className="font-fredoka text-2xl font-black text-purple-dark sm:text-3xl">
                Simuletool Training Lab
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-purple-dark px-3 py-2 font-nunito text-xs font-black text-white">
              <Activity size={14} strokeWidth={3} />
              Score {score}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-green-success px-3 py-2 font-nunito text-xs font-black text-black">
              <BookOpen size={14} strokeWidth={3} />
              17 Simuletools
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[280px_1fr]">
        <nav className="rounded-2xl border-4 border-black bg-white p-3 shadow-[6px_6px_0_#111827]">
          <div className="mb-3 flex items-center gap-2">
            <Gamepad2 size={18} strokeWidth={3} className="text-purple-primary" />
            <h2 className="font-fredoka text-lg font-black text-purple-dark">Modes</h2>
          </div>
          <div className="grid gap-2">
            {GAMES.map((game) => {
              const active = game.id === activeGameId;

              return (
                <button
                  key={game.id}
                  onClick={() => {
                    setActiveGameId(game.id);
                    setScore(0);
                  }}
                  className={`rounded-xl border-[3px] border-black p-3 text-left transition-transform hover:scale-[1.02] ${
                    active ? 'bg-yellow-accent' : 'bg-purple-pale'
                  }`}
                >
                  <span className="font-nunito text-[10px] font-black uppercase text-purple-primary">{game.mode}</span>
                  <span className="mt-0.5 block font-nunito text-sm font-black text-purple-dark">{game.title}</span>
                  <span className="mt-1 block font-nunito text-[10px] font-bold leading-snug text-purple-dark">
                    {game.description}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <section className="min-w-0 rounded-2xl border-4 border-black bg-white/60 shadow-[6px_6px_0_#111827]">
          <ActiveGame onScoreChange={setScore} />
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
