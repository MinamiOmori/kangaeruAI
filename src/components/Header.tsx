import { ShieldCheck, RotateCcw } from 'lucide-react';

interface HeaderProps {
  activeSection: 'practice' | 'rules' | 'stats';
  onOpenRules: () => void;
  onScrollToStats: () => void;
  onResetSession: () => void;
}

export function Header({
  onOpenRules,
  onScrollToStats,
  onResetSession,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="font-display flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          <ShieldCheck className="h-5 w-5 text-blue-700 shrink-0" aria-hidden="true" />
          <span>思考の練習場</span>
        </a>

        <nav
          aria-label="主要ナビゲーション"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#workspace"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
          >
            練習モード
          </a>
          <button
            type="button"
            onClick={onOpenRules}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            AI活用の5約束
          </button>
          <button
            type="button"
            onClick={onScrollToStats}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            思考の記録
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetSession}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>新しい練習を始める</span>
          </button>
        </div>
      </div>
    </header>
  );
}
