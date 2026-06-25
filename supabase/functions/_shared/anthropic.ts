export const CLAUDE_MODEL = "claude-sonnet-4-6";

export function getAnthropicApiKey(): string | null {
  return Deno.env.get("ANTHROPIC_API_KEY") ?? null;
}

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnthropicCallOptions {
  model?: string;
  max_tokens?: number;
  system?: string;
  messages: AnthropicMessage[];
  temperature?: number;
}

export async function callAnthropic(
  apiKey: string,
  options: AnthropicCallOptions
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: options.model ?? CLAUDE_MODEL,
    max_tokens: options.max_tokens ?? 1024,
    messages: options.messages,
  };
  if (options.system !== undefined) body.system = options.system;
  if (options.temperature !== undefined) body.temperature = options.temperature;

  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
}

export function extractText(data: { content: { text: string }[] }): string {
  return data.content[0].text;
}

export function parseJsonText(text: string): unknown {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}
