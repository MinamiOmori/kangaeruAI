import { useState } from 'react';
import {
  Lock,
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  BookOpenCheck,
  MessageSquarePlus,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import type { CoachResponse } from '../types.ts';

interface CoachMessageCardProps {
  data: CoachResponse;
  timestamp: string;
  verifiedKeywords: string[];
  onVerifyKeyword: (keyword: string) => void;
  onReplyToQuestion: (question: string) => void;
  onFocusComposerWithStarter: (starter: string) => void;
}

export function CoachMessageCard({
  data,
  timestamp,
  verifiedKeywords,
  onVerifyKeyword,
  onReplyToQuestion,
  onFocusComposerWithStarter,
}: CoachMessageCardProps) {
  const [showCopyReminder, setShowCopyReminder] = useState(false);

  const handleCopyAttempt = () => {
    setShowCopyReminder(true);
  };

  if (data.isLocked) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 text-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <Lock className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
            <span>丸投げロック発動</span>
            <span aria-hidden="true" className="text-amber-500">·</span>
            <span className="font-medium text-amber-800">リアルタイムモラル指導</span>
          </div>
          <span className="font-mono-num text-xs text-amber-700">{timestamp}</span>
        </div>

        <div className="mt-4 space-y-4 text-sm leading-relaxed">
          <div>
            <p className="text-xs font-bold text-amber-900">なぜロックされたのか</p>
            <p className="mt-1 text-slate-800 whitespace-pre-wrap">{data.lockReason}</p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-white/90 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0" aria-hidden="true" />
              <span>AIを使いこなすための言い換えガイド</span>
            </p>
            <p className="mt-1.5 text-slate-700 whitespace-pre-wrap">{data.moralGuidance}</p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() =>
                onFocusComposerWithStarter(
                  '【自分の考え】私がいま分かっていること・書きたいことは、'
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>自分の考えを書いてロックを解除する</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onCopy={handleCopyAttempt}
      className="rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-bold text-blue-800">思考コーチ</span>
          <span aria-hidden="true">·</span>
          <span>{data.coachingType || '思考ヒント'}</span>
        </div>
        <span className="font-mono-num text-xs text-slate-400">{timestamp}</span>
      </div>

      {showCopyReminder && (
        <div
          role="status"
          className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"
        >
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold">丸パクリ防止ガイド</p>
              <p className="mt-0.5">
                AIの文章をそのままコピー＆ペーストするのではなく、内容を理解したうえで自分の言葉に言い換えて思考ノートに書いてみましょう。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCopyReminder(false)}
            className="text-xs font-medium text-amber-800 underline hover:text-amber-950 whitespace-nowrap shrink-0 cursor-pointer"
          >
            閉じる
          </button>
        </div>
      )}

      <div className="mt-4 space-y-5">
        {data.mainHint && (
          <div className="text-sm leading-7 text-slate-800 whitespace-pre-wrap">
            {data.mainHint}
          </div>
        )}

        {data.practiceProblem && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <BookOpenCheck className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
                <span>練習用の類題（自分で解いてみよう）</span>
              </p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
              {data.practiceProblem}
            </p>
            <button
              type="button"
              onClick={() =>
                onFocusComposerWithStarter(
                  '【類題への自分の解答プロセス】私は次のように考えました：'
                )
              }
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-800 transition-colors hover:bg-blue-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>この類題の自分の解き方を入力する</span>
            </button>
          </div>
        )}

        {data.draftFeedbackPoints && data.draftFeedbackPoints.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-bold text-slate-900">
              自分の下書きを見直すポイント（書き直しは自分で行おう）
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
              {data.draftFeedbackPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-mono-num mt-0.5 text-xs font-medium text-blue-700">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.questionsForStudent && data.questionsForStudent.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <HelpCircle className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
              <span>あなたへの問いかけ（クリックして答えてみよう）</span>
            </p>
            <div className="mt-2.5 flex flex-col gap-2">
              {data.questionsForStudent.map((question, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onReplyToQuestion(question)}
                  className="group flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm text-slate-800 transition-colors hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer"
                >
                  <span className="leading-relaxed">{question}</span>
                  <span className="mt-0.5 text-xs font-medium text-blue-700 opacity-80 group-hover:opacity-100 whitespace-nowrap shrink-0">
                    答える →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {data.keywordsToVerify && data.keywordsToVerify.length > 0 && (
          <div className="border-t border-slate-100 pt-3.5">
            <p className="text-xs font-medium text-slate-600">
              AIの言葉を鵜呑みにせず、自分で検索（ググる）して意味や事実を確かめよう
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.keywordsToVerify.map((keyword) => {
                const isVerified = verifiedKeywords.includes(keyword);
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                  keyword
                )}`;
                return (
                  <a
                    key={keyword}
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onVerifyKeyword(keyword)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isVerified
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800'
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    )}
                    <span>{keyword} を検索して確認</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {data.sources && data.sources.length > 0 && (
          <div className="border-t border-slate-100 pt-3.5">
            <p className="text-xs font-medium text-slate-600">
              参照したWeb情報（一次情報・公的機関か自分の目で確かめよう）
            </p>
            <ul className="mt-2 space-y-1.5">
              {data.sources.slice(0, 5).map((source, idx) => (
                <li key={idx}>
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-700 underline-offset-2 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="truncate max-w-[460px]">{source.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
