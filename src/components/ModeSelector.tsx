import {
  FileText,
  Search,
  Lightbulb,
  Calculator,
  Scale,
  Compass,
} from 'lucide-react';
import type { LearningModeConfig, LearningModeId } from '../types.ts';

interface ModeSelectorProps {
  modes: LearningModeConfig[];
  selectedModeId: LearningModeId;
  onSelectMode: (modeId: LearningModeId) => void;
}

const MODE_ICONS: Record<LearningModeId, typeof FileText> = {
  report: FileText,
  research: Search,
  idea: Lightbulb,
  problem: Calculator,
  debate: Scale,
  plan: Compass,
};

export function ModeSelector({
  modes,
  selectedModeId,
  onSelectMode,
}: ModeSelectorProps) {
  const activeMode = modes.find((m) => m.id === selectedModeId) ?? modes[0];

  return (
    <section aria-label="練習モード選択" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="目的別練習モード"
            className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0"
          >
            {modes.map((mode) => {
              const Icon = MODE_ICONS[mode.id];
              const isSelected = mode.id === selectedModeId;
              return (
                <button
                  key={mode.id}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => onSelectMode(mode.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                    isSelected
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{mode.shortName}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
            <span className="font-medium text-slate-900">{activeMode.name}</span>
            <span aria-hidden="true">·</span>
            <span>{activeMode.tagline}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
