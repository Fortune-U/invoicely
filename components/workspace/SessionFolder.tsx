"use client";

import type { ComponentType, ReactNode } from "react";
import FolderImpl from "../Folder";
import { DOC_TYPES, type SessionDoc } from "../../lib/types";

// Folder is authored in JS; its `items = []` default infers never[].
const Folder = FolderImpl as unknown as ComponentType<{
  color?: string;
  size?: number;
  className?: string;
  items?: ReactNode[];
}>;

function timeOf(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function typeLabel(doc: SessionDoc): string {
  return DOC_TYPES.find((d) => d.id === doc.docType)?.label ?? "Invoice";
}

export default function SessionFolder({
  docs,
  activeId,
  onOpen,
}: {
  docs: SessionDoc[];
  activeId: string | null;
  onOpen: (doc: SessionDoc) => void;
}) {
  const papers = docs.slice(0, 3).map((doc) => (
    <button
      key={doc.id}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(doc);
      }}
      className="flex h-full w-full flex-col justify-between overflow-hidden p-1.5 text-left text-[7px] font-bold leading-tight text-granite-800"
    >
      <span className="text-[6px] font-black uppercase tracking-wide text-lobster-pink">
        {typeLabel(doc)}
      </span>
      <span className="truncate">{doc.title}</span>
      <span className="h-1 w-3/4 rounded-full bg-willow-400" />
    </button>
  ));

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-night-bordeaux">
        This session
      </h3>
      <p className="mb-5 text-xs leading-relaxed text-granite">
        Files you generate live here until you close the tab — nothing is
        stored. To continue work later, attach the exported PDF as context.
      </p>

      <div className="flex flex-col items-center gap-5 py-4">
        <Folder size={1.1} color="#c1666b" items={papers} />
        <p className="text-xs font-bold text-granite-800">
          {docs.length === 0
            ? "Empty · 0 files"
            : `${docs.length} file${docs.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {docs.length > 0 && (
        <ul className="mt-2 space-y-1">
          {docs.map((doc) => (
            <li key={doc.id}>
              <button
                type="button"
                onClick={() => onOpen(doc)}
                className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                  activeId === doc.id ? "bg-willow-green/20" : "hover:bg-black/5"
                }`}
              >
                <span className="block truncate font-medium text-[#2a2a2a]">
                  {doc.title}
                </span>
                <span className="text-xs text-granite">
                  {typeLabel(doc)} · {timeOf(doc.createdAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
