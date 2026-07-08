"use client";

import { useRef, useState } from "react";
import type { Client } from "../../lib/types";
import { clientsToCsv, csvToClients, downloadCsv } from "../../lib/csv";
import ClientFormModal from "./ClientFormModal";

export default function ClientPanel({
  clients,
  selectedClientId,
  onSelect,
  onSave,
  onDelete,
  onImport,
}: {
  clients: Client[];
  selectedClientId: string | null;
  onSelect: (id: string | null) => void;
  onSave: (client: Omit<Client, "id" | "createdAt"> & { id?: string }) => void;
  onDelete: (id: string) => void;
  onImport: (clients: Array<Omit<Client, "id" | "createdAt">>) => void;
}) {
  const [modalClient, setModalClient] = useState<Client | null | "new">(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    downloadCsv("clients.csv", clientsToCsv(clients));
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const result = csvToClients(text);
    if (result.clients.length > 0) onImport(result.clients);
    setImportSummary(
      `Imported ${result.clients.length} client${result.clients.length === 1 ? "" : "s"}.` +
        (result.errors.length ? ` ${result.errors.length} row(s) skipped.` : "")
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-night-bordeaux">Clients</h3>
        <button
          type="button"
          onClick={() => setModalClient("new")}
          className="text-xs font-medium text-lobster-pink hover:underline"
        >
          + Add
        </button>
      </div>

      <ul className="mb-3 max-h-48 space-y-1 overflow-y-auto">
        {clients.length === 0 && (
          <li className="text-xs text-granite">No clients saved yet.</li>
        )}
        {clients.map((client) => (
          <li
            key={client.id}
            className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
              selectedClientId === client.id
                ? "bg-willow-green/20"
                : "hover:bg-black/5"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                onSelect(selectedClientId === client.id ? null : client.id)
              }
              className="flex-1 truncate text-left"
            >
              {client.name}
            </button>
            <button
              type="button"
              onClick={() => setModalClient(client)}
              className="ml-2 hidden text-xs text-granite hover:underline group-hover:inline"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(client.id)}
              className="ml-2 hidden text-xs text-lobster-pink hover:underline group-hover:inline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={handleExport}
          disabled={clients.length === 0}
          className="rounded-full border border-black/10 px-3 py-1 font-medium text-granite hover:bg-black/5 disabled:opacity-40"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="rounded-full border border-black/10 px-3 py-1 font-medium text-granite hover:bg-black/5"
        >
          Import CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {importSummary && (
        <p className="mt-1.5 text-xs text-granite">{importSummary}</p>
      )}

      {modalClient && (
        <ClientFormModal
          initial={modalClient === "new" ? null : modalClient}
          onClose={() => setModalClient(null)}
          onSave={(client) => {
            onSave(client);
            setModalClient(null);
          }}
        />
      )}
    </div>
  );
}
