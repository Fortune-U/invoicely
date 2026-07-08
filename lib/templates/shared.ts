import type { InvoiceData, LineItem } from "../types";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function lineTotal(item: LineItem): number {
  return item.quantity * item.rate;
}

export function subtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function taxAmount(items: LineItem[], taxRate: number): number {
  return subtotal(items) * (taxRate / 100);
}

export function grandTotal(items: LineItem[], taxRate: number): number {
  return subtotal(items) + taxAmount(items, taxRate);
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function itemsRows(items: LineItem[], currency: string): string {
  return items
    .map(
      (item) => `
        <tr>
          <td class="desc">${escapeHtml(item.description || "—")}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${formatCurrency(item.rate, currency)}</td>
          <td class="num">${formatCurrency(lineTotal(item), currency)}</td>
        </tr>`
    )
    .join("");
}

export function totalsFor(invoice: InvoiceData) {
  return {
    subtotal: subtotal(invoice.items),
    tax: taxAmount(invoice.items, invoice.taxRate),
    total: grandTotal(invoice.items, invoice.taxRate),
  };
}
