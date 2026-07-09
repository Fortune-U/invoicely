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
  apiKey: z.string().default(""),
  model: z.string().min(1),
  system: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
});

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

async function pollinationsFetch(body: string): Promise<Response> {
  const url = "https://text.pollinations.ai/openai";
  const init = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
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
  model: string
): Promise<string> {
  const res = await pollinationsFetch(
    JSON.stringify({
      model: model || "openai",
      max_tokens: 8000,
      messages: [{ role: "system", content: system }, ...messages],
    })
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
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { provider, apiKey, model, system, messages } = body;

  try {
    if (provider === "pollinations") {
      const text = await callPollinations(system, messages, model);
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
    });

    return Response.json({ text });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "The AI provider request failed. Check your key and model name.";
    return Response.json({ error: message }, { status: 502 });
  }
}
