import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getAnthropicApiKey, callAnthropic } from "../_shared/anthropic.ts";

interface RequestBody {
  prompt: string;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { prompt }: RequestBody = await req.json();

    if (!prompt) {
      return errorResponse("Prompt is required", 400);
    }

    const anthropicApiKey = getAnthropicApiKey();
    if (!anthropicApiKey) {
      return errorResponse("ANTHROPIC_API_KEY not configured");
    }

    const response = await callAnthropic(anthropicApiKey, {
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Anthropic API error:", errorData);
      return errorResponse("Failed to generate advice", response.status);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Error:", error);
    return errorResponse(error.message);
  }
});
