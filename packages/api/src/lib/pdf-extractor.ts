import pdfParse from "pdf-parse";
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
  method: "pdf_parse" | "claude_vision";
}

// ── Helper ────────────────────────────────────────────────────────────────────

function isTextSufficient(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= 100 && /\d/.test(trimmed);
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{3,}/g, "  ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

// ── Primary: pdf-parse (reliable in serverless) ───────────────────────────────

async function extractWithPdfParse(
  buffer: Buffer
): Promise<{ text: string; pages: number } | null> {
  try {
    const data = await pdfParse(buffer, { max: 0 });
    if (!data.text) return null;
    return {
      text: cleanText(data.text),
      pages: data.numpages,
    };
  } catch {
    return null;
  }
}

// ── Fallback: Claude reads PDF natively (handles scanned/image PDFs) ──────────

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

// ── Main export ───────────────────────────────────────────────────────────────

export async function extractPdfText(
  buffer: Buffer
): Promise<PdfExtractionResult> {
  // ── Attempt 1: pdf-parse (fast, works in serverless) ──
  const parsed = await extractWithPdfParse(buffer);

  if (parsed && isTextSufficient(parsed.text)) {
    return {
      text: parsed.text,
      pages: parsed.pages,
      info: { method: "pdf_parse" },
      method: "pdf_parse",
    };
  }

  // ── Attempt 2: Claude Vision (handles scanned/image PDFs) ──
  try {
    const claudeText = await extractWithClaudeVision(buffer);

    if (!isTextSufficient(claudeText)) {
      throw new PipelineError(
        "EMPTY_EXTRACTION",
        "El PDF no contiene suficiente texto legible. Asegúrate de que sea un estado de cuenta digital de tu banco."
      );
    }

    return {
      text: cleanText(claudeText),
      pages: parsed?.pages ?? 1,
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
