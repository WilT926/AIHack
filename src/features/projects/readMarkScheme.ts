"use client";

// Reads an uploaded mark scheme into criteria. Text and PDFs are parsed in the
// browser; a photo or scan goes to the engine, which reads it with Claude.
import { parseMarkScheme, type ParsedCriterion } from "@/lib/documents/markScheme";
import { extractPdfText, PdfReadError } from "@/lib/documents/pdf";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];
const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024;

export const MARK_SCHEME_ACCEPT = "application/pdf,.pdf,text/plain,.txt,.md,image/png,image/jpeg,image/webp,image/gif";

export class MarkSchemeError extends Error {}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

async function fromImage(file: File, mediaType: ImageType): Promise<ParsedCriterion[]> {
  if (file.size > MAX_IMAGE_BYTES) throw new MarkSchemeError("That image is over 4.5 MB. Try a smaller photo or a screenshot.");
  const res = await fetch("/review/api/markscheme", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mediaType, data: toBase64(await file.arrayBuffer()) }),
  }).catch(() => {
    throw new MarkSchemeError("Couldn't reach the server. Check your connection.");
  });
  const data = (await res.json().catch(() => ({}))) as { criteria?: ParsedCriterion[]; error?: string };
  if (!res.ok) throw new MarkSchemeError(data.error ?? "Couldn't read that image.");
  return data.criteria ?? [];
}

/** Criteria from a file. Throws MarkSchemeError with a message the screen can show. */
export async function readMarkScheme(file: File): Promise<ParsedCriterion[]> {
  const image = IMAGE_TYPES.find((t) => t === file.type);
  let criteria: ParsedCriterion[];
  if (image) {
    criteria = await fromImage(file, image);
  } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    try {
      criteria = parseMarkScheme((await extractPdfText(file)).text);
    } catch (err) {
      throw new MarkSchemeError(err instanceof PdfReadError ? err.message : "Something went wrong reading that PDF.");
    }
  } else {
    criteria = parseMarkScheme(await file.text());
  }
  if (criteria.length === 0) throw new MarkSchemeError("We couldn't find any criteria in that file. Paste them instead, one per line.");
  return criteria;
}
