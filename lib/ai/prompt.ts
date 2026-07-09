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

Your job in this chat is to help them shape it: discuss scope, suggest phases and steps, help formulate fair prices, spot missing information, and summarize decisions. Be concise and concrete — short paragraphs, tight bullet lists, or small GFM tables. Replies render as pure markdown: never use HTML tags (<br>, <b>, <table> …) — use markdown line breaks, bold, and tables instead. Ask at most one focused question per reply when something essential is missing.

When that focused question has a small set of likely answers, append at the VERY END of your reply a fenced code block tagged "question" containing JSON, exactly like:
\`\`\`question
{"question":"Which platforms should the MVP support?","options":["iOS only","Android only","iOS + Android","Web + mobile"]}
\`\`\`
Use 2–5 short options. The app renders this as clickable choices, so don't also list the options in your prose. Skip the block entirely for open-ended questions.

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

You must reply in exactly one of these two formats and nothing else:

1. When required information is missing — a single JSON object, no fences, no prose:
{"status":"needs_info","missingFields":["recipientName","..."],"message":"one short sentence asking for what's missing"}

2. When you have everything needed — TWO fenced blocks, first the metadata, then the document:
\`\`\`json
{"status":"ready","meta":{"title":"...","subtitle":"...","total":123.45,"currency":"NGN"}}
\`\`\`
\`\`\`html
<!DOCTYPE html>
... the full standalone document, written as normal multi-line HTML ...
\`\`\`
CRITICAL: never place the HTML inside a JSON string — it always goes in its own \`\`\`html fence as plain multi-line HTML. No text outside these blocks.

The document to produce this turn is ${DOC_GUIDANCE[ctx.docType]}

Rules:
- Never invent client names, specific scope items, or monetary amounts that were not provided by the user or present in the attached reference documents. If something essential is missing, use "needs_info".
- Invoice numbers, doc reference numbers, and dates may be generated sensibly if not specified (e.g. today's date).
- ${senderKnown}
- ${clientKnown}
- When status is "ready", the html fence MUST contain a COMPLETE standalone HTML document: <!DOCTYPE html>, <html>, <head>, <body> — no external stylesheets, fonts, images, or scripts. It must look like a polished, print-ready business document (an "artifact"), not a web page.
- In <head>, write EXACTLY this style tag — do NOT write out any CSS yourself, the app substitutes the real stylesheet for the placeholder:
<style>{{DESIGN_CSS}}</style>
(You may add ONE extra small <style> block after it only if the user asked for a different look.)
- The stylesheet you're building against defines these classes — use them; don't invent your own:
  .page (wrap everything in <div class="page">) · .doc-header with h1 + .subtitle + .date (centered title block) · hr.rule (section separator) · h2.section (section headings) · .kv-line with b and span.due (lines like "Cost: ₦1,000,000 | Paid: ₦500,000 | <span class='due'>Balance due: ₦500,000</span>") · table.grid for EVERY tabular listing (th are dark-headed; add class "num" to money/number cells, td.paid for amounts paid, td.owed for outstanding amounts, and finish summary tables with <tr class="total">) · .badge with modifier classes critical/high/medium/low (severity), done/pending (status), scope/chargeable (billing) · .callout (the headline figure — total due / outstanding / project total; .callout.ok for positive figures) · .note (small muted text).
- Respect the currency the user uses (e.g. ₦/NGN, $/USD). Format money consistently with thousands separators.
- If the user asks for a different colour mood, adjust the accent colours in your appended CSS, keeping the same structure and legibility.
- "meta.title" is the document's title; "meta.total" (a plain number) is the headline amount if the document has one (invoice total, outstanding balance, proposal total), else omit it.
- Output raw JSON only. No markdown fences, no text outside the JSON object.${contextBlock}`;
}
