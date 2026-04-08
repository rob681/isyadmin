import { router, protectedProcedure, getTenantId } from "../trpc";
import { db } from "@isyadmin/db";
import { calculateHealth } from "../lib/health-calculator";

export const healthRouter = router({
  current: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    return calculateHealth(tenantId);
  }),

  history: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    const snapshots = await db.healthSnapshot.findMany({
      where: { tenantId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
    });

    return snapshots.map((s) => ({
      ...s,
      totalIncome: Number(s.totalIncome),
      totalExpenses: Number(s.totalExpenses),
      upcomingPayments: Number(s.upcomingPayments),
    }));
  }),
});
