import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getAnthropicApiKey, callAnthropic, extractText } from "../_shared/anthropic.ts";

interface SimplifiedJapanese {
  japanese: string;
  reading: string;
  explanation: string;
}

interface EnglishSuggestion {
  english: string;
  key_words: string[];
  japanese_note: string;
}

interface JapaneseSimplifyResponse {
  original: string;
  simplified: SimplifiedJapanese[];
}

interface EnglishConvertResponse {
  source: string;
  english_suggestions: EnglishSuggestion[];
}

interface RequestBody {
  action: 'japanese-simplify' | 'english-convert';
  input: string | string[];
  anthropicApiKey?: string;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const { action, input, anthropicApiKey: providedApiKey }: RequestBody = body;

    if (!action || !input) {
      return errorResponse("Action and input are required", 400);
    }

    const anthropicApiKey = providedApiKey || getAnthropicApiKey();
    if (!anthropicApiKey) {
      return errorResponse("ANTHROPIC_API_KEY not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === 'japanese-simplify') {
      systemPrompt = `You are a Japanese language expert specializing in plain language (やさしい日本語). When given a Japanese word or phrase, provide 3 alternative expressions using only simple, everyday Japanese that anyone (including children or non-native speakers) can understand. Avoid kanji-heavy, academic, or formal words.

For EACH input word/phrase, respond with a separate object in this exact JSON format:
{
  "original": "the original input",
  "simplified": [
    { "japanese": "simple expression 1", "reading": "hiragana reading", "explanation": "short explanation of nuance in Japanese" },
    { "japanese": "simple expression 2", "reading": "hiragana reading", "explanation": "short explanation of nuance in Japanese" },
    { "japanese": "simple expression 3", "reading": "hiragana reading", "explanation": "short explanation of nuance in Japanese" }
  ]
}

If multiple inputs are provided, return an array of such objects. ONLY respond with valid JSON, no additional text.`;

      const inputs = Array.isArray(input) ? input : [input];
      userPrompt = `以下の日本語を簡単な日本語に言い換えてください:\n${inputs.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`;
    } else if (action === 'english-convert') {
      systemPrompt = `You are a language expert. Convert the given Japanese phrase into 3 simple English expressions using ONLY common everyday words (A1-A2 vocabulary level). Avoid difficult, technical, or uncommon English words. Each suggestion must feel natural and be understood by anyone worldwide.

For EACH input phrase, respond with a separate object in this exact JSON format:
{
  "source": "the Japanese input",
  "english_suggestions": [
    { "english": "simple English phrase 1", "key_words": ["word1", "word2"], "japanese_note": "ニュアンスの説明" },
    { "english": "simple English phrase 2", "key_words": ["word1", "word2"], "japanese_note": "ニュアンスの説明" },
    { "english": "simple English phrase 3", "key_words": ["word1", "word2"], "japanese_note": "ニュアンスの説明" }
  ]
}

If multiple inputs are provided, return an array of such objects. ONLY respond with valid JSON, no additional text.`;

      const inputs = Array.isArray(input) ? input : [input];
      userPrompt = `以下の日本語を簡単な英語に変換してください:\n${inputs.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`;
    } else {
      return errorResponse("Invalid action. Must be 'japanese-simplify' or 'english-convert'", 400);
    }

    const response = await callAnthropic(anthropicApiKey, {
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    if (!response.ok) {
      const error = await response.text();
      return jsonResponse({ error: "Failed to get AI response", details: `Status: ${response.status}`, anthropicError: error }, 500);
    }

    const data = await response.json();
    const aiResponse = extractText(data);

    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch {
      return jsonResponse({ error: "Invalid JSON response from AI", raw: aiResponse }, 500);
    }

    const inputArray = Array.isArray(input) ? input : [input];
    const results = Array.isArray(parsedResponse) ? parsedResponse : [parsedResponse];

    if (inputArray.length === 1) {
      return jsonResponse(results[0]);
    } else {
      return jsonResponse(results);
    }
  } catch (error) {
    console.error("Error in simple-language-converter function:", error);
    return jsonResponse({ error: "Internal server error", details: error.message }, 500);
  }
});
