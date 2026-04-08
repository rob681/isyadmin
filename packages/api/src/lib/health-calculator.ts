import { db } from "@isyadmin/db";
import type { HealthResult, HealthLevel } from "@isyadmin/shared";

export async function calculateHealth(tenantId: string): Promise<HealthResult> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Current month movements
  const movements = await db.movement.findMany({
    where: { tenantId, date: { gte: startOfMonth, lte: endOfMonth } },
    select: { amount: true, type: true },
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const m of movements) {
    const amt = Number(m.amount);
    if (m.type === "ABONO") totalIncome += amt;
    else totalExpenses += amt;
  }

  // Overdue payments (statements past due date)
  const overdueStatements = await db.bankStatement.count({
    where: {
      tenantId,
      paymentDueDate: { lt: now },
      status: "CONFIRMED",
    },
  });

  // Active installments monthly commitment
  const installments = await db.installment.findMany({
    where: { tenantId, isActive: true },
    select: { monthlyAmount: true },
  });
  const monthlyInstallments = installments.reduce((sum, i) => sum + Number(i.monthlyAmount), 0);

  // Upcoming payments in 7 days
  const upcomingRecurring = await db.recurringItem.findMany({
    where: { tenantId, isActive: true, nextExpectedDate: { gte: now, lte: in7Days } },
    select: { estimatedAmount: true },
  });
  const upcomingPayments7d = upcomingRecurring.reduce((sum, r) => sum + Number(r.estimatedAmount), 0);

  // 3-month average spending
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const pastMovements = await db.movement.findMany({
    where: {
      tenantId,
      date: { gte: threeMonthsAgo, lt: startOfMonth },
      type: { not: "ABONO" },
    },
    select: { amount: true },
  });
  const avgExpenses = pastMovements.length > 0
    ? pastMovements.reduce((sum, m) => sum + Number(m.amount), 0) / 3
    : totalExpenses; // If no history, use current month

  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
  const spendingVsAverage = avgExpenses > 0 ? totalExpenses / avgExpenses : 1;

  // Calculate score
  let score = 100;
  const factors: string[] = [];

  // 1. Overdue payments (-30 max)
  if (overdueStatements > 0) {
    score -= Math.min(overdueStatements * 15, 30);
    factors.push(`Tienes ${overdueStatements} pago(s) vencido(s)`);
  }

  // 2. Debt ratio (-25 max)
  if (totalIncome > 0) {
    const debtRatio = monthlyInstallments / totalIncome;
    if (debtRatio > 0.40) {
      score -= 25;
      factors.push("Más del 40% de tus ingresos se van en deudas");
    } else if (debtRatio > 0.30) {
      score -= 15;
      factors.push("El 30-40% de tus ingresos se van en deudas");
    } else if (debtRatio > 0.20) {
      score -= 5;
    }
  }

  // 3. Savings rate (-20 max)
  if (savingsRate < 0) {
    score -= 20;
    factors.push("Estás gastando más de lo que ganas");
  } else if (savingsRate < 0.05) {
    score -= 12;
    factors.push("Tu margen de ahorro es muy bajo (menos del 5%)");
  } else if (savingsRate < 0.10) {
    score -= 5;
  }

  // 4. Spending vs average (-15 max)
  if (spendingVsAverage > 1.50) {
    score -= 15;
    factors.push("Estás gastando 50% más que tu promedio");
  } else if (spendingVsAverage > 1.25) {
    score -= 8;
    factors.push("Estás gastando 25% más que tu promedio");
  }

  // 5. Short-term pressure (-10 max)
  if (totalIncome > 0) {
    const shortTermPressure = upcomingPayments7d / totalIncome;
    if (shortTermPressure > 0.50) {
      score -= 10;
      factors.push("Los pagos de esta semana superan el 50% de tus ingresos");
    } else if (shortTermPressure > 0.30) {
      score -= 5;
    }
  }

  score = Math.max(0, Math.min(100, score));

  const level: HealthLevel = score >= 70 ? "GREEN" : score >= 40 ? "YELLOW" : "RED";
  const summary = generateSummary(level, score, factors);

  return { score, level, summary, factors };
}

function generateSummary(level: HealthLevel, score: number, factors: string[]): string {
  if (level === "GREEN") {
    if (score >= 90) return "Todo en orden. Tus finanzas están saludables y no tienes pagos pendientes.";
    return "Vas bien. Tus gastos están controlados, aunque hay un par de cosas que vigilar.";
  }

  if (level === "YELLOW") {
    if (factors.length === 1) return `Atención: ${factors[0].toLowerCase()}. Nada grave, pero vale la pena revisar.`;
    return `Hay ${factors.length} cosas que necesitan tu atención. Revisa las alertas para mantener el control.`;
  }

  if (factors.some((f) => f.includes("vencido"))) {
    return "Tienes pagos vencidos que necesitas atender hoy. Revisa las alertas urgentes.";
  }
  return "Tus finanzas necesitan atención inmediata. Te recomendamos revisar tus gastos y pagos pendientes.";
}
