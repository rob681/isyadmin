"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@isyadmin/shared";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const PROCESSING_STATUSES = ["UPLOADED", "EXTRACTING", "INTERPRETING", "VALIDATING"];

const STEP_CONFIG: Record<string, { label: string; progress: number }> = {
  UPLOADED:     { label: "Preparando...", progress: 5 },
  EXTRACTING:   { label: "Extrayendo texto del PDF...", progress: 30 },
  INTERPRETING: { label: "Analizando movimientos con IA...", progress: 65 },
  VALIDATING:   { label: "Clasificando categorias...", progress: 90 },
};

const TYPE_COLORS: Record<string, string> = {
  CARGO: "bg-red-100 text-red-700",
  ABONO: "bg-green-100 text-green-700",
  COMISION: "bg-orange-100 text-orange-700",
  INTERES: "bg-orange-100 text-orange-700",
  PAGO: "bg-blue-100 text-blue-700",
  MSI: "bg-purple-100 text-purple-700",
  DOMICILIACION: "bg-indigo-100 text-indigo-700",
};

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score == null) return <Badge variant="outline">-</Badge>;
  const pct = Math.round(score * 100);
  if (score >= 0.8) return <Badge variant="success">{pct}%</Badge>;
  if (score >= 0.6) return <Badge variant="warning">{pct}%</Badge>;
  return <Badge variant="danger">{pct}%</Badge>;
}

