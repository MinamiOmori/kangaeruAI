import { X, ShieldAlert, SearchCheck, MessageCircleQuestion, PenTool, Scale } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIVE_PROMISES = [
  {
    icon: ShieldAlert,
    title: '01. 課題の「丸投げ・代筆」はしない（ロック機能）',
    detail:
      'レポートを書いてもらう、問題の答えだけを教えてもらう使い方は自分の考える力を奪います。丸投げ依頼にはロックがかかり、正しい質問のしかたをガイドします。',
  },
  {
    icon: MessageCircleQuestion,
    title: '02. AIからの「問いかけ」に自分の頭で答える',
    detail:
      '答えをすぐもらうのではなく、AIからの質問に答えていくことで「自分は本当はどう考えているのか」を整理する力を鍛えます。',
  },
  {
    icon: SearchCheck,
    title: '03. AIが出した単語や情報は必ず自分でググる',
    detail:
      'AIも間違えることがあります。表示されたキーワードや参照リンクを自分で検索して、公的機関や一次情報かどうかを確かめましょう。',
  },
  {
    icon: PenTool,
    title: '04. まず「自分の下書き・途中計算」を書いてから見てもらう',
    detail:
      '0から作らせるのではなく、思考ノートに書いた自分の文章や途中式を見てもらい、修正のヒントや類題を受け取りましょう。',
  },
  {
    icon: Scale,
    title: '05. あえて反対意見をもらい、自分の考えと比べる',
    detail:
      'AIに賛同してもらうだけでなく、別の視点やリスクを出してもらうことで、より納得感のある深い結論にたどり着けます。',
  },
];

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="rules-modal-title"
              className="font-display text-xl font-bold text-slate-900"
            >
              AIを使える人間になるための5つの約束
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              この場所は、AIに頼りきるのではなく「AIを使いこなして自分の思考力を伸ばす」ための学校の安全な練習場です。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {FIVE_PROMISES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-start gap-3.5 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <Icon
                  className="mt-0.5 h-5 w-5 text-blue-700 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 cursor-pointer whitespace-nowrap"
          >
            理解して練習を始める
          </button>
        </div>
      </div>
    </div>
  );
}
