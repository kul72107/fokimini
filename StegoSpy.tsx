import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Eye, Binary, Fingerprint, Zap, Trophy, Star,
  Lock, Unlock, ChevronRight, RotateCcw, BookOpen, Scan,
  Crosshair, MessageSquare, AlertTriangle, Check, X,
  Microscope, BarChart3, Target, Sparkles
} from 'lucide-react';

interface Props {
  onScoreChange: (score: number) => void;
}

type ToolId = 'none' | 'lsb' | 'color' | 'spectral' | 'histogram';
type LevelId = 1 | 2 | 3 | 4;
type GamePhase = 'menu' | 'playing' | 'decode' | 'result';

interface Pixel {
  r: number;
  g: number;
  b: number;
  lsbR: 0 | 1;
  lsbG: 0 | 1;
  lsbB: 0 | 1;
  hasHidden: boolean;
  hiddenBit: 0 | 1 | null;
}

const COLORS = [
  '#7C3AED', '#5B21B6', '#A78BFA', '#FACC15', '#F472B6',
  '#4ADE80', '#60A5FA', '#FB923C', '#EF4444', '#14B8A6',
  '#8B5CF6', '#EC4899', '#22D3EE', '#A3E635', '#F59E0B',
];

const LEVEL_CONFIG = [
  {
    id: 1 as LevelId,
    name: 'Red Channel Secret',
    description: 'A message hides in the RED channel only. Easy to spot!',
    gridSize: 6,
    message: 'PAW',
    channel: 'r' as const,
    bitsPerPixel: 1,
    hint: 'Look at the last bit of each RED value!',
  },
  {
    id: 2 as LevelId,
    name: 'RGB Mix-Up',
    description: 'The message is spread across all three RGB channels!',
    gridSize: 8,
    message: 'SAFE',
    channel: 'rgb' as const,
    bitsPerPixel: 1,
    hint: 'Check R, then G, then B - the bits form a pattern!',
  },
  {
    id: 3 as LevelId,
    name: 'Scattered Bits',
    description: 'Bits are hidden in a diagonal pattern across the image!',
    gridSize: 8,
    message: 'SPY',
    channel: 'pattern' as const,
    bitsPerPixel: 1,
    hint: 'The hidden bits follow a diagonal path!',
  },
  {
    id: 4 as LevelId,
    name: 'Find the Fake',
    description: 'Three images! Only ONE has hidden data. Which one?',
    gridSize: 6,
    message: 'GOTYA',
    channel: 'multi' as const,
    bitsPerPixel: 1,
    hint: 'Use the Color Analyzer to find slight differences!',
  },
];

function textToBits(text: string): (0 | 1)[] {
  const bits: (0 | 1)[] = [];
  for (let i = 0; i < text.length; i++) {
    const binary = text.charCodeAt(i).toString(2).padStart(8, '0');
    for (const b of binary) {
      bits.push(b === '1' ? 1 : 0);
    }
  }
  return bits;
}

function bitsToText(bits: (0 | 1)[]): string {
  let text = '';
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8);
    if (byte.length < 8) break;
    const charCode = parseInt(byte.join(''), 2);
    if (charCode > 0 && charCode < 128) {
      text += String.fromCharCode(charCode);
    }
  }
  return text;
}

