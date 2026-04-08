import { db } from "@isyadmin/db";

// ── Types ──

export interface Insight {
  id: string;
  icon: string;
  message: string;
  severity: "info" | "warning" | "danger";
  category: "spending" | "income" | "subscription" | "pattern" | "anomaly";
  action?: Action;
}

export interface Prediction {
  days: 7 | 15 | 30;
  projectedBalance: number;
  projectedIncome: number;
  projectedExpenses: number;
  risk: "low" | "medium" | "high";
  warning: string | null;
}

export interface Pattern {
  id: string;
  icon: string;
  message: string;
  type: "habit" | "recurring" | "anomaly" | "trend";
  data?: Record<string, unknown>;
}

export interface Action {
  label: string;
  type: "reduce" | "review" | "cancel" | "adjust" | "save";
  targetCategory?: string;
  potentialSaving?: number;
}

export interface FinancialIntelligence {
  insights: Insight[];
  predictions: Prediction[];
  patterns: Pattern[];
  semaphore: {
    level: "green" | "yellow" | "red";
    score: number;
    explanation: string;
    recommendation: string;
  };
}

// ── Helpers ──

interface MonthData {
  income: number;
  expenses: number;
  byCategory: Map<string, { name: string; total: number; count: number }>;
  byDayOfWeek: number[];
  byType: Map<string, number>;
}

