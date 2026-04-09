import { NextRequest, NextResponse } from "next/server";
import { db } from "@isyadmin/db";
import { runStatementPipeline } from "@isyadmin/api";

/**
 * Cron job: Reprocess PDFs stuck in UPLOADED status
 * Runs every minute via Vercel Cron
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = req.headers.get("authorization");
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find PDFs stuck in UPLOADED for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const stuckStatements = await db.bankStatement.findMany({
      where: {
        status: "UPLOADED",
        createdAt: { lt: fiveMinutesAgo },
        movementsCount: null, // Only reprocess if not already processed
      },
      select: {
        id: true,
        tenantId: true,
        fileName: true,
      },
      take: 10, // Process max 10 per run
    });

    if (stuckStatements.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stuck statements found",
        processed: 0,
      });
    }

    console.log(`[Cron] Found ${stuckStatements.length} stuck statements to reprocess`);

    const results = [];

    for (const stmt of stuckStatements) {
      try {
        // Reset and reprocess
        await db.bankStatement.update({
          where: { id: stmt.id },
          data: {
            status: "UPLOADED",
            errorMessage: null,
            processingStartedAt: null,
            processingCompletedAt: null,
          },
        });

        // Fire and forget
        runStatementPipeline(stmt.id, stmt.tenantId).catch((err) => {
          console.error(`[Cron] Pipeline error for ${stmt.fileName}:`, err.message);
        });

        results.push({
          id: stmt.id,
          fileName: stmt.fileName,
          status: "reprocessing",
        });

        console.log(`[Cron] Reprocessing: ${stmt.fileName}`);
      } catch (error: any) {
        console.error(`[Cron] Error resetting statement ${stmt.id}:`, error.message);
        results.push({
          id: stmt.id,
          fileName: stmt.fileName,
          status: "error",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reprocessed ${results.length} statements`,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[Cron] Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Cron job failed" },
      { status: 500 }
    );
  }
}