function generateGrid(
  size: number,
  message: string,
  channel: string,
  levelId: LevelId
): Pixel[][] {
  const bits = textToBits(message);
  const grid: Pixel[][] = [];
  let bitIndex = 0;

  // Generate base colors
  const baseColors: { r: number; g: number; b: number }[][] = [];
  for (let row = 0; row < size; row++) {
    baseColors[row] = [];
    for (let col = 0; col < size; col++) {
      baseColors[row][col] = {
        r: Math.floor(Math.random() * 180) + 40,
        g: Math.floor(Math.random() * 180) + 40,
        b: Math.floor(Math.random() * 180) + 40,
      };
    }
  }

  for (let row = 0; row < size; row++) {
    grid[row] = [];
    for (let col = 0; col < size; col++) {
      const base = baseColors[row][col];
      let hasHidden = false;
      let hiddenBit: 0 | 1 | null = null;
      let r = base.r;
      let g = base.g;
      let b = base.b;

      // Determine if this pixel should hide data
      const shouldHide = (() => {
        if (bitIndex >= bits.length) return false;
        if (levelId === 1) return true; // All pixels in red channel
        if (levelId === 2) return true; // All pixels RGB
        if (levelId === 3) return (row + col) % 3 === 0; // Diagonal pattern
        if (levelId === 4) return row < 3; // Top rows only
        return false;
      })();

      if (shouldHide) {
        hasHidden = true;
        hiddenBit = bits[bitIndex];

        // Embed in appropriate channel
        if (levelId === 1 || levelId === 4) {
          // Red channel only
          r = (r & 0b11111110) | (hiddenBit as number);
        } else if (levelId === 2) {
          // Spread across RGB
          const channelIndex = bitIndex % 3;
          if (channelIndex === 0) r = (r & 0b11111110) | (hiddenBit as number);
          else if (channelIndex === 1) g = (g & 0b11111110) | (hiddenBit as number);
          else b = (b & 0b11111110) | (hiddenBit as number);
        } else if (levelId === 3) {
          // Diagonal - use red channel
          r = (r & 0b11111110) | (hiddenBit as number);
        }

        bitIndex++;
      }

      grid[row][col] = {
        r, g, b,
        lsbR: (r & 1) as 0 | 1,
        lsbG: (g & 1) as 0 | 1,
        lsbB: (b & 1) as 0 | 1,
        hasHidden,
        hiddenBit,
      };
    }
  }

  return grid;
}

function generateCleanGrid(size: number): Pixel[][] {
  const grid: Pixel[][] = [];
  for (let row = 0; row < size; row++) {
    grid[row] = [];
    for (let col = 0; col < size; col++) {
      const r = Math.floor(Math.random() * 180) + 40;
      const g = Math.floor(Math.random() * 180) + 40;
      const b = Math.floor(Math.random() * 180) + 40;
      grid[row][col] = {
        r, g, b,
        lsbR: (r & 1) as 0 | 1,
        lsbG: (g & 1) as 0 | 1,
        lsbB: (b & 1) as 0 | 1,
        hasHidden: false,
        hiddenBit: null,
      };
    }
  }
  return grid;
}

