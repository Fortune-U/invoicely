"use client";

import type { SavedInvoice } from "../../lib/types";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvoiceHistory({
  invoices,
  onOpen,
  onDelete,
}: {
  invoices: SavedInvoice[];
  onOpen: (invoice: SavedInvoice) => void;
  onDelete: (id: string) => void;
}) {
  if (invoices.length === 0) {
    return (
      <p className="text-xs text-granite">
        Invoices you save will show up here for next billing cycle.
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {invoices.map((inv) => (
        <li
          key={inv.id}
          className="group flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-black/5"
        >
          <button
            type="button"
            onClick={() => onOpen(inv)}
            className="flex-1 truncate text-left"
          >
            <span className="font-medium text-[#2a2a2a]">
              {inv.title || inv.clientName || "Untitled"}
            </span>
            <span className="ml-2 text-xs text-granite">
              {inv.invoiceNumber || inv.docType || "doc"} · {formatDate(inv.createdAt)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(inv.id)}
            className="ml-2 hidden text-xs text-lobster-pink group-hover:inline"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
