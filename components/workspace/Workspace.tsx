"use client";

import { useEffect, useState } from "react";
import type {
  AiSettings,
  BusinessProfile,
  ChatMessage,
  DocContext,
  DocType,
  InvoiceData,
  SessionDoc,
  TemplateId,
} from "../../lib/types";
import {
  loadProfile,
  saveProfile,
  loadAiSettings,
  saveAiSettings,
} from "../../lib/storage";
import { renderTemplate } from "../../lib/templates";
import { grandTotal } from "../../lib/templates/shared";
import {
  generateDocument,
  chatReply,
  PROVIDER_LABELS,
  AiResponseParseError,
} from "../../lib/ai";
import { extractContext } from "../../lib/pdfExtract";

import SessionFolder from "./SessionFolder";
import InvoiceForm from "./InvoiceForm";
import ChatPanel from "./ChatPanel";
import PreviewPane from "./PreviewPane";
import ProviderSettingsModal from "./ProviderSettingsModal";
import MissingFieldsModal from "./MissingFieldsModal";

const FREE_SETTINGS: AiSettings = {
  provider: "puter",
  apiKey: "",
  model: "gpt-4o-mini",
};

type Mode = "ai" | "manual";

export default function Workspace() {
  const [mode, setMode] = useState<Mode>("ai");
  const [ready, setReady] = useState(false);

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
  const [generating, setGenerating] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<{
    message: string;
    fields: string[];
  } | null>(null);

  // Session-only: every generated document lands here; nothing is persisted.
  // To continue work in a later session, users attach exported files as context.
  const [sessionDocs, setSessionDocs] = useState<SessionDoc[]>([]);
  const [current, setCurrent] = useState<SessionDoc | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
    setAiSettings(loadAiSettings() ?? FREE_SETTINGS);
    setReady(true);
  }, []);

  function addSessionDoc(doc: Omit<SessionDoc, "id" | "createdAt">): void {
    const record: SessionDoc = {
      ...doc,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setSessionDocs((prev) => [record, ...prev]);
    setCurrent(record);
  }

  async function handleAddFiles(files: FileList) {
    setContextBusy(true);
    setContextError(null);
    try {
      const results = await Promise.all(
        Array.from(files).map((f) => extractContext(f))
      );
      setContexts((prev) => [...prev, ...results]);
    } catch (err) {
      setContextError(
        err instanceof Error ? err.message : "Couldn't read that file."
      );
    } finally {
      setContextBusy(false);
    }
  }

  function handleRemoveContext(index: number) {
    setContexts((prev) => prev.filter((_, i) => i !== index));
  }

  function handleProfileChange(next: BusinessProfile) {
    setProfile(next);
    saveProfile(next);
  }

  function handleManualGenerate(invoice: InvoiceData, templateId: TemplateId) {
    const html = renderTemplate(templateId, invoice);
    addSessionDoc({
      html,
      title: `${invoice.invoiceNumber} — ${invoice.client.name}`,
      docType: "invoice",
      total: grandTotal(invoice.items, invoice.taxRate),
      currency: invoice.currency,
      source: "manual",
    });
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
        client: null,
        docType,
        contexts,
      });
      setChatMessages([...history, { role: "assistant", content: reply }]);
    } catch (err) {
      setChatError(
        err instanceof Error
          ? err.message
          : "Something went wrong talking to the AI provider."
      );
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
        client: null,
        docType,
        contexts,
      });

      if (response.status === "needs_info") {
        setChatMessages([
          ...history,
          { role: "assistant", content: response.message },
        ]);
        setMissingFields({
          message: response.message,
          fields: response.missingFields,
        });
      } else {
        const total = response.meta.total;
        const currency = response.meta.currency ?? "";
        const amountLine =
          typeof total === "number"
            ? ` — ${currency} ${total.toLocaleString()}`.trimEnd()
            : "";
        setChatMessages([
          ...history,
          {
            role: "assistant",
            content: `Done — "${response.meta.title}"${amountLine}. It's in your session folder.`,
          },
        ]);
        addSessionDoc({
          html: response.html,
          title: response.meta.title,
          docType,
          total: typeof total === "number" ? total : 0,
          currency,
          source: "ai",
        });
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
      setGenerating(false);
    }
  }

  function handleSendChat(text: string) {
    const history = [...chatMessages, { role: "user" as const, content: text }];
    setChatMessages(history);
    void runChat(history);
  }

  function handleGenerate() {
    void runGenerate(chatMessages);
  }

  function handleMissingFieldsSubmit(values: Record<string, string>) {
    setMissingFields(null);
    const summary = Object.entries(values)
      .map(([field, value]) => `${field}: ${value}`)
      .join("; ");
    const history = [
      ...chatMessages,
      { role: "user" as const, content: `Here's the missing info — ${summary}` },
    ];
    setChatMessages(history);
    void runGenerate(history);
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-granite">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white lg:h-screen lg:max-h-screen lg:overflow-hidden">
      <header className="flex items-center justify-between border-b border-black/5 px-6 py-3">
        <span className="text-sm font-semibold text-granite">
          Your document workspace
        </span>
        <div className="flex rounded-full bg-black/5 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`rounded-full px-4 py-1.5 ${mode === "ai" ? "bg-white shadow-sm text-night-bordeaux" : "text-granite"}`}
          >
            AI documents
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`rounded-full px-4 py-1.5 ${mode === "manual" ? "bg-white shadow-sm text-night-bordeaux" : "text-granite"}`}
          >
            Manual invoice
          </button>
        </div>
      </header>

      {/* On lg the single row is minmax(0,1fr): exactly the leftover viewport
          height, never content-sized — children must scroll internally. */}
      <div className="grid flex-1 grid-cols-1 gap-6 p-6 lg:min-h-0 lg:grid-cols-[230px_1.15fr_1fr] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden">
        <aside className="overflow-y-auto lg:min-h-0">
          <SessionFolder
            docs={sessionDocs}
            activeId={current?.id ?? null}
            onOpen={setCurrent}
          />
        </aside>

        <section className="h-150 overflow-hidden lg:h-full lg:min-h-0">
          {mode === "manual" ? (
            <InvoiceForm
              profile={profile}
              onProfileChange={handleProfileChange}
              selectedClient={null}
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
              onGenerate={handleGenerate}
              generating={generating}
              onOpenSettings={() => setProviderModalOpen(true)}
            />
          )}
        </section>

        <section className="h-150 overflow-hidden lg:h-full lg:min-h-0">
          <PreviewPane
            html={current?.html ?? null}
            invoiceNumber={current?.title ?? null}
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
