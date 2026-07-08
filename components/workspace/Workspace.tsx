"use client";

import { useEffect, useState } from "react";
import type {
  AiSettings,
  BusinessProfile,
  ChatMessage,
  Client,
  DocContext,
  DocType,
  InvoiceData,
  SavedInvoice,
  TemplateId,
} from "../../lib/types";
import {
  listClients,
  saveClient,
  deleteClient,
  listInvoices,
  saveInvoice,
  deleteInvoice,
} from "../../lib/db";
import { loadProfile, saveProfile, loadAiSettings, saveAiSettings } from "../../lib/storage";
import { renderTemplate } from "../../lib/templates";
import { generateDocument, chatReply, PROVIDER_LABELS, AiResponseParseError } from "../../lib/ai";
import { extractContext } from "../../lib/pdfExtract";

const FREE_SETTINGS: AiSettings = { provider: "pollinations", apiKey: "", model: "openai" };

import ClientPanel from "./ClientPanel";
import InvoiceHistory from "./InvoiceHistory";
import InvoiceForm from "./InvoiceForm";
import ChatPanel from "./ChatPanel";
import PreviewPane from "./PreviewPane";
import ProviderSettingsModal from "./ProviderSettingsModal";
import MissingFieldsModal from "./MissingFieldsModal";

type Mode = "manual" | "ai";

interface CurrentDoc {
  html: string;
  title?: string;
  docType?: DocType;
  invoiceNumber: string;
  clientName: string;
  total: number;
  currency: string;
  dueDate: string;
  source: "manual" | "ai";
  templateId?: TemplateId;
}

