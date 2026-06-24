import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Star,
  Lock,
  Check,
  Lightbulb,
  HelpCircle,
  Flame,
  BookOpen,
  Settings,
  Search,
  Trophy,
  Shield,
  FileText,
  Compass,
  Key,
  Eye,
  Flame as FlameIcon,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import type { FileSystemState } from '@/lib/filesystem';
import { createInitialState, getPromptPath } from '@/lib/filesystem';
import { executeCommand, getCompletions } from '@/lib/commands';
import type { CommandOutput, CommandContext } from '@/lib/commands';
import {
  DEFAULT_MISSIONS,
  DEFAULT_ACHIEVEMENTS,
  checkMissionProgress,
  checkAchievements,
} from '@/lib/missions';
import type { Mission, Achievement } from '@/lib/missions';
import { DEFAULT_THEMES, getThemeColors } from '@/lib/themes';
import type { TerminalTheme } from '@/lib/themes';

interface OutputLine {
  id: number;
  prompt: string;
  command: string;
  outputs: CommandOutput[];
  timestamp: number;
}

export default function TerminalPage() {
  const [fs, setFs] = useState<FileSystemState>(createInitialState);
  const [input, setInput] = useState('');
  const [outputs, setOutputs] = useState<OutputLine[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [outputId, setOutputId] = useState(0);
  const [missions, setMissions] = useState<Mission[]>(DEFAULT_MISSIONS);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [activeMission, setActiveMission] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'missions' | 'achievements' | 'themes'>('missions');
  const [theme, setTheme] = useState<TerminalTheme>(DEFAULT_THEMES[0]);
  const [showHelp, setShowHelp] = useState(false);
  const [totalCommands, setTotalCommands] = useState(0);
  const [filesCreated, setFilesCreated] = useState(0);
  const [networkCommands, setNetworkCommands] = useState<string[]>([]);
  const [missionsCompleted, setMissionsCompleted] = useState<number[]>([]);
  const [uniqueCommands, setUniqueCommands] = useState<Set<string>>(new Set());
  const [showMissionPanel, setShowMissionPanel] = useState(true);
  const [completions, setCompletions] = useState<string[]>([]);
  const [showCompletions, setShowCompletions] = useState(false);
  const [completionIdx, setCompletionIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const termBodyRef = useRef<HTMLDivElement>(null);

  const promptStr = `user@cyberpaws:${getPromptPath(fs.currentDir)}$`;

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputs]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getCtx = useCallback((): CommandContext => {
    const allCommands = outputs.map((o) => o.command);
    return {
      fs,
      username: 'user',
      hostname: 'cyberpaws',
      history: allCommands,
      missionsCompleted,
      commandsUsed: Array.from(uniqueCommands),
    };
  }, [fs, missionsCompleted, outputs, uniqueCommands]);

  const handleSubmit = useCallback(
    (rawInput: string) => {
      const trimmed = rawInput.trim();
      if (!trimmed) return;

      setHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);
      setTotalCommands((c) => c + 1);

      const cmd = trimmed.split(/\s+/)[0].toLowerCase();
      setUniqueCommands((prev) => new Set(prev).add(cmd));

      if (cmd === 'touch' || cmd === 'mkdir') {
        setFilesCreated((c) => c + 1);
      }
      if (['ifconfig', 'ping', 'nmap', 'netstat', 'traceroute', 'ssh', 'curl', 'wget'].includes(cmd)) {
        setNetworkCommands((prev) => [...prev, cmd]);
      }

      const ctx = getCtx();
      const result = executeCommand(trimmed, ctx);

      // Handle clear
      if (result.clear) {
        setOutputs([]);
        setInput('');
        return;
      }

      // Handle exit
      if (result.exit) {
        const newLine: OutputLine = {
          id: outputId,
          prompt: promptStr,
          command: trimmed,
          outputs: result.outputs,
          timestamp: Date.now(),
        };
        setOutputs((prev) => [...prev, newLine]);
        setOutputId((i) => i + 1);
        setInput('');
        return;
      }

      // Update filesystem state
      if (result.newState) {
        setFs((prev) => ({ ...prev, ...result.newState }));
      }

      const newLine: OutputLine = {
        id: outputId,
        prompt: promptStr,
        command: trimmed,
        outputs: result.outputs,
        timestamp: Date.now(),
      };
      setOutputs((prev) => [...prev, newLine]);
      setOutputId((i) => i + 1);
      setInput('');

      // Check mission progress
      setMissions((prev) => {
        let changed = false;
        const updated = prev.map((m) => {
          if (m.completed) return m;
          const progressed = checkMissionProgress(m, trimmed, fs);
          if (progressed.completed && !m.completed) {
            changed = true;
            setMissionsCompleted((mc) => [...mc, m.id]);
          }
          if (
            progressed.objectives.some((o, i) => o.completed && !m.objectives[i].completed) ||
            progressed.completed !== m.completed
          ) {
            changed = true;
          }
          return progressed;
        });
        return changed ? updated : prev;
      });

      // Check achievements
      setAchievements((prev) =>
        checkAchievements(prev, trimmed, totalCommands + 1, missionsCompleted.length, filesCreated, networkCommands)
      );
    },
    [getCtx, outputId, promptStr, fs, totalCommands, filesCreated, networkCommands, missionsCompleted]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Tab completion
      if (e.key === 'Tab') {
        e.preventDefault();
        if (!showCompletions || completions.length === 0) {
          const comps = getCompletions(input, fs);
          if (comps.length > 0) {
            setCompletions(comps);
            setShowCompletions(true);
            setCompletionIdx(0);
            if (comps.length === 1) {
              const parts = input.split(/\s+/);
              if (parts.length <= 1) {
                setInput(comps[0] + ' ');
              } else {
                parts[parts.length - 1] = comps[0];
                setInput(parts.join(' '));
              }
              setShowCompletions(false);
            }
          }
        } else {
          const nextIdx = (completionIdx + 1) % completions.length;
          setCompletionIdx(nextIdx);
          const parts = input.split(/\s+/);
          if (parts.length <= 1) {
            setInput(completions[nextIdx] + ' ');
          } else {
            parts[parts.length - 1] = completions[nextIdx];
            setInput(parts.join(' '));
          }
        }
        return;
      }

      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
        setShowCompletions(false);
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHistoryIndex((i) => {
          const newIdx = i === -1 ? history.length - 1 : Math.max(0, i - 1);
          setInput(history[newIdx] || '');
          return newIdx;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHistoryIndex((i) => {
          if (i === -1) return -1;
          const newIdx = i + 1;
          if (newIdx >= history.length) {
            setInput('');
            return -1;
          }
          setInput(history[newIdx] || '');
          return newIdx;
        });
      } else if (e.key === 'Enter') {
        handleSubmit(input);
      }
    },
    [input, history, historyIndex, showCompletions, completions, completionIdx, fs, handleSubmit]
  );

  const terminalLevel = (() => {
    const count = uniqueCommands.size;
    if (count < 5) return { name: 'Beginner', color: '#A78BFA' };
    if (count < 12) return { name: 'Intermediate', color: '#60A5FA' };
    if (count < 20) return { name: 'Advanced', color: '#4ADE80' };
    if (count < 30) return { name: 'Expert', color: '#FACC15' };
    return { name: 'Master', color: '#F472B6' };
  })();

  const unlockedThemes = DEFAULT_THEMES.map((t) => ({
    ...t,
    unlocked:
      t.unlocked ||
      (t.id === 'hacker' && missionsCompleted.length >= 3) ||
      (t.id === 'sunset' && missionsCompleted.length >= 5) ||
      (t.id === 'ocean' && missionsCompleted.length >= 7) ||
      (t.id === 'cyberpaw' && missionsCompleted.length >= 10),
  }));

  const themeColors = getThemeColors(theme);

  return (
    <div className="min-h-[100dvh] bg-purple-pale">
      {/* Page Header */}
      <section className="bg-purple-dark px-4 sm:px-6 pt-[88px] pb-6 relative overflow-hidden">
        {/* Floating decoration */}
        <div className="absolute top-20 right-8 opacity-10 pointer-events-none hidden lg:block">
          <svg width="120" height="120" viewBox="0 0 200 200" fill="none">
            <ellipse cx="100" cy="140" rx="50" ry="40" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="55" cy="80" rx="30" ry="35" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="100" cy="55" rx="30" ry="38" fill="#A78BFA" stroke="#000" strokeWidth="4" />
            <ellipse cx="145" cy="80" rx="30" ry="35" fill="#A78BFA" stroke="#000" strokeWidth="4" />
          </svg>
        </div>

        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Terminal size={40} strokeWidth={3} className="text-green-success" />
              <svg width="36" height="36" viewBox="0 0 128 128" fill="none">
                <ellipse cx="64" cy="80" rx="40" ry="36" fill="#7C3AED" stroke="#fff" strokeWidth="3" />
                <ellipse cx="30" cy="48" rx="20" ry="22" fill="#7C3AED" stroke="#fff" strokeWidth="3" />
                <ellipse cx="64" cy="32" rx="20" ry="24" fill="#7C3AED" stroke="#fff" strokeWidth="3" />
                <ellipse cx="98" cy="48" rx="20" ry="22" fill="#7C3AED" stroke="#fff" strokeWidth="3" />
              </svg>
            </div>
            <div>
              <h1 className="font-fredoka font-bold text-3xl sm:text-4xl lg:text-5xl text-white text-outline-sm">
                Cyber Terminal
              </h1>
              <p className="font-nunito text-sm sm:text-base text-purple-lighter">
                Learn real Linux commands like a pro hacker!
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-purple-darker border-[3px] border-black rounded-full px-3 py-1.5">
              <div className="w-4 h-4 rounded-full bg-green-success border-2 border-black" />
              <span className="font-nunito font-semibold text-sm text-white">{uniqueCommands.size} cmds</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-darker border-[3px] border-black rounded-full px-3 py-1.5">
              <Star size={16} fill="#FACC15" strokeWidth={0} />
              <span className="font-nunito font-semibold text-sm text-white">{missionsCompleted.length}/10</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-darker border-[3px] border-black rounded-full px-3 py-1.5">
              <Flame size={16} className="text-yellow-accent" />
              <span className="font-nunito font-semibold text-sm text-white">{terminalLevel.name}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Terminal Interface */}
      <section className="px-4 sm:px-6 py-6">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6" style={{ minHeight: 'calc(100dvh - 200px)' }}>
          {/* Terminal Window */}
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            className="flex-1 lg:flex-[0.65] flex flex-col"
          >
            {/* Terminal Frame */}
            <div
              className="border-4 border-black rounded-2xl overflow-hidden flex flex-col"
              style={{
                boxShadow: '8px 8px 0px 0px #3B0764',
                ...themeColors,
              }}
            >
              {/* Title Bar */}
              <div
                className="h-9 flex items-center px-3 gap-2 border-b-4 border-black"
                style={{ backgroundColor: theme.headerBg }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-alert border-2 border-black" />
                  <div className="w-3 h-3 rounded-full bg-yellow-accent border-2 border-black" />
                  <div className="w-3 h-3 rounded-full bg-green-success border-2 border-black" />
                </div>
                <div className="flex-1 text-center">
                  <span className="font-jetbrains text-xs text-white opacity-80">
                    user@cyberpaws:{getPromptPath(fs.currentDir)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="text-white/60 hover:text-white transition-none">
                    <Minimize2 size={14} strokeWidth={2.5} />
                  </button>
                  <button className="text-white/60 hover:text-white transition-none">
                    <Maximize2 size={14} strokeWidth={2.5} />
                  </button>
                  <button className="text-white/60 hover:text-white transition-none">
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Terminal Body */}
              <div
                ref={termBodyRef}
                className="flex-1 p-4 sm:p-5 overflow-y-auto"
                style={{
                  backgroundColor: theme.bodyBg,
                  minHeight: '400px',
                  maxHeight: '600px',
                }}
                onClick={() => inputRef.current?.focus()}
              >
                {/* Welcome message */}
                {outputs.length === 0 && (
                  <div className="mb-4">
                    <pre
                      className="font-jetbrains text-sm leading-relaxed"
                      style={{ color: theme.outputColor }}
                    >
                      {`
  /\\_/\\
 ( o.o )   Welcome to CyberPaw Terminal v1.0!
  > ^ <

Type "help" to see all available commands.
Type "missions" to see your training missions.

`}
                    </pre>
                  </div>
                )}

                {/* Output Lines */}
                <div ref={outputRef} className="flex flex-col gap-2">
                  {outputs.map((line) => (
                    <div key={line.id} className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-start gap-1">
                        <span
                          className="font-jetbrains text-sm whitespace-pre-wrap shrink-0"
                          style={{ color: theme.promptColor }}
                        >
                          {line.prompt}
                        </span>
                        <span
                          className="font-jetbrains text-sm whitespace-pre-wrap"
                          style={{ color: theme.textColor }}
                        >
                          {line.command}
                        </span>
                      </div>
                      {line.outputs.map((out, i) => (
                        <pre
                          key={i}
                          className="font-jetbrains text-sm whitespace-pre-wrap leading-relaxed pl-0"
                          style={{
                            color:
                              out.type === 'error'
                                ? theme.errorColor
                                : out.type === 'success'
                                ? theme.successColor
                                : out.type === 'warning'
                                ? theme.warningColor
                                : out.type === 'info'
                                ? themeColors['--term-path']
                                : out.type === 'ascii'
                                ? theme.outputColor
                                : theme.outputColor,
                          }}
                        >
                          {out.text}
                        </pre>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Input Line */}
                <div className="flex flex-wrap items-start gap-1 mt-1">
                  <span
                    className="font-jetbrains text-sm shrink-0"
                    style={{ color: theme.promptColor }}
                  >
                    {promptStr}
                  </span>
                  <div className="relative flex-1 min-w-[200px]">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent font-jetbrains text-sm outline-none caret-transparent"
                      style={{
                        color: theme.textColor,
                        caretColor: theme.cursorColor,
                      }}
                      spellCheck={false}
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                    />
                    {/* Blinking block cursor overlay */}
                    <span
                      className="absolute top-0 left-0 pointer-events-none font-jetbrains text-sm animate-blink"
                      style={{
                        color: 'transparent',
                        marginLeft: `${input.length * 8.4}px`,
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: theme.cursorColor,
                          color: theme.bodyBg,
                        }}
                      >
                        &nbsp;
                      </span>
                    </span>
                  </div>
                </div>

                {/* Tab completions dropdown */}
                <AnimatePresence>
                  {showCompletions && completions.length > 1 && (
                    <motion.div
                      initial={{ opacity: 1, y: -5 }}
                      exit={{ opacity: 1, y: -5 }}
                      className="mt-1 border-[3px] border-black rounded-lg p-2 max-h-40 overflow-y-auto"
                      style={{ backgroundColor: theme.headerBg }}
                    >
                      {completions.map((c, i) => (
                        <div
                          key={c}
                          className="font-jetbrains text-sm px-2 py-0.5 rounded cursor-pointer"
                          style={{
                            color: i === completionIdx ? theme.bodyBg : theme.textColor,
                            backgroundColor: i === completionIdx ? theme.promptColor : 'transparent',
                          }}
                          onClick={() => {
                            const parts = input.split(/\s+/);
                            if (parts.length <= 1) {
                              setInput(c + ' ');
                            } else {
                              parts[parts.length - 1] = c;
                              setInput(parts.join(' '));
                            }
                            setShowCompletions(false);
                            inputRef.current?.focus();
                          }}
                        >
                          {c}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                onClick={() => handleSubmit('help')}
                className="flex items-center gap-1.5 bg-purple-primary border-[3px] border-black rounded-full px-3 py-1.5 text-white font-nunito font-semibold text-sm hover:scale-105 transition-transform"
              >
                <HelpCircle size={14} strokeWidth={2.5} />
                Help
              </button>
              <button
                onClick={() => handleSubmit('clear')}
                className="flex items-center gap-1.5 bg-purple-light border-[3px] border-black rounded-full px-3 py-1.5 text-purple-darker font-nunito font-semibold text-sm hover:scale-105 transition-transform"
              >
                <X size={14} strokeWidth={2.5} />
                Clear
              </button>
              <button
                onClick={() => setShowMissionPanel((p) => !p)}
                className="flex items-center gap-1.5 bg-yellow-accent border-[3px] border-black rounded-full px-3 py-1.5 text-black font-nunito font-semibold text-sm hover:scale-105 transition-transform lg:hidden"
              >
                <BookOpen size={14} strokeWidth={2.5} />
                {showMissionPanel ? 'Hide' : 'Show'} Missions
              </button>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="flex items-center gap-1.5 bg-blue-info border-[3px] border-black rounded-full px-3 py-1.5 text-white font-nunito font-semibold text-sm hover:scale-105 transition-transform"
              >
                <Lightbulb size={14} strokeWidth={2.5} />
                Tips
              </button>
            </div>

            {/* Quick Help Banner */}
            <AnimatePresence>
              {showHelp && (
                <motion.div
                  initial={{ height: 0, opacity: 1 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 1 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="bg-white border-[3px] border-black rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-fredoka font-semibold text-lg text-purple-dark">Quick Tips</h3>
                      <button onClick={() => setShowHelp(false)} className="text-purple-dark hover:scale-110 transition-transform">
                        <X size={18} strokeWidth={3} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { cmd: 'ls', desc: 'List files in the current folder' },
                        { cmd: 'cd <folder>', desc: 'Change to a different folder' },
                        { cmd: 'cat <file>', desc: 'Show the contents of a file' },
                        { cmd: 'pwd', desc: 'Show your current location' },
                        { cmd: 'clear', desc: 'Clear the terminal screen' },
                        { cmd: 'help', desc: 'See all available commands' },
                      ].map((tip) => (
                        <div key={tip.cmd} className="flex items-start gap-2 bg-purple-pale rounded-lg p-2 border-2 border-purple-lighter">
                          <code className="font-jetbrains text-xs bg-purple-darker text-white px-1.5 py-0.5 rounded shrink-0">
                            {tip.cmd}
                          </code>
                          <span className="font-nunito text-xs text-purple-dark">{tip.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Sidebar Panel */}
          <AnimatePresence>
            {showMissionPanel && (
              <motion.div
                initial={{ opacity: 1, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="lg:flex-[0.35] flex flex-col gap-4"
              >
                {/* Tab Buttons */}
                <div className="flex items-center gap-1 bg-white border-[3px] border-black rounded-xl p-1">
                  {[
                    { key: 'missions' as const, icon: BookOpen, label: 'Missions' },
                    { key: 'achievements' as const, icon: Trophy, label: 'Badges' },
                    { key: 'themes' as const, icon: Settings, label: 'Themes' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-nunito font-semibold text-sm border-[3px] transition-none ${
                        activeTab === tab.key
                          ? 'bg-purple-primary border-black text-white'
                          : 'bg-transparent border-transparent text-purple-dark hover:bg-purple-pale'
                      }`}
                    >
                      <tab.icon size={14} strokeWidth={2.5} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white border-[3px] border-black rounded-xl overflow-hidden flex-1">
                  {/* Missions Tab */}
                  {activeTab === 'missions' && (
                    <div className="p-4">
                      <h3 className="font-fredoka font-semibold text-xl text-purple-dark mb-3">
                        Training Missions
                      </h3>
                      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                        {missions.map((mission) => (
                          <motion.div
                            key={mission.id}
                            whileHover={{ scale: 1.02 }}
                            className={`border-[3px] rounded-xl p-3 cursor-pointer transition-none ${
                              activeMission === mission.id
                                ? 'border-purple-primary bg-purple-pale'
                                : mission.completed
                                ? 'border-green-success bg-green-50'
                                : 'border-purple-lighter bg-white hover:border-purple-light'
                            }`}
                            onClick={() => setActiveMission(activeMission === mission.id ? null : mission.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center shrink-0 ${
                                  mission.completed ? 'bg-green-success' : 'bg-purple-lighter'
                                }`}
                              >
                                {mission.completed ? (
                                  <Check size={16} strokeWidth={3} className="text-white" />
                                ) : (
                                  <span className="font-fredoka font-bold text-xs text-purple-dark">
                                    {mission.id}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-nunito font-bold text-sm text-purple-dark truncate">
                                  {mission.title}
                                </div>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: mission.difficulty }).map((_, i) => (
                                    <Star
                                      key={i}
                                      size={10}
                                      fill="#FACC15"
                                      strokeWidth={0}
                                    />
                                  ))}
                                  <span className="font-nunito text-[10px] text-purple-light ml-1">
                                    {mission.xpReward} XP
                                  </span>
                                </div>
                              </div>
                              {mission.completed && (
                                <Trophy size={16} className="text-yellow-accent shrink-0" />
                              )}
                            </div>

                            {/* Expanded Mission Details */}
                            <AnimatePresence>
                              {activeMission === mission.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 1 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 1 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2 pt-2 border-t-2 border-purple-lighter">
                                    <p className="font-nunito text-xs text-purple-dark mb-2">
                                      {mission.description}
                                    </p>
                                    <div className="flex flex-col gap-1">
                                      {mission.objectives.map((obj) => (
                                        <div key={obj.id} className="flex items-center gap-2">
                                          <div
                                            className={`w-4 h-4 border-[2px] border-black rounded-sm flex items-center justify-center shrink-0 ${
                                              obj.completed ? 'bg-green-success' : 'bg-white'
                                            }`}
                                          >
                                            {obj.completed && <Check size={10} strokeWidth={3} className="text-white" />}
                                          </div>
                                          <span
                                            className={`font-nunito text-xs ${
                                              obj.completed
                                                ? 'line-through text-purple-light'
                                                : 'text-purple-dark'
                                            }`}
                                          >
                                            {obj.text}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    {/* Hints */}
                                    <div className="mt-2 bg-yellow-accent/20 border-l-4 border-yellow-accent rounded-r-md p-2">
                                      <div className="flex items-center gap-1 mb-1">
                                        <Lightbulb size={12} className="text-yellow-accent" />
                                        <span className="font-nunito font-bold text-[10px] text-purple-dark">
                                          Hint
                                        </span>
                                      </div>
                                      <p className="font-nunito text-[10px] text-purple-dark">
                                        {mission.hints[0]}
                                      </p>
                                    </div>
                                    {/* Progress */}
                                    <div className="mt-2">
                                      <div className="h-2 bg-purple-lighter rounded-full border-2 border-black overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{
                                            width: `${
                                              (mission.objectives.filter((o) => o.completed).length /
                                                mission.objectives.length) *
                                              100
                                            }%`,
                                          }}
                                          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                                          className="h-full bg-green-success rounded-full"
                                        />
                                      </div>
                                      <span className="font-nunito text-[10px] text-purple-light">
                                        {mission.objectives.filter((o) => o.completed).length} /{' '}
                                        {mission.objectives.length} complete
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Achievements Tab */}
                  {activeTab === 'achievements' && (
                    <div className="p-4">
                      <h3 className="font-fredoka font-semibold text-xl text-purple-dark mb-3">
                        Badges
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {achievements.map((achievement) => (
                          <motion.div
                            key={achievement.id}
                            whileHover={{ rotate: -5, scale: 1.1 }}
                            className="flex flex-col items-center gap-1"
                            title={`${achievement.title}: ${achievement.description}`}
                          >
                            <div
                              className={`w-16 h-16 rounded-full border-[3px] border-black flex items-center justify-center ${
                                achievement.unlocked ? '' : 'opacity-50'
                              }`}
                              style={{
                                backgroundColor: achievement.unlocked ? achievement.color : '#DDD6FE',
                                boxShadow: achievement.unlocked
                                  ? `0 0 0 3px ${achievement.color}`
                                  : 'none',
                              }}
                            >
                              {achievement.unlocked ? (
                                getAchievementIcon(achievement.icon)
                              ) : (
                                <Lock size={20} strokeWidth={3} className="text-purple-dark" />
                              )}
                            </div>
                            <span className="font-nunito font-semibold text-[10px] text-purple-dark text-center leading-tight">
                              {achievement.title}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="mt-4 pt-4 border-t-2 border-purple-lighter">
                        <h4 className="font-fredoka font-semibold text-sm text-purple-dark mb-2">
                          Stats
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Commands Used', value: totalCommands },
                            { label: 'Unique Commands', value: uniqueCommands.size },
                            { label: 'Missions Done', value: missionsCompleted.length },
                            { label: 'Files Created', value: filesCreated },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className="bg-purple-pale rounded-lg border-2 border-purple-lighter p-2"
                            >
                              <div className="font-nunito font-bold text-lg text-purple-dark">
                                {stat.value}
                              </div>
                              <div className="font-nunito text-[10px] text-purple-light">
                                {stat.label}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Terminal Level */}
                        <div className="mt-3 bg-purple-dark rounded-lg border-[3px] border-black p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-nunito font-bold text-sm text-white">
                              Terminal Level
                            </span>
                            <span
                              className="font-fredoka font-bold text-sm"
                              style={{ color: terminalLevel.color }}
                            >
                              {terminalLevel.name}
                            </span>
                          </div>
                          <div className="mt-1 h-2 bg-purple-darker rounded-full border-2 border-black overflow-hidden">
                            <div
                              className="h-full rounded-full transition-none"
                              style={{
                                width: `${Math.min((uniqueCommands.size / 30) * 100, 100)}%`,
                                backgroundColor: terminalLevel.color,
                              }}
                            />
                          </div>
                          <span className="font-nunito text-[10px] text-purple-lighter">
                            {uniqueCommands.size}/30 commands to Master
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Themes Tab */}
                  {activeTab === 'themes' && (
                    <div className="p-4">
                      <h3 className="font-fredoka font-semibold text-xl text-purple-dark mb-3">
                        Terminal Themes
                      </h3>
                      <div className="flex flex-col gap-2">
                        {unlockedThemes.map((t) => (
                          <motion.button
                            key={t.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (t.unlocked) setTheme(t);
                            }}
                            className={`border-[3px] border-black rounded-xl p-3 text-left transition-none ${
                              theme.id === t.id ? 'ring-4 ring-purple-primary' : ''
                            } ${!t.unlocked ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-16 h-10 rounded-lg border-2 border-black shrink-0 flex items-center justify-center"
                                style={{
                                  backgroundColor: t.bodyBg,
                                }}
                              >
                                <span
                                  className="font-jetbrains text-[10px]"
                                  style={{ color: t.promptColor }}
                                >
                                  $ _
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-nunito font-bold text-sm text-purple-dark flex items-center gap-1">
                                  {t.name}
                                  {!t.unlocked && <Lock size={12} strokeWidth={2.5} />}
                                </div>
                                <div className="font-nunito text-[10px] text-purple-light">
                                  {t.unlocked ? 'Unlocked' : t.unlockRequirement}
                                </div>
                              </div>
                              {theme.id === t.id && (
                                <Check size={18} strokeWidth={3} className="text-green-success shrink-0" />
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tip of the Session */}
                <div className="bg-yellow-accent/20 border-l-4 border-yellow-accent rounded-r-xl p-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb size={18} className="text-yellow-accent shrink-0 mt-0.5" />
                    <div>
                      <div className="font-nunito font-bold text-xs text-purple-dark">
                        Cyber Tip
                      </div>
                      <div className="font-nunito text-xs text-purple-dark">
                        Type &quot;fortune&quot; for random security tips, or &quot;cowsay hello&quot; for fun!
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Command Library Section */}
      <section className="px-4 sm:px-6 py-8 bg-white border-t-4 border-black">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={28} strokeWidth={2.5} className="text-purple-primary" />
            <h2 className="font-fredoka font-semibold text-2xl sm:text-3xl text-purple-dark text-outline-sm">
              Command Library
            </h2>
          </div>
          <p className="font-nunito text-purple-light mb-4">Your hacking cheat sheet - click any command to try it!</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {COMMAND_LIBRARY.map((cmd) => (
              <motion.button
                key={cmd.name}
                whileHover={{ y: -4 }}
                className="text-left bg-purple-lighter border-[3px] border-black rounded-xl p-4 hover:bg-purple-pale transition-none"
                onClick={() => {
                  setInput(cmd.example);
                  inputRef.current?.focus();
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <code className="font-jetbrains font-bold text-sm bg-purple-darker text-white px-2 py-0.5 rounded">
                    {cmd.name}
                  </code>
                  <span
                    className={`font-nunito font-bold text-[10px] px-2 py-0.5 rounded-full border-[2px] border-black ${
                      cmd.category === 'Navigation'
                        ? 'bg-blue-info text-white'
                        : cmd.category === 'File'
                        ? 'bg-green-success text-black'
                        : cmd.category === 'Network'
                        ? 'bg-purple-primary text-white'
                        : cmd.category === 'System'
                        ? 'bg-yellow-accent text-black'
                        : 'bg-pink-accent text-white'
                    }`}
                  >
                    {cmd.category}
                  </span>
                </div>
                <p className="font-nunito text-sm text-purple-dark mb-1">{cmd.description}</p>
                <code className="font-jetbrains text-xs bg-purple-darker/80 text-white px-2 py-1 rounded block">
                  {cmd.example}
                </code>
              </motion.button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Achievement icon helper
function getAchievementIcon(icon: string) {
  const props = { size: 22, strokeWidth: 2.5, className: 'text-white' };
  switch (icon) {
    case 'terminal':
      return <Terminal {...props} />;
    case 'compass':
      return <Compass {...props} />;
    case 'file':
      return <FileText {...props} />;
    case 'key':
      return <Key {...props} />;
    case 'lock':
      return <Lock {...props} />;
    case 'radar':
      return <Eye {...props} />;
    case 'search':
      return <Search {...props} />;
    case 'shield':
      return <Shield {...props} />;
    case 'flame':
      return <FlameIcon {...props} />;
    case 'trophy':
      return <Trophy {...props} />;
    default:
      return <Star {...props} />;
  }
}

const COMMAND_LIBRARY = [
  { name: 'ls', description: 'List files in the current directory', example: 'ls', category: 'Navigation' },
  { name: 'ls -la', description: 'List all files including hidden ones', example: 'ls -la', category: 'Navigation' },
  { name: 'cd', description: 'Change to home directory', example: 'cd', category: 'Navigation' },
  { name: 'cd ..', description: 'Go up one directory level', example: 'cd ..', category: 'Navigation' },
  { name: 'pwd', description: 'Print current directory path', example: 'pwd', category: 'Navigation' },
  { name: 'cat', description: 'Display file contents', example: 'cat readme.txt', category: 'File' },
  { name: 'touch', description: 'Create an empty file', example: 'touch myfile.txt', category: 'File' },
  { name: 'mkdir', description: 'Create a new directory', example: 'mkdir myfolder', category: 'File' },
  { name: 'rm', description: 'Remove a file', example: 'rm myfile.txt', category: 'File' },
  { name: 'cp', description: 'Copy a file', example: 'cp readme.txt backup.txt', category: 'File' },
  { name: 'mv', description: 'Move or rename a file', example: 'mv old.txt new.txt', category: 'File' },
  { name: 'head', description: 'Show first 10 lines of a file', example: 'head readme.txt', category: 'File' },
  { name: 'tail', description: 'Show last 10 lines of a file', example: 'tail readme.txt', category: 'File' },
  { name: 'grep', description: 'Search for text in files', example: 'grep password passwords.txt', category: 'File' },
  { name: 'chmod', description: 'Change file permissions', example: 'chmod 755 script.sh', category: 'File' },
  { name: 'tree', description: 'Show directory tree structure', example: 'tree', category: 'Navigation' },
  { name: 'echo', description: 'Print text to the terminal', example: 'echo Hello World!', category: 'System' },
  { name: 'clear', description: 'Clear the terminal screen', example: 'clear', category: 'System' },
  { name: 'whoami', description: 'Show current username', example: 'whoami', category: 'System' },
  { name: 'date', description: 'Show current date and time', example: 'date', category: 'System' },
  { name: 'cal', description: 'Show a calendar', example: 'cal', category: 'System' },
  { name: 'ps', description: 'List running processes', example: 'ps', category: 'System' },
  { name: 'ifconfig', description: 'Show network interfaces', example: 'ifconfig', category: 'Network' },
  { name: 'ping', description: 'Test network connectivity', example: 'ping localhost', category: 'Network' },
  { name: 'nmap', description: 'Scan network ports (educational)', example: 'nmap 127.0.0.1', category: 'Network' },
  { name: 'traceroute', description: 'Trace network route', example: 'traceroute cyberpaw.edu', category: 'Network' },
  { name: 'netstat', description: 'Show network connections', example: 'netstat', category: 'Network' },
  { name: 'wget', description: 'Download a file', example: 'wget https://example.com/file.txt', category: 'Network' },
  { name: 'curl', description: 'Make HTTP requests', example: 'curl https://api.example.com', category: 'Network' },
  { name: 'ssh', description: 'Connect to remote server', example: 'ssh user@server.com', category: 'Network' },
  { name: 'sudo', description: 'Run command as admin', example: 'sudo apt update', category: 'System' },
  { name: 'history', description: 'Show command history', example: 'history', category: 'System' },
  { name: 'banner', description: 'Create ASCII art banner', example: 'banner Hello!', category: 'Fun' },
  { name: 'cowsay', description: 'Cow says your message', example: 'cowsay Hello!', category: 'Fun' },
  { name: 'fortune', description: 'Get a random cyber tip', example: 'fortune', category: 'Fun' },
  { name: 'matrix', description: 'Matrix rain effect', example: 'matrix', category: 'Fun' },
  { name: 'missions', description: 'List available missions', example: 'missions', category: 'System' },
  { name: 'start', description: 'Start a mission', example: 'start 1', category: 'System' },
];
