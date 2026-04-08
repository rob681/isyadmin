import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, getTenantId } from "../trpc";
import { db } from "@isyadmin/db";
import { createAccountSchema } from "@isyadmin/shared";

export const accountRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);

    const accounts = await db.financialAccount.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { statements: true, movements: true } },
      },
    });

    return accounts;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const account = await db.financialAccount.findFirst({
        where: { id: input.id, tenantId },
        include: {
          _count: { select: { statements: true, movements: true } },
        },
      });
      if (!account) return null;
      return account;
    }),

  create: protectedProcedure
    .input(createAccountSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);

      const account = await db.financialAccount.create({
        data: {
          tenantId,
          name: input.name,
          institution: input.institution,
          accountType: input.accountType,
          lastFourDigits: input.lastFourDigits,
          currency: input.currency,
        },
      });

      return account;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        institution: z.string().min(1).optional(),
        accountType: z.enum(["credit_card", "debit", "checking", "savings"]).optional(),
        lastFourDigits: z.string().length(4).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const { id, ...data } = input;

      const account = await db.financialAccount.findFirst({
        where: { id, tenantId },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cuenta no encontrada" });
      }

      await db.financialAccount.update({
        where: { id },
        data,
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);

      const account = await db.financialAccount.findFirst({
        where: { id: input.id, tenantId },
        include: { _count: { select: { movements: true } } },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cuenta no encontrada" });
      }

      if (account._count.movements > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No puedes eliminar una cuenta con movimientos. Desactívala en su lugar.",
        });
      }

      await db.financialAccount.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Summary: balance per account for dashboard
  summary: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const accounts = await db.financialAccount.findMany({
      where: { tenantId, isActive: true },
    });

    const summaries = [];

    for (const account of accounts) {
      const movements = await db.movement.findMany({
        where: {
          tenantId,
          accountId: account.id,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { amount: true, type: true },
      });

      let income = 0;
      let expenses = 0;
      for (const m of movements) {
        const amt = Number(m.amount);
        if (m.type === "ABONO") income += amt;
        else expenses += amt;
      }

      summaries.push({
        id: account.id,
        name: account.name,
        institution: account.institution,
        accountType: account.accountType,
        lastFourDigits: account.lastFourDigits,
        income,
        expenses,
        balance: income - expenses,
        movementCount: movements.length,
      });
    }

    return summaries;
  }),
});