export default function EstadoCuentaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [corrections, setCorrections] = useState<
    Record<string, { categoryId: string | null; subcategoryId: string | null }>
  >({});

  const { data: statement, isLoading } = trpc.statement.getById.useQuery(
    { id },
    {
      refetchInterval: (data) => {
        if (!data) return 2000;
        return PROCESSING_STATUSES.includes(data.status) ? 2000 : false;
      },
    }
  );

  const { data: categories } = trpc.category.list.useQuery();

  const confirmMutation = trpc.statement.confirm.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!statement) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-muted-foreground">Estado de cuenta no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/estados-cuenta")}>
          Volver
        </Button>
      </div>
    );
  }

  // ─── PROCESSING VIEW ─────────────────────────────
  if (PROCESSING_STATUSES.includes(statement.status)) {
    const step = STEP_CONFIG[statement.status] ?? STEP_CONFIG.UPLOADED;

    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <button
          type="button"
          onClick={() => router.push("/estados-cuenta")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Procesando estado de cuenta</h2>
              <p className="text-sm text-muted-foreground">{statement.fileName}</p>
            </div>

            <div className="space-y-3">
              <Progress value={step.progress} className="h-2" />
              <p className="text-sm font-medium text-primary">{step.label}</p>
              <p className="text-xs text-muted-foreground">
                Esto puede tomar 15-30 segundos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── ERROR VIEW ───────────────────────────────────
  if (statement.status === "FAILED") {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <button
          type="button"
          onClick={() => router.push("/estados-cuenta")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <Card className="border-red-200">
          <CardContent className="p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold">Error al procesar</h2>
            <p className="text-sm text-muted-foreground">
              {statement.errorMessage ?? "Ocurrio un error inesperado."}
            </p>
            <Button variant="outline" onClick={() => router.push("/estados-cuenta")}>
              Volver a estados de cuenta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── REVIEW / CONFIRMED VIEW ─────────────────────
  const movements = statement.movements ?? [];
  const isConfirmed = statement.status === "CONFIRMED";
  const pendingCount = movements.filter((m) => !m.userConfirmed).length;

  function handleConfirmAll() {
    const correctionsList = Object.entries(corrections).flatMap(
      ([movementId, corr]) => {
        const results: { movementId: string; field: string; newValue: string }[] = [];
        if (corr.categoryId !== undefined) {
          results.push({
            movementId,
            field: "categoryId",
            newValue: corr.categoryId ?? "",
          });
        }
        if (corr.subcategoryId !== undefined) {
          results.push({
            movementId,
            field: "subcategoryId",
            newValue: corr.subcategoryId ?? "",
          });
        }
        return results;
      }
    );

    confirmMutation.mutate({
      statementId: id,
      corrections: correctionsList.length > 0 ? correctionsList : undefined,
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-24">
      <button
        type="button"
        onClick={() => router.push("/estados-cuenta")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {/* Statement Metadata */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              {statement.institution ?? statement.fileName}
            </CardTitle>
            <Badge
              variant={isConfirmed ? "success" : "warning"}
              className="text-xs"
            >
              {isConfirmed ? "Confirmado" : "Pendiente de revision"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statement.institution && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Banco
                </p>
                <p className="text-sm font-medium">{statement.institution}</p>
              </div>
            )}
            {statement.periodStart && statement.periodEnd && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Periodo
                </p>
                <p className="text-sm font-medium">
                  {new Date(statement.periodStart).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  –{" "}
                  {new Date(statement.periodEnd).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
            {statement.currentBalance != null && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Saldo
                </p>
                <p className="text-sm font-semibold">
                  {formatMoney(statement.currentBalance)}
                </p>
              </div>
            )}
            {statement.minimumPayment != null && (
              <div>
                <p className="text-xs text-muted-foreground">Pago minimo</p>
                <p className="text-sm font-medium">
                  {formatMoney(statement.minimumPayment)}
                </p>
              </div>
            )}
            {statement.noInterestPayment != null && (
              <div>
                <p className="text-xs text-muted-foreground">Sin intereses</p>
                <p className="text-sm font-medium">
                  {formatMoney(statement.noInterestPayment)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Movimientos</p>
              <p className="text-sm font-medium">{movements.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      {movements.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No se encontraron movimientos en este estado de cuenta.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      Fecha
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      Descripcion
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      Tipo
                    </th>
                    <th className="text-right p-3 font-medium text-muted-foreground">
                      Monto
                    </th>
                    <th className="text-left p-3 font-medium text-muted-foreground">
                      Categoria
                    </th>
                    <th className="text-center p-3 font-medium text-muted-foreground">
                      Confianza
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const isIncome = m.type === "ABONO" || m.type === "PAGO";
                    const correctedCategoryId =
                      corrections[m.id]?.categoryId ?? m.category?.id ?? "";
                    const selectedCategory = categories?.find(
                      (c) => c.id === correctedCategoryId
                    );
                    const subcategories = selectedCategory?.subcategories ?? [];

                    return (
                      <tr
                        key={m.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 whitespace-nowrap">
                          {new Date(m.date).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-sm">
                              {m.merchantName || m.description}
                            </p>
                            {m.merchantName && m.description !== m.merchantName && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {m.originalDescription || m.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={`text-[10px] px-1.5 py-0.5 ${
                              TYPE_COLORS[m.type] ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {m.type}
                          </Badge>
                        </td>
                        <td
                          className={`p-3 text-right font-semibold whitespace-nowrap ${
                            isIncome ? "text-green-600" : "text-foreground"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatMoney(m.amount)}
                        </td>
                        <td className="p-3">
                          {isConfirmed ? (
                            <span className="text-xs">
                              {m.category?.name ?? "—"}
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <select
                                value={correctedCategoryId}
                                onChange={(e) => {
                                  setCorrections((prev) => ({
                                    ...prev,
                                    [m.id]: {
                                      categoryId: e.target.value || null,
                                      subcategoryId: null,
                                    },
                                  }));
                                }}
                                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                              >
                                <option value="">Sin categoria</option>
                                {categories
                                  ?.filter((c) => {
                                    if (isIncome) return c.type === "INGRESO";
                                    return c.type !== "INGRESO";
                                  })
                                  .map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                              </select>
                              {subcategories.length > 0 && (
                                <select
                                  value={
                                    corrections[m.id]?.subcategoryId ??
                                    m.subcategory?.id ??
                                    ""
                                  }
                                  onChange={(e) => {
                                    setCorrections((prev) => ({
                                      ...prev,
                                      [m.id]: {
                                        ...prev[m.id],
                                        subcategoryId: e.target.value || null,
                                      },
                                    }));
                                  }}
                                  className="w-full h-7 rounded-md border border-input bg-background px-2 text-[11px]"
                                >
                                  <option value="">Subcategoria</option>
                                  {subcategories.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                      {sub.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <ConfidenceBadge score={m.confidenceScore} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary row */}
      {movements.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-600 font-semibold">
              +
              {formatMoney(
                movements
                  .filter((m) => m.type === "ABONO" || m.type === "PAGO")
                  .reduce((sum, m) => sum + m.amount, 0)
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-red-600 font-semibold">
              -
              {formatMoney(
                movements
                  .filter((m) => m.type !== "ABONO" && m.type !== "PAGO")
                  .reduce((sum, m) => sum + m.amount, 0)
              )}
            </span>
          </div>
          <span className="text-muted-foreground">
            {movements.length} movimiento{movements.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Sticky Confirmation Bar */}
      {!isConfirmed && movements.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {pendingCount > 0
                ? `${pendingCount} movimiento${pendingCount !== 1 ? "s" : ""} sin confirmar`
                : "Todos los movimientos listos"}
            </div>
            <Button
              onClick={handleConfirmAll}
              disabled={confirmMutation.isLoading}
              className="min-w-[160px]"
            >
              {confirmMutation.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar todos
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Confirmed badge */}
      {isConfirmed && (
        <div className="flex items-center justify-center gap-2 text-green-600 py-4">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Estado de cuenta confirmado</span>
        </div>
      )}
    </div>
  );
}
