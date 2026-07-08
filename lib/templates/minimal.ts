import type { InvoiceData } from "../types";
import { escapeHtml, formatCurrency, itemsRows, totalsFor } from "./shared";

export function minimalTemplate(invoice: InvoiceData): string {
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
  .sheet {
    width: 800px;
    margin: 0 auto;
    padding: 56px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #c1666b;
    padding-bottom: 24px;
    margin-bottom: 32px;
  }
  .brand { font-size: 22px; font-weight: 700; color: #4e6766; }
  .muted { color: #6b7674; font-size: 13px; line-height: 1.6; }
  .invoice-title { text-align: right; }
  .invoice-title h1 { margin: 0; font-size: 28px; letter-spacing: 2px; color: #4e6766; }
  .meta-grid {
    display: flex;
    justify-content: space-between;
    margin-bottom: 32px;
  }
  .meta-grid h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #c1666b; margin: 0 0 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7674; border-bottom: 1px solid #e3e3e3; padding: 8px 4px; }
  td { padding: 12px 4px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  .num { text-align: right; }
  .desc { max-width: 360px; }
  .totals { width: 260px; margin-left: auto; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals .grand { border-top: 2px solid #2a2a2a; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; color: #4e6766; }
  .notes { margin-top: 40px; font-size: 12px; color: #6b7674; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="brand">${escapeHtml(invoice.business.businessName || "Your Business")}</div>
        <div class="muted">${escapeHtml(invoice.business.email)}<br/>${escapeHtml(invoice.business.address)}</div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="muted">${escapeHtml(invoice.invoiceNumber)}</div>
      </div>
    </div>

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
          <th class="desc">Description</th>
          <th class="num">Qty</th>
          <th class="num">Rate</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows(invoice.items, invoice.currency)}
      </tbody>
    </table>

    <div class="totals">
      <div><span>Subtotal</span><span>${formatCurrency(subtotal, invoice.currency)}</span></div>
      <div><span>Tax (${invoice.taxRate}%)</span><span>${formatCurrency(tax, invoice.currency)}</span></div>
      <div class="grand"><span>Total</span><span>${formatCurrency(total, invoice.currency)}</span></div>
    </div>

    ${invoice.notes ? `<div class="notes">${escapeHtml(invoice.notes)}</div>` : ""}
  </div>
</body>
</html>`;
}
