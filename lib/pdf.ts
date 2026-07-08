import { jsPDF } from "jspdf";

export function exportHtmlToPdf(html: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = "800px";
    iframe.style.height = "1130px";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    iframe.onload = () => {
      const doc = iframe.contentDocument;
      const body = doc?.body;
      if (!doc || !body) {
        cleanup();
        reject(new Error("Could not render invoice for export."));
        return;
      }

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
        .catch((err: unknown) => {
          cleanup();
          reject(err instanceof Error ? err : new Error("PDF export failed."));
        });
    };

    iframe.srcdoc = html;
  });
}
