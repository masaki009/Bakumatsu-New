import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getAnthropicApiKey, callAnthropic, extractText } from "../_shared/anthropic.ts";

interface RequestBody {
  japanese: string;
  correctEnglish: string;
  userEnglish: string;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { japanese, correctEnglish, userEnglish }: RequestBody = await req.json();

    if (!japanese || !correctEnglish || !userEnglish) {
      return errorResponse("japanese, correctEnglish, userEnglish are required", 400);
    }

    const anthropicApiKey = getAnthropicApiKey();
    if (!anthropicApiKey) {
      return errorResponse("ANTHROPIC_API_KEY not configured");
    }

    const prompt = `あなたは英語教師です。生徒が書いた英文を以下の観点で日本語でフィードバックしてください。

【日本語原文】
${japanese}

【クイズの模範英文】
${correctEnglish}

【生徒が書いた英文】
${userEnglish}

フィードバックの形式：
1. **文法・語法の評価**：生徒の英文に文法的な誤りや改善点があれば具体的に指摘してください。正しければその旨を述べてください。
2. **意味・内容の評価**：日本語原文の意味を正確に伝えているか評価してください。
3. **模範英文との比較**：生徒の英文と模範英文を比べ、違いがある場合はどちらの表現がより自然・適切かを説明してください。
4. **総合コメント**：全体的な評価と励ましのコメントを1〜2文で。

フィードバックは丁寧かつ具体的に、200〜350字程度の日本語で書いてください。`;

    const response = await callAnthropic(anthropicApiKey, {
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    if (!response.ok) {
      const error = await response.text();
      return errorResponse(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const feedback: string = extractText(data);
    return jsonResponse({ feedback });
  } catch (error) {
    console.error("Error in word-quiz-challenge:", error);
    return errorResponse("Internal server error");
  }
});
