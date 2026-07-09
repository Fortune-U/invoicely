import type { AiProvider, ChatMessage } from "../types";
import { callPuter } from "./puter";

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  pollinations: "openai",
  puter: "gpt-4o-mini",
  anthropic: "claude-sonnet-5",
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  grok: "grok-3-mini",
  openrouter: "openai/gpt-4o-mini",
};

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  pollinations: "Community free — no key (can be busy)",
  puter: "Puter — free, no key",
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI",
  gemini: "Google Gemini — free tier",
  grok: "xAI Grok",
  openrouter: "OpenRouter — has free models",
};

// Curated per-provider model choices for the settings dropdown. Kept short and
// current; the UI offers a "Custom…" option for anything not listed yet.
export const PROVIDER_MODELS: Record<AiProvider, { id: string; label: string }[]> = {
  puter: [
    { id: "gpt-4o-mini", label: "GPT-4o mini (fast)" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "claude-sonnet-4", label: "Claude Sonnet 4" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { id: "deepseek-chat", label: "DeepSeek Chat" },
  ],
  pollinations: [
    { id: "openai", label: "OpenAI (default)" },
    { id: "openai-large", label: "OpenAI large" },
    { id: "mistral", label: "Mistral" },
  ],
  anthropic: [
    { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
    { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (fast)" },
  ],
  openai: [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o mini (fast)" },
    { id: "gpt-4.1", label: "GPT-4.1" },
    { id: "o3-mini", label: "o3-mini (reasoning)" },
  ],
  gemini: [
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (free tier)" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  ],
  grok: [
    { id: "grok-3-mini", label: "Grok 3 mini (fast)" },
    { id: "grok-3", label: "Grok 3" },
    { id: "grok-4", label: "Grok 4" },
  ],
  openrouter: [
    { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (free)" },
    { id: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3 (free)" },
    { id: "openai/gpt-4o-mini", label: "GPT-4o mini" },
    { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
    { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
  ],
};

// Shown under the provider picker so users know the cheapest reliable path.
export const PROVIDER_HINTS: Partial<Record<AiProvider, string>> = {
  pollinations:
    "A shared community service with no key. It's often rate-limited or down — fine for trying things out, not for dependable use.",
  puter:
    "Free GPT/Claude/Gemini access with no key via Puter's \"user pays\" model. Heavier use may ask you to sign in to a free Puter account (the prompt comes from Puter itself).",
  gemini:
    "Google's free tier is generous and reliable. Get a free key at aistudio.google.com — no card needed.",
  grok:
    "xAI's Grok models. Get an API key at console.x.ai.",
  openrouter:
    "Free models are available (pick a model ending in \":free\", e.g. meta-llama/llama-3.3-70b-instruct:free). Free key at openrouter.ai.",
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
  // Puter is a browser SDK, not an HTTP API — it never touches the relay.
  if (provider === "puter") {
    return callPuter(messages, systemPrompt, model);
  }

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
