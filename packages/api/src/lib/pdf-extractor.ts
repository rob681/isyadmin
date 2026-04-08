import pdfParse from "pdf-parse";

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
}

export async function extractPdfText(
  buffer: Buffer
): Promise<PdfExtractionResult> {
  try {
    const data = await pdfParse(buffer, { max: 0 });

    if (!data.text || data.text.trim().length < 50) {
      throw new PipelineError(
        "EMPTY_EXTRACTION",
        "El PDF parece ser una imagen escaneada o no contiene texto suficiente. Por favor sube un estado de cuenta digital (no escaneado)."
      );
    }

    return {
      text: data.text,
      pages: data.numpages,
      info: data.info ?? {},
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
