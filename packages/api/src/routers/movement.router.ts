import { z } from "zod";
import { router, protectedProcedure, getTenantId } from "../trpc";
import { db } from "@isyadmin/db";
import { createMovementSchema, updateMovementSchema, movementFiltersSchema } from "@isyadmin/shared";
import { detectDeductible } from "../lib/movement-classifier";

export const movementRouter = router({
  list: protectedProcedure
    .input(movementFiltersSchema)
    .query(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const { page, limit, scope, type, categoryId, accountId, dateFrom, dateTo, search } = input;

      const where: any = { tenantId };
      if (scope) where.scope = scope;
      if (type) where.type = type;
      if (categoryId) where.categoryId = categoryId;
      if (accountId) where.accountId = accountId;
      if (dateFrom) where.date = { ...where.date, gte: new Date(dateFrom) };
      if (dateTo) where.date = { ...where.date, lte: new Date(dateTo) };
      if (search) {
        where.OR = [
          { description: { contains: search, mode: "insensitive" } },
          { merchantName: { contains: search, mode: "insensitive" } },
        ];
      }

      const [movements, total] = await Promise.all([
        db.movement.findMany({
          where,
          include: {
            category: { select: { id: true, name: true, icon: true, color: true } },
            subcategory: { select: { id: true, name: true } },
          },
          orderBy: { date: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.movement.count({ where }),
      ]);

      return {
        movements: movements.map((m) => ({
          ...m,
          amount: Number(m.amount),
        })),
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const movement = await db.movement.findFirst({
        where: { id: input.id, tenantId },
        include: {
          category: true,
          subcategory: true,
          statement: { select: { id: true, institution: true, periodStart: true, periodEnd: true } },
          corrections: { orderBy: { createdAt: "desc" } },
        },
      });

      if (!movement) return null;
      return { ...movement, amount: Number(movement.amount) };
    }),

  create: protectedProcedure
    .input(createMovementSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const userId = ctx.session.user.id;

      // Detectar si es deductible
      const isDeductible = detectDeductible(
        input.description,
        input.type,
        input.merchantName ?? null,
        input.scope
      );

      const movement = await db.movement.create({
        data: {
          tenantId,
          createdById: userId,
          date: new Date(input.date),
          description: input.description,
          amount: input.amount,
          type: input.type as any,
          scope: input.scope as any,
          source: "MANUAL",
          categoryId: input.categoryId,
          subcategoryId: input.subcategoryId,
          merchantName: input.merchantName,
          isDeductible,
          notes: input.notes,
          accountId: input.accountId,
          userConfirmed: true,
          confidenceScore: 1.0,
        },
      });

      return { ...movement, amount: Number(movement.amount) };
    }),

  update: protectedProcedure
    .input(updateMovementSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const { id, ...data } = input;

      const existing = await db.movement.findFirst({ where: { id, tenantId } });
      if (!existing) {
        throw new Error("Movimiento no encontrado");
      }

      // Log corrections
      const userId = ctx.session.user.id;
      const corrections: { field: string; oldValue: string; newValue: string }[] = [];

      if (data.categoryId && data.categoryId !== existing.categoryId) {
        corrections.push({ field: "categoryId", oldValue: existing.categoryId ?? "", newValue: data.categoryId });
      }
      if (data.scope && data.scope !== existing.scope) {
        corrections.push({ field: "scope", oldValue: existing.scope, newValue: data.scope });
      }
      if (data.type && data.type !== existing.type) {
        corrections.push({ field: "type", oldValue: existing.type, newValue: data.type });
      }

      const updateData: any = {};
      if (data.date) updateData.date = new Date(data.date);
      if (data.description) updateData.description = data.description;
      if (data.amount) updateData.amount = data.amount;
      if (data.type) updateData.type = data.type;
      if (data.scope) updateData.scope = data.scope;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.subcategoryId !== undefined) updateData.subcategoryId = data.subcategoryId;
      if (data.notes !== undefined) updateData.notes = data.notes;
      updateData.userConfirmed = true;

      await db.$transaction([
        db.movement.update({ where: { id }, data: updateData }),
        ...corrections.map((c) =>
          db.movementCorrection.create({
            data: { movementId: id, userId, ...c },
          })
        ),
      ]);

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      await db.movement.deleteMany({ where: { id: input.id, tenantId } });
      return { success: true };
    }),
});
