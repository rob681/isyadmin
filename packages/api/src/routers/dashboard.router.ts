import { router, protectedProcedure, getTenantId } from "../trpc";
import { db } from "@isyadmin/db";
import { calculateHealth } from "../lib/health-calculator";

export const dashboardRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get month's movements
    const movements = await db.movement.findMany({
      where: {
        tenantId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { amount: true, type: true },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const m of movements) {
      const amt = Number(m.amount);
      if (m.type === "ABONO") {
        totalIncome += amt;
      } else {
        totalExpenses += amt;
      }
    }

    const available = totalIncome - totalExpenses;

    // Upcoming payments (next 7 days)
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingRecurring = await db.recurringItem.findMany({
      where: {
        tenantId,
        isActive: true,
        nextExpectedDate: { gte: now, lte: in7Days },
      },
      orderBy: { nextExpectedDate: "asc" },
      take: 10,
    });

    const upcomingStatements = await db.bankStatement.findMany({
      where: {
        tenantId,
        paymentDueDate: { gte: now, lte: in7Days },
        status: "CONFIRMED",
      },
      select: { id: true, institution: true, paymentDueDate: true, minimumPayment: true, noInterestPayment: true },
    });

    let upcomingTotal = 0;
    for (const r of upcomingRecurring) upcomingTotal += Number(r.estimatedAmount);
    for (const s of upcomingStatements) upcomingTotal += Number(s.minimumPayment ?? 0);

    // Health
    const health = await calculateHealth(tenantId);

    // Active alerts
    const alertsCount = await db.alert.count({
      where: { tenantId, isRead: false, isDismissed: false },
    });

    return {
      totalIncome,
      totalExpenses,
      available,
      upcomingTotal,
      health,
      alertsCount,
      upcomingPayments: [
        ...upcomingStatements.map((s) => ({
          id: s.id,
          name: `Tarjeta ${s.institution}`,
          amount: Number(s.minimumPayment ?? 0),
          dueDate: s.paymentDueDate!.toISOString(),
          type: "statement" as const,
        })),
        ...upcomingRecurring.map((r) => ({
          id: r.id,
          name: r.name,
          amount: Number(r.estimatedAmount),
          dueDate: r.nextExpectedDate!.toISOString(),
          type: "recurring" as const,
        })),
      ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    };
  }),

  monthSummary: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    const now = new Date();

    // Last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const movements = await db.movement.findMany({
        where: {
          tenantId,
          date: { gte: date, lte: endDate },
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

      months.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: date.toLocaleDateString("es-MX", { month: "short" }),
        income,
        expenses,
      });
    }

    return months;
  }),
});
