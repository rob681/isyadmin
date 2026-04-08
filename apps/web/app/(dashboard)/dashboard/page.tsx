"use client";

import { trpc } from "@/lib/trpc/client";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@isyadmin/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Building2,
  FileText,
  Plus,
  AlertTriangle,
  Bell,
  ArrowRight,
  Lightbulb,
  Target,
  BarChart3,
  Shield,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = trpc.dashboard.overview.useQuery();
  const alerts = trpc.alert.list.useQuery();
  const intelligence = trpc.intelligence.analyze.useQuery();
  const accountSummary = trpc.account.summary.useQuery();
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [activePrediction, setActivePrediction] = useState<7 | 15 | 30>(7);

  if (isLoading) return <DashboardSkeleton />;
  if (!data) return null;

  const intel = intelligence.data;
  const semaphore = intel?.semaphore;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── SEMAPHORE: Financial Health at a Glance ─── */}
      {semaphore && (
        <Card
          className={`border-2 ${
            semaphore.level === "green"
              ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
              : semaphore.level === "yellow"
              ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
              : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
          }`}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                  semaphore.level === "green"
                    ? "bg-green-500"
                    : semaphore.level === "yellow"
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
              >
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xl font-bold ${
                      semaphore.level === "green"
                        ? "text-green-700 dark:text-green-400"
                        : semaphore.level === "yellow"
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {semaphore.score}/100
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      semaphore.level === "green"
                        ? "bg-green-200 text-green-800"
                        : semaphore.level === "yellow"
                        ? "bg-amber-200 text-amber-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {semaphore.level === "green"
                      ? "Saludable"
                      : semaphore.level === "yellow"
                      ? "Atención"
                      : "Urgente"}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/80">{semaphore.explanation}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {semaphore.recommendation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── BALANCE CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Ingresos</span>
            </div>
            <p className="text-lg font-bold text-green-600">{formatMoney(data.totalIncome)}</p>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Gastos</span>
            </div>
            <p className="text-lg font-bold text-red-600">{formatMoney(data.totalExpenses)}</p>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Disponible</span>
            </div>
            <p className={`text-lg font-bold ${data.available >= 0 ? "text-foreground" : "text-red-600"}`}>
              {formatMoney(data.available)}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Por pagar</span>
            </div>
            <p className="text-lg font-bold">{formatMoney(data.upcomingTotal)}</p>
            <p className="text-xs text-muted-foreground">próx. 7 días</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── ACCOUNT SUMMARY ─── */}
      {accountSummary.data && accountSummary.data.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Mis cuentas</h2>
              </div>
              <button
                type="button"
                onClick={() => router.push("/cuentas")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accountSummary.data.slice(0, 4).map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/movimientos?accountId=${acc.id}`)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium">{acc.name}</span>
                    <span className="text-[10px] text-muted-foreground">{acc.institution}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-green-600">+{formatMoney(acc.income)}</span>
                      <span className="text-xs text-red-600">-{formatMoney(acc.expenses)}</span>
                    </div>
                    <span className={`text-xs font-semibold ${acc.balance >= 0 ? "text-foreground" : "text-red-600"}`}>
                      {formatMoney(acc.balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── INSIGHTS (Module 1 + Module 4: Actions) ─── */}
      {intel && intel.insights.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold">Lo que debes saber</h2>
            </div>
            <div className="space-y-3">
              {(showAllInsights ? intel.insights : intel.insights.slice(0, 3)).map((insight) => (
                <div
                  key={insight.id}
                  className={`p-3 rounded-xl border ${
                    insight.severity === "danger"
                      ? "bg-red-50 border-red-200 dark:bg-red-950/20"
                      : insight.severity === "warning"
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20"
                      : "bg-blue-50 border-blue-200 dark:bg-blue-950/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm">
                      <span className="mr-1.5">{insight.icon}</span>
                      {insight.message}
                    </p>
                  </div>
                  {insight.action && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                          insight.severity === "danger"
                            ? "bg-red-200 text-red-800 hover:bg-red-300"
                            : "bg-amber-200 text-amber-800 hover:bg-amber-300"
                        }`}
                      >
                        {insight.action.label}
                      </button>
                      {insight.action.potentialSaving && (
                        <span className="text-xs text-muted-foreground">
                          Ahorro potencial: {formatMoney(insight.action.potentialSaving)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {intel.insights.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllInsights(!showAllInsights)}
                className="text-xs text-primary hover:underline mt-3 flex items-center gap-1"
              >
                {showAllInsights ? (
                  <>Mostrar menos <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Ver {intel.insights.length - 3} más <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── PREDICTIONS (Module 2) ─── */}
      {intel && intel.predictions.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-indigo-500" />
              <h2 className="font-semibold">Proyección</h2>
            </div>

            {/* Period selector */}
            <div className="flex gap-1 mb-4 bg-muted p-1 rounded-xl">
              {([7, 15, 30] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setActivePrediction(days)}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
                    activePrediction === days
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {days} días
                </button>
              ))}
            </div>

            {(() => {
              const pred = intel.predictions.find((p) => p.days === activePrediction);
              if (!pred) return null;
              return (
                <div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Ingresos</p>
                      <p className="text-sm font-bold text-green-600">
                        {formatMoney(pred.projectedIncome)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Gastos</p>
                      <p className="text-sm font-bold text-red-600">
                        {formatMoney(pred.projectedExpenses)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Balance</p>
                      <p
                        className={`text-sm font-bold ${
                          pred.projectedBalance >= 0 ? "text-foreground" : "text-red-600"
                        }`}
                      >
                        {formatMoney(pred.projectedBalance)}
                      </p>
                    </div>
                  </div>

                  {pred.warning && (
                    <div
                      className={`p-3 rounded-xl border text-sm flex items-start gap-2 ${
                        pred.risk === "high"
                          ? "bg-red-50 border-red-200 dark:bg-red-950/20"
                          : "bg-amber-50 border-amber-200 dark:bg-amber-950/20"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{pred.warning}</span>
                    </div>
                  )}

                  {!pred.warning && (
                    <div className="p-3 rounded-xl border bg-green-50 border-green-200 dark:bg-green-950/20 text-sm flex items-start gap-2">
                      <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-green-700 dark:text-green-400">
                        Tu balance se ve estable para los próximos {pred.days} días
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* ─── PATTERNS (Module 3) ─── */}
      {intel && intel.patterns.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <h2 className="font-semibold">Patrones detectados</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {intel.patterns.slice(0, 6).map((pattern) => (
                <div
                  key={pattern.id}
                  className="p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm">
                    <span className="mr-1.5">{pattern.icon}</span>
                    {pattern.message}
                  </p>
                  <Badge variant="secondary" className="text-[10px] mt-1.5">
                    {pattern.type === "habit"
                      ? "Hábito"
                      : pattern.type === "recurring"
                      ? "Recurrente"
                      : pattern.type === "anomaly"
                      ? "Inusual"
                      : "Tendencia"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── UPCOMING PAYMENTS ─── */}
      {data.upcomingPayments.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Próximos pagos</h2>
              <button
                type="button"
                onClick={() => router.push("/recurrentes")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-3">
              {data.upcomingPayments.slice(0, 5).map((payment) => {
                const daysUntil = Math.ceil(
                  (new Date(payment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const urgency = daysUntil <= 2 ? "danger" : daysUntil <= 5 ? "warning" : "success";
                return (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          urgency === "danger"
                            ? "bg-red-500"
                            : urgency === "warning"
                            ? "bg-amber-500"
                            : "bg-green-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">{payment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.dueDate).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                          })}
                          {daysUntil <= 0 ? " — Vencido" : ` — en ${daysUntil} días`}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{formatMoney(payment.amount)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── ALERTS ─── */}
      {alerts.data && alerts.data.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Alertas</h2>
                <Badge variant="secondary" className="text-xs">
                  {alerts.data.length}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => router.push("/alertas")}
                className="text-xs text-primary hover:underline"
              >
                Ver todas
              </button>
            </div>
            <div className="space-y-2">
              {alerts.data.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border text-sm ${
                    alert.severity === "RED"
                      ? "bg-red-50 border-red-200 dark:bg-red-950/20"
                      : alert.severity === "YELLOW"
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20"
                      : "bg-green-50 border-green-200 dark:bg-green-950/20"
                  }`}
                >
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── CTAs ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button size="lg" onClick={() => router.push("/estados-cuenta")} className="h-14 text-base">
          <FileText className="h-5 w-5 mr-2" />
          Subir estado de cuenta
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => router.push("/movimientos/nuevo")}
          className="h-14 text-base"
        >
          <Plus className="h-5 w-5 mr-2" />
          Agregar movimiento
        </Button>
      </div>
    </div>
  );
}
