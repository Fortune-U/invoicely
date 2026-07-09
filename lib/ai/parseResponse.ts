import { z } from "zod";
import { injectDesignCss } from "./docCss";

const NeedsInfoSchema = z.object({
  status: z.literal("needs_info"),
  missingFields: z.array(z.string()),
  message: z.string(),
});

// html is optional in the JSON: the preferred protocol delivers the document in
// a separate ```html fence (JSON-embedded HTML breeds escaping bugs — literal \n
// artifacts in the preview). Legacy inline html is still accepted.
const ReadySchema = z.object({
  status: z.literal("ready"),
  html: z.string().min(1).optional(),
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

// Public type: by the time a "ready" response leaves this module it ALWAYS has html.
export type AiResponse =
  | z.infer<typeof NeedsInfoSchema>
  | (Omit<z.infer<typeof ReadySchema>, "html"> & { html: string });

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

// Models routinely emit literal newlines/tabs inside JSON string values (invalid
// JSON, common when the value is a whole HTML document). Walk the string and
// escape control characters that occur inside string literals.
function repairControlChars(candidate: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of candidate) {
    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        continue;
      }
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r") { out += "\\r"; continue; }
      if (ch === "\t") { out += "\\t"; continue; }
      out += ch;
      continue;
    }
    if (ch === '"') inString = true;
    out += ch;
  }
  return out;
}

// When HTML is sliced out of a raw (failed-JSON) response it may still carry
// JSON-string escape artifacts — the literal \n, \", \t sequences users see as
// text in the preview. Decode them.
function unescapeJsonArtifacts(html: string): string {
  if (!/\\[n"tr\\/]/.test(html)) return html;
  return html
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\(["\\/nrt])/g, (_, ch: string) =>
      ch === "n" ? "\n" : ch === "r" ? "\r" : ch === "t" ? "\t" : ch
    );
}

function extractHtmlFence(raw: string): string | null {
  const match = raw.match(/```html\s*([\s\S]*?)```/i);
  if (match) return match[1].trim();
  // Unterminated fence — the model hit its output limit mid-document. Take
  // everything after the opening fence so the user still gets the document.
  const open = raw.match(/```html\s*/i);
  if (open && open.index !== undefined) {
    const rest = raw.slice(open.index + open[0].length).trim();
    return rest.length > 0 ? rest : null;
  }
  return null;
}

function titleOf(html: string): string {
  return html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || "Generated document";
}

// Last resort: the model ignored the protocol and replied with a bare HTML
// document. Salvage it so the user still gets their document.
function salvageHtml(raw: string): Extract<AiResponse, { status: "ready" }> | null {
  const start = raw.search(/<!doctype html|<html[\s>]/i);
  if (start === -1) return null;
  const endMatch = raw.match(/<\/html>/i);
  const sliced = endMatch
    ? raw.slice(start, raw.indexOf(endMatch[0]) + endMatch[0].length)
    : raw.slice(start);
  const html = unescapeJsonArtifacts(sliced);
  return {
    status: "ready",
    html,
    meta: { title: titleOf(html) },
  };
}

export function parseAiResponse(raw: string): AiResponse {
  // Preferred protocol: the document arrives in its own ```html fence.
  const fencedHtml = extractHtmlFence(raw);

  // Parse the JSON part (metadata, or a needs_info reply) from everything
  // before the html fence (works whether or not the fence was terminated).
  const htmlFenceStart = raw.search(/```html/i);
  const jsonSource = htmlFenceStart === -1 ? raw : raw.slice(0, htmlFenceStart);
  const candidate = extractJsonCandidate(jsonSource);

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    try {
      parsed = JSON.parse(repairControlChars(candidate));
    } catch {
      parsed = null;
    }
  }

  const result = parsed === null ? null : AiResponseSchema.safeParse(parsed);

  if (result?.success) {
    const data = result.data;
    if (data.status === "needs_info") return data;

    const html = data.html ? unescapeJsonArtifacts(data.html) : fencedHtml;
    if (html) return { status: "ready", html: injectDesignCss(html), meta: data.meta };

    // "ready" but no document anywhere — treat as a broken reply.
    throw new AiResponseParseError(raw);
  }

  // No usable JSON: a fenced or bare HTML document alone is still a success.
  if (fencedHtml) {
    const html = injectDesignCss(fencedHtml);
    return { status: "ready", html, meta: { title: titleOf(html) } };
  }
  const salvaged = salvageHtml(raw);
  if (salvaged) return { ...salvaged, html: injectDesignCss(salvaged.html) };
  throw new AiResponseParseError(raw);
}
