"use client";

import { useRef, useState } from "react";
import { DOC_TYPES, type ChatMessage, type DocContext, type DocType } from "../../lib/types";

export default function ChatPanel({
  messages,
  busy,
  error,
  providerLabel,
  docType,
  onDocTypeChange,
  contexts,
  contextBusy,
  contextError,
  onAddFiles,
  onRemoveContext,
  onSend,
  onGenerate,
  generating,
  onOpenSettings,
}: {
  messages: ChatMessage[];
  busy: boolean;
  error: string | null;
  providerLabel: string;
  docType: DocType;
  onDocTypeChange: (type: DocType) => void;
  contexts: DocContext[];
  contextBusy: boolean;
  contextError: string | null;
  onAddFiles: (files: FileList) => void;
  onRemoveContext: (index: number) => void;
  onSend: (text: string) => void;
  onGenerate: () => void;
  generating: boolean;
  onOpenSettings: () => void;
}) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    onSend(text.trim());
    setText("");
  }

  const activeDoc = DOC_TYPES.find((d) => d.id === docType);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-granite">
          AI provider: <span className="font-medium">{providerLabel}</span>
        </span>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-granite hover:bg-black/5"
        >
          Change provider
        </button>
      </div>

      {/* Document type */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {DOC_TYPES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onDocTypeChange(d.id)}
            title={d.hint}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              docType === d.id
                ? "bg-night-bordeaux text-jasmine"
                : "border border-black/10 text-granite hover:bg-black/5"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Context attachments */}
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={contextBusy}
            className="rounded-full border border-dashed border-lobster-pink/60 px-3 py-1 text-xs font-medium text-lobster-pink hover:bg-lobster-pink/5 disabled:opacity-50"
          >
            {contextBusy ? "Reading…" : "+ Add context (PDF / text)"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,application/pdf,text/plain"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) onAddFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        {contexts.length > 0 && (
          <ul className="mt-2 space-y-1">
            {contexts.map((c, i) => (
              <li
                key={`${c.name}-${i}`}
                className="flex items-center justify-between rounded-md bg-willow-100 px-2 py-1 text-xs text-granite-800"
              >
                <span className="truncate">📎 {c.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveContext(i)}
                  className="ml-2 text-lobster-pink hover:underline"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {contextError && (
          <p className="mt-1 text-xs text-lobster-pink">{contextError}</p>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-black/10 bg-[#faf9f6] p-4">
        {messages.length === 0 && (
          <p className="text-sm text-granite">
            Chat with the AI to shape your{" "}
            <span className="font-semibold">{activeDoc?.label.toLowerCase()}</span> — scope,
            steps, pricing. Attach past documents above for context (e.g. a previous
            engagement summary). When it feels right, hit{" "}
            <span className="font-semibold">Generate</span> below and the full document is
            built from the whole conversation.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-night-bordeaux text-jasmine"
                : "bg-white text-[#2a2a2a] shadow-sm"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="max-w-[85%] rounded-lg bg-white px-3 py-2 text-sm text-granite shadow-sm">
            {generating
              ? `Writing your ${activeDoc?.label.toLowerCase()}…`
              : "Thinking…"}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-lobster-pink">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          rows={2}
          placeholder={`Chat about the ${activeDoc?.label.toLowerCase()} — scope, steps, pricing…`}
          disabled={busy}
          className="flex-1 resize-none rounded-2xl border border-black/10 px-4 py-2.5 text-sm disabled:bg-black/5"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="self-end rounded-full bg-lobster-pink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>

      <button
        type="button"
        onClick={onGenerate}
        disabled={busy || messages.length === 0}
        className="mt-3 w-full rounded-full bg-night-bordeaux px-5 py-3 text-sm font-bold text-jasmine transition hover:bg-[#3a0416] disabled:opacity-40"
      >
        {generating
          ? "Generating…"
          : `⚡ Generate ${activeDoc?.label.toLowerCase()} from this chat`}
      </button>
    </div>
  );
}
