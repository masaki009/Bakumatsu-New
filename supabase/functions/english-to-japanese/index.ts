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

    if (!text || typeof text !== 'string') {
      return errorResponse("Text is required and must be a string", 400);
    }

    const anthropicApiKey = providedApiKey || getAnthropicApiKey();
    if (!anthropicApiKey) {
      return errorResponse("ANTHROPIC_API_KEY not configured");
    }

    const systemPrompt = "あなたは英語から日本語への翻訳の専門家です。与えられた英文を自然な日本語に翻訳してください。翻訳結果のみを返してください。説明や追加情報は不要です。";

    const response = await callAnthropic(anthropicApiKey, {
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: `以下の英文を日本語に翻訳してください:\n\n${text}` }],
    });

    if (!response.ok) {
      const error = await response.text();
      return jsonResponse({ error: "Failed to get AI response", details: `Status: ${response.status}`, anthropicError: error }, 500);
    }

    const data = await response.json();
    const translation = extractText(data);
    return jsonResponse({ translation });
  } catch (error) {
    console.error("Error in english-to-japanese function:", error);
    return jsonResponse({ error: "Internal server error", details: error.message }, 500);
  }
});
