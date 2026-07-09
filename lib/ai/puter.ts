import type { ChatMessage } from "../types";

// Puter.js is a browser SDK ("user pays" model): free AI with no developer key.
// It must run client-side, so it bypasses our /api/generate relay entirely.
// Heavy usage may prompt the end user to sign in to a free Puter account —
// that dialog is handled by the SDK itself.

interface PuterAi {
  chat: (
    messages: { role: string; content: string }[],
    options: { model: string; max_tokens?: number }
  ) => Promise<unknown>;
}

declare global {
  interface Window {
    puter?: { ai: PuterAi };
  }
}

let loader: Promise<PuterAi> | null = null;

function loadPuter(): Promise<PuterAi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Puter can only run in the browser."));
  }
  if (window.puter?.ai) return Promise.resolve(window.puter.ai);
  if (!loader) {
    loader = new Promise<PuterAi>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.puter.com/v2/";
      script.async = true;
      script.onload = () => {
        if (window.puter?.ai) resolve(window.puter.ai);
        else reject(new Error("Puter loaded but its AI module is unavailable."));
      };
      script.onerror = () => {
        loader = null;
        reject(new Error("Couldn't load Puter. Check your connection or pick another provider."));
      };
      document.head.appendChild(script);
    });
  }
  return loader;
}

// Puter returns different shapes per underlying model — normalize to a string.
function extractText(result: unknown): string {
  if (typeof result === "string") return result;
  if (result && typeof result === "object") {
    const r = result as {
      message?: { content?: unknown };
      text?: unknown;
      toString?: () => string;
    };
    const content = r.message?.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      const joined = content
        .map((block) =>
          typeof block === "string" ? block : ((block as { text?: string })?.text ?? "")
        )
        .join("");
      if (joined) return joined;
    }
    if (typeof r.text === "string") return r.text;
  }
  throw new Error("Puter returned an unexpected response shape.");
}

export async function callPuter(
  messages: ChatMessage[],
  systemPrompt: string,
  model: string
): Promise<string> {
  const ai = await loadPuter();
  const result = await ai.chat(
    [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    { model: model || "gpt-4o-mini", max_tokens: 8000 }
  );
  return extractText(result);
}
