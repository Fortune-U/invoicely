import { z } from "zod";

const NeedsInfoSchema = z.object({
  status: z.literal("needs_info"),
  missingFields: z.array(z.string()),
  message: z.string(),
});

const ReadySchema = z.object({
  status: z.literal("ready"),
  html: z.string().min(1),
  meta: z
    .object({
      title: z.string(),
      subtitle: z.string().optional(),
      total: z.number().optional(),
      currency: z.string().optional(),
    })
    .passthrough(),
});

const AiResponseSchema = z.union([NeedsInfoSchema, ReadySchema]);

export type AiResponse = z.infer<typeof AiResponseSchema>;

export class AiResponseParseError extends Error {
  raw: string;
  constructor(raw: string) {
    super("The AI response wasn't in the expected format. Try rephrasing your request.");
    this.raw = raw;
  }
}

function extractJsonCandidate(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : raw;

  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    return body.trim();
  }
  return body.slice(start, end + 1);
}

export function parseAiResponse(raw: string): AiResponse {
  const candidate = extractJsonCandidate(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new AiResponseParseError(raw);
  }

  const result = AiResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new AiResponseParseError(raw);
  }
  return result.data;
}
