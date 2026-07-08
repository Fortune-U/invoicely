import type { AiProvider, ChatMessage } from "../types";

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  pollinations: "openai",
  anthropic: "claude-sonnet-5",
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  openrouter: "openai/gpt-4o-mini",
};

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  pollinations: "Free — no key needed",
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
};

// All provider calls go through our stateless route handler (app/api/generate),
// which relays the user's key to the provider via the Vercel AI SDK. Server-side
// calls avoid every browser CORS restriction; the key is never stored.
export async function callProvider(
  provider: AiProvider,
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, apiKey, model, system: systemPrompt, messages }),
    });
  } catch {
    throw new Error("Couldn't reach the app server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed with status ${res.status}.`);
  }
  if (typeof data?.text !== "string") {
    throw new Error("The AI provider returned an unexpected response.");
  }
  return data.text;
}
