import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getAnthropicApiKey, callAnthropic, extractText } from "../_shared/anthropic.ts";

interface RequestBody {
  genre: string;
}

interface ProcessResult {
  original: string;
  simplified: string;
  english: string;
  vocabulary: { word: string; directTranslation: string }[];
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { genre }: RequestBody = await req.json();

    const apiKey = getAnthropicApiKey();
    if (!apiKey) {
      return errorResponse("API key not configured");
    }

    const prompt = `あなたは英語学習のための日本語→英語変換練習コンテンツを生成するエンジンです。

ジャンル：${genre}

以下のJSONフォーマットで出力してください。他のテキストは一切含めないでください。

{
  "original": "（ジャンルに関連した、難しい表現・硬めの言い回しを使った40文字以内の日本語文。体言止め、文語調、難読語、専門的な表現を積極的に使うこと）",
  "simplified": "（上記の文を中学生でも理解できる平易な日本語に言い換えた文。意味を省略せず、難しい言葉は別の表現にスライドすること）",
  "english": "（simplifiedの意味を省略せずそのまま翻訳した英文。15words以内）",
  "vocabulary": [
    { "word": "（originalに含まれる難しい単語・表現）", "directTranslation": "（その単語をそのまま辞書的に英訳した場合の例）" }
  ]
}

vocabularyには2〜4個の難しい単語・表現を含めてください。
JSONのみ出力し、コードブロックは使用しないでください。`;

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
