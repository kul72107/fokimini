import type { ElementType } from 'react';
import {
  BookOpen,
  CircuitBoard,
  Gauge,
  Radar,
  Route,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  SIMULE_TOOLS,
  SIMULE_TOOL_CATEGORY_COLORS,
  SIMULE_TOOL_CATEGORY_LABELS,
  getSimuleToolsByIds,
  type SimuleToolCategory,
} from './simuleTools';

interface Props {
  mission: string;
  toolIds: readonly string[];
}

const CATEGORY_ICONS: Record<SimuleToolCategory, ElementType> = {
  map: Route,
  sensor: Radar,
  policy: Shield,
  response: CircuitBoard,
  recovery: Gauge,
  special: Sparkles,
};

export default function SimuleToolTrainingPanel({ mission, toolIds }: Props) {
  const tools = getSimuleToolsByIds(toolIds);

  return (
    <section className="w-full max-w-2xl rounded-2xl border-4 border-black bg-white p-3" style={{ boxShadow: '6px 6px 0px 0px #000' }}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen size={18} strokeWidth={3} className="text-purple-primary" />
          <div>
            <h3 className="font-fredoka text-sm font-bold text-purple-dark">Simuletool Training</h3>
            <p className="font-nunito text-[10px] font-bold text-purple-light">{mission}</p>
          </div>
        </div>
        <span className="rounded-full border-[3px] border-black bg-yellow-accent px-3 py-1 font-nunito text-[10px] font-black text-black">
          {tools.length}/{SIMULE_TOOLS.length}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {tools.map((tool) => {
          const Icon = CATEGORY_ICONS[tool.category];
          const color = SIMULE_TOOL_CATEGORY_COLORS[tool.category];

          return (
            <article key={tool.id} className="rounded-xl border-[3px] border-black bg-purple-pale p-2">
              <div className="flex items-start gap-2">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[3px] border-black"
                  style={{ backgroundColor: color }}
                >
                  <Icon size={16} strokeWidth={3} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <h4 className="font-nunito text-xs font-black text-purple-dark">{tool.name}</h4>
                    <span className="rounded-full bg-white px-2 py-0.5 font-nunito text-[8px] font-black text-purple-dark">
                      {SIMULE_TOOL_CATEGORY_LABELS[tool.category]}
                    </span>
                  </div>
                  <p className="mt-0.5 font-nunito text-[10px] font-bold text-purple-light">{tool.training}</p>
                  <p className="mt-1 font-nunito text-[9px] font-semibold leading-snug text-purple-dark">{tool.strength}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
