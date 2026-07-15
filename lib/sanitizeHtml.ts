const BLOCKED_ELEMENTS = [
  "script",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "applet",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "base",
  "link",
  "meta",
  "audio",
  "video",
  "source",
  "track",
  "svg",
  "math",
];

function safeCss(css: string): string {
  return css
    .replace(/@import[\s\S]*?(?:;|$)/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/-moz-binding\s*:[^;}]*/gi, "")
    .replace(/behavior\s*:[^;}]*/gi, "");
}

function isSafeLink(value: string): boolean {
  const compact = value.replace(/[\u0000-\u0020]/g, "").toLowerCase();
  return (
    compact.startsWith("https://") ||
    compact.startsWith("http://") ||
    compact.startsWith("mailto:") ||
    compact.startsWith("#") ||
    compact.startsWith("/")
  );
}

/**
 * Sanitizes model-produced documents before they cross a browser rendering
 * boundary. Generated documents are styling artifacts, never applications:
 * active content, forms, embeds, external assets, and event handlers are removed.
 */
export function sanitizeDocumentHtml(html: string): string {
  if (typeof DOMParser === "undefined") {
    throw new Error("Document sanitization is only available in the browser.");
  }

  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed.querySelectorAll(BLOCKED_ELEMENTS.join(",")).forEach((node) => node.remove());

  parsed.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (
        name.startsWith("on") ||
        ["srcdoc", "formaction", "action", "ping", "poster", "background"].includes(name)
      ) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (name === "style") {
        element.setAttribute("style", safeCss(attribute.value));
      }
      if (name === "href" && !isSafeLink(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
      // Generated documents do not need remote images. Data images are retained
      // for future user-supplied logos without allowing network beacons.
      if (name === "src" && !attribute.value.toLowerCase().startsWith("data:image/")) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  parsed.querySelectorAll("style").forEach((style) => {
    style.textContent = safeCss(style.textContent ?? "");
  });
  parsed.querySelectorAll("a[target='_blank']").forEach((link) => {
    link.setAttribute("rel", "noopener noreferrer");
  });

  return `<!DOCTYPE html>\n${parsed.documentElement.outerHTML}`;
}
