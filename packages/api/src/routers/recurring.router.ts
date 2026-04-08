import { z } from "zod";
import { router, protectedProcedure, getTenantId } from "../trpc";
import { db } from "@isyadmin/db";
import { createRecurringSchema } from "@isyadmin/shared";

export const recurringRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    const items = await db.recurringItem.findMany({
      where: { tenantId, isActive: true },
      orderBy: { nextExpectedDate: "asc" },
    });

    return items.map((i) => ({
      ...i,
      estimatedAmount: Number(i.estimatedAmount),
    }));
  }),

  subscriptions: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    const items = await db.recurringItem.findMany({
      where: { tenantId, isActive: true, isSubscription: true },
      orderBy: { nextExpectedDate: "asc" },
    });
    return items.map((i) => ({ ...i, estimatedAmount: Number(i.estimatedAmount) }));
  }),

  services: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    const items = await db.recurringItem.findMany({
      where: { tenantId, isActive: true, isService: true },
      orderBy: { nextExpectedDate: "asc" },
    });
    return items.map((i) => ({ ...i, estimatedAmount: Number(i.estimatedAmount) }));
  }),

  installments: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    const items = await db.installment.findMany({
      where: { tenantId, isActive: true },
      orderBy: { estimatedEndDate: "asc" },
    });
    return items.map((i) => ({
      ...i,
      totalAmount: Number(i.totalAmount),
      monthlyAmount: Number(i.monthlyAmount),
    }));
  }),

  create: protectedProcedure
    .input(createRecurringSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      return db.recurringItem.create({
        data: {
          tenantId,
          name: input.name,
          estimatedAmount: input.estimatedAmount,
          frequency: input.frequency as any,
          scope: input.scope as any,
          isSubscription: input.isSubscription,
          isService: input.isService,
          nextExpectedDate: input.nextExpectedDate ? new Date(input.nextExpectedDate) : null,
          autoDetected: false,
        },
      });
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      await db.recurringItem.updateMany({
        where: { id: input.id, tenantId },
        data: { isActive: false },
      });
      return { success: true };
    }),
});
