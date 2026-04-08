import { db } from "@isyadmin/db";
import { downloadFile } from "./supabase-storage";
import { extractPdfText, PipelineError } from "./pdf-extractor";
import { interpretStatement } from "./statement-interpreter";
import {
  classifyMovements,
  detectDeductible,
  type ClassificationInput,
  type CategoryForClassification,
} from "./movement-classifier";

async function logStep(
  statementId: string,
  step: string,
  status: "started" | "completed" | "failed",
  details?: Record<string, unknown>,
  durationMs?: number
) {
  await db.processingLog.create({
    data: {
      statementId,
      step,
      status,
      details: (details as any) ?? undefined,
      durationMs,
    },
  });
}

async function failStatement(
  statementId: string,
  step: string,
  errorMessage: string,
  details?: Record<string, unknown>
) {
  await logStep(statementId, step, "failed", details);
  await db.bankStatement.update({
    where: { id: statementId },
    data: {
      status: "FAILED",
      errorMessage,
      processingCompletedAt: new Date(),
    },
  });
}

export async function runStatementPipeline(
  statementId: string,
  tenantId: string
): Promise<void> {
  // 1. Verify statement exists and belongs to tenant
  const statement = await db.bankStatement.findFirst({
    where: { id: statementId, tenantId },
  });

  if (!statement) {
    throw new PipelineError("DB_ERROR", "Estado de cuenta no encontrado");
  }

  // 2. Start processing
  await db.bankStatement.update({
    where: { id: statementId },
    data: { status: "EXTRACTING", processingStartedAt: new Date() },
  });

  // ─── STEP 1: EXTRACT TEXT ────────────────────────────────
  await logStep(statementId, "extract_text", "started");
  const extractStart = Date.now();

  let rawText: string;
  let pages: number;

  try {
    // storagePath is stored as "statements/tenantId/filename.pdf"
    const bucket = "statements";
    const path = statement.storagePath.replace("statements/", "");
    const buffer = await downloadFile(bucket, path);
    const result = await extractPdfText(buffer);
    rawText = result.text;
    pages = result.pages;
  } catch (err) {
    const message =
      err instanceof PipelineError
        ? err.message
        : "No se pudo descargar o leer el PDF.";
    await failStatement(statementId, "extract_text", message, {
      error: String(err),
    });
    return;
  }

  await db.bankStatement.update({
    where: { id: statementId },
    data: { rawExtractedText: rawText },
  });

  await logStep(statementId, "extract_text", "completed", {
    pages,
    textLength: rawText.length,
  }, Date.now() - extractStart);

  // ─── STEP 2: INTERPRET WITH AI ──────────────────────────
  await db.bankStatement.update({
    where: { id: statementId },
    data: { status: "INTERPRETING" },
  });

  await logStep(statementId, "interpret_statement", "started");
  const interpretStart = Date.now();

  let interpreted;
  try {
    interpreted = await interpretStatement(rawText);
  } catch (err) {
    const message =
      err instanceof PipelineError
        ? err.message
        : "Error al interpretar el estado de cuenta.";
    await failStatement(statementId, "interpret_statement", message, {
      error: String(err),
    });
    return;
  }

  // Save metadata and AI interpretation
  await db.bankStatement.update({
    where: { id: statementId },
    data: {
      aiInterpretation: interpreted as any,
      institution: interpreted.institution,
      periodStart: interpreted.periodStart
        ? new Date(interpreted.periodStart)
        : null,
      periodEnd: interpreted.periodEnd
        ? new Date(interpreted.periodEnd)
        : null,
      cutoffDate: interpreted.cutoffDate
        ? new Date(interpreted.cutoffDate)
        : null,
      paymentDueDate: interpreted.paymentDueDate
        ? new Date(interpreted.paymentDueDate)
        : null,
      currentBalance: interpreted.currentBalance,
      minimumPayment: interpreted.minimumPayment,
      noInterestPayment: interpreted.noInterestPayment,
    },
  });

  await logStep(
    statementId,
    "interpret_statement",
    "completed",
    { movementCount: interpreted.movements.length },
    Date.now() - interpretStart
  );

  // ─── STEP 3: CLASSIFY MOVEMENTS ─────────────────────────
  await db.bankStatement.update({
    where: { id: statementId },
    data: { status: "VALIDATING" },
  });

  await logStep(statementId, "classify_movements", "started");
  const classifyStart = Date.now();

  // Fetch categories from DB for classification
  const categories = await db.category.findMany({
    include: { subcategories: true },
    orderBy: { sortOrder: "asc" },
  });

  const categoriesForClassification: CategoryForClassification[] =
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      subcategories: c.subcategories.map((s) => ({
        id: s.id,
        name: s.name,
      })),
    }));

  const classificationInputs: ClassificationInput[] =
    interpreted.movements.map((m, i) => ({
      movementIndex: i,
      description: m.description,
      originalDescription: m.originalDescription,
      amount: m.amount,
      type: m.type,
      merchantName: m.merchantName,
    }));

  // Classification failure is non-fatal
  let classifications;
  try {
    classifications = await classifyMovements(
      classificationInputs,
      categoriesForClassification
    );
  } catch {
    classifications = classificationInputs.map((m) => ({
      movementIndex: m.movementIndex,
      categoryId: null as string | null,
      subcategoryId: null as string | null,
      confidence: 0,
    }));
  }

  const classifiedCount = classifications.filter(
    (c) => c.categoryId !== null
  ).length;
  await logStep(
    statementId,
    "classify_movements",
    "completed",
    { total: interpreted.movements.length, classified: classifiedCount },
    Date.now() - classifyStart
  );

  // ─── STEP 4: CREATE MOVEMENTS IN DB ─────────────────────
  try {
    const movementsData = interpreted.movements.map((m, i) => {
      const classification = classifications.find(
        (c) => c.movementIndex === i
      );

      // Combined confidence: only factor in classification if it succeeded
      const interpretConfidence = m.confidence;
      const classifyConfidence = classification?.confidence ?? 0;
      const combinedConfidence =
        classification?.categoryId != null && classifyConfidence > 0
          ? Math.min(interpretConfidence, classifyConfidence)
          : interpretConfidence;

      // Detectar si es deductible (para negocio)
      const isDeductible = detectDeductible(
        m.description,
        m.type,
        m.merchantName,
        "PERSONAL" // Siempre PERSONAL en extracciones PDF (no sabemos scope aún)
      );

      return {
        tenantId,
        statementId,
        date: new Date(m.date),
        description: m.description,
        originalDescription: m.originalDescription,
        amount: m.amount,
        type: m.type as any,
        source: "PDF_EXTRACTED" as const,
        scope: "PERSONAL" as const,
        categoryId: classification?.categoryId ?? null,
        subcategoryId: classification?.subcategoryId ?? null,
        merchantName: m.merchantName,
        isRecurring: m.isRecurring,
        isSubscription: m.isSubscription,
        isService: m.isService,
        isLoan: m.isLoan,
        isInstallment: m.isInstallment,
        isDeductible,
        confidenceScore: combinedConfidence,
        aiMetadata: {
          totalInstallments: m.totalInstallments,
          remainingInstallments: m.remainingInstallments,
        } as any,
        userConfirmed: false,
      };
    });

    await db.$transaction([
      db.movement.createMany({ data: movementsData }),
      db.bankStatement.update({
        where: { id: statementId },
        data: {
          status: "REVIEW",
          movementsCount: movementsData.length,
          processingCompletedAt: new Date(),
        },
      }),
    ]);

    await logStep(statementId, "pipeline_complete", "completed", {
      movementsCreated: movementsData.length,
    });
  } catch (err) {
    await failStatement(
      statementId,
      "create_movements",
      "Error interno al guardar los movimientos.",
      { error: String(err) }
    );
  }
}
