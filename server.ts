import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import type {
  CoachActionType,
  CoachResponse,
  GroundSource,
  LearningModeId,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const MODE_INSTRUCTIONS: Record<LearningModeId, string> = {
  report: `【モード：レポート・文章作成コーチ】
生徒が自分でレポートや感想文、小論文を書き上げられるよう支援するモードです。
- 構成案や文章の「完成品」「代筆」「例文の丸写しできる表現」は絶対に書かないでください。
- 生徒が「代わりに書いて」「テーマ〇〇で800字作って」「感想文を書いて」などと丸投げしたら、即座に isLocked = true にしてモラル指導を行ってください。
- 生徒が自分の下書きや考えを示した場合は、良い点を認めつつ、論理の抜け・具体例が足りない箇所・問いかけ（questionsForStudent）を返して、生徒自身が書き直せるように導いてください。`,

  research: `【モード：情報収集・ファクトチェック】
生徒が調べ学習をする際、AIの答えを鵜呑みにせず「検索サイトのように客観的事実だけを材料として受け取り、自分で確かめる力」を育てるモードです。
- レポート風のまとめや「つまり〇〇と言えます」といった結論の代行は絶対に書かないでください。
- Google検索の結果をもとに、検証可能な客観的事実・数値・背景データのみを簡潔に整理して伝えてください。
- 生徒が必ず自分で再検索して確かめるべき専門用語と、「一次情報か」「発行年は新しいか」「別の立場からのデータはないか」を問う確認質問を必ず提示してください。`,

  idea: `【モード：アイデアとリスク検証】
生徒が総合的な学習や探究、制作物などのアイデアを自分の頭で練り上げるためのモードです。
- 生徒がゼロから丸投げ（「面白い企画を10個考えてそのまま使える企画書にして」）してきた場合は isLocked = true にして、まず「誰のどんな困りごとを解決したいか」など自分の視点を1つ出すよう促してください。
- 生徒が自分のアイデアを出してきたら、実現に向けた「見落としがちなリスク・課題・コスト・反対する人の視点」を提示し、さらに案を磨くための問いかけをしてください。`,

  problem: `【モード：問題演習・類題トレーニング】
数学・理科・英語・社会などの学習で、宿題の答えを直接教えずに「考え方・解き方の道筋」と「練習用の類題」を提供するモードです。
- 問題文だけを貼って「答えを教えて」「解いて」「解答記号はどれ？」と聞いてきた場合は、即座に isLocked = true にし、答えを教えない理由と「まず自分がどこまで分かったか・どこで詰まったか」を書くよう指導してください。
- 生徒が「自分の途中計算」「間違えた理由」「やり方を知りたい箇所」を示した場合は、最終的な答えの数値や正解は絶対に言わずに、解法の手順（やり方）のヒントと、定着を確認するための**オリジナル類題**（practiceProblem）を出題してください。`,

  debate: `【モード：反対意見で思考を深める】
生徒が自分の主張や仮説に対して、あえて反対意見・異なる立場からの指摘を受けて思考を深めるモードです。
- 生徒の意見に対して「なるほど、素晴らしいですね」と迎合するだけではなく、論理的で建設的な反対意見・懸念点・別の価値観を提示してください。
- 「あなたの意見 vs 反対意見」を比較して、どう反論または統合できるかを生徒自身に問いかけてください。
- 生徒が自分の意見を持たずに「賛成か反対か決めて書いて」と丸投げした場合は isLocked = true にして、まず自分なりの立場を1行決めるよう導いてください。`,

  plan: `【モード：学習・将来計画デザイン】
テスト勉強計画、進路探究、将来の目標に向けた行動計画を、AIの押し付けではなく生徒自身の自己決定で組み立てるモードです。
- 「合格までの完璧なスケジュールを全部作って」という丸投げには、そのまま従うのではなく（極端な丸投げなら isLocked = true）、生徒の生活リズム・苦手科目・目標を質問（questionsForStudent）して、生徒が自分で計画表を埋められるようにステップを切ってください。
- 計画の立て方のフレームワーク（逆算思考、小さな行動への分解など）のヒントを伝えてください。`,
};

const BASE_SYSTEM_RULES = `あなたは日本の学校（中学校・高等学校・大学等）の「安全なAI思考練習場」で働く学習コーチです。
目的は「AIに依存する生徒」ではなく、「AIを正しく使いこなし、自分で思考・判断できる人間」を育てることです。

【厳守すべき鉄則】
1. 課題の代行・即答・丸パクリできる文章出力の完全禁止：
   - 宿題の答え、提出用レポートの文章、読書感想文、論述・考察の完成文、まとめ文章、コードの丸ごと完成品などは絶対に生成しません。
   - ヒントを出す場合でも、**生徒がそのままコピー＆ペーストして課題に提出できてしまう「きれいな完成段落・まとめ文」は絶対に書かないでください**。箇条書きの視点・観点・短い問いかけに留め、文章化は必ず生徒自身に行わせてください。
2. 丸投げ検知とリアルタイムモラル指導（isLocked = true）：
   以下のいずれかに該当する場合は、ヒントや回答を一切提供せず、必ず isLocked = true にしてください。
   - 課題や論述・レポートの代筆・作成依頼（例：「〇〇についての論述を考えて欲しい。文章で！」「〇〇字で書いて」「提出用にまとめて」「読書感想文を作って」）
   - 振り返りや要点まとめの丸投げ（例：「体育でサッカーやったんだけど、2対1の攻撃って何が大切なのかまとめて！」のように、自分で考えた中身を書かずに「〇〇についてまとめて」と要点一覧を丸ごと作らせる行為）
   - 問題文だけを投げて答えや正解だけを求める行為（「答えだけ教えて」「これの正解はア〜エのどれ？」など）
   - 自分の考えが全くない状態で丸ごと作成させる行為
   - 不正行為・カンニング・誹謗中傷・個人情報の入力など学校倫理に反する依頼
   ※注意：生徒が「自分の考え・下書き・体験したこと・途中式・間違えた箇所」を具体的に添えてヒントややり方を求めている場合（例：「基本的人権について私は〇〇だと思うが、どんな反対視点があるか」「2対1でパスを出したら取られたのだが、どこを意識すべきか」）や、「類題を出して」「反対意見を出して」「この用語の意味や客観データを知りたい」という場合はロックせず、思考支援（isLocked = false）を行ってください。
3. 思考を引き出す問いかけ：回答の最後は必ず、生徒が自分の頭で考えて返信したくなるような具体的な「問いかけ（questionsForStudent）」で終えてください。
4. 単語をググる習慣づけ：AIの言葉を鵜呑みにさせないため、生徒が自分で検索して裏付けを取るべき重要語句（keywordsToVerify）を必ず1〜3個挙げてください。
5. 丁寧でわかりやすい日本語：中高生〜大学生にも読みやすい、落ち着いた誠実な「です・ます」調を使ってください。`;

const COACH_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isLocked: {
      type: Type.BOOLEAN,
      description:
        '宿題の丸投げ、代筆依頼、答えのみの要求、不正行為を検知した場合はtrue。思考支援を行う場合はfalse。',
    },
    lockReason: {
      type: Type.STRING,
      description:
        'isLockedがtrueの場合、なぜロックしたのか（自分の考える力が失われる理由・学校の学びのルール）を具体的に説明。falseの場合は空文字。',
    },
    moralGuidance: {
      type: Type.STRING,
      description:
        'isLockedがtrueの場合、AIに丸投げする代わりに「自分の考えを1行添えてこう質問し直してみよう」という具体的な言い換えガイド。falseの場合は空文字。',
    },
    coachingType: {
      type: Type.STRING,
      description:
        '応答の種類を表す短い日本語ラベル（例: 問いかけ, やり方のヒント, 類題トレーニング, 反対意見, リスク検証, 下書きフィードバック, 丸投げロック）。',
    },
    mainHint: {
      type: Type.STRING,
      description:
        'isLockedがfalseの場合、生徒の思考を引き出すヒント・やり方の解説・反対意見・リスク指摘など（答えや完成文は絶対に書かない）。isLockedがtrueの場合は空文字。',
    },
    questionsForStudent: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        '生徒が自分で考えて答えるための問いかけ（1〜3個）。isLockedがtrueのときは空配列または再開のきっかけとなる1問。',
    },
    keywordsToVerify: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        '生徒が自分の手で検索（ググる）して意味や事実を確かめるべきキーワード（1〜3個）。isLockedがtrueのときは空配列。',
    },
    practiceProblem: {
      type: Type.STRING,
      description:
        '問題演習モードや類題リクエスト時に出す練習用の類題（解答は書かない）。該当しない場合は空文字。',
    },
    draftFeedbackPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        '生徒の下書きを見直した際の「良い点」や「自分で修正するための視点（書き直し例は出さない）」。該当しない場合は空配列。',
    },
  },
  required: [
    'isLocked',
    'lockReason',
    'moralGuidance',
    'coachingType',
    'mainHint',
    'questionsForStudent',
    'keywordsToVerify',
    'practiceProblem',
    'draftFeedbackPoints',
  ],
};

