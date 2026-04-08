import { z } from "zod";
import { router, protectedProcedure, getTenantId } from "../trpc";
import { db } from "@isyadmin/db";

export const alertRouter = router({
  list: protectedProcedure
    .input(z.object({
      includeRead: z.boolean().default(false),
      includeDismissed: z.boolean().default(false),
    }).optional())
    .query(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const where: any = { tenantId };

      if (!input?.includeRead) where.isRead = false;
      if (!input?.includeDismissed) where.isDismissed = false;

      // Exclude expired alerts
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];

      return db.alert.findMany({
        where,
        orderBy: [
          { severity: "asc" }, // RED first
          { createdAt: "desc" },
        ],
      });
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      await db.alert.updateMany({
        where: { id: input.id, tenantId },
        data: { isRead: true },
      });
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    await db.alert.updateMany({
      where: { tenantId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }),

  dismiss: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      await db.alert.updateMany({
        where: { id: input.id, tenantId },
        data: { isDismissed: true },
      });
      return { success: true };
    }),
});
