"use client";

import type { PageText } from "./types";

let workerConfigured = false;

async function getPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerConfigured) {
    // CDN worker matches the installed pdfjs-dist version (avoids Next bundler worker issues).
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    workerConfigured = true;
  }
  return pdfjs;
}

/**
 * Extract plain text from each PDF page using pdf.js (client-side).
 * Throws if the PDF has no extractable text (e.g. scanned-only).
 */
export async function extractPdfPages(
  file: File,
  onProgress?: (done: number, total: number) => void
): Promise<PageText[]> {
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: PageText[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const strings: string[] = [];
    for (const item of content.items) {
      if (item && typeof item === "object" && "str" in item) {
        const str = (item as { str: string }).str;
        if (str) strings.push(str);
      }
    }
    const text = strings.join(" ").replace(/\s+/g, " ").trim();
    pages.push({ page: pageNum, text });
    onProgress?.(pageNum, doc.numPages);
  }

  const nonEmpty = pages.filter((p) => p.text.length > 0);
  if (nonEmpty.length === 0) {
    throw new Error(
      "No extractable text found. This PDF may be scanned images only — try a text-based MoE PDF."
    );
  }

  return pages;
}
