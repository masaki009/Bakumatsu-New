import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getAnthropicApiKey, callAnthropic, extractText } from "../_shared/anthropic.ts";

interface RequestBody {
  type: string;
  usedSentences?: string[];
}

const TOPIC_POOLS: string[] = [
  "daily conversation at home",
  "workplace or office talk",
  "ordering food at a restaurant",
  "shopping or bargaining",
  "phone call or texting",
  "sports and exercise",
  "travel and transportation",
  "school or university life",
  "watching movies or TV",
  "medical or health situations",
  "friendship or romance",
  "arguments or apologies",
  "plans and invitations",
  "complaining or venting",
  "news and current events",
  "technology and gadgets",
  "cooking or food talk",
  "children or family life",
  "partying or socializing",
  "crime or mystery drama",
];

function pickTopics(seed: number, count: number): string[] {
  const shuffled = [...TOPIC_POOLS];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { type, usedSentences = [] }: RequestBody = await req.json();

    if (!type) {
      return errorResponse("type is required", 400);
    }

    const anthropicApiKey = getAnthropicApiKey();
    if (!anthropicApiKey) {
      return errorResponse("ANTHROPIC_API_KEY not configured");
    }

    const typeDescriptions: Record<string, string> = {
      "脱落・弱化": "Reduction/Weakening — sounds that are dropped or reduced (gonna, kinda, wanna, 't' dropping, weak vowels, etc.)",
      "同化": "Assimilation — adjacent sounds influence each other (did you → didʒu, hit you → hitʃu, this year → thisʃir, etc.)",
      "リンキング": "Linking — word boundaries merge so the last sound of one word links to the first of the next (an apple → ananple, pick it up → pickitup, etc.)",
      "短縮形": "Contraction — multiple words reduced to one (wanna=want to, gimme=give me, gonna=going to, dunno=don't know, etc.)",
      "ランダム": "Mix — a combination of multiple sound change types (reduction, assimilation, linking, and contraction) in one sentence",
    };

    const typeDescription = typeDescriptions[type] || type;

    const seed = Date.now();
    const topics = pickTopics(seed, 3);

    const avoidSection = usedSentences.length > 0
      ? `\nAVOID these sentences (already used — do NOT reuse or closely paraphrase them):\n${usedSentences.slice(-30).map((s, i) => `${i + 1}. ${s}`).join("\n")}\n`
      : "";

    const topicSection = `\nEach of the 3 examples should be set in a DIFFERENT context. Use these 3 topics as loose inspiration (one per example):\n1. ${topics[0]}\n2. ${topics[1]}\n3. ${topics[2]}\n`;

    const prompt = `Generate 3 English example sentences demonstrating the following sound change type: ${type} (${typeDescription}).
${avoidSection}${topicSection}
Rules:
- Prefer real movie or TV drama dialogue whenever possible. If you know the exact source, name it.
- Each sentence should clearly illustrate the specified sound change.
- For ランダム, include at least 2 different sound change types per sentence.
- Make the sentences varied in length, register (formal/casual), and speaker situation.
- Do NOT repeat vocabulary or phrasing patterns across the 3 examples.

Return ONLY valid JSON with no markdown fences:
{
  "examples": [
    {
      "type": "${type}",
      "sentence": "The original English sentence as written",
      "spokenForm": "How it actually sounds when spoken naturally (show reduced/linked/assimilated forms in romaji or katakana hints inline)",
      "source": "Movie or drama title, or null if unknown",
      "translation": "日本語訳",
      "chunks": [
        {
          "original": "the original phrase (e.g., 'did you')",
          "phonetic": "カタカナ発音 (e.g., 'ディジュ')",
          "rule": "音変化の説明 (e.g., 'd+y→dʒ（ジュ音）')"
        }
      ],
      "miniLecture": "この音変化タイプについての日本語ミニレクチャー（3〜5文）。リスニングへの応用を含めて説明してください。"
    }
  ]
}

Important:
- chunks should contain 2–4 specific phrases from the sentence that demonstrate the sound change.
- miniLecture should be the same for all 3 examples (explaining the overall type), but sentence-specific chunks should reflect each sentence.
- Return exactly 3 examples.`;

    const response = await callAnthropic(anthropicApiKey, {
      max_tokens: 3000,
      temperature: 1,
      system: "You are an expert English phonetics and pronunciation teacher specializing in connected speech and sound changes. Generate authentic, highly varied examples from real media when possible. Never repeat examples from previous sessions. Respond with valid JSON only, no markdown.",
      messages: [{ role: "user", content: prompt }],
    });

    if (!response.ok) {
      const error = await response.text();
      return errorResponse(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    let rawText: string = extractText(data);
    rawText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    const parsed = JSON.parse(rawText);
    return jsonResponse(parsed);
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Internal server error");
  }
});
