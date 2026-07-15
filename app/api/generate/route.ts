import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";

// Stateless relay: the user's key travels with each request and is used once to
// call their chosen provider via the Vercel AI SDK. Nothing is stored or logged.
// Running server-side also removes every browser CORS problem.

const BodySchema = z.object({
  provider: z.enum(["pollinations", "anthropic", "openai", "gemini", "grok", "openrouter"]),
  apiKey: z.string().max(512).default(""),
  model: z.string().min(1).max(120),
  system: z.string().max(60_000),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(30_000),
    })
  ).max(80),
}).strict();

const MAX_BODY_BYTES = 350_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;
const REQUEST_TIMEOUT_MS = 90_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function clientId(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

function isRateLimited(request: Request): boolean {
  const now = Date.now();
  const id = clientId(request);
  const current = rateBuckets.get(id);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(id, { count: 1, resetAt: now + RATE_WINDOW_MS });
    if (rateBuckets.size > 5_000) {
      for (const [key, bucket] of rateBuckets) {
        if (bucket.resetAt <= now) rateBuckets.delete(key);
      }
    }
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

// text.pollinations.ai is IPv6-only in DNS; many networks (and some serverless
// runtimes) have no IPv6 route, so a plain fetch dies with ENOTFOUND. Fallback:
// resolve IPv4 edge IPs of the same Cloudflare zone via DNS-over-HTTPS (1.1.1.1
// is an IP literal — immune to local DNS) and connect to them with the correct
// SNI so the edge routes by hostname.
let ipCache: { ips: string[]; at: number } | null = null;

async function pollinationsIpv4(): Promise<string[]> {
  if (ipCache && Date.now() - ipCache.at < 5 * 60_000) return ipCache.ips;
  const res = await fetch(
    "https://1.1.1.1/dns-query?name=api.pollinations.ai&type=A",
    { headers: { accept: "application/dns-json" } }
  );
  const data = await res.json();
  const ips: string[] = (data?.Answer ?? [])
    .filter((a: { type: number }) => a.type === 1)
    .map((a: { data: string }) => a.data);
  if (ips.length) ipCache = { ips, at: Date.now() };
  return ips;
}

async function pollinationsFetch(body: string, signal: AbortSignal): Promise<Response> {
  const url = "https://text.pollinations.ai/openai";
  const init = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    signal,
  };
  try {
    return await fetch(url, init);
  } catch {
    const ips = await pollinationsIpv4();
    if (!ips.length) throw new Error("Free provider is unreachable right now.");
    const { Agent, fetch: ufetch } = await import("undici");
    const agent = new Agent({
      connect: {
        lookup: (_host, opts, cb) => {
          if (opts?.all) {
            (cb as (e: null, a: { address: string; family: number }[]) => void)(
              null,
              ips.map((address) => ({ address, family: 4 }))
            );
          } else {
            (cb as (e: null, a: string, f: number) => void)(null, ips[0], 4);
          }
        },
      },
    });
    return (await ufetch(url, {
      ...init,
      dispatcher: agent,
    })) as unknown as Response;
  }
}

async function callPollinations(
  system: string,
  messages: { role: string; content: string }[],
  model: string,
  signal: AbortSignal
): Promise<string> {
  const res = await pollinationsFetch(
    JSON.stringify({
      model: model || "openai",
      max_tokens: 8000,
      messages: [{ role: "system", content: system }, ...messages],
    }),
    signal
  );
  if (!res.ok) {
    throw new Error(
      `The community free provider is busy or down right now (${res.status}). Try again shortly — or switch to Google Gemini's free tier (free key at aistudio.google.com) in provider settings for dependable results.`
    );
  }
  const raw = await res.text();
  try {
    const data = JSON.parse(raw);
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text === "string") return text;
  } catch {
    // body was plain text
  }
  return raw;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Request body is too large." }, { status: 413 });
  }
  if (isRateLimited(request)) {
    return Response.json(
      { error: "Too many AI requests. Please wait a minute and try again." },
      { status: 429, headers: { "retry-after": "60" } }
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return Response.json({ error: "Request body is too large." }, { status: 413 });
    }
    body = BodySchema.parse(JSON.parse(raw));
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { provider, apiKey, model, system, messages } = body;
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  try {
    if (provider === "pollinations") {
      const text = await callPollinations(system, messages, model, signal);
      return Response.json({ text });
    }

    if (!apiKey) {
      return Response.json(
        { error: "This provider needs an API key — add one in provider settings." },
        { status: 400 }
      );
    }

    const languageModel =
      provider === "openai"
        ? createOpenAI({ apiKey })(model)
        : provider === "anthropic"
          ? createAnthropic({ apiKey })(model)
          : provider === "gemini"
            ? createGoogleGenerativeAI({ apiKey })(model)
            : provider === "grok"
              ? createOpenAICompatible({
                  name: "xai",
                  baseURL: "https://api.x.ai/v1",
                  apiKey,
                })(model)
              : createOpenAICompatible({
                  name: "openrouter",
                  baseURL: "https://openrouter.ai/api/v1",
                  apiKey,
                })(model);

    const { text } = await generateText({
      model: languageModel,
      system,
      messages,
      // Full HTML documents are long; a low default cap truncates them mid-tag.
      maxOutputTokens: 8192,
      abortSignal: signal,
    });

    return Response.json({ text });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return Response.json(
      {
        error: timedOut
          ? "The AI provider took too long to respond. Please try again."
          : "The AI provider request failed. Check your key and model name.",
      },
      { status: timedOut ? 504 : 502 }
    );
  }
}