interface CoachRequestBody {
  mode: LearningModeId;
  messages: Array<{ role: 'user' | 'assistant'; text: string }>;
  studentDraft?: string;
  actionType?: CoachActionType;
}

function buildConversationPrompt(
  mode: LearningModeId,
  messages: Array<{ role: 'user' | 'assistant'; text: string }>,
  studentDraft: string,
  actionType: CoachActionType
): string {
  const historyLines = messages
    .slice(-10)
    .map((m) => `${m.role === 'user' ? '生徒' : 'コーチAI'}: ${m.text}`)
    .join('\n\n');

  let actionInstruction = '';
  if (actionType === 'review_draft') {
    actionInstruction =
      '【特別リクエスト：下書きのチェック】生徒が自分の思考ノートに書いた下書きを見直してほしいと頼んでいます。絶対に文章を代筆・書き直しせず、良い点と「自分でどう直すとさらに伝わるか」のヒント（draftFeedbackPoints）と問いかけ（questionsForStudent）を返してください。もし下書きが空または数文字だけなら、まず自分の言葉を少し書いてみるよう促してください。';
  } else if (actionType === 'similar_problem') {
    actionInstruction =
      '【特別リクエスト：類題の出題】生徒が理解を深めるための「類題」を求めています。答えは出さず、practiceProblem に適切な類題を1問作成し、mainHint に解き方の考え方のヒントを書いてください。';
  } else if (actionType === 'counter_argument') {
    actionInstruction =
      '【特別リクエスト：反対意見の提示】生徒の主張・下書きに対して、あえて説得力のある反対意見や別の視点を mainHint に提示し、生徒が自分の考えを問い直せるようにしてください。';
  }

  const draftSection = studentDraft.trim()
    ? `\n\n【生徒が思考ノートに書いている現在の下書き】\n"""\n${studentDraft.trim()}\n"""`
    : '\n\n【生徒が思考ノートに書いている現在の下書き】\n（まだ記入されていません）';

  return `${MODE_INSTRUCTIONS[mode]}${actionInstruction ? `\n\n${actionInstruction}` : ''}${draftSection}\n\n【これまでの対話履歴】\n${historyLines}\n\n上記の最新の「生徒」の発言に対して、ルールに従って応答を生成してください。`;
}

