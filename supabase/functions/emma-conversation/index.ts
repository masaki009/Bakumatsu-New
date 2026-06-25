import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getAnthropicApiKey, callAnthropic, extractText } from "../_shared/anthropic.ts";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: Message[];
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const apiKey = getAnthropicApiKey();
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set in Supabase Edge Function secrets");
    }

    const { messages }: RequestBody = await req.json();

    const response = await callAnthropic(apiKey, {
      max_tokens: 1024,
      system: "You are Emma, a friendly and encouraging English conversation tutor. Keep responses concise (2-3 sentences max). Speak naturally. Gently correct grammar mistakes. Always end with a follow-up question to keep the conversation going.",
      messages: messages,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Error:", error);
    return errorResponse(error instanceof Error ? error.message : "Unknown error occurred");
  }
});
