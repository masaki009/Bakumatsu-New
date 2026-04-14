import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { action, input, anthropicApiKey: providedApiKey }: RequestBody = body;

    if (!action || !input) {
      return new Response(
        JSON.stringify({ error: "Action and input are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const anthropicApiKey = providedApiKey || Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
      return new Response(
        JSON.stringify({ error: "Invalid action. Must be 'japanese-simplify' or 'english-convert'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error status:", response.status);
      console.error("Anthropic API error body:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to get AI response",
          details: `Status: ${response.status}`,
          anthropicError: error
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", aiResponse);
      return new Response(
        JSON.stringify({ error: "Invalid JSON response from AI", raw: aiResponse }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const inputArray = Array.isArray(input) ? input : [input];
    const results = Array.isArray(parsedResponse) ? parsedResponse : [parsedResponse];

    if (inputArray.length === 1) {
      return new Response(
        JSON.stringify(results[0]),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify(results),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in simple-language-converter function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
