"use client";

import { useState } from "react";
import type { BusinessProfile, Client, InvoiceData, LineItem, TemplateId } from "../../lib/types";
import { subtotal, taxAmount, grandTotal, formatCurrency } from "../../lib/templates/shared";
import TemplatePicker from "./TemplatePicker";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function newInvoiceNumber(): string {
  return `INV-${Date.now().toString().slice(-6)}`;
}

function emptyItem(): LineItem {
  return { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0 };
}

export default function InvoiceForm({
  profile,
  onProfileChange,
  selectedClient,
  onGenerate,
}: {
  profile: BusinessProfile;
  onProfileChange: (profile: BusinessProfile) => void;
  selectedClient: Client | null;
  onGenerate: (invoice: InvoiceData, templateId: TemplateId) => void;
}) {
  const [clientName, setClientName] = useState(selectedClient?.name ?? "");
  const [clientEmail, setClientEmail] = useState(selectedClient?.email ?? "");
  const [clientAddress, setClientAddress] = useState(selectedClient?.address ?? "");

  const [lastClientId, setLastClientId] = useState(selectedClient?.id ?? null);
  if (lastClientId !== (selectedClient?.id ?? null)) {
    setLastClientId(selectedClient?.id ?? null);
    setClientName(selectedClient?.name ?? "");
    setClientEmail(selectedClient?.email ?? "");
    setClientAddress(selectedClient?.address ?? "");
  }

  const [invoiceNumber, setInvoiceNumber] = useState(newInvoiceNumber());
  const [date, setDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState(plusDaysIso(14));
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [templateId, setTemplateId] = useState<TemplateId>("minimal");
  const [error, setError] = useState<string | null>(null);

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!clientName.trim()) {
      setError("Client name is required.");
      return;
    }
    const validItems = items.filter((it) => it.description.trim().length > 0);
    if (validItems.length === 0) {
      setError("Add at least one line item with a description.");
      return;
    }

    const invoice: InvoiceData = {
      invoiceNumber,
      date,
      dueDate,
      currency,
      business: profile,
      client: { name: clientName.trim(), email: clientEmail.trim(), address: clientAddress.trim() },
      items: validItems,
      taxRate,
      notes,
    };
    onGenerate(invoice, templateId);
  }

  const sub = subtotal(items);
  const tax = taxAmount(items, taxRate);
  const total = grandTotal(items, taxRate);

  return (
    <form onSubmit={handleSubmit} className="h-full space-y-5 overflow-y-auto pr-1">
      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-lobster-pink">
          Your business
        </legend>
        <input
          type="text"
          placeholder="Business name"
          value={profile.businessName}
          onChange={(e) => onProfileChange({ ...profile, businessName: e.target.value })}
          className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="email"
            placeholder="Email"
            value={profile.email}
            onChange={(e) => onProfileChange({ ...profile, email: e.target.value })}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Address"
            value={profile.address}
            onChange={(e) => onProfileChange({ ...profile, address: e.target.value })}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-lobster-pink">
          Bill to
        </legend>
        <input
          type="text"
          placeholder="Client name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="email"
            placeholder="Client email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Client address"
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-4 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-granite">Invoice #</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full rounded-md border border-black/10 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-granite">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-black/10 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-granite">Due</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-md border border-black/10 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-granite">Currency</label>
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            className="w-full rounded-md border border-black/10 px-2 py-1.5 text-sm"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-lobster-pink">
          Line items
        </legend>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                className="flex-1 rounded-md border border-black/10 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                step="any"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                className="w-16 rounded-md border border-black/10 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                step="any"
                value={item.rate}
                onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })}
                className="w-24 rounded-md border border-black/10 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="px-1 text-xs text-lobster-pink"
                aria-label="Remove line item"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-2 text-xs font-medium text-lobster-pink hover:underline"
        >
          + Add line item
        </button>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-granite">Tax rate (%)</label>
          <input
            type="number"
            min={0}
            step="any"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            className="w-full rounded-md border border-black/10 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="space-y-1 text-right text-sm">
          <div className="text-granite">Subtotal {formatCurrency(sub, currency)}</div>
          <div className="text-granite">Tax {formatCurrency(tax, currency)}</div>
          <div className="font-semibold text-night-bordeaux">Total {formatCurrency(total, currency)}</div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-granite">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-lobster-pink">
          Template
        </legend>
        <TemplatePicker value={templateId} onChange={setTemplateId} />
      </fieldset>

      {error && <p className="text-xs text-lobster-pink">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-full bg-night-bordeaux px-4 py-2.5 text-sm font-semibold text-jasmine hover:bg-[#3a0416]"
      >
        Generate preview
      </button>
    </form>
  );
}
