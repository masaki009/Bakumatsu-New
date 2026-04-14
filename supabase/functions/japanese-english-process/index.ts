import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { genre }: RequestBody = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: "Anthropic API error", details: err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.content[0].text.trim();

    let result: ProcessResult;
    try {
      result = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: "JSON parse error", raw: text }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
