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
  provider: z.enum(["pollinations", "anthropic", "openai", "gemini", "openrouter"]),
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

async function callPollinations(
  system: string,
  messages: { role: string; content: string }[],
  model: string
): Promise<string> {
  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: model || "openai",
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) {
    throw new Error(`Free provider error (${res.status}). It may be rate-limited — try again shortly or add your own API key.`);
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
            : createOpenAICompatible({
                name: "openrouter",
                baseURL: "https://openrouter.ai/api/v1",
                apiKey,
              })(model);

    const { text } = await generateText({
      model: languageModel,
      system,
      messages,
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
