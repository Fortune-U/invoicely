"use client";

import { useState, type ComponentType } from "react";
import { exportHtmlToPdf } from "../../lib/pdf";
import CubesImpl from "../Cubes";

// Cubes is authored in JS with an untyped optional prop inferred as required.
const Cubes = CubesImpl as unknown as ComponentType<{
  gridSize?: number;
  maxAngle?: number;
  radius?: number;
  cellGap?: number;
  borderStyle?: string;
  faceColor?: string;
  rippleColor?: string;
  rippleSpeed?: number;
  autoAnimate?: boolean;
  rippleOnClick?: boolean;
}>;

export default function PreviewPane({
  html,
  invoiceNumber,
  onSave,
  saved,
}: {
  html: string | null;
  invoiceNumber: string | null;
  onSave: () => void;
  saved: boolean;
}) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleDownload() {
    if (!html) return;
    setExporting(true);
    setExportError(null);
    try {
      await exportHtmlToPdf(html, `${invoiceNumber || "invoice"}.pdf`);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Could not export PDF."
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-night-bordeaux">Preview</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!html || saved}
            className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-medium text-granite hover:bg-black/5 disabled:opacity-40"
          >
            {saved ? "Saved" : "Save to history"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!html || exporting}
            className="rounded-full bg-night-bordeaux px-4 py-1.5 text-xs font-semibold text-jasmine hover:bg-[#3a0416] disabled:opacity-40"
          >
            {exporting ? "Exporting…" : "Download PDF"}
          </button>
        </div>
      </div>

      {exportError && (
        <p className="mb-2 text-xs text-lobster-pink">{exportError}</p>
      )}

      <div className="relative flex-1 overflow-hidden rounded-lg border border-black/10 bg-[#faf9f6]">
        {html ? (
          <iframe
            title="Invoice preview"
            srcDoc={html}
            sandbox=""
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-granite">
            Generate an invoice from the form or chat to see a preview here.
          </div>
        )}

        {exporting && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-white/85 backdrop-blur-sm">
            <div className="flex w-64 justify-center">
              <Cubes
                gridSize={4}
                maxAngle={55}
                radius={2.5}
                cellGap={6}
                borderStyle="2px solid #a5c882"
                faceColor="#4a051c"
                rippleColor="#f7dd72"
                rippleSpeed={2}
                autoAnimate
                rippleOnClick={false}
              />
            </div>
            <p className="text-sm font-semibold text-night-bordeaux">
              Building your PDF…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
