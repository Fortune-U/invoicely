import type { AiSettings, BusinessProfile } from "./types";

const PROFILE_KEY = "invoicely:profile";
const AI_SETTINGS_KEY = "invoicely:ai-settings";

export function loadProfile(): BusinessProfile {
  if (typeof window === "undefined") {
    return { businessName: "", email: "", address: "" };
  }
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return { businessName: "", email: "", address: "" };
  try {
    return JSON.parse(raw) as BusinessProfile;
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
    return JSON.parse(raw) as AiSettings;
  } catch {
    return null;
  }
}

export function saveAiSettings(settings: AiSettings): void {
  window.localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

export function clearAiSettings(): void {
  window.localStorage.removeItem(AI_SETTINGS_KEY);
}
