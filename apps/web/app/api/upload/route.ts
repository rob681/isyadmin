import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile, runStatementPipeline } from "@isyadmin/api";
import { db } from "@isyadmin/db";
import crypto from "crypto";

const BUCKET = "statements";
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const accountId = formData.get("accountId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "El archivo excede 20 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");
  const tenantId = (session.user as any).tenantId;
  const userId = (session.user as any).id;
  const path = `${tenantId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

  try {
    // 1. Check for duplicate file hash
    if (fileHash) {
      const duplicate = await db.bankStatement.findFirst({
        where: { tenantId, fileHash },
      });
      if (duplicate) {
        return NextResponse.json(
          {
            error: `Este archivo ya fue subido previamente (${duplicate.institution ?? "archivo"})`,
          },
          { status: 409 }
        );
      }
    }

    // 2. Upload to Supabase Storage
    const result = await uploadFile(BUCKET, path, buffer, "application/pdf");

    // 3. Create BankStatement record
    const statement = await db.bankStatement.create({
      data: {
        tenantId,
        uploadedById: userId,
        accountId: accountId || undefined,
        fileName: file.name,
        fileSize: file.size,
        storagePath: result.storagePath,
        fileHash,
        status: "UPLOADED",
      },
    });

    // 4. Trigger pipeline (fire and forget — don't block the response)
    // The frontend will poll for status updates
    runStatementPipeline(statement.id, tenantId).catch((err) => {
      console.error("[Pipeline Error]", err);
    });

    return NextResponse.json({
      statementId: statement.id,
      storagePath: result.storagePath,
      fileName: file.name,
      fileSize: file.size,
      fileHash,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al subir archivo" },
      { status: 500 }
    );
  }
}
