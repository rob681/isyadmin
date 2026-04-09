import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runStatementPipeline } from "@isyadmin/api";
import { db } from "@isyadmin/db";

/**
 * Admin-only endpoint to manually reprocess a stuck statement
 * GET /api/admin/reprocess/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Only allow SUPER_ADMIN
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const statement = await db.bankStatement.findUnique({
      where: { id: params.id },
      select: { id: true, tenantId: true, fileName: true, status: true },
    });

    if (!statement) {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 }
      );
    }

    // Reset status and clear errors
    await db.bankStatement.update({
      where: { id: params.id },
      data: {
        status: "UPLOADED",
        errorMessage: null,
        processingStartedAt: null,
        processingCompletedAt: null,
      },
    });

    // Fire and forget
    runStatementPipeline(params.id, statement.tenantId).catch((err) => {
      console.error("[Admin Reprocess Error]", err);
    });

    return NextResponse.json({
      success: true,
      message: `Reprocessing ${statement.fileName}`,
      statementId: params.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error reprocessing statement" },
      { status: 500 }
    );
  }
}
