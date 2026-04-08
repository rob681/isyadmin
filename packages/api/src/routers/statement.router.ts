import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, getTenantId } from "../trpc";
import { db } from "@isyadmin/db";
import { runStatementPipeline } from "../lib/statement-pipeline";

export const statementRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);

    const statements = await db.bankStatement.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        institution: true,
        periodStart: true,
        periodEnd: true,
        status: true,
        movementsCount: true,
        currentBalance: true,
        createdAt: true,
      },
    });

    return statements.map((s) => ({
      ...s,
      currentBalance: s.currentBalance ? Number(s.currentBalance) : null,
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const statement = await db.bankStatement.findFirst({
        where: { id: input.id, tenantId },
        include: {
          movements: {
            include: {
              category: { select: { id: true, name: true, icon: true, color: true } },
              subcategory: { select: { id: true, name: true } },
            },
            orderBy: { date: "asc" },
          },
          logs: { orderBy: { createdAt: "asc" } },
          account: { select: { id: true, name: true, institution: true } },
        },
      });

      if (!statement) return null;

      return {
        ...statement,
        currentBalance: statement.currentBalance ? Number(statement.currentBalance) : null,
        minimumPayment: statement.minimumPayment ? Number(statement.minimumPayment) : null,
        noInterestPayment: statement.noInterestPayment ? Number(statement.noInterestPayment) : null,
        movements: statement.movements.map((m) => ({
          ...m,
          amount: Number(m.amount),
        })),
      };
    }),

  registerUpload: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileSize: z.number(),
      storagePath: z.string(),
      fileHash: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const userId = ctx.session.user.id;

      // Check for duplicate file hash
      if (input.fileHash) {
        const duplicate = await db.bankStatement.findFirst({
          where: { tenantId, fileHash: input.fileHash },
        });
        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Este archivo ya fue subido previamente (${duplicate.institution ?? "archivo"} - ${duplicate.periodStart ? new Date(duplicate.periodStart).toLocaleDateString("es-MX") : "sin fecha"})`,
          });
        }
      }

      const statement = await db.bankStatement.create({
        data: {
          tenantId,
          uploadedById: userId,
          fileName: input.fileName,
          fileSize: input.fileSize,
          storagePath: input.storagePath,
          fileHash: input.fileHash,
          status: "UPLOADED",
        },
      });

      return statement;
    }),

  confirm: protectedProcedure
    .input(z.object({
      statementId: z.string(),
      corrections: z.array(z.object({
        movementId: z.string(),
        field: z.string(),
        newValue: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const userId = ctx.session.user.id;

      const statement = await db.bankStatement.findFirst({
        where: { id: input.statementId, tenantId, status: "REVIEW" },
      });

      if (!statement) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Estado de cuenta no encontrado" });
      }

      // Apply corrections (only allow safe fields)
      const ALLOWED_FIELDS = new Set(["categoryId", "subcategoryId", "description", "type", "scope"]);

      if (input.corrections?.length) {
        for (const corr of input.corrections) {
          if (!ALLOWED_FIELDS.has(corr.field)) continue;

          // Get old value for audit trail
          const existing = await db.movement.findUnique({
            where: { id: corr.movementId },
            select: { [corr.field]: true } as any,
          });

          await db.movementCorrection.create({
            data: {
              movementId: corr.movementId,
              userId,
              field: corr.field,
              oldValue: existing ? String((existing as any)[corr.field] ?? "") : null,
              newValue: corr.newValue,
            },
          });

          await db.movement.update({
            where: { id: corr.movementId },
            data: { [corr.field]: corr.newValue, userConfirmed: true },
          });
        }
      }

      // Mark all movements as confirmed
      await db.movement.updateMany({
        where: { statementId: input.statementId },
        data: { userConfirmed: true },
      });

      await db.bankStatement.update({
        where: { id: input.statementId },
        data: { status: "CONFIRMED" },
      });

      return { success: true };
    }),

  process: protectedProcedure
    .input(z.object({ statementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);

      const statement = await db.bankStatement.findFirst({
        where: { id: input.statementId, tenantId },
        select: { id: true, status: true },
      });

      if (!statement) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Estado de cuenta no encontrado" });
      }

      if (["REVIEW", "CONFIRMED"].includes(statement.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este estado de cuenta ya fue procesado",
        });
      }

      await runStatementPipeline(input.statementId, tenantId);
      return { success: true };
    }),

  getStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const statement = await db.bankStatement.findFirst({
        where: { id: input.id, tenantId },
        select: {
          id: true,
          status: true,
          errorMessage: true,
          movementsCount: true,
          institution: true,
          processingStartedAt: true,
          processingCompletedAt: true,
        },
      });
      if (!statement) throw new TRPCError({ code: "NOT_FOUND" });
      return statement;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);

      // Delete movements first, then statement
      await db.movement.deleteMany({ where: { statementId: input.id, tenantId } });
      await db.bankStatement.deleteMany({ where: { id: input.id, tenantId } });

      return { success: true };
    }),
});