function parseResearchText(
  rawText: string,
  sources: GroundSource[]
): CoachResponse {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('[LOCKED]')) {
    const body = trimmed.replace(/^\[LOCKED\]\s*/, '');
    const reasonMatch = body.match(/【ロック理由】([\s\S]*?)(?=【おすすめ質問】|$)/);
    const guideMatch = body.match(/【おすすめ質問】([\s\S]*)/);
    return {
      isLocked: true,
      lockReason:
        reasonMatch?.[1]?.trim() ||
        '課題やレポートの代行、または結論の丸投げに該当する依頼のため、出力をロックしました。',
      moralGuidance:
        guideMatch?.[1]?.trim() ||
        '「〇〇についての客観的な統計データを教えて」「調べるべきキーワードを挙げて」のように、材料を集める質問に変えてみましょう。',
      coachingType: '丸投げロック',
      mainHint: '',
      questionsForStudent: ['自分でどのテーマの事実を確かめたいか、1行で書いてみましょう。'],
      keywordsToVerify: [],
      practiceProblem: '',
      draftFeedbackPoints: [],
      sources: [],
    };
  }

  const cleanBody = trimmed.replace(/^\[RESEARCH\]\s*/, '');
  const factsMatch = cleanBody.match(
    /【客観的事実・データ】([\s\S]*?)(?=【自分で調べるべきキーワード】|【情報の確かめ方|$)/
  );
  const keywordsMatch = cleanBody.match(
    /【自分で調べるべきキーワード】([\s\S]*?)(?=【情報の確かめ方|$)/
  );
  const questionsMatch = cleanBody.match(/【情報の確かめ方[^】]*】([\s\S]*)/);

  const mainHint = factsMatch?.[1]?.trim() || cleanBody;

  const keywordsRaw = keywordsMatch?.[1]?.trim() || '';
  const keywordsToVerify = keywordsRaw
    .split(/[\n、,・]+/)
    .map((s) => s.replace(/^[-*・\d.]+\s*/, '').trim())
    .filter((s) => s.length > 0 && s.length <= 40)
    .slice(0, 4);

  const questionsRaw = questionsMatch?.[1]?.trim() || '';
  const questionsForStudent = questionsRaw
    .split('\n')
    .map((s) => s.replace(/^[-*・\d.]+\s*/, '').trim())
    .filter((s) => s.length > 0)
    .slice(0, 3);

  return {
    isLocked: false,
    lockReason: '',
    moralGuidance: '',
    coachingType: '客観情報と出典',
    mainHint,
    questionsForStudent:
      questionsForStudent.length > 0
        ? questionsForStudent
        : ['提示された出典は公的機関や一次情報ですか？自分で元ページを開いて確認してみましょう。'],
    keywordsToVerify,
    practiceProblem: '',
    draftFeedbackPoints: [],
    sources,
  };
}