export default function Workspace() {
  const [mode, setMode] = useState<Mode>("manual");
  const [ready, setReady] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [profile, setProfile] = useState<BusinessProfile>({
    businessName: "",
    email: "",
    address: "",
  });
  const [aiSettings, setAiSettings] = useState<AiSettings>(FREE_SETTINGS);
  const [providerModalOpen, setProviderModalOpen] = useState(false);

  const [docType, setDocType] = useState<DocType>("proposal");
  const [contexts, setContexts] = useState<DocContext[]>([]);
  const [contextBusy, setContextBusy] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<{ message: string; fields: string[] } | null>(null);

  const [current, setCurrent] = useState<CurrentDoc | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, i] = await Promise.all([listClients(), listInvoices()]);
      setClients(c);
      setInvoices(i);
      setProfile(loadProfile());
      setAiSettings(loadAiSettings() ?? FREE_SETTINGS);
      setReady(true);
    })();
  }, []);

  async function handleAddFiles(files: FileList) {
    setContextBusy(true);
    setContextError(null);
    try {
      const results = await Promise.all(Array.from(files).map((f) => extractContext(f)));
      setContexts((prev) => [...prev, ...results]);
    } catch (err) {
      setContextError(err instanceof Error ? err.message : "Couldn't read that file.");
    } finally {
      setContextBusy(false);
    }
  }

  function handleRemoveContext(index: number) {
    setContexts((prev) => prev.filter((_, i) => i !== index));
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  function handleProfileChange(next: BusinessProfile) {
    setProfile(next);
    saveProfile(next);
  }

  async function handleSaveClient(client: Omit<Client, "id" | "createdAt"> & { id?: string }) {
    const record = await saveClient(client);
    setClients((prev) => {
      const exists = prev.some((c) => c.id === record.id);
      const next = exists ? prev.map((c) => (c.id === record.id ? record : c)) : [record, ...prev];
      return next;
    });
  }

  async function handleDeleteClient(id: string) {
    await deleteClient(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (selectedClientId === id) setSelectedClientId(null);
  }

  async function handleImportClients(newClients: Array<Omit<Client, "id" | "createdAt">>) {
    const saved = await Promise.all(newClients.map((c) => saveClient(c)));
    setClients((prev) => [...saved, ...prev]);
  }

  function handleManualGenerate(invoice: InvoiceData, templateId: TemplateId) {
    const html = renderTemplate(templateId, invoice);
    const total = invoice.items.reduce((sum, it) => sum + it.quantity * it.rate, 0) * (1 + invoice.taxRate / 100);
    setCurrent({
      html,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client.name,
      total,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      source: "manual",
      templateId,
    });
    setSaved(false);
  }

  // Conversational turn — the assistant helps shape scope/pricing, plain text reply.
  async function runChat(history: ChatMessage[]) {
    setChatBusy(true);
    setChatError(null);
    try {
      const reply = await chatReply({
        settings: aiSettings,
        history,
        profile,
        client: selectedClient,
        docType,
        contexts,
      });
      setChatMessages([...history, { role: "assistant", content: reply }]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Something went wrong talking to the AI provider.");
    } finally {
      setChatBusy(false);
    }
  }

  // Document generation — builds the full document from the entire chat history.
  async function runGenerate(history: ChatMessage[]) {
    setGenerating(true);
    setChatBusy(true);
    setChatError(null);
    try {
      const response = await generateDocument({
        settings: aiSettings,
        history: [
          ...history,
          {
            role: "user" as const,
            content:
              "Now produce the final document based on everything we discussed above (and any attached reference documents).",
          },
        ],
        profile,
        client: selectedClient,
        docType,
        contexts,
      });

      if (response.status === "needs_info") {
        setChatMessages([...history, { role: "assistant", content: response.message }]);
        setMissingFields({ message: response.message, fields: response.missingFields });
      } else {
        const total = response.meta.total;
        const currency = response.meta.currency ?? "";
        const amountLine =
          typeof total === "number" ? ` — ${currency} ${total.toLocaleString()}`.trimEnd() : "";
        setChatMessages([
          ...history,
          {
            role: "assistant",
            content: `Done — "${response.meta.title}"${amountLine}.`,
          },
        ]);
        setCurrent({
          html: response.html,
          title: response.meta.title,
          docType,
          invoiceNumber: "",
          clientName: response.meta.subtitle ?? selectedClient?.name ?? "",
          total: typeof total === "number" ? total : 0,
          currency,
          dueDate: "",
          source: "ai",
        });
        setSaved(false);
        setMissingFields(null);
      }
    } catch (err) {
      const message =
        err instanceof AiResponseParseError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong talking to the AI provider.";
      setChatError(message);
    } finally {
      setChatBusy(false);
    }
  }

  function handleSendChat(text: string) {
    const history = [...chatMessages, { role: "user" as const, content: text }];
    setChatMessages(history);
    void runChat(history);
  }

  function handleMissingFieldsSubmit(values: Record<string, string>) {
    setMissingFields(null);
    const summary = Object.entries(values)
      .map(([field, value]) => `${field}: ${value}`)
      .join("; ");
    const history = [...chatMessages, { role: "user" as const, content: `Here's the missing info — ${summary}` }];
    setChatMessages(history);
    void runChat(history);
  }

  async function handleSaveCurrent() {
    if (!current) return;
    const record = await saveInvoice({
      title: current.title,
      docType: current.docType,
      clientName: current.clientName,
      invoiceNumber: current.invoiceNumber,
      total: current.total,
      currency: current.currency,
      dueDate: current.dueDate,
      html: current.html,
      source: current.source,
      templateId: current.templateId,
    });
    setInvoices((prev) => [record, ...prev]);
    setSaved(true);
  }

  function handleOpenInvoice(invoice: SavedInvoice) {
    setCurrent({
      html: invoice.html,
      title: invoice.title,
      docType: invoice.docType,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      total: invoice.total,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      source: invoice.source,
      templateId: invoice.templateId,
    });
    setSaved(true);
  }

  async function handleDeleteInvoice(id: string) {
    await deleteInvoice(id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }

  if (!ready) {
    return <div className="flex flex-1 items-center justify-center text-sm text-granite">Loading…</div>;
  }

  return (
    <div className="flex min-h-225 flex-col bg-white">
      <header className="flex items-center justify-between border-b border-black/5 px-6 py-3">
        <span className="text-sm font-semibold text-granite">Your document workspace</span>
        <div className="flex rounded-full bg-black/5 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`rounded-full px-4 py-1.5 ${mode === "manual" ? "bg-white shadow-sm text-night-bordeaux" : "text-granite"}`}
          >
            Manual invoice
          </button>
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`rounded-full px-4 py-1.5 ${mode === "ai" ? "bg-white shadow-sm text-night-bordeaux" : "text-granite"}`}
          >
            AI documents
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-[260px_1fr_1fr] lg:h-180">
        <aside className="flex flex-col gap-6 overflow-y-auto">
          <ClientPanel
            clients={clients}
            selectedClientId={selectedClientId}
            onSelect={setSelectedClientId}
            onSave={handleSaveClient}
            onDelete={handleDeleteClient}
            onImport={handleImportClients}
          />
          <div>
            <h3 className="mb-2 text-sm font-semibold text-night-bordeaux">History</h3>
            <InvoiceHistory invoices={invoices} onOpen={handleOpenInvoice} onDelete={handleDeleteInvoice} />
          </div>
        </aside>

        <section className="overflow-hidden">
          {mode === "manual" ? (
            <InvoiceForm
              profile={profile}
              onProfileChange={handleProfileChange}
              selectedClient={selectedClient}
              onGenerate={handleManualGenerate}
            />
          ) : (
            <ChatPanel
              messages={chatMessages}
              busy={chatBusy}
              error={chatError}
              providerLabel={PROVIDER_LABELS[aiSettings.provider]}
              docType={docType}
              onDocTypeChange={setDocType}
              contexts={contexts}
              contextBusy={contextBusy}
              contextError={contextError}
              onAddFiles={handleAddFiles}
              onRemoveContext={handleRemoveContext}
              onSend={handleSendChat}
              onOpenSettings={() => setProviderModalOpen(true)}
            />
          )}
        </section>

        <section className="overflow-hidden">
          <PreviewPane
            html={current?.html ?? null}
            invoiceNumber={current?.title ?? current?.invoiceNumber ?? null}
            onSave={handleSaveCurrent}
            saved={saved}
          />
        </section>
      </div>

      {providerModalOpen && (
        <ProviderSettingsModal
          initial={aiSettings}
          onClose={() => setProviderModalOpen(false)}
          onSave={(settings) => {
            setAiSettings(settings);
            saveAiSettings(settings);
            setProviderModalOpen(false);
          }}
        />
      )}

      {missingFields && (
        <MissingFieldsModal
          message={missingFields.message}
          fields={missingFields.fields}
          onClose={() => setMissingFields(null)}
          onSubmit={handleMissingFieldsSubmit}
        />
      )}
    </div>
  );
}