export default function StegoSpy({ onScoreChange }: Props) {
  const [currentLevel, setCurrentLevel] = useState<LevelId>(1);
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [activeTool, setActiveTool] = useState<ToolId>('none');
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<Set<LevelId>>(new Set());

  // Grid state
  const [grid, setGrid] = useState<Pixel[][]>([]);
  const [multiGrids, setMultiGrids] = useState<Pixel[][][]>([]);
  const [selectedGridIndex, setSelectedGridIndex] = useState(0);
  const [collectedBits, setCollectedBits] = useState<(0 | 1)[]>([]);
  const [decodedMessage, setDecodedMessage] = useState('');
  const [showDecoded, setShowDecoded] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [magnifierPos, setMagnifierPos] = useState<{ x: number; y: number } | null>(null);

  const level = LEVEL_CONFIG[currentLevel - 1];

  const initLevel = useCallback((lvl: LevelId) => {
    const config = LEVEL_CONFIG[lvl - 1];
    if (lvl === 4) {
      // Generate 3 grids, only one has data
      const grids: Pixel[][][] = [];
      const secretIndex = Math.floor(Math.random() * 3);
      for (let i = 0; i < 3; i++) {
        if (i === secretIndex) {
          grids.push(generateGrid(config.gridSize, config.message, config.channel, lvl));
        } else {
          grids.push(generateCleanGrid(config.gridSize));
        }
      }
      setMultiGrids(grids);
      setGrid(grids[0]);
      setSelectedGridIndex(0);
    } else {
      const newGrid = generateGrid(config.gridSize, config.message, config.channel, lvl);
      setGrid(newGrid);
      setMultiGrids([]);
    }
    setActiveTool('none');
    setCollectedBits([]);
    setDecodedMessage('');
    setShowDecoded(false);
    setRevealedCells(new Set());
    setMagnifierPos(null);
  }, []);

  const startLevel = (lvl: LevelId) => {
    setCurrentLevel(lvl);
    setPhase('playing');
    initLevel(lvl);
  };

  // Removed redundant useEffect that caused double-initialization.
  // initLevel is already called inside startLevel, which is the only entry point
  // to the 'playing' phase. This prevents generateGrid from being called twice
  // (which would create two different random grids and overwrite the first one).

  const toggleCellBit = (row: number, col: number) => {
    const key = `${row}-${col}`;
    const pixel = level.channel === 'multi' ? multiGrids[selectedGridIndex]?.[row]?.[col] : grid[row]?.[col];
    if (!pixel || !pixel.hasHidden) return;

    const newRevealed = new Set(revealedCells);
    if (newRevealed.has(key)) {
      newRevealed.delete(key);
      setCollectedBits((prev) => prev.slice(0, -1));
    } else {
      newRevealed.add(key);
      if (pixel.hiddenBit !== null) {
        setCollectedBits((prev) => [...prev, pixel.hiddenBit as 0 | 1]);
      }
    }
    setRevealedCells(newRevealed);
  };

  const decodeMessage = () => {
    const msg = bitsToText(collectedBits);
    setDecodedMessage(msg);
    setShowDecoded(true);
    setPhase('decode');

    const target = level.message;
    if (msg.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(msg.toLowerCase())) {
      const newScore = score + 25;
      setScore(newScore);
      setStars((s) => Math.min(12, s + 1));
      onScoreChange(Math.min(100, newScore));
      setCompletedLevels((prev) => new Set(Array.from(prev).concat([currentLevel])));
    }
  };

  const autoCollect = () => {
    // Auto-collect all hidden bits
    const sourceGrid = level.channel === 'multi' && multiGrids.length > 0
      ? multiGrids[selectedGridIndex]
      : grid;
    if (!sourceGrid) return;

    const newBits: (0 | 1)[] = [];
    const newRevealed = new Set<string>();

    for (let row = 0; row < sourceGrid.length; row++) {
      for (let col = 0; col < sourceGrid[row].length; col++) {
        const pixel = sourceGrid[row][col];
        if (pixel.hasHidden && pixel.hiddenBit !== null) {
          newBits.push(pixel.hiddenBit);
          newRevealed.add(`${row}-${col}`);
        }
      }
    }

    setCollectedBits(newBits);
    setRevealedCells(newRevealed);
  };

  const handleGridSelect = (idx: number) => {
    setSelectedGridIndex(idx);
    setGrid(multiGrids[idx]);
    setCollectedBits([]);
    setRevealedCells(new Set());
  };

  const currentGrid = level.channel === 'multi' && multiGrids.length > 0
    ? multiGrids[selectedGridIndex]
    : grid;

  // ---- RENDER ----

  if (phase === 'menu') {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-full bg-purple-dark border-[4px] border-black flex items-center justify-center">
              <Search size={24} strokeWidth={3} className="text-yellow-accent" />
            </div>
            <h2 className="font-fredoka text-2xl text-purple-dark text-outline-sm">Stego Spy</h2>
          </div>
          <p className="font-nunito text-sm text-purple-dark">
            Find secret messages hidden inside images! Become a steganography detective!
          </p>
        </div>

        <div className="w-full max-w-lg bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={16} strokeWidth={3} className="text-yellow-accent" fill="#FACC15" />
            <span className="font-nunito text-xs font-bold text-yellow-accent">{stars}/12</span>
          </div>
          <span className="font-nunito text-xs font-bold text-white">Score: {score}</span>
          <span className="font-nunito text-xs text-purple-lighter">
            Cleared: {completedLevels.size}/4
          </span>
        </div>

        <div className="w-full max-w-lg grid grid-cols-2 gap-3">
          {LEVEL_CONFIG.map((lvl) => {
            const isUnlocked = lvl.id === 1 || completedLevels.has((lvl.id - 1) as LevelId);
            const isCompleted = completedLevels.has(lvl.id);
            return (
              <motion.button
                key={lvl.id}
                whileHover={isUnlocked ? { scale: 1.03 } : {}}
                whileTap={isUnlocked ? { scale: 0.97 } : {}}
                onClick={() => isUnlocked && startLevel(lvl.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-4 border-black transition-colors ${
                  isCompleted
                    ? 'bg-green-success'
                    : isUnlocked
                    ? 'bg-white hover:bg-purple-pale'
                    : 'bg-gray-200 cursor-not-allowed'
                }`}
                style={{ opacity: isUnlocked ? 1 : 0.4, boxShadow: isUnlocked ? '6px 6px 0px 0px #000' : 'none' }}
              >
                {!isUnlocked && <Lock size={20} strokeWidth={3} className="text-gray-500" />}
                {isCompleted && <Trophy size={20} strokeWidth={3} className="text-yellow-accent" />}
                {isUnlocked && !isCompleted && (
                  <div className="w-10 h-10 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center">
                    {lvl.id === 1 && <Eye size={18} strokeWidth={3} className="text-white" />}
                    {lvl.id === 2 && <Fingerprint size={18} strokeWidth={3} className="text-white" />}
                    {lvl.id === 3 && <Crosshair size={18} strokeWidth={3} className="text-white" />}
                    {lvl.id === 4 && <Scan size={18} strokeWidth={3} className="text-white" />}
                  </div>
                )}
                <span className="font-nunito text-xs font-bold text-purple-dark">{lvl.name}</span>
                <span className="font-nunito text-[10px] text-purple-dark text-center leading-tight">
                  {lvl.description.slice(0, 40)}...
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="w-full max-w-lg bg-white rounded-2xl border-4 border-black p-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} strokeWidth={3} className="text-blue-info" />
            <span className="font-nunito text-xs font-bold text-purple-dark">What is Steganography?</span>
          </div>
          <p className="font-nunito text-[11px] text-purple-dark leading-relaxed">
            Steganography is hiding secret messages inside pictures, audio, or videos. Unlike cryptography (scrambling text), steganography hides the fact that a message even exists! The secret bit is hidden in the Least Significant Bit (LSB) — the tiniest change in color that human eyes cannot see.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 bg-purple-pale rounded-lg border-[2px] border-black p-1.5 text-center">
              <span className="font-mono text-[9px] text-purple-dark">Color: 255,128,64</span>
            </div>
            <ChevronRight size={16} strokeWidth={3} className="text-purple-light" />
            <div className="flex-1 bg-yellow-accent rounded-lg border-[2px] border-black p-1.5 text-center">
              <span className="font-mono text-[9px] text-black">LSB: 1,0,0</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'decode') {
    const success = decodedMessage.toLowerCase().includes(level.message.toLowerCase()) ||
      level.message.toLowerCase().includes(decodedMessage.toLowerCase());

    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={`w-full max-w-lg rounded-2xl border-4 border-black p-6 flex flex-col items-center gap-3 ${
            success ? 'bg-green-success' : 'bg-yellow-accent'
          }`}
          style={{ boxShadow: '8px 8px 0px 0px #000' }}
        >
          {success ? (
            <Trophy size={48} strokeWidth={3} className="text-yellow-accent" />
          ) : (
            <AlertTriangle size={48} strokeWidth={3} className="text-black" />
          )}
          <h3 className="font-fredoka text-xl text-black text-outline-sm">
            {success ? 'Message Decoded!' : 'Partial Decode'}
          </h3>

          <div className="bg-black rounded-xl border-[3px] border-black p-3 w-full">
            <p className="font-nunito text-[10px] text-purple-lighter mb-1">Decoded Message:</p>
            <p className="font-mono text-lg text-green-success font-bold text-center">
              &quot;{decodedMessage || '???'}&quot;
            </p>
          </div>

          <p className="font-nunito text-xs text-black text-center">
            {success
              ? `Excellent work, detective! You found the hidden message: "${level.message}"`
              : `You got: "${decodedMessage}". The actual message was: "${level.message}". Try collecting more bits!`}
          </p>

          {success && (
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  size={24}
                  strokeWidth={2}
                  className="text-yellow-accent"
                  fill="#FACC15"
                />
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            {currentLevel < 4 ? (
              <button
                onClick={() => startLevel((currentLevel + 1) as LevelId)}
                className="flex items-center gap-1 px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark hover:scale-105 transition-transform"
              >
                Next Case
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            ) : (
              <button
                onClick={() => setPhase('result')}
                className="flex items-center gap-1 px-5 py-2 bg-purple-primary border-[3px] border-black rounded-full font-nunito font-bold text-sm text-white hover:bg-purple-dark hover:scale-105 transition-transform"
              >
                Final Score
                <Trophy size={16} strokeWidth={3} />
              </button>
            )}
            <button
              onClick={() => startLevel(currentLevel)}
              className="flex items-center gap-1 px-4 py-2 bg-purple-lighter border-[3px] border-black rounded-full font-nunito font-bold text-xs text-purple-dark hover:scale-105 transition-transform"
            >
              <RotateCcw size={14} strokeWidth={3} />
              Retry
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-full max-w-lg bg-green-success rounded-2xl border-4 border-black p-6 flex flex-col items-center gap-3"
          style={{ boxShadow: '8px 8px 0px 0px #000' }}
        >
          <div className="w-16 h-16 rounded-full bg-purple-dark border-[4px] border-black flex items-center justify-center">
            <Search size={32} strokeWidth={3} className="text-yellow-accent" />
          </div>
          <h3 className="font-fredoka text-2xl text-black text-outline-sm">Mission Complete!</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <Star
                key={s}
                size={28}
                strokeWidth={2}
                className={s <= stars ? 'text-yellow-accent' : 'text-black/20'}
                fill={s <= stars ? '#FACC15' : 'transparent'}
              />
            ))}
          </div>
          <p className="font-nunito text-lg font-bold text-black">Final Score: {score}</p>
          <p className="font-nunito text-xs text-black text-center">
            You are now a certified Steganography Detective! You can find hidden messages anywhere!
          </p>
          <button
            onClick={() => {
              setPhase('menu');
              setScore(0);
              setStars(0);
              setCompletedLevels(new Set());
              onScoreChange(0);
            }}
            className="px-6 py-3 bg-purple-primary text-white border-[3px] border-black rounded-full font-nunito font-bold hover:bg-purple-dark hover:scale-105 transition-transform"
          >
            Play Again
          </button>
        </motion.div>
      </div>
    );
  }

  // ---- MAIN GAMEPLAY ----
  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {/* HUD */}
      <div className="w-full max-w-3xl flex items-center justify-between bg-purple-dark rounded-xl border-[3px] border-black px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPhase('menu')}
            className="font-nunito text-[10px] text-purple-lighter hover:text-white underline"
          >
            Menu
          </button>
          <span className="font-nunito text-xs font-bold text-yellow-accent">
            Case {currentLevel}: {level.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black rounded-full px-2 py-0.5 border-[2px] border-yellow-accent">
            <Binary size={12} strokeWidth={3} className="text-yellow-accent" />
            <span className="font-mono text-[10px] text-yellow-accent font-bold">
              {collectedBits.length} bits
            </span>
          </div>
          <span className="font-nunito text-xs font-bold text-white">Score: {score}</span>
        </div>
      </div>

      {/* Hint */}
      <div className="w-full max-w-3xl bg-yellow-accent rounded-xl border-[3px] border-black px-3 py-1.5 flex items-center gap-2">
        <Zap size={14} strokeWidth={3} className="text-black flex-shrink-0" />
        <span className="font-nunito text-[10px] text-black font-semibold">Hint: {level.hint}</span>
      </div>

      <div className="w-full max-w-3xl flex flex-col lg:flex-row gap-3">
        {/* LEFT: Pixel Grid */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Image Selector for Level 4 */}
          {currentLevel === 4 && multiGrids.length > 0 && (
            <div className="flex gap-2 justify-center">
              {multiGrids.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGridSelect(idx)}
                  className={`px-3 py-1.5 rounded-full border-[3px] border-black font-nunito text-xs font-bold transition-colors ${
                    selectedGridIndex === idx
                      ? 'bg-purple-primary text-white'
                      : 'bg-white text-purple-dark hover:bg-purple-pale'
                  }`}
                >
                  Image {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Pixel Grid */}
          <div className="bg-white rounded-2xl border-4 border-black p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Scan size={14} strokeWidth={3} className="text-purple-primary" />
                <span className="font-nunito text-[10px] font-bold text-purple-dark">
                  Pixel Grid ({level.gridSize}x{level.gridSize})
                </span>
              </div>
              {activeTool === 'spectral' && (
                <span className="font-nunito text-[10px] text-red-alert font-bold animate-pulse">
                  Drag over image!
                </span>
              )}
            </div>

            <div
              className="relative inline-block"
              onMouseLeave={() => {
                setHoveredCell(null);
                setMagnifierPos(null);
              }}
            >
              <div
                className="grid gap-[2px] bg-black border-[3px] border-black rounded-lg p-[2px]"
                style={{
                  gridTemplateColumns: `repeat(${level.gridSize}, 1fr)`,
                  width: 'fit-content',
                }}
                onMouseMove={(e) => {
                  if (activeTool === 'spectral') {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMagnifierPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }
                }}
              >
                {currentGrid.map((row, rowIdx) =>
                  row.map((pixel, colIdx) => {
                    const key = `${rowIdx}-${colIdx}`;
                    const isRevealed = revealedCells.has(key);
                    const isHovered =
                      hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;

                    // Spectral analysis: highlight nearby cells
                    const isHotSpot = (() => {
                      if (activeTool !== 'spectral' || !magnifierPos) return false;
                      const cellSize = 32;
                      const cellX = colIdx * cellSize + colIdx * 2;
                      const cellY = rowIdx * cellSize + rowIdx * 2;
                      const dist = Math.sqrt(
                        Math.pow(magnifierPos.x - cellX - cellSize / 2, 2) +
                          Math.pow(magnifierPos.y - cellY - cellSize / 2, 2)
                      );
                      return dist < 50 && pixel.hasHidden;
                    })();

                    // Color analyzer: show suspicious pixels
                    const isSuspicious =
                      activeTool === 'color' && pixel.hasHidden;

                    const bgColor = `rgb(${pixel.r},${pixel.g},${pixel.b})`;

                    return (
                      <motion.div
                        key={key}
                        whileHover={activeTool === 'lsb' ? { scale: 1.15, zIndex: 10 } : { scale: 1.05 }}
                        onHoverStart={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                        onClick={() => activeTool === 'lsb' && toggleCellBit(rowIdx, colIdx)}
                        className="relative cursor-pointer border-[1px] border-black/20"
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: bgColor,
                          borderRadius: 2,
                          boxShadow: isHotSpot
                            ? '0 0 0 3px #FACC15, 0 0 8px #FACC15'
                            : isSuspicious
                            ? '0 0 0 2px #FACC15'
                            : isRevealed
                            ? '0 0 0 2px #4ADE80'
                            : 'none',
                        }}
                      >
                        {/* LSB values */}
                        {activeTool === 'lsb' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-mono text-[6px] text-white leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                              {pixel.lsbR}
                              {pixel.lsbG}
                              {pixel.lsbB}
                            </span>
                            {isRevealed && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-3 h-3 bg-green-success rounded-full border-[1px] border-black flex items-center justify-center"
                              >
                                <Check size={6} strokeWidth={4} className="text-black" />
                              </motion.div>
                            )}
                            {pixel.hasHidden && !isRevealed && (
                              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-yellow-accent" />
                            )}
                          </div>
                        )}

                        {/* Spectral hotspot indicator */}
                        {activeTool === 'spectral' && isHotSpot && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="absolute inset-0 bg-yellow-accent/40 flex items-center justify-center"
                          >
                            <Sparkles size={14} strokeWidth={3} className="text-yellow-accent" />
                          </motion.div>
                        )}

                        {/* Suspicious color indicator */}
                        {activeTool === 'color' && isSuspicious && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <AlertTriangle size={12} strokeWidth={3} className="text-yellow-accent drop-shadow-[0_1px_1px_rgba(0,0,0,1)]" />
                          </div>
                        )}

                        {/* Histogram view */}
                        {activeTool === 'histogram' && (
                          <div className="absolute inset-0 flex items-end justify-center gap-[1px] pb-[1px]">
                            <div
                              className="w-[3px] bg-red-alert border-[1px] border-black"
                              style={{ height: `${(pixel.r / 255) * 100}%` }}
                            />
                            <div
                              className="w-[3px] bg-green-success border-[1px] border-black"
                              style={{ height: `${(pixel.g / 255) * 100}%` }}
                            />
                            <div
                              className="w-[3px] bg-blue-info border-[1px] border-black"
                              style={{ height: `${(pixel.b / 255) * 100}%` }}
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Magnifying Glass for Spectral */}
              {activeTool === 'spectral' && magnifierPos && (
                <div
                  className="absolute pointer-events-none z-20"
                  style={{
                    left: magnifierPos.x - 30,
                    top: magnifierPos.y - 30,
                    width: 60,
                    height: 60,
                  }}
                >
                  <div className="w-full h-full rounded-full border-[4px] border-yellow-accent bg-white/10 flex items-center justify-center">
                    <Crosshair size={24} strokeWidth={3} className="text-yellow-accent" />
                  </div>
                  <div
                    className="absolute w-4 h-4 bg-yellow-accent border-[2px] border-black"
                    style={{ bottom: -6, right: -2, transform: 'rotate(45deg)' }}
                  />
                </div>
              )}
            </div>

            {/* Pixel Info */}
            {hoveredCell && currentGrid[hoveredCell.row]?.[hoveredCell.col] && (
              <motion.div
                initial={{ opacity: 1 }}
                className="mt-2 bg-purple-pale rounded-lg border-[2px] border-purple-light px-2 py-1 flex items-center gap-3 justify-center"
              >
                <span className="font-mono text-[9px] text-purple-dark">
                  Pos: ({hoveredCell.row},{hoveredCell.col})
                </span>
                <span className="font-mono text-[9px] text-red-alert">R:{currentGrid[hoveredCell.row][hoveredCell.col].r}</span>
                <span className="font-mono text-[9px] text-green-success">G:{currentGrid[hoveredCell.row][hoveredCell.col].g}</span>
                <span className="font-mono text-[9px] text-blue-info">B:{currentGrid[hoveredCell.row][hoveredCell.col].b}</span>
                <span className="font-mono text-[9px] text-purple-dark font-bold">
                  LSB: {currentGrid[hoveredCell.row][hoveredCell.col].lsbR}
                  {currentGrid[hoveredCell.row][hoveredCell.col].lsbG}
                  {currentGrid[hoveredCell.row][hoveredCell.col].lsbB}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* RIGHT: Tools Panel */}
        <div className="w-full lg:w-64 flex flex-col gap-2">
          {/* Detection Tools */}
          <div className="bg-white rounded-2xl border-4 border-black p-3">
            <div className="flex items-center gap-2 mb-2">
              <Microscope size={14} strokeWidth={3} className="text-purple-primary" />
              <span className="font-nunito text-xs font-bold text-purple-dark">Detection Tools</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {[
                { id: 'lsb' as ToolId, label: 'LSB Inspector', icon: Binary, desc: 'Show last bits' },
                { id: 'color' as ToolId, label: 'Color Analyzer', icon: Eye, desc: 'Find odd colors' },
                { id: 'spectral' as ToolId, label: 'Spectral Scan', icon: Crosshair, desc: 'Drag to scan' },
                { id: 'histogram' as ToolId, label: 'Histogram', icon: BarChart3, desc: 'Color bars' },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(activeTool === tool.id ? 'none' : tool.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border-[3px] border-black transition-all hover:scale-[1.02] ${
                    activeTool === tool.id
                      ? 'bg-purple-primary text-white'
                      : 'bg-purple-pale text-purple-dark'
                  }`}
                >
                  <tool.icon size={16} strokeWidth={3} />
                  <div className="flex flex-col items-start">
                    <span className="font-nunito text-[10px] font-bold">{tool.label}</span>
                    <span className="font-nunito text-[8px]">{tool.desc}</span>
                  </div>
                  {activeTool === tool.id && (
                    <motion.div
                      layoutId="activeTool"
                      className="ml-auto w-2 h-2 rounded-full bg-yellow-accent border-[1px] border-black"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Collected Bits */}
          <div className="bg-white rounded-2xl border-4 border-black p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Binary size={14} strokeWidth={3} className="text-purple-primary" />
                <span className="font-nunito text-[10px] font-bold text-purple-dark">Collected Bits</span>
              </div>
              <span className="font-mono text-[9px] text-purple-light">
                {collectedBits.length}/{textToBits(level.message).length}
              </span>
            </div>
            <div className="bg-black rounded-lg border-[2px] border-black p-2 min-h-[40px]">
              <div className="flex flex-wrap gap-[2px]">
                {collectedBits.length === 0 ? (
                  <span className="font-mono text-[9px] text-purple-lighter">
                    Click pixels with LSB tool...
                  </span>
                ) : (
                  collectedBits.map((bit, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`font-mono text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded border-[1px] border-black ${
                        bit === 1 ? 'bg-yellow-accent text-black' : 'bg-purple-lighter text-purple-dark'
                      }`}
                    >
                      {bit}
                    </motion.span>
                  ))
                )}
              </div>
            </div>
            <div className="flex gap-1 mt-1">
              <button
                onClick={autoCollect}
                className="flex-1 px-2 py-1 bg-blue-info border-[2px] border-black rounded-full font-nunito text-[9px] font-bold text-white hover:scale-105 transition-transform"
              >
                Auto-Collect All
              </button>
              <button
                onClick={() => { setCollectedBits([]); setRevealedCells(new Set()); }}
                className="px-2 py-1 bg-purple-lighter border-[2px] border-black rounded-full font-nunito text-[9px] font-bold text-purple-dark hover:scale-105 transition-transform"
              >
                <RotateCcw size={10} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Decode Button */}
          <button
            onClick={decodeMessage}
            disabled={collectedBits.length < 8}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-success border-[3px] border-black rounded-full font-nunito font-bold text-sm text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ boxShadow: '4px 4px 0px 0px #000' }}
          >
            <MessageSquare size={16} strokeWidth={3} />
            Decode Message
          </button>

          {/* Educational */}
          <div className="bg-purple-pale rounded-2xl border-[3px] border-purple-light p-2">
            <div className="flex items-center gap-1 mb-1">
              <BookOpen size={12} strokeWidth={3} className="text-blue-info" />
              <span className="font-nunito text-[9px] font-bold text-purple-dark">LSB Explained</span>
            </div>
            <p className="font-nunito text-[8px] text-purple-dark leading-relaxed">
              Each color has 8 bits (0-255). The Least Significant Bit (last one) changes the color by only 1/255th — invisible to eyes but readable by computers!
            </p>
          </div>
        </div>
      </div>

      {/* Legend / Bottom bar */}
      <div className="w-full max-w-3xl flex flex-wrap items-center justify-center gap-3 bg-white rounded-xl border-[3px] border-black px-3 py-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-success border-[1px] border-black rounded-sm" />
          <span className="font-nunito text-[9px] text-purple-dark">Collected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-accent border-[1px] border-black rounded-sm" />
          <span className="font-nunito text-[9px] text-purple-dark">Suspicious</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-alert border-[1px] border-black rounded-sm" />
          <span className="font-nunito text-[9px] text-purple-dark">R channel</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-yellow-accent" />
          <span className="font-nunito text-[9px] text-purple-dark">Has hidden data</span>
        </div>
        <span className="font-nunito text-[9px] text-purple-light ml-2">
          Click pixels in LSB mode to collect bits
        </span>
      </div>
    </div>
  );
}
