import type { InvoiceData, TemplateId } from "../types";
import { minimalTemplate } from "./minimal";
import { modernTemplate } from "./modern";
import { boldTemplate } from "./bold";

export const TEMPLATES: Record<TemplateId, { label: string; render: (invoice: InvoiceData) => string }> = {
  minimal: { label: "Minimal", render: minimalTemplate },
  modern: { label: "Modern", render: modernTemplate },
  bold: { label: "Bold", render: boldTemplate },
};

export function renderTemplate(templateId: TemplateId, invoice: InvoiceData): string {
  return TEMPLATES[templateId].render(invoice);
}
