export interface PreSendCheckResult {
  isLikelyCheating: boolean;
  warningMessage: string;
}

const CHEATING_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /(代わりに|かわりに|代筆|丸写し|そのまま提出|提出できる)/,
    reason: '課題や文章の代筆を求める表現が含まれています。',
  },
  {
    pattern: /(答えだけ|解答だけ|正解だけ|答えを教えて|解いてください|丸投げ)/,
    reason: '答えそのものや即答を求める表現が含まれています。',
  },
  {
    pattern: /(論述|考察|感想文|レポート|小論文|作文|志望理由書).*(考えて|書いて|作って|作成して|まとめて|文章で)/,
    reason: '課題の論述や文章そのものをAIに作らせる依頼とみなされる可能性があります。',
  },
  {
    pattern: /(文章で|文章にして|まとめて|箇条書きにして)[！!。.\s]*$/,
    reason: 'AIに「まとめ」や「文章」を作らせてそのまま使う依頼になりやすい表現です。',
  },
  {
    pattern: /(課題|宿題|テスト).*(考えて|書いて|作って|やって)/,
    reason: '課題の代行を求める表現が含まれています。',
  },
  {
    pattern: /(全部|最初から最後まで|一から).*(書いて|作って|やって)/,
    reason: '自分で考える工程をすべてAIに任せる表現が含まれています。',
  },
];

export function checkPreSendInput(text: string): PreSendCheckResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isLikelyCheating: false, warningMessage: '' };
  }

  for (const item of CHEATING_PATTERNS) {
    if (item.pattern.test(trimmed)) {
      return {
        isLikelyCheating: true,
        warningMessage: `${item.reason} このまま送信すると「丸投げロック」が発動します。まず自分が考えたこと（仮説・体験・書きたい結論の1行など）を添えて「視点」や「問いかけ」を聞く形に変えてみましょう。`,
      };
    }
  }

  return { isLikelyCheating: false, warningMessage: '' };
}

export function isCopiedFromAiText(
  pastedText: string,
  aiTexts: string[]
): boolean {
  const normalizedPaste = pastedText.replace(/\s+/g, '').trim();
  if (normalizedPaste.length < 15) return false;

  for (const source of aiTexts) {
    const normalizedSource = source.replace(/\s+/g, '').trim();
    if (!normalizedSource) continue;
    if (normalizedSource.includes(normalizedPaste)) {
      return true;
    }
  }
  return false;
}
