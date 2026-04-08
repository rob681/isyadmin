import { getClaudeClient } from "./claude";

// ── Types ────────────────────────────────────────────────────────────────────

export class PipelineError extends Error {
  constructor(
    public code:
      | "CORRUPT_PDF"
      | "EMPTY_EXTRACTION"
      | "CLAUDE_PARSE_ERROR"
      | "CLAUDE_CLASSIFY_ERROR"
      | "DB_ERROR"
      | "DOWNLOAD_ERROR",
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "PipelineError";
  }
}

export interface PdfExtractionResult {
  text: string;
  pages: number;
  info: Record<string, unknown>;
  method: "pdfjs" | "claude_vision";
}

// ── Primary: pdfjs-dist with position-aware text reconstruction ───────────────

async function extractWithPdfJs(
  buffer: Buffer
): Promise<{ text: string; pages: number } | null> {
  try {
    // Dynamic import — pdfjs-dist is marked as serverExternalPackage in next.config.js
    const pdfjsLib = await import("pdfjs-dist" as any);

    // Disable worker for Node.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";

    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
      verbosity: 0,
    });

    const doc = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Filter out empty items, keep only TextItem (not TextMarkedContent)
      const textItems = textContent.items.filter(
        (item: any) => "str" in item && item.str.trim() !== ""
      ) as Array<{ str: string; transform: number[]; hasEOL?: boolean }>;

      if (textItems.length === 0) continue;

      // Sort by Y (descending = top of page first), then X (ascending = left to right)
      // In PDF coordinate space, Y increases upward, so higher Y = higher on page
      textItems.sort((a, b) => {
        const yA = a.transform[5];
        const yB = b.transform[5];
        const yDiff = yB - yA;
        // Items on the same row (within 4pt tolerance)
        if (Math.abs(yDiff) <= 4) {
          return a.transform[4] - b.transform[4];
        }
        return yDiff;
      });

      // Group items into rows based on Y proximity
      const rows: string[][] = [];
      let currentRowY: number | null = null;
      let currentRow: string[] = [];

      for (const item of textItems) {
        const y = item.transform[5];

        if (currentRowY === null || Math.abs(y - currentRowY) > 4) {
          if (currentRow.length > 0) rows.push(currentRow);
          currentRow = [item.str];
          currentRowY = y;
        } else {
          // Detect if there's a significant X gap (column separator)
          const lastItem = textItems[textItems.indexOf(item) - 1];
          const lastWidth = lastItem ? ((lastItem as any).width as number | undefined) ?? 0 : 0;
          const xGap = lastItem
            ? item.transform[4] - (lastItem.transform[4] + lastWidth)
            : 0;
          const separator = xGap > 20 ? "  " : "";
          currentRow.push(separator + item.str);
        }

        if (item.hasEOL) {
          if (currentRow.length > 0) rows.push(currentRow);
          currentRow = [];
          currentRowY = null;
        }
      }
      if (currentRow.length > 0) rows.push(currentRow);

      // Join rows, clean up whitespace
      const pageText = rows
        .map((row) => row.join("").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join("\n");

      pageTexts.push(pageText);
    }

    const text = pageTexts.join("\n\n--- PÁGINA ---\n\n");
    return { text: cleanText(text), pages: doc.numPages };
  } catch {
    return null;
  }
}

// ── Fallback: Claude reads PDF natively (handles scanned PDFs) ────────────────

async function extractWithClaudeVision(buffer: Buffer): Promise<string> {
  const claude = getClaudeClient();

  const response = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: buffer.toString("base64"),
            },
          } as any,
          {
            type: "text",
            text: `Extrae TODO el texto de este estado de cuenta bancario mexicano.
Mantén la estructura original: fechas, descripciones, montos, columnas.
Separa las páginas con "--- PÁGINA ---".
Incluye encabezados, totales, resúmenes y todos los movimientos.
Responde SOLO con el texto extraído, sin comentarios adicionales.`,
          },
        ],
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response from Claude");
  return block.text;
}

// ── Text cleaning ─────────────────────────────────────────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{3,}/g, "  ") // Collapse excessive spaces
    .replace(/\n{4,}/g, "\n\n\n") // Collapse excessive blank lines
    .trim();
}

function isTextSufficient(text: string): boolean {
  const trimmed = text.trim();
  // Need at least 100 chars and some numeric content (amounts)
  return trimmed.length >= 100 && /\d/.test(trimmed);
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function extractPdfText(
  buffer: Buffer
): Promise<PdfExtractionResult> {
  // ── Attempt 1: pdfjs-dist (fast, free, works for digital PDFs) ──
  const pdfjsResult = await extractWithPdfJs(buffer);

  if (pdfjsResult && isTextSufficient(pdfjsResult.text)) {
    return {
      text: pdfjsResult.text,
      pages: pdfjsResult.pages,
      info: { method: "pdfjs" },
      method: "pdfjs",
    };
  }

  // ── Attempt 2: Claude Vision fallback (handles scanned/image PDFs) ──
  try {
    const claudeText = await extractWithClaudeVision(buffer);

    if (!isTextSufficient(claudeText)) {
      throw new PipelineError(
        "EMPTY_EXTRACTION",
        "El PDF no contiene suficiente texto legible. Asegúrate de que sea un estado de cuenta digital de tu banco."
      );
    }

    return {
      text: claudeText,
      pages: pdfjsResult?.pages ?? 1,
      info: { method: "claude_vision" },
      method: "claude_vision",
    };
  } catch (err) {
    if (err instanceof PipelineError) throw err;
    throw new PipelineError(
      "CORRUPT_PDF",
      "No se pudo leer el archivo PDF. Puede estar dañado o protegido con contraseña.",
      err
    );
  }
}
