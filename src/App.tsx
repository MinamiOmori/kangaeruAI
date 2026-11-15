import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Send,
  AlertCircle,
  BookOpen,
  ShieldAlert,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { ModeSelector } from './components/ModeSelector.tsx';
import { CoachMessageCard } from './components/CoachMessageCard.tsx';
import { ThinkingNotePanel } from './components/ThinkingNotePanel.tsx';
import { RulesModal } from './components/RulesModal.tsx';
import { LEARNING_MODES, MODE_MAP } from './constants/modes.ts';
import { checkPreSendInput } from './utils/cheatingDetector.ts';
import type {
  ChatMessage,
  CoachActionType,
  CoachResponse,
  LearningModeId,
  SessionStats,
} from './types.ts';

const DRAFT_STORAGE_PREFIX = 'thinking_playground_draft_v1_';

function formatTimeNow(): string {
  return new Date().toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [selectedModeId, setSelectedModeId] = useState<LearningModeId>('report');
  const [messagesByMode, setMessagesByMode] = useState<
    Record<LearningModeId, ChatMessage[]>
  >({
    report: [],
    research: [],
    idea: [],
    problem: [],
    debate: [],
    plan: [],
  });

  const [draftsByMode, setDraftsByMode] = useState<Record<LearningModeId, string>>(
    () => {
      const initial: Record<LearningModeId, string> = {
        report: '',
        research: '',
        idea: '',
        problem: '',
        debate: '',
        plan: '',
      };
      for (const mode of LEARNING_MODES) {
        try {
          const saved = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${mode.id}`);
          if (saved) initial[mode.id] = saved;
        } catch {
          // Ignore storage errors
        }
      }
      return initial;
    }
  );

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const [stats, setStats] = useState<SessionStats>({
    studentTurns: 0,
    questionsAnswered: 0,
    verifiedKeywords: [],
    lockInterventions: 0,
    draftReviews: 0,
  });

  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);

  const activeMode = MODE_MAP[selectedModeId];
  const currentMessages = messagesByMode[selectedModeId];
  const currentDraft = draftsByMode[selectedModeId];

  const preSendCheck = useMemo(() => checkPreSendInput(inputText), [inputText]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${DRAFT_STORAGE_PREFIX}${selectedModeId}`,
        currentDraft
      );
    } catch {
      // Ignore storage errors
    }
  }, [selectedModeId, currentDraft]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [currentMessages.length, isLoading]);

  const sendToCoach = async (
    textToSend: string,
    actionType: CoachActionType = 'chat'
  ) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      text: trimmed,
      timestamp: formatTimeNow(),
      mode: selectedModeId,
      actionType,
    };

    const nextHistory = [...currentMessages, userMsg];
    setMessagesByMode((prev) => ({
      ...prev,
      [selectedModeId]: nextHistory,
    }));

    if (actionType === 'chat') {
      setInputText('');
    }

    setStats((prev) => ({
      ...prev,
      studentTurns: prev.studentTurns + 1,
      questionsAnswered:
        trimmed.includes('【問いへの自分の考え】')
          ? prev.questionsAnswered + 1
          : prev.questionsAnswered,
      draftReviews:
        actionType === 'review_draft' ? prev.draftReviews + 1 : prev.draftReviews,
    }));

    setIsLoading(true);
    try {
      const apiMessages = nextHistory
        .filter((m) => !m.error)
        .map((m) => ({
          role: m.role,
          text:
            m.role === 'assistant' && m.coachData
              ? m.coachData.isLocked
                ? `【ロック指導】${m.coachData.lockReason}`
                : `${m.coachData.mainHint}\n問いかけ: ${m.coachData.questionsForStudent.join(' / ')}`
              : m.text,
        }));

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedModeId,
          messages: apiMessages,
          studentDraft: currentDraft,
          actionType,
        }),
      });

      const payload = (await res.json()) as CoachResponse & { error?: string };

      if (!res.ok) {
        throw new Error(
          payload.error || 'AIコーチからの応答を取得できませんでした。'
        );
      }

      if (payload.isLocked) {
        setStats((prev) => ({
          ...prev,
          lockInterventions: prev.lockInterventions + 1,
        }));
      }

      const aiMsg: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: payload.isLocked ? payload.lockReason : payload.mainHint,
        timestamp: formatTimeNow(),
        mode: selectedModeId,
        actionType,
        coachData: payload,
      };

      setMessagesByMode((prev) => ({
        ...prev,
        [selectedModeId]: [...prev[selectedModeId], aiMsg],
      }));
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : '通信エラーが発生しました。もう一度お試しください。';
      const errorBubble: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: errMsg,
        timestamp: formatTimeNow(),
        mode: selectedModeId,
        error: errMsg,
      };
      setMessagesByMode((prev) => ({
        ...prev,
        [selectedModeId]: [...prev[selectedModeId], errorBubble],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplyToQuestion = (question: string) => {
    const prefix = `【問いへの自分の考え】\n質問「${question}」に対する私の考え：\n`;
    setInputText(prefix);
    composerRef.current?.focus();
  };

  const handleFocusComposerWithStarter = (starter: string) => {
    setInputText(starter);
    composerRef.current?.focus();
  };

  const handleVerifyKeyword = (keyword: string) => {
    setStats((prev) => {
      if (prev.verifiedKeywords.includes(keyword)) return prev;
      return {
        ...prev,
        verifiedKeywords: [...prev.verifiedKeywords, keyword],
      };
    });
  };

  const handleRequestDraftReview = () => {
    if (currentDraft.trim().length < 5) return;
    sendToCoach(
      '思考ノートに書いた自分の下書きを確認し、書き直さずに改善のためのヒントと問いかけをください。',
      'review_draft'
    );
  };

  const handleRequestCounterArgument = () => {
    if (currentDraft.trim().length < 5) return;
    sendToCoach(
      '思考ノートに書いた自分の考えに対して、あえて反対意見や見落としがちな視点を提示してください。',
      'counter_argument'
    );
  };

  const handleRequestSimilarProblem = () => {
    const context = inputText.trim() || currentDraft.trim();
    const prompt = context
      ? `次の内容について理解を深めたいので、答えは言わずに練習用の「類題」を1問と解く手順のヒントを出してください：\n${context}`
      : '今の学習単元に合わせて、自分で解く練習ができる「類題」を出すために、まずどの単元のどんな問題でつまずいているか質問してください。';
    if (inputText.trim()) {
      setInputText('');
    }
    sendToCoach(prompt, 'similar_problem');
  };

  const handleResetSession = () => {
    setMessagesByMode((prev) => ({
      ...prev,
      [selectedModeId]: [],
    }));
    setInputText('');
  };

  const handleScrollToStats = () => {
    statsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        activeSection="practice"
        onOpenRules={() => setIsRulesOpen(true)}
        onScrollToStats={handleScrollToStats}
        onResetSession={handleResetSession}
      />

      <ModeSelector
        modes={LEARNING_MODES}
        selectedModeId={selectedModeId}
        onSelectMode={(modeId) => setSelectedModeId(modeId)}
      />

      <main
        id="workspace"
        className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)] lg:items-start">
          {/* Left Zone: Socratic Coaching & Safe Dialogue Stage */}
          <section
            aria-label="思考コーチとの対話ステージ"
            className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs"
          >
            {/* Mode Guardrail Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
              <div>
                <h1 className="font-display text-base font-bold text-slate-900">
                  {activeMode.name}
                </h1>
                <p className="mt-0.5 text-xs text-slate-600">
                  AIの役割：{activeMode.aiRole}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>{activeMode.guardrail}</span>
              </div>
            </div>

            {/* Messages / Empty Welcome Area */}
            <div className="min-h-[420px] max-h-[620px] overflow-y-auto bg-slate-50/50 p-5 space-y-5">
              {currentMessages.length === 0 ? (
                <div className="mx-auto max-w-2xl py-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <BookOpen className="h-4 w-4 text-blue-700 shrink-0" aria-hidden="true" />
                      <h2 className="font-display">
                        まずは「自分の考え」や「つまずいた箇所」から話しかけてみよう
                      </h2>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      ここは「答えをそのまま教えてくれるAI」ではなく、質問やヒント・類題・反対意見を通じて、あなた自身の考える力を引き出す安全な練習場です。
                    </p>

                    <div className="mt-5">
                      <p className="text-xs font-bold text-slate-700">
                        入力のしかたを試してみる（クリックで入力欄に入ります）
                      </p>
                      <div className="mt-2.5 flex flex-col gap-2">
                        {activeMode.examples.map((example, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setInputText(example.text);
                              composerRef.current?.focus();
                            }}
                            className={`flex flex-col gap-1 rounded-lg border p-3.5 text-left transition-colors cursor-pointer ${
                              example.isCheatingDemo
                                ? 'border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50'
                                : 'border-slate-200 bg-slate-50/70 hover:border-blue-300 hover:bg-blue-50/40'
                            }`}
                          >
                            <span
                              className={`text-xs font-bold ${
                                example.isCheatingDemo
                                  ? 'text-amber-800'
                                  : 'text-blue-800'
                              }`}
                            >
                              {example.label}
                            </span>
                            <span className="text-xs leading-relaxed text-slate-700">
                              {example.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                currentMessages.map((msg) =>
                  msg.role === 'user' ? (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-slate-900">
                        <div className="flex items-center justify-between gap-4 text-xs text-blue-800">
                          <span className="font-bold">あなたの発言</span>
                          <span className="font-mono-num text-blue-600">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ) : msg.error ? (
                    <div
                      key={msg.id}
                      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />
                        <span>エラーが発生しました</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-red-800">
                        {msg.error}
                      </p>
                    </div>
                  ) : msg.coachData ? (
                    <CoachMessageCard
                      key={msg.id}
                      data={msg.coachData}
                      timestamp={msg.timestamp}
                      verifiedKeywords={stats.verifiedKeywords}
                      onVerifyKeyword={handleVerifyKeyword}
                      onReplyToQuestion={handleReplyToQuestion}
                      onFocusComposerWithStarter={handleFocusComposerWithStarter}
                    />
                  ) : null
                )
              )}

              {isLoading && (
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-medium text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-700 shrink-0" aria-hidden="true" />
                  <span>思考を引き出すヒントと問いかけを組み立てています...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Composer & Pre-send Safety Check */}
            <div className="border-t border-slate-200 bg-white p-4 sm:p-5 rounded-b-xl">
              {preSendCheck.isLikelyCheating && (
                <div
                  role="status"
                  className="mb-3 flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"
                >
                  <ShieldAlert
                    className="mt-0.5 h-4 w-4 text-amber-700 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-bold">送信前のセルフチェック</p>
                    <p className="mt-0.5">{preSendCheck.warningMessage}</p>
                  </div>
                </div>
              )}

              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                {selectedModeId === 'problem' && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleRequestSimilarProblem}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>類題を出してもらう</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    handleFocusComposerWithStarter(
                      '【自分の仮説・考え】今のところ私はこう考えていますが、'
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>「自分の考え」の書き出しを入れる</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendToCoach(inputText, 'chat');
                }}
                className="flex flex-col gap-3"
              >
                <textarea
                  ref={composerRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing &&
                      e.keyCode !== 229
                    ) {
                      e.preventDefault();
                      sendToCoach(inputText, 'chat');
                    }
                  }}
                  placeholder={activeMode.placeholder}
                  rows={3}
                  aria-label="AIコーチへの入力欄"
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white p-3.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    個人情報は入力しないでください · Shift+Enterで改行 / Enterで送信
                  </p>
                  <button
                    type="submit"
                    disabled={isLoading || !inputText.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>自分の考えを送る</span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Right Zone: Student's Own Thinking Note & Training Record */}
          <ThinkingNotePanel
            mode={activeMode}
            draft={currentDraft}
            aiTexts={currentMessages
              .filter((m) => m.role === 'assistant' && m.coachData)
              .flatMap((m) => [
                m.coachData?.mainHint ?? '',
                m.coachData?.practiceProblem ?? '',
                ...(m.coachData?.draftFeedbackPoints ?? []),
              ])}
            onChangeDraft={(val) =>
              setDraftsByMode((prev) => ({
                ...prev,
                [selectedModeId]: val,
              }))
            }
            onRequestDraftReview={handleRequestDraftReview}
            onRequestCounterArgument={handleRequestCounterArgument}
            isLoading={isLoading}
            stats={stats}
            statsSectionRef={statsRef}
          />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          <p>
            思考の練習場 — 課題の代行や即答を行わず、問いかけと判断力を育てる学校向けAIトレーニング環境
          </p>
          <button
            type="button"
            onClick={() => setIsRulesOpen(true)}
            className="font-medium text-slate-700 underline-offset-2 hover:underline cursor-pointer whitespace-nowrap"
          >
            AI活用の5つの約束を確認する
          </button>
        </div>
      </footer>

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
}
