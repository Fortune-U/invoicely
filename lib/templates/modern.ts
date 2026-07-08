import type { InvoiceData } from "../types";
import { escapeHtml, formatCurrency, itemsRows, totalsFor } from "./shared";

export function modernTemplate(invoice: InvoiceData): string {
  const { subtotal, tax, total } = totalsFor(invoice);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Helvetica, Arial, sans-serif;
    color: #2a2a2a;
    background: #ffffff;
  }
  .sheet { width: 800px; margin: 0 auto; }
  .band {
    background: #4a051c;
    color: #f7dd72;
    padding: 40px 56px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .band .brand { font-size: 20px; font-weight: 700; color: #ffffff; }
  .band .brand-meta { font-size: 12px; color: #e8c9c9; margin-top: 6px; line-height: 1.6; }
  .band h1 { margin: 0; font-size: 26px; letter-spacing: 3px; text-align: right; }
  .band .num { text-align: right; font-size: 12px; color: #f7dd72; margin-top: 4px; }
  .body-pad { padding: 40px 56px; }
  .meta-grid { display: flex; justify-content: space-between; margin-bottom: 28px; }
  .meta-grid h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a5c882; margin: 0 0 6px; }
  .muted { color: #55605e; font-size: 13px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #4e6766; color: #ffffff; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 8px; }
  td { padding: 12px 8px; border-bottom: 1px solid #eef1f0; font-size: 13px; }
  .col-num { text-align: right; }
  tbody tr:nth-child(even) { background: #f7faf6; }
  .totals { width: 260px; margin-left: auto; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals .grand { background: #a5c882; color: #21331b; margin-top: 8px; padding: 12px 10px; border-radius: 4px; font-size: 16px; font-weight: 700; }
  .notes { margin-top: 36px; font-size: 12px; color: #6b7674; border-top: 1px solid #eef1f0; padding-top: 16px; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="band">
      <div>
        <div class="brand">${escapeHtml(invoice.business.businessName || "Your Business")}</div>
        <div class="brand-meta">${escapeHtml(invoice.business.email)}<br/>${escapeHtml(invoice.business.address)}</div>
      </div>
      <div>
        <h1>INVOICE</h1>
        <div class="num">${escapeHtml(invoice.invoiceNumber)}</div>
      </div>
    </div>

    <div class="body-pad">
      <div class="meta-grid">
        <div>
          <h3>Bill To</h3>
          <div class="muted">
            ${escapeHtml(invoice.client.name || "Client name")}<br/>
            ${escapeHtml(invoice.client.email)}<br/>
            ${escapeHtml(invoice.client.address)}
          </div>
        </div>
        <div>
          <h3>Date</h3>
          <div class="muted">${escapeHtml(invoice.date)}</div>
          <h3 style="margin-top:12px;">Due</h3>
          <div class="muted">${escapeHtml(invoice.dueDate)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="col-num">Qty</th>
            <th class="col-num">Rate</th>
            <th class="col-num">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows(invoice.items, invoice.currency).replace(/class="num"/g, 'class="col-num"')}
        </tbody>
      </table>

      <div class="totals">
        <div><span>Subtotal</span><span>${formatCurrency(subtotal, invoice.currency)}</span></div>
        <div><span>Tax (${invoice.taxRate}%)</span><span>${formatCurrency(tax, invoice.currency)}</span></div>
        <div class="grand"><span>Total</span><span>${formatCurrency(total, invoice.currency)}</span></div>
      </div>

      ${invoice.notes ? `<div class="notes">${escapeHtml(invoice.notes)}</div>` : ""}
    </div>
  </div>
</body>
</html>`;
}
