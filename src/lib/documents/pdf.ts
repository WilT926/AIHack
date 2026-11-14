// Browser-only: reads a PDF file with pdf.js and returns its text, laid out
// with blank lines between paragraphs, ready for buildDocument().
// The file never leaves the browser.

import { pagesToText, type PdfTextItem } from "./pdfLayout";

export const MAX_PDF_BYTES = 25 * 1024 * 1024;

export class PdfReadError extends Error {
  constructor(
    message: string,
    readonly reason: "too-large" | "not-pdf" | "password" | "no-text" | "unreadable",
  ) {
    super(message);
  }
}

let workerReady: Promise<typeof import("pdfjs-dist")> | undefined;

/** Load pdf.js once, with its worker, only when a PDF is actually opened. */
function loadPdfJs() {
  workerReady ??= import("pdfjs-dist").then((pdfjs) => {
    if (!pdfjs.GlobalWorkerOptions.workerPort) {
      pdfjs.GlobalWorkerOptions.workerPort = new Worker(
        new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
        { type: "module" },
      );
    }
    return pdfjs;
  });
  return workerReady;
}

export async function extractPdfText(
  file: File,
  onProgress?: (page: number, pages: number) => void,
): Promise<{ text: string; pages: number }> {
  if (file.size > MAX_PDF_BYTES) {
    throw new PdfReadError("That PDF is over 25 MB. Try exporting just the chapter you want reviewed.", "too-large");
  }
  if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new PdfReadError("That file isn't a PDF. Upload a PDF or paste the text instead.", "not-pdf");
  }

  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());

  const loadingTask = pdfjs.getDocument({ data });
  let pdf;
  try {
    pdf = await loadingTask.promise;
  } catch (err) {
    void loadingTask.destroy();
    if (err instanceof Error && err.name === "PasswordException") {
      throw new PdfReadError("That PDF is password-protected. Remove the password or paste the text instead.", "password");
    }
    throw new PdfReadError("We couldn't read that PDF. Try pasting the text instead.", "unreadable");
  }

  try {
    const pages: PdfTextItem[][] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      const items: PdfTextItem[] = [];
      for (const it of content.items) {
        if (!("str" in it)) continue; // marked-content markers
        const [, , , , x, y] = it.transform as number[];
        items.push({ str: it.str, x, y, width: it.width, height: it.height, hasEOL: it.hasEOL });
      }
      pages.push(items);
      page.cleanup();
      onProgress?.(n, pdf.numPages);
    }

    const text = pagesToText(pages);
    if (!text.trim()) {
      throw new PdfReadError(
        "This PDF has no selectable text (it may be a scan). Paste the text instead.",
        "no-text",
      );
    }
    return { text, pages: pdf.numPages };
  } finally {
    void loadingTask.destroy(); // frees the document and its memory
  }
}
