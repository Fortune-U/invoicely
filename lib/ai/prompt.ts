import type { BusinessProfile, Client, DocType, DocContext } from "../types";

export interface PromptContext {
  profile: BusinessProfile;
  client: Client | null;
  docType: DocType;
  contexts: DocContext[];
}

const DOC_GUIDANCE: Record<DocType, string> = {
  proposal:
    "a PROJECT PROPOSAL: a persuasive but professional pitch. Include an intro/overview, scope of work broken into phases or steps, deliverables per phase, a timeline if implied, and a clear pricing table (phase → cost). End with next steps or terms.",
  pricing:
    "a PRICING & SCOPE BREAKDOWN: an itemized document listing the work involved. Group work into phases or feature areas. Where useful, use tables with columns like Item/Issue, Severity or Priority, Status, and Billing/Cost. Show per-phase costs and a grand total.",
  followup:
    "a FOLLOW-UP / STATUS SUMMARY: a consolidated engagement summary. Lead with an outstanding-balance table (Engagement, Total, Paid, Outstanding) and the total outstanding. Then break down each phase/engagement with its cost, amount paid, balance due, and a status table of what's done vs pending.",
  invoice:
    "an INVOICE: a bill with sender + client details, an invoice number and dates, a line-item table (description, qty, rate, amount), subtotal, tax, and total due.",
};

// Conversational mode: the assistant discusses, refines scope, and gathers details.
// Document generation happens separately when the user hits "Generate document".
export function buildChatSystemPrompt(ctx: PromptContext): string {
  const contextBlock =
    ctx.contexts.length > 0
      ? `\n\nAttached reference document(s) — treat their facts, figures, and history as the source of truth:\n\n${ctx.contexts
          .map((c) => `--- BEGIN "${c.name}" ---\n${c.text}\n--- END "${c.name}" ---`)
          .join("\n\n")}`
      : "";

  const profileLine = ctx.profile.businessName
    ? `The user's business: ${JSON.stringify(ctx.profile)}.`
    : "";
  const clientLine = ctx.client
    ? `Selected client/recipient: ${JSON.stringify({ name: ctx.client.name, email: ctx.client.email })}.`
    : "";

  return `You are a document consultant inside a browser document studio for freelancers and agencies. The user is preparing ${DOC_GUIDANCE[ctx.docType]}

Your job in this chat is to help them shape it: discuss scope, suggest phases and steps, help formulate fair prices, spot missing information, and summarize decisions. Be concise and concrete — short paragraphs or tight bullet lists, no fluff. Ask at most one focused question per reply when something essential is missing.

${profileLine} ${clientLine}

When the user has everything settled they will press "Generate document", so you never need to write the final document yourself in chat — just help them get its content right.${contextBlock}`;
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const senderKnown = ctx.profile.businessName
    ? `The sender's business profile is known: ${JSON.stringify(ctx.profile)}. Reuse it; don't ask for it.`
    : `No sender business profile is on file. If the user hasn't given their own business/sender name, treat it as missing.`;

  const clientKnown = ctx.client
    ? `A saved client/recipient is selected: ${JSON.stringify({
        name: ctx.client.name,
        email: ctx.client.email,
        address: ctx.client.address,
      })}. Reuse it; don't ask for details already here.`
    : `No saved client/recipient is selected. The recipient's name is usually required unless the user provides one.`;

  const contextBlock =
    ctx.contexts.length > 0
      ? `\n\nThe user has attached reference document(s). Use them as the source of truth for facts, figures, scope, prices, and history — prefer this content over guessing. Do not invent numbers that contradict it.\n\n${ctx.contexts
          .map((c) => `--- BEGIN "${c.name}" ---\n${c.text}\n--- END "${c.name}" ---`)
          .join("\n\n")}`
      : "";

  return `You are the document-generation engine inside a browser-only document studio for freelancers and small agencies. You turn a natural-language request (plus any attached reference documents) into a beautiful, print-ready document.

You must reply with ONLY a single JSON object (no prose, no markdown code fences) matching exactly one of these two shapes:

1. When required information is missing:
{"status":"needs_info","missingFields":["recipientName","..."],"message":"one short sentence asking for what's missing"}

2. When you have everything needed:
{"status":"ready","html":"<!DOCTYPE html>...full standalone document...","meta":{"title":"...","subtitle":"...","total":123.45,"currency":"NGN"}}

The document to produce this turn is ${DOC_GUIDANCE[ctx.docType]}

Rules:
- Never invent client names, specific scope items, or monetary amounts that were not provided by the user or present in the attached reference documents. If something essential is missing, use "needs_info".
- Invoice numbers, doc reference numbers, and dates may be generated sensibly if not specified (e.g. today's date).
- ${senderKnown}
- ${clientKnown}
- When status is "ready", "html" MUST be a COMPLETE standalone HTML document: <!DOCTYPE html>, <html>, a <head> with an inline <style> block (no external stylesheets, fonts, images, or scripts), and a <body>. Target ~800px content width, generous whitespace, clear typographic hierarchy, and clean tables with subtle borders/zebra rows. It should look like a polished professional document, not a web page.
- Respect the currency the user uses (e.g. ₦/NGN, $/USD). Format money consistently with thousands separators.
- Default palette unless the user asks otherwise: deep bordeaux #4a051c and granite #4e6766 for headings/bands, lobster #c1666b as accent, willow #a5c882 and jasmine #f7dd72 for highlights, on white. Keep it legible and professional.
- "meta.title" is the document's title; "meta.total" (a plain number) is the headline amount if the document has one (invoice total, outstanding balance, proposal total), else omit it.
- Output raw JSON only. No markdown fences, no text outside the JSON object.${contextBlock}`;
}
