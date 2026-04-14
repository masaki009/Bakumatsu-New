import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  genres: string[];
  difficulty: string;
}

interface Question {
  japanese: string;
  blocks: string[];
  answer: string[];
  english: string;
  hint: string;
}

interface ApiResponse {
  questions: Question[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { genres, difficulty }: RequestBody = await req.json();

    if (!genres || genres.length === 0 || !difficulty) {
      return new Response(
        JSON.stringify({ error: "genres and difficulty are required" }),
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

    const genreList = genres.join(", ");

    const difficultyGuide =
      difficulty === "初級"
        ? "4–5 phrases, simple present or past tense"
        : difficulty === "中級"
        ? "5–6 phrases, includes time or place expressions"
        : "6–8 phrases, passive voice, relative clauses, or subordinate clauses";

    const userPrompt = `Generate 3 word-order quiz questions for genre: ${genreList}, difficulty: ${difficulty} (${difficultyGuide}).

GENERATION METHOD — follow this exact sequence for EVERY question:

STEP 1. Write one English sentence suitable for the genre and difficulty. Store it as "english".

STEP 2. Split "english" into ordered chunks (each chunk = one short English phrase or word). Number them 1, 2, 3, … in left-to-right order. These chunks must cover every word of the sentence with no gaps and no overlaps.

STEP 3. Translate EACH numbered English chunk into a Japanese chunk of equivalent meaning. Keep the translation tight — one English chunk = one Japanese chunk.
  english chunk 1 → japanese chunk 1
  english chunk 2 → japanese chunk 2
  …

STEP 4. "answer" = the Japanese chunks listed in the SAME ORDER as the numbered English chunks (i.e., english order).

STEP 5. Re-read "answer" left-to-right and verify it produces exactly "english" when translated chunk-by-chunk. If not, revise until it does.

STEP 6. Rearrange the Japanese chunks into natural Japanese sentence order to form "japanese" (the display sentence).

STEP 7. "blocks" = the Japanese chunks listed in the order they appear in "japanese" (Japanese sentence order). "blocks" and "answer" contain exactly the same chunks, just in different orders.

STEP 8. Write "hint" — one Japanese sentence explaining the key grammar point.

WORKED EXAMPLE:
english: "She went to the library after school yesterday"

English chunks (in order):
  1. She
  2. went to
  3. the library
  4. after school
  5. yesterday

Japanese translations (same order):
  1. She           → 彼女は
  2. went to       → 行きました
  3. the library   → 図書館に
  4. after school  → 放課後
  5. yesterday     → 昨日

answer (English order): ["彼女は", "行きました", "図書館に", "放課後", "昨日"]

Verification:
  彼女は=She, 行きました=went to, 図書館に=the library, 放課後=after school, 昨日=yesterday
  → "She went to the library after school yesterday" ✓ matches english

Natural Japanese order: 彼女は昨日放課後図書館に行きました
japanese: "彼女は昨日放課後図書館に行きました"
blocks (Japanese order): ["彼女は", "昨日", "放課後", "図書館に", "行きました"]

SECOND WORKED EXAMPLE:
english: "The meeting was held at the city hall last Monday"

English chunks:
  1. The meeting
  2. was held
  3. at the city hall
  4. last Monday

Japanese:
  1. The meeting      → 会議は
  2. was held         → 開催されました
  3. at the city hall → 市庁舎で
  4. last Monday      → 先週の月曜日に

answer: ["会議は", "開催されました", "市庁舎で", "先週の月曜日に"]

Verification:
  会議は=The meeting, 開催されました=was held, 市庁舎で=at the city hall, 先週の月曜日に=last Monday
  → "The meeting was held at the city hall last Monday" ✓

japanese: "会議は先週の月曜日に市庁舎で開催されました"
blocks: ["会議は", "先週の月曜日に", "市庁舎で", "開催されました"]

OUTPUT — respond with valid JSON only, no markdown fences:
{
  "questions": [
    {
      "japanese": "日本語文（ブロックを日本語の語順で並べたもの）",
      "blocks": ["日本語語順チャンク1", "チャンク2", "チャンク3"],
      "answer": ["英語語順チャンク1", "チャンク2", "チャンク3"],
      "english": "The English sentence.",
      "hint": "文法ポイント（日本語1文）"
    }
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
        max_tokens: 2048,
        system: `You are a Japanese language quiz generator.

INVARIANT RULE (never break this):
Reading "answer" left-to-right, chunk by chunk, must produce exactly the sentence in "english".
- answer[0] translates to the first word(s) of "english"
- answer[1] translates to the next word(s) of "english"
- … and so on until the full sentence is covered

Generate from English first, then derive Japanese chunks. Never reverse this order.
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

    const parsed: ApiResponse = JSON.parse(rawText);

    const validQuestions = parsed.questions.filter((q) => {
      if (!q.blocks || !q.answer) return false;
      if (q.blocks.length !== q.answer.length) return false;
      const sortedBlocks = [...q.blocks].sort();
      const sortedAnswer = [...q.answer].sort();
      return sortedBlocks.every((b, i) => b === sortedAnswer[i]);
    });

    if (validQuestions.length === 0) {
      return new Response(
        JSON.stringify({ error: "Generated questions had mismatched blocks/answer. Please retry." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ questions: validQuestions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in word-order-quiz:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
