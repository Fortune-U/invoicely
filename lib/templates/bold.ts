import type { InvoiceData } from "../types";
import { escapeHtml, formatCurrency, itemsRows, totalsFor } from "./shared";

export function boldTemplate(invoice: InvoiceData): string {
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
    background: #f7dd72;
  }
  .sheet { width: 800px; margin: 0 auto; background: #ffffff; }
  .header {
    background: #c1666b;
    color: #ffffff;
    padding: 48px 56px 32px;
  }
  .header h1 { margin: 0 0 4px; font-size: 40px; letter-spacing: 1px; }
  .header .sub { font-size: 13px; opacity: 0.9; }
  .strip {
    background: #4a051c;
    color: #f7dd72;
    padding: 14px 56px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    letter-spacing: 0.5px;
  }
  .body-pad { padding: 40px 56px; }
  .meta-grid { display: flex; justify-content: space-between; margin-bottom: 28px; }
  .meta-grid h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #c1666b; margin: 0 0 6px; }
  .muted { color: #4e6766; font-size: 13px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { border-bottom: 3px solid #4a051c; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 6px; color: #4a051c; }
  td { padding: 14px 6px; border-bottom: 1px solid #f2e6c9; font-size: 13px; }
  .col-num { text-align: right; }
  .totals { width: 280px; margin-left: auto; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals .grand {
    background: #4a051c;
    color: #f7dd72;
    margin-top: 10px;
    padding: 16px 14px;
    font-size: 20px;
    font-weight: 700;
  }
  .notes { margin-top: 36px; font-size: 12px; color: #6b7674; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <h1>${escapeHtml(invoice.business.businessName || "Your Business")}</h1>
      <div class="sub">${escapeHtml(invoice.business.email)} &middot; ${escapeHtml(invoice.business.address)}</div>
    </div>
    <div class="strip">
      <span>INVOICE ${escapeHtml(invoice.invoiceNumber)}</span>
      <span>DUE ${escapeHtml(invoice.dueDate)}</span>
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
          <h3>Invoice Date</h3>
          <div class="muted">${escapeHtml(invoice.date)}</div>
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
