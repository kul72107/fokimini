import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { localAuth } from "@/lib/localAuth";
import { ALL_TOOLS } from "@/lib/battleEngine";
import {
  Shield,
  Search,
  Wifi,
  Globe,
  Lock,
  Bug,
  Users,
  ShieldCheck,
  Zap,
  Star,
  Ghost,
  ChevronRight,
  X,
  Unlock,
  Power,
  Clock,
  Eye,
  Swords,
  Filter,
  Sparkles,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   TYPE HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

type Tool = {
  id: number;
  toolId: string;
  name: string;
  description: string | null;
  category: "recon" | "network" | "web" | "crypto" | "malware" | "social" | "defense" | "advanced";
  power: number;
  cooldown: number;
  defenseBreak: number;
  stealthLevel: number;
  unlockLevel: number;
  icon: string;
  tier: number;
};

type InventoryItem = {
  id: number;
  userId: number;
  toolId: number;
  quantity: number;
  tier: number;
  usesRemaining: number;
  acquiredAt: Date;
  updatedAt: Date;
  tool?: Tool;
};

type AvailableTool = Tool & {
  isOwned: boolean;
  canUnlock: boolean;
};

/* ═══════════════════════════════════════════════════════════════════════
   CATEGORY CONFIG
   ═══════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { key: "all", label: "ALL", color: "#7C3AED" },
  { key: "recon", label: "RECON", color: "#60A5FA" },
  { key: "network", label: "NETWORK", color: "#22D3EE" },
  { key: "web", label: "WEB", color: "#A78BFA" },
  { key: "crypto", label: "CRYPTO", color: "#F472B6" },
  { key: "malware", label: "MALWARE", color: "#F87171" },
  { key: "social", label: "SOCIAL", color: "#FB923C" },
  { key: "defense", label: "DEFENSE", color: "#4ADE80" },
  { key: "advanced", label: "ADVANCED", color: "#FACC15" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

const CATEGORY_COLOR_MAP: Record<string, string> = {
  recon: "#60A5FA",
  network: "#22D3EE",
  web: "#A78BFA",
  crypto: "#F472B6",
  malware: "#F87171",
  social: "#FB923C",
  defense: "#4ADE80",
  advanced: "#FACC15",
};

/* ═══════════════════════════════════════════════════════════════════════
   LUCIDE ICON MAPPER
   ═══════════════════════════════════════════════════════════════════════ */

const ICON_MAP: Record<string, React.ElementType> = {
  Search,
  Wifi,
  Globe,
  Lock,
  Bug,
  Users,
  ShieldCheck,
  Zap,
  Shield,
  Eye,
  Star,
  Power,
  Clock,
  Sparkles,
  Swords,
};

function ToolIcon({ name, size = 28, color = "#fff" }: { name: string; size?: number; color?: string }) {
  const Icon = ICON_MAP[name] || Zap;
  return <Icon size={size} color={color} strokeWidth={2.5} />;
}

/* ═══════════════════════════════════════════════════════════════════════
   UTILITY COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

function StatBar({
  label,
  value,
  max,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: React.ElementType;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} color={color} strokeWidth={2.5} />
      <span className="text-xs font-nunito font-bold text-purple-darker w-10">{label}</span>
      <div className="flex-1 h-3 bg-purple-pale border-2 border-black rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-jetbrains font-bold text-purple-darker w-8 text-right">{value}</span>
    </div>
  );
}

function TierStars({ tier, color }: { tier: number; color: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={14}
          strokeWidth={2.5}
          stroke={i <= tier ? color : "#CBD5E1"}
          fill={i <= tier ? color : "none"}
        />
      ))}
    </div>
  );
}

function StealthIcons({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Ghost
          key={i}
          size={12}
          strokeWidth={2.5}
          stroke={i <= level ? "#A78BFA" : "#CBD5E1"}
          fill={i <= level ? "#A78BFA" : "none"}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TOOL DETAIL MODAL
   ═══════════════════════════════════════════════════════════════════════ */

function ToolDetailModal({
  tool,
  inventoryItem,
  onClose,
  onUnlock,
  isUnlocking,
}: {
  tool: Tool;
  inventoryItem?: InventoryItem;
  onClose: () => void;
  onUnlock: (toolId: number) => void;
  isUnlocking: boolean;
}) {
  const color = CATEGORY_COLOR_MAP[tool.category] || "#7C3AED";
  const isOwned = !!inventoryItem;
  const currentTier = inventoryItem?.tier || 0;

  const tierStats = [
    { tier: 1, power: tool.power, cooldown: tool.cooldown, defenseBreak: tool.defenseBreak, stealth: tool.stealthLevel },
    { tier: 2, power: Math.round(tool.power * 1.3), cooldown: Math.round(tool.cooldown * 0.85), defenseBreak: Math.round(tool.defenseBreak * 1.3), stealth: Math.min(tool.stealthLevel + 1, 5) },
    { tier: 3, power: Math.round(tool.power * 1.7), cooldown: Math.round(tool.cooldown * 0.7), defenseBreak: Math.round(tool.defenseBreak * 1.7), stealth: Math.min(tool.stealthLevel + 2, 5) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal Panel */}
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border-4 border-black rounded-2xl card-shadow-lg"
      >
        {/* Colored top stripe */}
        <div className="h-3 w-full border-b-4 border-black" style={{ backgroundColor: color }} />

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl border-4 border-black flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <ToolIcon name={tool.icon} size={32} />
              </div>
              <div>
                <h2 className="font-fredoka font-bold text-2xl text-purple-darker">{tool.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="px-3 py-0.5 rounded-full border-2 border-black text-xs font-nunito font-bold text-black uppercase"
                    style={{ backgroundColor: color }}
                  >
                    {tool.category}
                  </span>
                  {isOwned && <TierStars tier={currentTier} color={color} />}
                  {!isOwned && (
                    <span className="flex items-center gap-1 text-xs font-nunito font-bold text-red-alert">
                      <Lock size={12} strokeWidth={3} /> Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl border-[3px] border-black bg-purple-pale flex items-center justify-center hover:bg-purple-lighter transition-colors"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Description */}
        {tool.description && (
          <div className="px-6 pb-4">
            <p className="font-nunito text-sm text-purple-dark leading-relaxed">{tool.description}</p>
          </div>
        )}

        {/* Stats */}
        <div className="px-6 pb-4 space-y-2">
          <h3 className="font-fredoka font-bold text-lg text-purple-darker mb-2">Current Stats</h3>
          <StatBar label="PWR" value={tool.power} max={100} color="#F87171" icon={Power} />
          <StatBar label="CD" value={tool.cooldown} max={120} color="#60A5FA" icon={Clock} />
          <StatBar label="DEF" value={tool.defenseBreak} max={50} color="#FACC15" icon={Shield} />
          <div className="flex items-center gap-2 pt-1">
            <Ghost size={14} color="#A78BFA" strokeWidth={2.5} />
            <span className="text-xs font-nunito font-bold text-purple-darker w-10">STL</span>
            <StealthIcons level={tool.stealthLevel} />
          </div>
        </div>

        {/* Unlock Requirements */}
        {!isOwned && (
          <div className="px-6 pb-4">
            <div className="bg-purple-pale border-[3px] border-black rounded-xl p-4">
              <h4 className="font-fredoka font-bold text-base text-purple-darker mb-2 flex items-center gap-2">
                <Unlock size={18} /> Unlock Requirements
              </h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star size={14} fill="#FACC15" strokeWidth={0} />
                  <span className="font-nunito font-bold text-sm text-purple-darker">
                    Reach Level {tool.unlockLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Path */}
        {isOwned && (
          <div className="px-6 pb-4">
            <h3 className="font-fredoka font-bold text-lg text-purple-darker mb-3">Upgrade Path</h3>
            <div className="space-y-2">
              {tierStats.map((ts, idx) => (
                <motion.div
                  key={ts.tier}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-3 p-3 border-[3px] rounded-xl ${
                    currentTier >= ts.tier
                      ? "border-black bg-white"
                      : "border-purple-lighter bg-purple-pale opacity-60"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center"
                    style={{ backgroundColor: currentTier >= ts.tier ? color : "#E2E8F0" }}
                  >
                    <span className="font-fredoka font-bold text-xs text-white">{ts.tier}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <div className="text-[10px] font-nunito font-bold text-purple-dark">PWR</div>
                      <div className="font-jetbrains font-bold text-sm" style={{ color: "#F87171" }}>
                        {ts.power}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-nunito font-bold text-purple-dark">CD</div>
                      <div className="font-jetbrains font-bold text-sm" style={{ color: "#60A5FA" }}>
                        {ts.cooldown}s
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-nunito font-bold text-purple-dark">DEF</div>
                      <div className="font-jetbrains font-bold text-sm" style={{ color: "#FACC15" }}>
                        {ts.defenseBreak}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-nunito font-bold text-purple-dark">STL</div>
                      <div className="font-jetbrains font-bold text-sm" style={{ color: "#A78BFA" }}>
                        {ts.stealth}/5
                      </div>
                    </div>
                  </div>
                  {currentTier >= ts.tier ? (
                    <Check size={16} strokeWidth={3} color="#4ADE80" />
                  ) : (
                    <Lock size={16} strokeWidth={3} color="#CBD5E1" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 pt-2">
          {isOwned ? (
            <button
              className="w-full py-3 rounded-xl border-4 border-black font-fredoka font-bold text-lg text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: color }}
              onClick={() => {}}
            >
              <span className="flex items-center justify-center gap-2">
                <Swords size={22} strokeWidth={2.5} />
                USE IN BATTLE
              </span>
            </button>
          ) : (
            <button
              onClick={() => onUnlock(tool.id)}
              disabled={isUnlocking}
              className="w-full py-3 rounded-xl border-4 border-black font-fredoka font-bold text-lg text-black bg-green-success transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {isUnlocking ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <Unlock size={22} strokeWidth={2.5} />
                )}
                UNLOCK TOOL
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TOOL CARD
   ═══════════════════════════════════════════════════════════════════════ */

function ToolCard({
  tool,
  inventoryItem,
  onClick,
  onUnlock,
  isUnlocking,
  unlockLevel,
}: {
  tool: Tool;
  inventoryItem?: InventoryItem;
  onClick: () => void;
  onUnlock: (e: React.MouseEvent) => void;
  isUnlocking: boolean;
  unlockLevel?: number;
}) {
  const color = CATEGORY_COLOR_MAP[tool.category] || "#7C3AED";
  const isOwned = !!inventoryItem;
  const canUnlock = unlockLevel !== undefined && unlockLevel >= tool.unlockLevel;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={onClick}
      className={`relative bg-white border-4 border-black rounded-2xl overflow-hidden cursor-pointer card-shadow transition-shadow hover:card-shadow-lg ${
        !isOwned ? "opacity-90" : ""
      }`}
    >
      {/* Colored top stripe */}
      <div className="h-2.5 w-full border-b-4 border-black" style={{ backgroundColor: color }} />

      <div className="p-4">
        {/* Top row: Icon + Category + Stars */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-12 h-12 rounded-xl border-[3px] border-black flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color }}
          >
            <ToolIcon name={tool.icon} size={24} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className="px-2 py-0.5 rounded-full border-2 border-black text-[10px] font-nunito font-bold text-black uppercase"
              style={{ backgroundColor: color }}
            >
              {tool.category}
            </span>
            {isOwned && <TierStars tier={inventoryItem.tier} color={color} />}
          </div>
        </div>

        {/* Tool Name */}
        <h3 className="font-fredoka font-bold text-base text-purple-darker mb-2 truncate">{tool.name}</h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3">
          <div className="flex items-center gap-1.5">
            <Power size={12} strokeWidth={3} color="#F87171" />
            <span className="text-[11px] font-nunito font-bold text-purple-dark">PWR: {tool.power}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} strokeWidth={3} color="#60A5FA" />
            <span className="text-[11px] font-nunito font-bold text-purple-dark">CD: {tool.cooldown}s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield size={12} strokeWidth={3} color="#FACC15" />
            <span className="text-[11px] font-nunito font-bold text-purple-dark">DEF: {tool.defenseBreak}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ghost size={12} strokeWidth={3} color="#A78BFA" />
            <span className="text-[11px] font-nunito font-bold text-purple-dark">STL: {tool.stealthLevel}/5</span>
          </div>
        </div>

        {/* Bottom: Owned status or Unlock button */}
        {isOwned ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-success border-2 border-black" />
              <span className="text-[10px] font-nunito font-bold text-green-success">OWNED</span>
            </div>
            <span className="text-[10px] font-jetbrains font-bold text-purple-light">
              {inventoryItem.usesRemaining} uses
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Lock size={12} strokeWidth={3} color="#F87171" />
              <span className="text-[10px] font-nunito font-bold text-red-alert">Lv.{tool.unlockLevel}</span>
            </div>
            {canUnlock && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onUnlock}
                disabled={isUnlocking}
                className="px-3 py-1 rounded-lg border-[3px] border-black bg-green-success text-[10px] font-nunito font-bold text-black transition-transform disabled:opacity-50"
              >
                {isUnlocking ? "..." : "UNLOCK"}
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Lock overlay for unowned tools */}
      {!isOwned && !canUnlock && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-white/80 border-[3px] border-black flex items-center justify-center">
            <Lock size={18} strokeWidth={3} color="#F87171" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN ARSENAL PAGE
   ═══════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════
   LOCALSTORAGE-BASED TOOL DATA — No backend required
   ═══════════════════════════════════════════════════════════════════════ */

const TOOLS_STORAGE_KEY = 'cyberpaw_tools';
const INVENTORY_STORAGE_KEY = 'cyberpaw_arsenal_inventory';

// Default: first 5 tools unlocked
function getDefaultUnlockedIds(): number[] {
  return [1, 2, 3, 4, 5];
}

function getUnlockedToolIds(): number[] {
  try {
    const raw = localStorage.getItem(TOOLS_STORAGE_KEY);
    const arsenalIds = raw ? JSON.parse(raw) : [];
    const battleIds = localAuth.getInventory();
    const merged = Array.from(new Set([...arsenalIds, ...battleIds])).sort((a, b) => a - b);
    if (merged.length > 0) {
      localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(merged));
      localStorage.setItem('cyberpaw_inventory', JSON.stringify(merged));
      return merged;
    }
  } catch { /* ignore */ }
  const defaults = getDefaultUnlockedIds();
  localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(defaults));
  localStorage.setItem('cyberpaw_inventory', JSON.stringify(defaults));
  return defaults;
}

function unlockTool(toolId: number): boolean {
  const ids = getUnlockedToolIds();
  if (ids.includes(toolId)) return false;
  ids.push(toolId);
  const sorted = ids.sort((a, b) => a - b);
  localStorage.setItem(TOOLS_STORAGE_KEY, JSON.stringify(sorted));
  localAuth.addTool(toolId);
  return true;
}

function getInventoryItems(): InventoryItem[] {
  const unlockedIds = getUnlockedToolIds();
  return unlockedIds.map((toolId, idx) => {
    const tool = ALL_TOOLS.find(t => t.id === toolId);
    return {
      id: idx + 1,
      userId: localAuth.me()?.id || 0,
      toolId,
      quantity: 1,
      tier: 1,
      usesRemaining: 999,
      acquiredAt: new Date(),
      updatedAt: new Date(),
      tool: tool ? mapToTool(tool) : undefined,
    };
  });
}

function mapToTool(t: typeof ALL_TOOLS[0]): Tool {
  return {
    id: t.id,
    toolId: `tool_${t.id}`,
    name: t.name,
    description: t.description,
    category: t.category as Tool['category'],
    power: t.power,
    cooldown: t.cooldown,
    defenseBreak: t.defenseBreak,
    stealthLevel: t.stealthLevel,
    unlockLevel: t.tier * 3,
    icon: t.icon,
    tier: t.tier,
  };
}

const ALL_TOOLS_MAPPED: Tool[] = ALL_TOOLS.map(mapToTool);

export default function Arsenal() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [unlockingId, setUnlockingId] = useState<number | null>(null);
  const [, forceUpdate] = useState(0);

  /* ── localStorage queries ── */
  const tools = ALL_TOOLS_MAPPED;
  const inventory = useMemo(() => getInventoryItems(), []);
  const user = localAuth.me();
  const playerLevel = user?.level || 1;

  /* ── Derived state ── */
  const inventoryMap = useMemo(() => {
    const map = new Map<number, InventoryItem>();
    inventory.forEach((item) => {
      map.set(item.toolId, item);
    });
    return map;
  }, [inventory]);

  const filteredTools = useMemo(() => {
    if (activeCategory === "all") return tools;
    return tools.filter((t) => t.category === activeCategory);
  }, [tools, activeCategory]);

  const toolsOwned = inventory.length;
  const totalPower = useMemo(() => {
    return inventory.reduce((sum, item) => {
      return sum + (item.tool?.power || 0) * (item.tier || 1);
    }, 0);
  }, [inventory]);

  const nextUnlockLevel = useMemo(() => {
    const unlockedIds = getUnlockedToolIds();
    const locked = tools.filter((t) => !unlockedIds.includes(t.id));
    if (locked.length === 0) return 0;
    return Math.min(...locked.map((t) => t.unlockLevel));
  }, [tools]);

  /* ── Handlers ── */
  const handleUnlock = (toolId: number) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;
    if (playerLevel < tool.unlockLevel) return;

    setUnlockingId(toolId);
    setTimeout(() => {
      unlockTool(toolId);
      setUnlockingId(null);
      forceUpdate(n => n + 1);
    }, 600);
  };

  const selectedInventoryItem = selectedTool ? inventoryMap.get(selectedTool.id) : undefined;

  const isLoading = false;

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen">
      {/* Background grid pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6">
        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-primary border-4 border-black flex items-center justify-center">
              <Shield size={28} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-fredoka font-bold text-4xl sm:text-5xl text-purple-darker text-outline-sm">
                CYBER ARSENAL
              </h1>
              <p className="font-nunito text-sm text-purple-dark font-semibold">
                Your hacking tool collection
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2 bg-white border-[3px] border-black rounded-xl px-4 py-2">
              <Zap size={18} strokeWidth={2.5} color="#FACC15" />
              <span className="font-nunito font-bold text-sm text-purple-darker">
                Tools Owned: <span className="text-purple-primary">{toolsOwned}/{ALL_TOOLS.length}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white border-[3px] border-black rounded-xl px-4 py-2">
              <Power size={18} strokeWidth={2.5} color="#F87171" />
              <span className="font-nunito font-bold text-sm text-purple-darker">
                Total Power: <span className="text-red-alert">{totalPower}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white border-[3px] border-black rounded-xl px-4 py-2">
              <Sparkles size={18} strokeWidth={2.5} color="#A78BFA" />
              <span className="font-nunito font-bold text-sm text-purple-darker">
                Next Unlock: <span className="text-purple-primary">Level {nextUnlockLevel}</span>
              </span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 mb-2">
            <Filter size={18} strokeWidth={2.5} color="#5B21B6" className="flex-shrink-0" />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`relative px-4 py-2 rounded-full border-[3px] font-nunito font-bold text-xs transition-all ${
                    activeCategory === cat.key
                      ? "border-black text-black"
                      : "border-purple-lighter text-purple-dark hover:border-purple-light bg-white"
                  }`}
                  style={
                    activeCategory === cat.key
                      ? { backgroundColor: cat.color }
                      : undefined
                  }
                >
                  {cat.label}
                  {activeCategory === cat.key && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 rounded-full border-[3px] border-black"
                      style={{ backgroundColor: cat.color, zIndex: -1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── LOADING STATE ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 bg-white border-4 border-black rounded-2xl px-8 py-4 card-shadow">
              <Loader2 size={28} strokeWidth={2.5} className="animate-spin text-purple-primary" />
              <span className="font-fredoka font-bold text-xl text-purple-darker">
                Loading Arsenal...
              </span>
            </div>
          </div>
        )}

        {/* ── TOOL GRID ── */}
        {!isLoading && (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filteredTools.map((tool, index) => {
                const typedTool = tool as Tool;
                const invItem = inventoryMap.get(typedTool.id);
                const availInfo = availableMap.get(typedTool.id);

                return (
                  <ToolCard
                    key={typedTool.id}
                    tool={typedTool}
                    inventoryItem={invItem}
                    onClick={() => setSelectedTool(typedTool)}
                    onUnlock={(e) => {
                      e.stopPropagation();
                      handleUnlock(typedTool.id);
                    }}
                    isUnlocking={unlockingId === typedTool.id}
                    unlockLevel={availInfo?.canUnlock ? playerLevel : undefined}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── EMPTY STATE ── */}
        {!isLoading && filteredTools.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="bg-white border-4 border-black rounded-2xl p-8 card-shadow text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-purple-pale border-4 border-black flex items-center justify-center mx-auto mb-4">
                <Search size={28} strokeWidth={2.5} color="#A78BFA" />
              </div>
              <h3 className="font-fredoka font-bold text-xl text-purple-darker mb-2">
                No Tools Found
              </h3>
              <p className="font-nunito text-sm text-purple-dark">
                No tools match the selected category. Try a different filter!
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── TOOL DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedTool && (
          <ToolDetailModal
            tool={selectedTool}
            inventoryItem={selectedInventoryItem}
            onClose={() => setSelectedTool(null)}
            onUnlock={handleUnlock}
            isUnlocking={unlockingId === selectedTool.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
