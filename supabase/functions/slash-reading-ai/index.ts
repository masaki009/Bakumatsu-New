import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const THEME_PROMPTS: Record<string, string> = {
  daily: "everyday life situations: commuting, home life, neighborhood interactions, small personal stories",
  travel: "travel experiences: airports, hotels, getting lost, meeting locals, discovering unexpected places",
  work: "workplace situations: meetings, emails, colleagues, office mishaps, professional challenges",
  food: "food and dining: restaurants, cooking, trying new foods, food markets, culinary discoveries",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { theme } = await req.json();

    if (!theme || !THEME_PROMPTS[theme]) {
      return new Response(
        JSON.stringify({ error: "Valid theme is required: daily, travel, work, or food" }),
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

    const themeDescription = THEME_PROMPTS[theme];

    const userPrompt = `Generate one English passage for slash reading practice on the theme: ${themeDescription}.

REQUIREMENTS:
- Write a short, engaging story or anecdote (2-4 sentences total)
- Split it into 8–12 meaningful phrase chunks suitable for slash reading
- Each chunk should be a natural phrase boundary (subject, verb phrase, prepositional phrase, etc.)
- Make it interesting and slightly humorous or surprising
- The total text should be 60–100 words

For each chunk, provide:
- "en": the English phrase chunk
- "ja": the natural Japanese translation of that chunk only

OUTPUT — respond with valid JSON only, no markdown fences:
{
  "chunks": [
    { "en": "English phrase chunk", "ja": "日本語訳チャンク" }
  ]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: `You are an English reading practice content generator for Japanese learners.
Generate natural, engaging passages split into phrase chunks suitable for slash reading practice.
Each chunk should be a meaningful phrase that can be understood independently.
Respond with valid JSON only, no markdown.`,
        messages: [{ role: "user", content: userPrompt }],
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
    let rawText: string = data.content[0].text;
    rawText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    const parsed = JSON.parse(rawText);

    if (!parsed.chunks || !Array.isArray(parsed.chunks) || parsed.chunks.length < 4) {
      return new Response(
        JSON.stringify({ error: "Invalid passage generated. Please retry." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ chunks: parsed.chunks }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in slash-reading-ai:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
