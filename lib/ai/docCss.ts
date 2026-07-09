// The canonical design system for AI-generated documents (IJGB-style).
// The model references these classes but never retypes the CSS — it writes a
// {{DESIGN_CSS}} placeholder that we substitute after parsing. This guarantees
// pixel-exact styling and saves a large slice of the output-token budget.
export const DOC_CSS = `
.page{max-width:840px;margin:0 auto;padding:56px 48px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#26323a;font-size:14px;line-height:1.55;background:#fff}
.doc-header{text-align:center;margin-bottom:8px}
.doc-header h1{font-size:34px;font-weight:800;color:#1f3a5f;margin:0 0 6px;letter-spacing:.3px}
.doc-header .subtitle{font-size:15px;color:#5b6a76;margin:0}
.doc-header .date{font-size:12px;color:#93a1ac;margin-top:4px}
.rule{border:none;border-top:1px solid #e3e8ec;margin:28px 0}
h2.section{font-size:21px;font-weight:800;color:#1f3a5f;margin:34px 0 10px}
.kv-line{font-size:13.5px;margin:2px 0 14px;color:#42505a}
.kv-line b{color:#26323a}
.kv-line .due{color:#c0392b;font-weight:700}
table.grid{width:100%;border-collapse:collapse;margin:14px 0 6px;font-size:13px}
table.grid th{background:#1f3a5f;color:#fff;text-align:left;padding:9px 12px;font-weight:700}
table.grid td{border:1px solid #e3e8ec;padding:8px 12px;vertical-align:top}
table.grid tr:nth-child(even) td{background:#f7f9fa}
table.grid .num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
table.grid td.paid{background:#eaf6ec}
table.grid td.owed{background:#fdeceb;color:#c0392b;font-weight:700}
table.grid tr.total td{background:#1f3a5f;color:#fff;font-weight:800;border-color:#1f3a5f}
.badge{display:inline-block;padding:2px 9px;border-radius:10px;font-size:11px;font-weight:800;letter-spacing:.4px}
.badge.critical{background:#fdeceb;color:#c0392b}.badge.high{background:#fef3e2;color:#c87a1e}.badge.medium{background:#e8f0fb;color:#2e6bb8}.badge.low{background:#eaf6ec;color:#2e8b57}
.badge.done{background:#eaf6ec;color:#2e8b57}.badge.pending{background:#fef3e2;color:#c87a1e}.badge.scope{background:#eef1f4;color:#5b6a76}.badge.chargeable{background:#fdf6dc;color:#8a6d0b}
.callout{border-left:4px solid #c0392b;background:#fdf7f6;padding:12px 16px;margin:20px 0;font-size:16px;font-weight:800;color:#c0392b}
.callout.ok{border-color:#2e8b57;background:#f4faf5;color:#2e8b57}
.note{font-size:12.5px;color:#5b6a76}
`.trim();

export function injectDesignCss(html: string): string {
  return html.split("{{DESIGN_CSS}}").join(DOC_CSS);
}
