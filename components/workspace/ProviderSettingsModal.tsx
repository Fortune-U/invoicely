"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { DEFAULT_MODELS, PROVIDER_LABELS, PROVIDER_HINTS, PROVIDER_MODELS } from "../../lib/ai";
import { KEYLESS_PROVIDERS, type AiProvider, type AiSettings } from "../../lib/types";

const PROVIDERS: AiProvider[] = [
  "puter",
  "pollinations",
  "gemini",
  "openrouter",
  "anthropic",
  "openai",
  "grok",
];

export default function ProviderSettingsModal({
  initial,
  onSave,
  onClose,
}: {
  initial: AiSettings | null;
  onSave: (settings: AiSettings) => void;
  onClose: () => void;
}) {
  const [provider, setProvider] = useState<AiProvider>(
    initial?.provider ?? "puter"
  );
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? "");
  const [model, setModel] = useState(initial?.model ?? DEFAULT_MODELS.puter);
  const [customModel, setCustomModel] = useState(
    initial && !PROVIDER_MODELS[initial.provider].some((m) => m.id === initial.model)
  );

  const keyless = KEYLESS_PROVIDERS.includes(provider);

  function handleProviderChange(next: AiProvider) {
    setProvider(next);
    if (!initial || initial.provider !== next) {
      setModel(DEFAULT_MODELS[next]);
      setCustomModel(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!model.trim()) return;
    if (!keyless && !apiKey.trim()) return;
    onSave({ provider, apiKey: keyless ? "" : apiKey.trim(), model: model.trim() });
  }

  return (
    <Modal title="Connect an AI provider" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs leading-relaxed text-granite">
          {keyless
            ? "No key needed for the community provider. For dependable free usage, Gemini's free tier or OpenRouter's free models (with a free key) are the better path."
            : "Your key stays in memory for this tab and is relayed per request through a stateless function to the provider you choose. You will need to re-enter it after refreshing or closing the page."}
        </p>

        <div>
          <label className="mb-1 block text-xs font-medium text-granite">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
          {PROVIDER_HINTS[provider] && (
            <p className="mt-1.5 text-xs leading-relaxed text-granite">
              {PROVIDER_HINTS[provider]}
            </p>
          )}
        </div>

        {!keyless && (
          <div>
            <label className="mb-1 block text-xs font-medium text-granite">
              API key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
              autoComplete="off"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-granite">
            Model
          </label>
          <select
            value={customModel ? "__custom__" : model}
            onChange={(e) => {
              if (e.target.value === "__custom__") {
                setCustomModel(true);
                setModel("");
              } else {
                setCustomModel(false);
                setModel(e.target.value);
              }
            }}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          >
            {PROVIDER_MODELS[provider].map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
            <option value="__custom__">Custom model ID…</option>
          </select>
          {customModel && (
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Exact model ID, e.g. gpt-4o-2024-11-20"
              className="mt-2 w-full rounded-md border border-black/10 px-3 py-2 text-sm"
              autoFocus
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-granite hover:bg-black/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-full bg-night-bordeaux px-4 py-2 text-sm font-semibold text-jasmine hover:bg-[#3a0416]"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
