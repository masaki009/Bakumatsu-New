import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getAnthropicApiKey, callAnthropic, extractText } from "../_shared/anthropic.ts";

interface RequestBody {
  genre: string;
  difficulty?: string;
}

interface ProcessResult {
  original: string;
  simplified: string;
  english: string;
  vocabulary: { word: string; directTranslation: string }[];
}

function buildPrompt(genre: string, difficulty: string): string {
  const levelGuide =
    difficulty === '初級'
      ? `
【難易度：初級（A1-A2）】
- 短くシンプルな日本語文（20文字以内）
- 日常的な基本語彙のみ使用（専門用語・硬い表現は避ける）
- 英文は現在形・現在進行形中心、8語以内`
      : difficulty === '上級'
      ? `
【難易度：上級（C1-C2）】
- 複雑で高度な日本語文（50文字以内）
- 専門用語・慣用表現・文語調・受動態・複文を積極的に使用
- 英文は複雑な文構造・上級語彙を使い15語以内`
      : `
【難易度：中級（B1-B2）】
- 中程度の難しさの日本語文（40文字以内）
- 硬めの表現・難読語・専門的な語彙を適度に使用
- 英文は過去・未来・助動詞なども使い15語以内`;

  return `あなたは英語学習のための日本語→英語変換練習コンテンツを生成するエンジンです。

ジャンル：${genre}
${levelGuide}

以下のJSONフォーマットで出力してください。他のテキストは一切含めないでください。

{
  "original": "（ジャンルに関連した日本語文。上記の難易度ガイドに厳密に従うこと）",
  "simplified": "（上記の文を中学生でも理解できる平易な日本語に言い換えた文。意味を省略せず、難しい言葉は別の表現にスライドすること）",
  "english": "（simplifiedの意味を省略せずそのまま翻訳した英文。上記の難易度の語数制限に従うこと）",
  "vocabulary": [
    { "word": "（originalに含まれる難しい単語・表現）", "directTranslation": "（その単語をそのまま辞書的に英訳した場合の例）" }
  ]
}

vocabularyには難易度に応じた数（初級:1〜2個、中級:2〜3個、上級:3〜4個）の単語・表現を含めてください。
JSONのみ出力し、コードブロックは使用しないでください。`;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { genre, difficulty = '中級' }: RequestBody = await req.json();

    const apiKey = getAnthropicApiKey();
    if (!apiKey) {
      return errorResponse("API key not configured");
    }

    const prompt = buildPrompt(genre, difficulty);

    const response = await callAnthropic(apiKey, {
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    if (!response.ok) {
      const err = await response.text();
      return errorResponse(`Anthropic API error: ${err}`);
    }

    const data = await response.json();
    const text = extractText(data).trim();

    let result: ProcessResult;
    try {
      result = JSON.parse(text);
    } catch {
      return jsonResponse({ error: "JSON parse error", raw: text }, 500);
    }

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(String(e));
  }
});
