import type { AiProvider, AiSettings, BusinessProfile } from "./types";

const PROFILE_KEY = "invoicely:profile";
const AI_SETTINGS_KEY = "invoicely:ai-settings";

export function loadProfile(): BusinessProfile {
  if (typeof window === "undefined") {
    return { businessName: "", email: "", address: "" };
  }
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return { businessName: "", email: "", address: "" };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") throw new Error("Invalid profile");
    const candidate = value as Record<string, unknown>;
    return {
      businessName: typeof candidate.businessName === "string" ? candidate.businessName : "",
      email: typeof candidate.email === "string" ? candidate.email : "",
      address: typeof candidate.address === "string" ? candidate.address : "",
    };
  } catch {
    return { businessName: "", email: "", address: "" };
  }
}

export function saveProfile(profile: BusinessProfile): void {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadAiSettings(): AiSettings | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AI_SETTINGS_KEY);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const candidate = value as Record<string, unknown>;
    const providers: AiProvider[] = [
      "pollinations", "puter", "anthropic", "openai", "gemini", "grok", "openrouter",
    ];
    if (
      !providers.includes(candidate.provider as AiProvider) ||
      typeof candidate.model !== "string" ||
      candidate.model.length === 0
    ) return null;
    return {
      provider: candidate.provider as AiProvider,
      model: candidate.model.slice(0, 120),
      // Credentials are deliberately session-only. Ignore keys left by older builds.
      apiKey: "",
    };
  } catch {
    return null;
  }
}

export function saveAiSettings(settings: AiSettings): void {
  window.localStorage.setItem(
    AI_SETTINGS_KEY,
    JSON.stringify({ provider: settings.provider, model: settings.model, apiKey: "" })
  );
}

export function clearAiSettings(): void {
  window.localStorage.removeItem(AI_SETTINGS_KEY);
}
