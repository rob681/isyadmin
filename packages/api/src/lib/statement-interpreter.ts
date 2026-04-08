import { askClaude } from "./claude";
import { PipelineError } from "./pdf-extractor";

export interface InterpretedMovement {
  date: string;
  originalDescription: string;
  description: string;
  amount: number;
  type:
    | "CARGO"
    | "ABONO"
    | "COMISION"
    | "INTERES"
    | "PAGO"
    | "MSI"
    | "DOMICILIACION";
  merchantName: string | null;
  isRecurring: boolean;
  isSubscription: boolean;
  isService: boolean;
  isLoan: boolean;
  isInstallment: boolean;
  totalInstallments: number | null;
  remainingInstallments: number | null;
  confidence: number;
}

export interface InterpretedStatement {
  institution: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cutoffDate: string | null;
  paymentDueDate: string | null;
  currentBalance: number | null;
  minimumPayment: number | null;
  noInterestPayment: number | null;
  movements: InterpretedMovement[];
}

const SYSTEM_PROMPT = `Eres un experto en estados de cuenta bancarios mexicanos (BBVA, Citibanamex, Banorte, HSBC, Santander, Scotiabank, Nu, Hey Banco, Inbursa).
Tu tarea es extraer información estructurada del texto de un estado de cuenta.
Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones, sin code fences.
Usa fechas en formato ISO: "YYYY-MM-DD".
Los montos siempre son números positivos (sin signo negativo).
Si no puedes determinar un valor, usa null.`;

function buildUserPrompt(rawText: string): string {
  // Truncate to ~12000 chars to stay within efficient token usage
  const text = rawText.length > 12000 ? rawText.slice(0, 12000) : rawText;

  return `Analiza el siguiente texto de estado de cuenta bancario mexicano y extrae la información.

TEXTO DEL ESTADO DE CUENTA:
---
${text}
---

Devuelve EXACTAMENTE este JSON (sin campos adicionales):
{
  "institution": "BBVA" | "Citibanamex" | "Banorte" | "HSBC" | "Santander" | "Scotiabank" | "Nu" | "Hey Banco" | null,
  "periodStart": "YYYY-MM-DD" | null,
  "periodEnd": "YYYY-MM-DD" | null,
  "cutoffDate": "YYYY-MM-DD" | null,
  "paymentDueDate": "YYYY-MM-DD" | null,
  "currentBalance": number | null,
  "minimumPayment": number | null,
  "noInterestPayment": number | null,
  "movements": [
    {
      "date": "YYYY-MM-DD",
      "originalDescription": "texto exacto del PDF",
      "description": "nombre normalizado del comercio o descripción limpia",
      "amount": 1234.56,
      "type": "CARGO" | "ABONO" | "COMISION" | "INTERES" | "PAGO" | "MSI" | "DOMICILIACION",
      "merchantName": "Netflix" | null,
      "isRecurring": false,
      "isSubscription": false,
      "isService": false,
      "isLoan": false,
      "isInstallment": false,
      "totalInstallments": null,
      "remainingInstallments": null,
      "confidence": 0.95
    }
  ]
}

REGLAS PARA TIPO:
- CARGO: compra normal, retiro, transferencia saliente, cobro
- ABONO: depósito, transferencia entrante, devolución
- PAGO: pago de tarjeta de crédito (línea que dice "PAGO RECIBIDO", "PAGO GRACIAS", "SU PAGO")
- COMISION: cobro de anualidad, comisión por servicio bancario, comisión por consulta
- INTERES: cargo de intereses ordinarios, moratorios, IVA de intereses
- MSI: compra a meses sin intereses (busca "MSI", "meses sin intereses", fraccionamiento)
- DOMICILIACION: cargo domiciliado automático (CFE, Telmex, seguros, Netflix, Spotify, etc.)

REGLAS PARA FLAGS:
- isRecurring: aparece mensualmente (Netflix, Spotify, CFE, seguros, etc.)
- isSubscription: es una suscripción digital (Netflix, Spotify, Adobe, Disney+, etc.)
- isService: servicio de utilidad (CFE, agua, gas, internet, teléfono)
- isInstallment: MSI o préstamo en mensualidades (incluir totalInstallments y remainingInstallments si están disponibles)
- isLoan: préstamo bancario o crédito de nómina

REGLAS PARA CONFIDENCE:
- 0.9-1.0: fecha, monto y descripción claramente legibles
- 0.7-0.9: algún dato requirió inferencia menor
- 0.5-0.7: descripción ambigua o monto inferido del contexto
- <0.5: dato muy incierto, posiblemente mal extraído

IMPORTANTE: Los estados de cuenta mexicanos suelen mostrar cargos como valores positivos o negativos dependiendo del banco. Convierte SIEMPRE a positivo. El tipo (CARGO/ABONO) indica la dirección del movimiento.`;
}

function cleanJsonResponse(response: string): string {
  return response
    .replace(/^```json\s*\n?/i, "")
    .replace(/\n?\s*```$/i, "")
    .trim();
}

export async function interpretStatement(
  rawText: string
): Promise<InterpretedStatement> {
  let response: string;

  try {
    response = await askClaude(SYSTEM_PROMPT, buildUserPrompt(rawText), {
      maxTokens: 8192,
      temperature: 0.1,
    });
  } catch (err) {
    throw new PipelineError(
      "CLAUDE_PARSE_ERROR",
      "El servicio de IA no está disponible en este momento. Intenta en unos minutos.",
      err
    );
  }

  const cleaned = cleanJsonResponse(response);

  let parsed: InterpretedStatement;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new PipelineError(
      "CLAUDE_PARSE_ERROR",
      "No se pudo interpretar el estado de cuenta. El formato puede no ser compatible."
    );
  }

  // Basic validation
  if (!parsed || typeof parsed !== "object") {
    throw new PipelineError(
      "CLAUDE_PARSE_ERROR",
      "La respuesta de IA no tiene el formato esperado."
    );
  }

  // Ensure movements is an array
  if (!Array.isArray(parsed.movements)) {
    parsed.movements = [];
  }

  // Sanitize each movement
  parsed.movements = parsed.movements
    .filter((m) => m && m.date && m.amount != null)
    .map((m) => ({
      date: m.date,
      originalDescription: m.originalDescription || m.description || "",
      description: m.description || m.originalDescription || "",
      amount: Math.abs(Number(m.amount) || 0),
      type: m.type || "CARGO",
      merchantName: m.merchantName || null,
      isRecurring: Boolean(m.isRecurring),
      isSubscription: Boolean(m.isSubscription),
      isService: Boolean(m.isService),
      isLoan: Boolean(m.isLoan),
      isInstallment: Boolean(m.isInstallment),
      totalInstallments: m.totalInstallments ?? null,
      remainingInstallments: m.remainingInstallments ?? null,
      confidence: typeof m.confidence === "number" ? m.confidence : 0.5,
    }));

  return parsed;
}