async function getMonthData(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<MonthData> {
  const movements = await db.movement.findMany({
    where: { tenantId, date: { gte: startDate, lte: endDate } },
    include: { category: { select: { name: true } } },
  });

  let income = 0;
  let expenses = 0;
  const byCategory = new Map<string, { name: string; total: number; count: number }>();
  const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const byType = new Map<string, number>();

  for (const m of movements) {
    const amt = Number(m.amount);
    const day = new Date(m.date).getDay();

    if (m.type === "ABONO" || m.type === "PAGO") {
      income += amt;
    } else {
      expenses += amt;
      byDayOfWeek[day] += amt;
    }

    // By category
    if (m.categoryId && m.category) {
      const existing = byCategory.get(m.categoryId);
      if (existing) {
        existing.total += amt;
        existing.count++;
      } else {
        byCategory.set(m.categoryId, { name: m.category.name, total: amt, count: 1 });
      }
    }

    // By type
    byType.set(m.type, (byType.get(m.type) ?? 0) + amt);
  }

  return { income, expenses, byCategory, byDayOfWeek, byType };
}

// ── Module 1: Insights Engine ──

function generateInsights(
  current: MonthData,
  previous: MonthData,
  subscriptions: { name: string; amount: number }[],
  avgExpenses: number
): Insight[] {
  const insights: Insight[] = [];
  let idx = 0;

  // Compare category spending vs previous month
  for (const [catId, data] of current.byCategory) {
    const prev = previous.byCategory.get(catId);
    if (prev && prev.total > 0) {
      const pctChange = ((data.total - prev.total) / prev.total) * 100;
      if (pctChange > 20 && data.total > 500) {
        insights.push({
          id: `cat-spike-${idx++}`,
          icon: "📈",
          message: `Estás gastando ${Math.round(pctChange)}% más en ${data.name} este mes`,
          severity: pctChange > 50 ? "danger" : "warning",
          category: "spending",
          action: {
            label: `Reducir gastos en ${data.name}`,
            type: "reduce",
            targetCategory: data.name,
            potentialSaving: Math.round(data.total - prev.total),
          },
        });
      } else if (pctChange < -20 && prev.total > 500) {
        insights.push({
          id: `cat-drop-${idx++}`,
          icon: "👍",
          message: `Redujiste ${Math.round(Math.abs(pctChange))}% tu gasto en ${data.name}`,
          severity: "info",
          category: "spending",
        });
      }
    }
  }

  // Subscription count
  if (subscriptions.length >= 3) {
    const totalSubs = subscriptions.reduce((s, x) => s + x.amount, 0);
    insights.push({
      id: `subs-${idx++}`,
      icon: "🔄",
      message: `Tienes ${subscriptions.length} suscripciones activas ($${Math.round(totalSubs)}/mes)`,
      severity: subscriptions.length >= 5 ? "warning" : "info",
      category: "subscription",
      action: {
        label: "Revisar suscripciones",
        type: "review",
        potentialSaving: Math.round(totalSubs * 0.3),
      },
    });
  }

  // Total spending vs average
  if (avgExpenses > 0 && current.expenses > avgExpenses * 1.15) {
    const pct = Math.round(((current.expenses - avgExpenses) / avgExpenses) * 100);
    insights.push({
      id: `total-spike-${idx++}`,
      icon: "⚠️",
      message: `Tu gasto total va ${pct}% arriba de tu promedio`,
      severity: pct > 30 ? "danger" : "warning",
      category: "spending",
      action: {
        label: "Ajustar gastos esta semana",
        type: "adjust",
        potentialSaving: Math.round(current.expenses - avgExpenses),
      },
    });
  }

  // Income change
  if (previous.income > 0) {
    const incomeChange = ((current.income - previous.income) / previous.income) * 100;
    if (incomeChange < -20) {
      insights.push({
        id: `income-drop-${idx++}`,
        icon: "💰",
        message: `Tus ingresos bajaron ${Math.round(Math.abs(incomeChange))}% vs el mes pasado`,
        severity: "warning",
        category: "income",
      });
    } else if (incomeChange > 20) {
      insights.push({
        id: `income-up-${idx++}`,
        icon: "🎉",
        message: `Tus ingresos subieron ${Math.round(incomeChange)}% vs el mes pasado`,
        severity: "info",
        category: "income",
      });
    }
  }

  // Negative balance
  if (current.income > 0 && current.expenses > current.income) {
    insights.push({
      id: `negative-${idx++}`,
      icon: "🚨",
      message: "Estás gastando más de lo que ganas este mes",
      severity: "danger",
      category: "spending",
      action: {
        label: "Reducir gastos no esenciales",
        type: "reduce",
        potentialSaving: Math.round(current.expenses - current.income),
      },
    });
  }

  return insights.slice(0, 8); // Max 8 insights
}

// ── Module 2: Prediction Engine ──

function generatePredictions(
  current: MonthData,
  avgMonthlyIncome: number,
  avgMonthlyExpenses: number,
  dayOfMonth: number,
  daysInMonth: number,
  upcomingPayments7d: number
): Prediction[] {
  const dailyExpenseRate = dayOfMonth > 0 ? current.expenses / dayOfMonth : 0;
  const dailyIncomeRate = dayOfMonth > 0 ? current.income / dayOfMonth : 0;

  // Weight: 60% current trend, 40% historical average
  const blendedDailyExpense = dailyExpenseRate * 0.6 + (avgMonthlyExpenses / 30) * 0.4;
  const blendedDailyIncome = dailyIncomeRate * 0.6 + (avgMonthlyIncome / 30) * 0.4;

  return [7, 15, 30].map((days) => {
    const projectedExpenses = current.expenses + blendedDailyExpense * days;
    const projectedIncome = current.income + blendedDailyIncome * days;
    const projectedBalance = projectedIncome - projectedExpenses;

    let risk: "low" | "medium" | "high" = "low";
    let warning: string | null = null;

    if (projectedBalance < 0) {
      risk = "high";
      warning = `Tu balance proyectado será negativo en ${days} días`;
    } else if (days === 7 && upcomingPayments7d > projectedBalance * 0.5) {
      risk = "medium";
      warning = "Los pagos próximos representan más del 50% de tu saldo";
    } else if (projectedExpenses > projectedIncome * 1.1) {
      risk = "medium";
      warning = "Tus gastos superarán tus ingresos si sigues al ritmo actual";
    }

    return {
      days: days as 7 | 15 | 30,
      projectedBalance: Math.round(projectedBalance),
      projectedIncome: Math.round(projectedIncome),
      projectedExpenses: Math.round(projectedExpenses),
      risk,
      warning,
    };
  });
}

// ── Module 3: Pattern Detection ──

function detectPatterns(
  current: MonthData,
  previous: MonthData,
  movements: { description: string; amount: number; type: string; date: Date }[]
): Pattern[] {
  const patterns: Pattern[] = [];
  let idx = 0;

  // Day-of-week spending pattern
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const maxDay = current.byDayOfWeek.indexOf(Math.max(...current.byDayOfWeek));
  const totalWeekdaySpend = current.byDayOfWeek.reduce((a, b) => a + b, 0);
  if (totalWeekdaySpend > 0) {
    const pctOfTotal = (current.byDayOfWeek[maxDay] / totalWeekdaySpend) * 100;
    if (pctOfTotal > 25) {
      patterns.push({
        id: `day-${idx++}`,
        icon: "📅",
        message: `Sueles gastar más los ${dayNames[maxDay]}`,
        type: "habit",
        data: { day: dayNames[maxDay], percentage: Math.round(pctOfTotal) },
      });
    }
  }

  // Weekend vs weekday
  const weekendSpend = current.byDayOfWeek[0] + current.byDayOfWeek[6];
  const weekdaySpend = totalWeekdaySpend - weekendSpend;
  if (weekendSpend > 0 && weekdaySpend > 0) {
    const weekendDailyAvg = weekendSpend / 2;
    const weekdayDailyAvg = weekdaySpend / 5;
    if (weekendDailyAvg > weekdayDailyAvg * 1.5) {
      patterns.push({
        id: `weekend-${idx++}`,
        icon: "🎉",
        message: "Tus gastos aumentan los fines de semana",
        type: "habit",
        data: { ratio: Math.round((weekendDailyAvg / weekdayDailyAvg) * 100) / 100 },
      });
    }
  }

  // Detect anomalies (amounts significantly higher than usual for same description)
  const descAvg = new Map<string, { total: number; count: number }>();
  for (const m of movements) {
    const key = m.description.toLowerCase().trim();
    const existing = descAvg.get(key);
    if (existing) {
      existing.total += m.amount;
      existing.count++;
    } else {
      descAvg.set(key, { total: m.amount, count: 1 });
    }
  }

  for (const m of movements) {
    const key = m.description.toLowerCase().trim();
    const avg = descAvg.get(key);
    if (avg && avg.count >= 2) {
      const meanAmt = avg.total / avg.count;
      if (m.amount > meanAmt * 1.8 && m.amount > 200) {
        patterns.push({
          id: `anomaly-${idx++}`,
          icon: "🔍",
          message: `"${m.description}" fue más alto de lo normal ($${Math.round(m.amount)} vs promedio $${Math.round(meanAmt)})`,
          type: "anomaly",
        });
      }
    }
  }

  // Recurring charges detection
  const recurringCandidates = new Map<string, number>();
  for (const m of movements) {
    if (m.type !== "ABONO") {
      const key = m.description.toLowerCase().trim();
      recurringCandidates.set(key, (recurringCandidates.get(key) ?? 0) + 1);
    }
  }

  for (const [desc, count] of recurringCandidates) {
    if (count >= 2) {
      patterns.push({
        id: `recurring-${idx++}`,
        icon: "🔁",
        message: `"${desc}" se repite cada mes`,
        type: "recurring",
      });
    }
  }

  // Spending trend (increasing month over month)
  if (previous.expenses > 0 && current.expenses > previous.expenses * 1.1) {
    patterns.push({
      id: `trend-${idx++}`,
      icon: "📊",
      message: "Tu gasto tiene tendencia al alza en los últimos 2 meses",
      type: "trend",
    });
  }

  return patterns.slice(0, 8);
}

// ── Module 6: Enhanced Semaphore ──

function buildSemaphore(
  healthScore: number,
  healthLevel: string,
  insights: Insight[],
  predictions: Prediction[]
): FinancialIntelligence["semaphore"] {
  const dangerInsights = insights.filter((i) => i.severity === "danger").length;
  const highRiskPredictions = predictions.filter((p) => p.risk === "high").length;

  let level: "green" | "yellow" | "red";
  let explanation: string;
  let recommendation: string;

  if (healthScore >= 70 && dangerInsights === 0 && highRiskPredictions === 0) {
    level = "green";
    explanation = "Tus finanzas están en buen camino. Ingresos y gastos balanceados.";
    recommendation = "Mantén tu ritmo actual. Si puedes, destina un poco más al ahorro.";
  } else if (healthScore >= 40 || (dangerInsights <= 1 && highRiskPredictions === 0)) {
    level = "yellow";
    explanation =
      dangerInsights > 0
        ? `Hay ${dangerInsights} tema(s) que requieren tu atención.`
        : "Tus finanzas están estables pero hay margen de mejora.";
    recommendation =
      insights.find((i) => i.action)?.action?.label ??
      "Revisa tus gastos principales y busca oportunidades de ahorro.";
  } else {
    level = "red";
    explanation = "Tus finanzas necesitan atención inmediata.";
    const topAction = insights.find((i) => i.severity === "danger" && i.action);
    recommendation =
      topAction?.action?.label ?? "Reduce gastos no esenciales y revisa pagos pendientes.";
  }

  return { level, score: healthScore, explanation, recommendation };
}

// ── Main Engine ──

export async function generateFinancialIntelligence(
  tenantId: string
): Promise<FinancialIntelligence> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Fetch data in parallel
  const [current, previous, threeMonthMovements, subscriptionItems, upcomingRecurring, healthResult] =
    await Promise.all([
      getMonthData(tenantId, startOfMonth, endOfMonth),
      getMonthData(tenantId, prevStart, prevEnd),
      // Last 3 months for averages and patterns
      db.movement.findMany({
        where: {
          tenantId,
          date: { gte: new Date(now.getFullYear(), now.getMonth() - 3, 1), lte: endOfMonth },
        },
        select: { description: true, amount: true, type: true, date: true },
      }),
      // Active subscriptions
      db.recurringItem.findMany({
        where: { tenantId, isActive: true, isSubscription: true },
        select: { name: true, estimatedAmount: true },
      }),
      // Upcoming payments
      db.recurringItem.findMany({
        where: {
          tenantId,
          isActive: true,
          nextExpectedDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: { estimatedAmount: true },
      }),
      // Reuse health calculator
      (async () => {
        const { calculateHealth } = await import("./health-calculator");
        return calculateHealth(tenantId);
      })(),
    ]);

  // Compute averages from 3-month data
  const pastMonths = 3;
  const past3Income = threeMonthMovements
    .filter((m) => m.type === "ABONO" || m.type === "PAGO")
    .reduce((s, m) => s + Number(m.amount), 0);
  const past3Expenses = threeMonthMovements
    .filter((m) => m.type !== "ABONO" && m.type !== "PAGO")
    .reduce((s, m) => s + Number(m.amount), 0);
  const avgMonthlyIncome = past3Income / pastMonths;
  const avgMonthlyExpenses = past3Expenses / pastMonths;

  const subscriptions = subscriptionItems.map((s) => ({
    name: s.name,
    amount: Number(s.estimatedAmount),
  }));

  const upcomingPayments7d = upcomingRecurring.reduce(
    (s, r) => s + Number(r.estimatedAmount),
    0
  );

  const movementsForPatterns = threeMonthMovements.map((m) => ({
    description: m.description,
    amount: Number(m.amount),
    type: m.type,
    date: m.date,
  }));

  // Generate all modules
  const insights = generateInsights(current, previous, subscriptions, avgMonthlyExpenses);
  const predictions = generatePredictions(
    current,
    avgMonthlyIncome,
    avgMonthlyExpenses,
    dayOfMonth,
    daysInMonth,
    upcomingPayments7d
  );
  const patterns = detectPatterns(current, previous, movementsForPatterns);
  const semaphore = buildSemaphore(healthResult.score, healthResult.level, insights, predictions);

  return { insights, predictions, patterns, semaphore };
}
