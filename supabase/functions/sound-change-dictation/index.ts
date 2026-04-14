import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  level: string;
  type: string;
}

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  "初級": "Beginner — short sentences of 5–8 words with 1–2 clearly identifiable sound changes. Use simple, common vocabulary.",
  "中級": "Intermediate — medium sentences of 8–15 words with 3–5 sound changes. Use everyday conversational English.",
  "上級": "Advanced — longer sentences or natural dialogue of 15+ words with 5 or more sound changes. Use fast, natural connected speech.",
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  "脱落・弱化": "Reduction/Weakening — sounds that are dropped or reduced (gonna, kinda, wanna, 't' flapping/dropping, weak vowels like schwa, h-dropping in 'him/her/his', etc.)",
  "同化": "Assimilation — adjacent sounds influence each other and change (did you → didʒu, hit you → hitʃu, this year → thisʃir, got you → gotʃu, etc.)",
  "リンキング": "Linking — word boundaries disappear so the final consonant of one word links to the initial vowel of the next (pick it up → pickitup, an apple → anapple, take it → takedit, etc.)",
  "短縮形": "Contraction — two or more words fused into one reduced form (wanna=want to, gimme=give me, gonna=going to, dunno=don't know, lemme=let me, coulda=could have, etc.)",
  "ミックス": "Mix — multiple sound change types occur in a single sentence (e.g., reduction + linking + assimilation all together)",
};

const TOPIC_POOLS: string[] = [
  "daily conversation at home",
  "workplace or office talk",
  "ordering food at a restaurant",
  "shopping or bargaining",
  "phone call between friends",
  "sports and exercise",
  "travel and transportation",
  "school or university life",
  "watching movies or TV",
  "medical or health situations",
  "friendship or romance",
  "plans and invitations",
  "complaining or venting",
  "technology and gadgets",
  "cooking or food talk",
  "children or family life",
  "partying or socializing",
  "morning routine",
  "asking for directions",
  "giving advice to a friend",
];

function pickTopics(count: number): string[] {
  const shuffled = [...TOPIC_POOLS];
  const seed = Date.now();
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { level, type }: RequestBody = await req.json();

    if (!level || !type) {
      return new Response(
        JSON.stringify({ error: "level and type are required" }),
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

    const levelDesc = LEVEL_DESCRIPTIONS[level] || level;
    const typeDesc = TYPE_DESCRIPTIONS[type] || type;
    const topics = pickTopics(3);

    const prompt = `Generate 3 English dictation exercises for Japanese learners practicing connected speech sound changes.

Level: ${level} (${levelDesc})
Sound Change Type: ${type} (${typeDesc})

Use these 3 different topics (one per sentence):
1. ${topics[0]}
2. ${topics[1]}
3. ${topics[2]}

Requirements:
- Each sentence must be natural, authentic, everyday English
- Prefer real movie or TV drama lines when possible
- Each sentence MUST clearly demonstrate the specified sound change type
- Sentence length and difficulty MUST match the level
- All 3 sentences must use different vocabulary and contexts
- For ミックス: include at least 3 different sound change types per sentence

Return ONLY valid JSON with no markdown fences:
{
  "questions": [
    {
      "sentence": "The original English sentence exactly as written (standard spelling)",
      "translation": "自然な日本語訳",
      "soundChanges": [
        {
          "phrase": "original phrase as written (e.g. 'did you')",
          "phonetic": "カタカナ発音 (e.g. 'ディジュ')",
          "rule": "音変化ルールの日本語説明 (e.g. 'd+y→dʒ 同化')"
        }
      ],
      "explanation": "この文でつまずきやすいポイントを日本語で2〜4文で説明。なぜ聞き取りにくいか、どのルールに注意すべきかを具体的に書いてください。"
    }
  ]
}

Rules for soundChanges array:
- 初級: 1–2 sound change items
- 中級: 3–5 sound change items
- 上級: 5–8 sound change items
- Each item must reference a specific phrase from the sentence
- Return exactly 3 questions`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3500,
        temperature: 1,
        system: "You are an expert English phonetics teacher specializing in dictation exercises for Japanese learners. Generate authentic, varied dictation sentences that clearly demonstrate connected speech sound changes. Always respond with valid JSON only, no markdown fences.",
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
    let rawText: string = data.content[0].text;
    rawText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    const parsed = JSON.parse(rawText);

    return new Response(
      JSON.stringify(parsed),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
