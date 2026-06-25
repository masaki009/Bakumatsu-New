import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getAnthropicApiKey, callAnthropic, extractText } from "../_shared/anthropic.ts";

interface RequestBody {
  text: string;
  anthropicApiKey?: string;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { text, anthropicApiKey: providedApiKey }: RequestBody = body;

    if (!text) {
      return errorResponse("Text is required", 400);
    }

    const anthropicApiKey = providedApiKey || getAnthropicApiKey();
    if (!anthropicApiKey) {
      return errorResponse("ANTHROPIC_API_KEY not configured");
    }

    const systemPrompt = `You are a pronunciation expert. Convert the given English text into Japanese katakana pronunciation, word by word.
Output ONLY the katakana pronunciation with spaces between words. Do not include any other text, explanations, or commentary.

Example:
Input: "Hello world"
Output: "ハロー ワールド"

Input: "Good morning everyone"
Output: "グッド モーニング エブリワン"`;

    const userPrompt = `以下の英文を、単語ごとに日本語のカタカナ読み（音節読み）に変換してください。
カタカナ読み（音節読み）のみを単語間にスペースを入れて出力し、それ以外は何も出力しないでください。
テキスト：${text}`;

    const response = await callAnthropic(anthropicApiKey, {
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    if (!response.ok) {
      const error = await response.text();
      return jsonResponse({ error: "Failed to get AI response", details: `Status: ${response.status}`, anthropicError: error }, 500);
    }

    const data = await response.json();
    const katakana = extractText(data).trim();
    return jsonResponse({ katakana });
  } catch (error) {
    console.error("Error in katakana-converter function:", error);
    return jsonResponse({ error: "Internal server error", details: error.message }, 500);
  }
});
