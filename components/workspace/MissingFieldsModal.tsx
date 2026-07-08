"use client";

import { useState } from "react";
import Modal from "../ui/Modal";

function prettifyField(field: string): string {
  const withSpaces = field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export default function MissingFieldsModal({
  message,
  fields,
  onSubmit,
  onClose,
}: {
  message: string;
  fields: string[];
  onSubmit: (values: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f, ""]))
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filled = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v.trim().length > 0)
    );
    if (Object.keys(filled).length === 0) return;
    onSubmit(filled);
  }

  return (
    <Modal title="A few details are missing" onClose={onClose}>
      <p className="mb-4 text-sm text-granite">{message}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        {fields.map((field) => (
          <div key={field}>
            <label className="mb-1 block text-xs font-medium text-granite">
              {prettifyField(field)}
            </label>
            <input
              type="text"
              value={values[field] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field]: e.target.value }))
              }
              className="w-full rounded-md border border-black/10 px-3 py-2 text-sm"
              autoFocus={field === fields[0]}
            />
          </div>
        ))}
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
            className="rounded-full bg-lobster-pink px-4 py-2 text-sm font-semibold text-white hover:bg-[#a8555a]"
          >
            Continue
          </button>
        </div>
      </form>
    </Modal>
  );
}
