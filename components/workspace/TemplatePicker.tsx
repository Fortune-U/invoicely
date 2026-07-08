"use client";

import type { TemplateId } from "../../lib/types";
import { TEMPLATES } from "../../lib/templates";

const SWATCHES: Record<TemplateId, string[]> = {
  minimal: ["#c1666b", "#4e6766", "#ffffff"],
  modern: ["#4a051c", "#a5c882", "#f7dd72"],
  bold: ["#c1666b", "#4a051c", "#f7dd72"],
};

export default function TemplatePicker({
  value,
  onChange,
}: {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`rounded-lg border p-2 text-left transition-colors ${
            value === id
              ? "border-lobster-pink bg-lobster-pink/5"
              : "border-black/10 hover:border-black/20"
          }`}
        >
          <div className="mb-1.5 flex h-3 overflow-hidden rounded-sm">
            {SWATCHES[id].map((c) => (
              <span key={c} className="flex-1" style={{ background: c }} />
            ))}
          </div>
          <span className="text-xs font-medium text-[#2a2a2a]">
            {TEMPLATES[id].label}
          </span>
        </button>
      ))}
    </div>
  );
}