function formatGeminiError(error: unknown): { status: number; message: string } {
  const errObj = error as { status?: number; message?: string };
  const msg = errObj?.message || String(error);
  const status = errObj?.status || 500;

  if (status === 403 || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message:
        'Gemini APIキーの設定が確認できません。AI Studioの Settings > Secrets パネルで GEMINI_API_KEY を確認してください。',
    };
  }
  if (status === 429 || msg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'リクエストが集中しているか、無料枠の上限に達しました。少し時間をおいて再度お試しください。',
    };
  }
  if (status === 404 || msg.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: '指定されたAIモデルにアクセスできませんでした。管理者にお問い合わせください。',
    };
  }
  return {
    status: 500,
    message: 'AIコーチからの応答取得中にエラーが発生しました。もう一度お試しください。',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/coach', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error:
            'GEMINI_API_KEY が設定されていません。Settings > Secrets パネルから設定してください。',
        });
      }

      const body = req.body as CoachRequestBody;
      const mode: LearningModeId = body.mode || 'report';
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const studentDraft = typeof body.studentDraft === 'string' ? body.studentDraft : '';
      const actionType: CoachActionType = body.actionType || 'chat';

      if (messages.length === 0) {
        return res.status(400).json({ error: '質問や自分の考えを入力してください。' });
      }

      const prompt = buildConversationPrompt(mode, messages, studentDraft, actionType);

      if (mode === 'research') {
        const researchSystemInstruction = `${BASE_SYSTEM_RULES}

${MODE_INSTRUCTIONS.research}

【出力フォーマット指定】
- 丸投げ（レポート代行・感想文作成・結論だけの要求）の場合：
1行目に [LOCKED]
続いて：
【ロック理由】
（理由）
【おすすめ質問】
（言い換え例）

- 適切な情報収集・事実確認の場合：
1行目に [RESEARCH]
続いて：
【客観的事実・データ】
（Web検索で得た客観的な事実やデータのみを箇条書き。レポートのようなまとめ文や意見は絶対に入れない）
【自分で調べるべきキーワード】
（生徒が自分でググって確かめるべき単語を2〜3個、箇条書き）
【情報の確かめ方（問いかけ）】
（情報の信頼性・一次情報かどうかを生徒自身が検証するための問いかけを1〜2個）`;

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction: researchSystemInstruction,
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });

        const rawChunks =
          response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const sources: GroundSource[] = [];
        const seenUris = new Set<string>();
        for (const chunk of rawChunks) {
          const uri = chunk.web?.uri;
          const title = chunk.web?.title;
          if (uri && !seenUris.has(uri)) {
            seenUris.add(uri);
            sources.push({
              title: title || uri,
              uri,
            });
          }
        }

        const parsed = parseResearchText(response.text ?? '', sources);
        return res.json(parsed);
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction: BASE_SYSTEM_RULES,
          responseMimeType: 'application/json',
          responseSchema: COACH_RESPONSE_SCHEMA,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const jsonStr = (response.text ?? '{}').trim();
      const parsed = JSON.parse(jsonStr) as CoachResponse;
      return res.json(parsed);
    } catch (error) {
      console.error('Coach API Error:', error);
      const formatted = formatGeminiError(error);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Thinking Playground server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
