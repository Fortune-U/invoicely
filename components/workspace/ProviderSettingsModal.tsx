"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { DEFAULT_MODELS, PROVIDER_LABELS } from "../../lib/ai";
import { KEYLESS_PROVIDERS, type AiProvider, type AiSettings } from "../../lib/types";

const PROVIDERS: AiProvider[] = [
  "pollinations",
  "anthropic",
  "openai",
  "gemini",
  "openrouter",
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
    initial?.provider ?? "pollinations"
  );
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? "");
  const [model, setModel] = useState(
    initial?.model ?? DEFAULT_MODELS.pollinations
  );

  const keyless = KEYLESS_PROVIDERS.includes(provider);

  function handleProviderChange(next: AiProvider) {
    setProvider(next);
    if (!initial || initial.provider !== next) {
      setModel(DEFAULT_MODELS[next]);
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
            ? "The free provider needs no key and works right away. Requests go straight from your browser — it's a shared public service, so it can be slower or rate-limited. Add your own key below for faster, higher-quality models."
            : "Your key is stored only in this browser's local storage and is sent directly from your browser to the provider you choose. It never passes through any server of ours — there isn't one."}
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
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
          />
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
