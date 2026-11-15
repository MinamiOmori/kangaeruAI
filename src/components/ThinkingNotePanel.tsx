import { useState } from 'react';
import {
  PenLine,
  Copy,
  Download,
  Check,
  Sparkles,
  Scale,
  CheckSquare,
  Square,
  ShieldAlert,
} from 'lucide-react';
import { isCopiedFromAiText } from '../utils/cheatingDetector.ts';
import type { LearningModeConfig, SessionStats } from '../types.ts';

interface ThinkingNotePanelProps {
  mode: LearningModeConfig;
  draft: string;
  aiTexts: string[];
  onChangeDraft: (value: string) => void;
  onRequestDraftReview: () => void;
  onRequestCounterArgument: () => void;
  isLoading: boolean;
  stats: SessionStats;
  statsSectionRef: React.RefObject<HTMLDivElement | null>;
}

const SELF_CHECK_ITEMS = [
  'AIの回答や文をそのままコピー＆ペーストしていない',
  '出てきた用語やデータを自分で検索して確かめた',
  '自分の言葉と理由で「なぜそう考えたか」を説明できる',
];

export function ThinkingNotePanel({
  mode,
  draft,
  aiTexts,
  onChangeDraft,
  onRequestDraftReview,
  onRequestCounterArgument,
  isLoading,
  stats,
  statsSectionRef,
}: ThinkingNotePanelProps) {
  const [copied, setCopied] = useState(false);
  const [pasteBlockedMessage, setPasteBlockedMessage] = useState('');
  const [checkedItems, setCheckedItems] = useState<boolean[]>([false, false, false]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text/plain');
    if (isCopiedFromAiText(pasted, aiTexts)) {
      e.preventDefault();
      setPasteBlockedMessage(
        'AIの回答をそのまま貼り付けようとしました（丸パクリ防止ロック）。ヒントの内容を自分の頭で噛み砕いて、自分の言葉で入力してみましょう。'
      );
    } else {
      setPasteBlockedMessage('');
    }
  };

  const handleCopyDraft = async () => {
    if (!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const handleDownloadDraft = () => {
    if (!draft.trim()) return;
    const blob = new Blob(
      [
        `【${mode.name}】思考ノート\n作成日時: ${new Date().toLocaleString('ja-JP')}\n\n${draft}`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thinking-note-${mode.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleCheckItem = (index: number) => {
    setCheckedItems((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  return (
    <aside className="flex flex-col gap-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
            <h2 className="font-display text-sm font-bold text-slate-900">
              {mode.draftLabel}
            </h2>
          </div>
          <span className="font-mono-num text-xs text-slate-500">
            {draft.length} 文字
          </span>
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
          AIに文章を作らせるのではなく、ここに自分の考え・下書き・途中式を書きためましょう（AI文面の丸コピー貼り付けは自動でブロックされます）。
        </p>

        {pasteBlockedMessage && (
          <div
            role="alert"
            className="mt-3 flex items-start justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"
          >
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
              <span>{pasteBlockedMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setPasteBlockedMessage('')}
              className="font-medium text-amber-800 underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              閉じる
            </button>
          </div>
        )}

        <textarea
          value={draft}
          onChange={(e) => onChangeDraft(e.target.value)}
          onPaste={handlePaste}
          placeholder={mode.draftPlaceholder}
          rows={9}
          aria-label={mode.draftLabel}
          className="mt-3 w-full resize-y rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
        />

        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            disabled={isLoading || draft.trim().length < 5}
            onClick={onRequestDraftReview}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>この下書きの修正ヒントをもらう（代筆なし）</span>
          </button>

          <button
            type="button"
            disabled={isLoading || draft.trim().length < 5}
            onClick={onRequestCounterArgument}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>この内容への反対意見・別視点をもらう</span>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={handleCopyDraft}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                <span className="text-emerald-700">コピーしました</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>コピー</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={!draft.trim()}
            onClick={handleDownloadDraft}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>.txtで保存</span>
          </button>
        </div>
      </div>

      <div
        ref={statsSectionRef}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
      >
        <h3 className="font-display text-sm font-bold text-slate-900">
          今日の思考トレーニング記録
        </h3>
        <div className="mt-3 grid grid-cols-3 gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs text-slate-500">自分の発言</p>
            <p className="font-mono-num mt-1 text-xl font-bold text-slate-900">
              {stats.studentTurns}
              <span className="ml-0.5 text-xs font-normal text-slate-500">回</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">調べた単語</p>
            <p className="font-mono-num mt-1 text-xl font-bold text-emerald-700">
              {stats.verifiedKeywords.length}
              <span className="ml-0.5 text-xs font-normal text-slate-500">語</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">下書き点検</p>
            <p className="font-mono-num mt-1 text-xl font-bold text-blue-700">
              {stats.draftReviews}
              <span className="ml-0.5 text-xs font-normal text-slate-500">回</span>
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold text-slate-900">
            提出前のセルフリフレクション
          </p>
          <ul className="mt-2.5 space-y-2">
            {SELF_CHECK_ITEMS.map((label, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => toggleCheckItem(idx)}
                  className="flex w-full items-start gap-2.5 text-left text-xs leading-relaxed text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  {checkedItems[idx] ? (
                    <CheckSquare
                      className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Square
                      className="mt-0.5 h-4 w-4 text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span className={checkedItems[idx] ? 'line-through text-slate-400' : ''}>
                    {label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
