import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getAnthropicApiKey, callAnthropic, extractText } from "../_shared/anthropic.ts";

const THEME_PROMPTS: Record<string, string> = {
  daily: "everyday life situations: commuting, home life, neighborhood interactions, small personal stories",
  travel: "travel experiences: airports, hotels, getting lost, meeting locals, discovering unexpected places",
  work: "workplace situations: meetings, emails, colleagues, office mishaps, professional challenges",
  food: "food and dining: restaurants, cooking, trying new foods, food markets, culinary discoveries",
};

const DIFFICULTY_CONFIG: Record<string, { words: string; level: string; chunks: string }> = {
  '初級': {
    words: '25–35',
    level: 'simple vocabulary and grammar for A1-A2 beginners. Use only common everyday words, short simple sentences, present tense or simple past tense.',
    chunks: '5–8',
  },
  '中級': {
    words: '35–45',
    level: 'intermediate vocabulary and grammar for B1-B2 learners. Use moderately complex sentences, varied tenses, and some idiomatic expressions.',
    chunks: '7–10',
  },
  '上級': {
    words: '45–55',
    level: 'advanced vocabulary and grammar for C1-C2 learners. Use complex sentence structures, nuanced vocabulary, and varied clause types.',
    chunks: '8–12',
  },
};

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { theme, difficulty = '中級' } = await req.json();

    if (!theme || !THEME_PROMPTS[theme]) {
      return errorResponse("Valid theme is required: daily, travel, work, or food", 400);
    }

    const anthropicApiKey = getAnthropicApiKey();
    if (!anthropicApiKey) {
      return errorResponse("ANTHROPIC_API_KEY not configured");
    }

    const themeDescription = THEME_PROMPTS[theme];
    const diffConfig = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG['中級'];

    const userPrompt = `Generate one English passage for slash reading practice on the theme: ${themeDescription}.

DIFFICULTY: ${difficulty}
Language level: ${diffConfig.level}
Target total word count: ${diffConfig.words} words
Number of chunks: ${diffConfig.chunks}

REQUIREMENTS:
- Write a short, engaging story or anecdote (2–4 sentences)
- Split it into ${diffConfig.chunks} meaningful phrase chunks suitable for slash reading
- Each chunk should be a natural phrase boundary (subject, verb phrase, prepositional phrase, clause, etc.)
- Make it interesting and slightly humorous or surprising
- Strictly keep total word count within ${diffConfig.words} words

For each chunk, provide:
- "en": the English phrase chunk
- "ja": the natural Japanese translation of that chunk only

OUTPUT — respond with valid JSON only, no markdown fences:
{
  "chunks": [
    { "en": "English phrase chunk", "ja": "日本語訳チャンク" }
  ]
}`;

    const response = await callAnthropic(anthropicApiKey, {
      max_tokens: 1024,
      system: `You are an English reading practice content generator for Japanese learners.
Generate natural, engaging passages split into phrase chunks suitable for slash reading practice.
Follow the difficulty level instructions precisely for vocabulary complexity and sentence length.
Respond with valid JSON only, no markdown.`,
      messages: [{ role: "user", content: userPrompt }],
    });

    if (!response.ok) {
      const error = await response.text();
      return errorResponse(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    let rawText: string = extractText(data);
    rawText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    const parsed = JSON.parse(rawText);

    if (!parsed.chunks || !Array.isArray(parsed.chunks) || parsed.chunks.length < 4) {
      return errorResponse("Invalid passage generated. Please retry.");
    }

    return jsonResponse({ chunks: parsed.chunks });
  } catch (error) {
    console.error("Error in slash-reading-ai:", error);
    return errorResponse("Internal server error");
  }
});
