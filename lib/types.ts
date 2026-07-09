export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  notes: string;
  createdAt: number;
}

export interface BusinessProfile {
  businessName: string;
  email: string;
  address: string;
}

export type TemplateId = "minimal" | "modern" | "bold";

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currency: string;
  business: BusinessProfile;
  client: Pick<Client, "name" | "email" | "address">;
  items: LineItem[];
  taxRate: number;
  notes: string;
}

export type InvoiceSource = "manual" | "ai";

export interface SavedInvoice {
  id: string;
  title?: string;
  docType?: DocType;
  clientName: string;
  invoiceNumber: string;
  total: number;
  currency: string;
  dueDate: string;
  html: string;
  source: InvoiceSource;
  templateId?: TemplateId;
  createdAt: number;
}

export type AiProvider =
  | "pollinations"
  | "puter"
  | "anthropic"
  | "openai"
  | "gemini"
  | "grok"
  | "openrouter";

// Providers that need no API key (someone else foots the bill / runs the model).
export const KEYLESS_PROVIDERS: AiProvider[] = ["pollinations", "puter"];

export interface AiSettings {
  provider: AiProvider;
  apiKey: string;
  model: string;
}

export type DocType = "proposal" | "pricing" | "followup" | "invoice";

export interface DocTypeMeta {
  id: DocType;
  label: string;
  hint: string;
}

export const DOC_TYPES: DocTypeMeta[] = [
  { id: "proposal", label: "Proposal", hint: "Pitch scope, deliverables, phases & pricing" },
  { id: "pricing", label: "Pricing / Scope", hint: "Itemized phases, steps, status & cost" },
  { id: "followup", label: "Follow-up Summary", hint: "Consolidated status & outstanding balance" },
  { id: "invoice", label: "Invoice", hint: "Bill with line items and balance due" },
];

// Text pulled from a file the user uploaded as reference context.
export interface DocContext {
  name: string;
  text: string;
}

// A document generated during this session. Held in memory only — the app
// stores nothing; continuity comes from re-attaching exported files as context.
export interface SessionDoc {
  id: string;
  title: string;
  docType?: DocType;
  total: number;
  currency: string;
  html: string;
  source: InvoiceSource;
  createdAt: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
