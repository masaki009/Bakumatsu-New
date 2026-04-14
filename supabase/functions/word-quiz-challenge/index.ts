import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  japanese: string;
  correctEnglish: string;
  userEnglish: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { japanese, correctEnglish, userEnglish }: RequestBody = await req.json();

    if (!japanese || !correctEnglish || !userEnglish) {
      return new Response(
        JSON.stringify({ error: "japanese, correctEnglish, userEnglish are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(
        JSON.stringify({ error: "Anthropic API error", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const feedback: string = data.content[0].text;

    return new Response(
      JSON.stringify({ feedback }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in word-quiz-challenge:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
