import { sanitizeDocumentHtml } from "./sanitizeHtml";

// Direct .pdf download via jsPDF's html rasterizer. Fails on some modern CSS
// (html2canvas limitation) — callers surface that error and point users to
// printHtml() below, which always works.
export function exportHtmlToPdf(html: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const safeHtml = sanitizeDocumentHtml(html);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = "800px";
    iframe.style.height = "1130px";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    // jsPDF's html module appends a full-viewport overlay (.html2pdf__overlay,
    // fixed, right:0/top:0/bottom:0, z-index 1000) and html2canvas appends a
    // clone iframe. On the error path jsPDF never removes them, leaving an
    // invisible layer that swallows every click — the app "freezes" until a
    // refresh. Sweep them on every completion, success or failure.
    const sweepArtifacts = () => {
      document
        .querySelectorAll(".html2pdf__overlay, .html2pdf__container, .html2canvas-container")
        .forEach((el) => el.remove());
    };

    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      sweepArtifacts();
      // Second pass for stragglers appended asynchronously mid-crash.
      setTimeout(sweepArtifacts, 500);
    };

    const fail = (err?: unknown) => {
      cleanup();
      reject(
        err instanceof Error
          ? err
          : new Error(
              "Direct download couldn't render this document (its styling uses features the rasterizer doesn't support). Use the Print button and choose \"Save as PDF\" instead."
            )
      );
    };

    iframe.onload = () => {
      const doc = iframe.contentDocument;
      const body = doc?.body;
      if (!doc || !body) {
        fail(new Error("Could not render the document for export."));
        return;
      }

      void import("jspdf").then(({ jsPDF }) => {
        const pdf = new jsPDF("p", "pt", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const sourceWidth = body.scrollWidth || 800;
        pdf
          .html(body, {
            width: pageWidth,
            windowWidth: sourceWidth,
            html2canvas: { scale: 0.75, useCORS: true },
            autoPaging: "text",
          })
          .then(() => {
            pdf.save(filename);
            cleanup();
            resolve();
          })
          .catch(() => fail());
      }).catch(fail);
    };

    // Scripts are disabled even after sanitization (defense in depth). Same-origin
    // is required so jsPDF can read the rendered document.
    iframe.sandbox.add("allow-same-origin");
    iframe.srcdoc = safeHtml;
  });
}

// Print / save-as-PDF via a dedicated window. Isolated from the app's window,
// so the print dialog can never leave the app in a frozen "printing" state
// (which is what happens when printing from a hidden same-window iframe).
export function printHtml(html: string): void {
  const safeHtml = sanitizeDocumentHtml(html);
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error("Your browser blocked the print window — allow pop-ups for this site.");
  }
  win.opener = null;
  win.document.open();
  win.document.write(safeHtml);
  win.document.close();

  const doPrint = () => {
    win.focus();
    win.print();
  };
  // Fire once the new window has laid the document out.
  if (win.document.readyState === "complete") {
    setTimeout(doPrint, 150);
  } else {
    win.addEventListener("load", () => setTimeout(doPrint, 150));
  }
}
