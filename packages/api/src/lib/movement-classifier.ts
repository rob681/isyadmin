import { askClaude } from "./claude";

export interface ClassificationInput {
  movementIndex: number;
  description: string;
  originalDescription: string;
  amount: number;
  type: string;
  merchantName: string | null;
}

export interface ClassificationResult {
  movementIndex: number;
  categoryId: string | null;
  subcategoryId: string | null;
  confidence: number;
  isDeductible?: boolean;
}

export interface CategoryForClassification {
  id: string;
  name: string;
  type: string;
  subcategories: { id: string; name: string }[];
}

const SYSTEM_PROMPT = `Eres un clasificador de gastos financieros para usuarios mexicanos.
Asigna cada movimiento a la categoría y subcategoría más apropiada del catálogo dado.
Responde ÚNICAMENTE con un array JSON, sin markdown, sin code fences, sin explicaciones.`;

function buildUserPrompt(
  movements: ClassificationInput[],
  categories: CategoryForClassification[]
): string {
  const compactMovements = movements.map((m) => ({
    i: m.movementIndex,
    d: m.description,
    o: m.originalDescription,
    a: m.amount,
    t: m.type,
    m: m.merchantName,
  }));

  return `Clasifica cada movimiento usando el catálogo de categorías.

CATEGORÍAS:
${JSON.stringify(categories)}

MOVIMIENTOS:
${JSON.stringify(compactMovements)}

Devuelve EXACTAMENTE un array JSON (un objeto por movimiento, mismo orden):
[{"movementIndex":0,"categoryId":"id"|null,"subcategoryId":"id"|null,"confidence":0.0-1.0}]

REGLAS:
- ABONO/PAGO → busca categorías tipo "INGRESO"
- CARGO/COMISION/INTERES/MSI/DOMICILIACION → busca categorías tipo "EGRESO" o "FINANCIERO"
- Si es COMISION → categoría "Comisiones bancarias"
- Si es INTERES → categoría "Intereses"
- Si es PAGO de tarjeta → categoría "Pago de tarjeta"
- Si no hay coincidencia → null para categoryId y subcategoryId
- confidence = qué tan seguro estás de la clasificación`;
}

function cleanJsonResponse(response: string): string {
  return response
    .replace(/^```json\s*\n?/i, "")
    .replace(/\n?\s*```$/i, "")
    .trim();
}

export async function classifyMovements(
  movements: ClassificationInput[],
  categories: CategoryForClassification[]
): Promise<ClassificationResult[]> {
  if (movements.length === 0) return [];

  // Process in chunks of 60 to avoid token overflow
  const CHUNK_SIZE = 60;
  const results: ClassificationResult[] = [];

  for (let i = 0; i < movements.length; i += CHUNK_SIZE) {
    const chunk = movements.slice(i, i + CHUNK_SIZE);

    try {
      const response = await askClaude(
        SYSTEM_PROMPT,
        buildUserPrompt(chunk, categories),
        { maxTokens: 4096, temperature: 0.1 }
      );

      const cleaned = cleanJsonResponse(response);
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          results.push({
            movementIndex: item.movementIndex ?? item.i ?? 0,
            categoryId: item.categoryId || null,
            subcategoryId: item.subcategoryId || null,
            confidence:
              typeof item.confidence === "number" ? item.confidence : 0.5,
          });
        }
      } else {
        // Fallback: return nulls for this chunk
        for (const m of chunk) {
          results.push({
            movementIndex: m.movementIndex,
            categoryId: null,
            subcategoryId: null,
            confidence: 0,
          });
        }
      }
    } catch {
      // Classification failure is non-fatal — return nulls for this chunk
      for (const m of chunk) {
        results.push({
          movementIndex: m.movementIndex,
          categoryId: null,
          subcategoryId: null,
          confidence: 0,
        });
      }
    }
  }

  return results;
}

// Detecta gastos deducibles para personas/negocios en México
export function detectDeductible(
  description: string,
  type: string,
  merchantName: string | null,
  scope: string
): boolean {
  // Solo aplica a gastos (CARGO, COMISIÓN, INTERÉS) y en scope NEGOCIO
  if (type !== "CARGO" && type !== "COMISION" && type !== "INTERES") {
    return false;
  }

  if (scope !== "NEGOCIO") {
    return false;
  }

  // Conversión a minúsculas para búsqueda insensible a mayúsculas
  const fullText = `${description} ${merchantName || ""}`.toLowerCase();

  // Categorías claramente deducibles para negocios en MX
  const deductibleKeywords = [
    // Tecnología y software
    "software", "saas", "subscription", "cloud", "hosting", "dominio",
    "stripe", "paypal", "google workspace", "microsoft 365", "adobe",

    // Oficina y equipamiento
    "oficina", "mueble", "escritorio", "silla", "estantería", "estante",
    "computadora", "laptop", "monitor", "teclado", "mouse", "impresora",

    // Servicios profesionales
    "contador", "abogado", "consultor", "asesor", "consultoría", "auditor",
    "gestoría", "notario", "traductor",

    // Transporte y viáticos
    "uber", "lyft", "taxi", "gasolina", "combustible", "transporte",
    "pasaje", "boleto", "vuelo", "hotel", "hospedaje",

    // Publicidad y marketing
    "facebook ads", "google ads", "publicidad", "marketing", "anuncio",
    "seo", "sem", "redes sociales", "instagram", "linkedin",

    // Servicios de comunicación
    "teléfono", "internet", "llamadas", "mensajes", "teleconferencia",

    // Seguros y servicios financieros
    "seguro", "póliza", "cobertura",

    // Educación profesional
    "curso", "capacitación", "certificación", "entrenamiento", "udemy",
    "coursera", "skillshare",

    // Servicios de contabilidad y administración
    "contabilidad", "facturación", "nómina", "rh", "recursos humanos",
    "quickbooks", "xero", "sat", "factur",
  ];

  return deductibleKeywords.some((keyword) => fullText.includes(keyword));
}
