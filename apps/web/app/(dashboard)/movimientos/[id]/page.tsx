"use client";

import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Tag,
  Building2,
  FileText,
  Home,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
  Clock,
} from "lucide-react";
import { formatMoney } from "@isyadmin/shared";

export default function MovimientoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: movement, isLoading } = trpc.movement.getById.useQuery({ id });

  const deleteMovement = trpc.movement.delete.useMutation({
    onSuccess: () => {
      router.push("/movimientos");
      router.refresh();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-muted-foreground">Movimiento no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/movimientos")}>
          Volver a movimientos
        </Button>
      </div>
    );
  }

  const isIncome = movement.type === "ABONO";
  const formattedAmount = formatMoney(movement.amount);
  const formattedDate = new Date(movement.date).toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {/* Main card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Amount hero */}
          <div className="text-center space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              isIncome ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {isIncome ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isIncome ? "Ingreso" : "Gasto"}
            </div>
            <p className={`text-4xl font-bold ${isIncome ? "text-green-600" : "text-foreground"}`}>
              {isIncome ? "+" : "-"}{formattedAmount}
            </p>
            <p className="text-muted-foreground">{movement.description}</p>
          </div>

          {/* Details grid */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" /> Fecha
              </span>
              <span className="text-sm font-medium capitalize">{formattedDate}</span>
            </div>

            {movement.category && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" /> Categoria
                </span>
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: `${movement.category.color}20`, color: movement.category.color ?? undefined }}
                >
                  {movement.category.name}
                </Badge>
              </div>
            )}

            {movement.subcategory && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-3 w-3 ml-1" /> Subcategoria
                </span>
                <span className="text-sm">{movement.subcategory.name}</span>
              </div>
            )}

            {movement.merchantName && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" /> Comercio
                </span>
                <span className="text-sm font-medium">{movement.merchantName}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {movement.scope === "PERSONAL" ? <Home className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                Ambito
              </span>
              <Badge variant={movement.scope === "PERSONAL" ? "secondary" : "default"}>
                {movement.scope === "PERSONAL" ? "Personal" : "Negocio"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" /> Origen
              </span>
              <span className="text-sm">
                {movement.source === "MANUAL" ? "Captura manual" : movement.source === "PDF_EXTRACTED" ? "Estado de cuenta" : "API"}
              </span>
            </div>

            {movement.statement && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" /> Estado de cuenta
                </span>
                <button
                  type="button"
                  onClick={() => router.push(`/estados-cuenta`)}
                  className="text-sm text-primary hover:underline"
                >
                  {movement.statement.institution ?? "Ver estado"}
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          {movement.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Notas</p>
              <p className="text-sm">{movement.notes}</p>
            </div>
          )}

          {/* Flags */}
          {(movement.isRecurring || movement.isSubscription || movement.isInstallment) && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {movement.isRecurring && <Badge variant="secondary">Recurrente</Badge>}
              {movement.isSubscription && <Badge variant="secondary">Suscripcion</Badge>}
              {movement.isInstallment && <Badge variant="secondary">Mensualidad</Badge>}
              {movement.isService && <Badge variant="secondary">Servicio</Badge>}
              {movement.isLoan && <Badge variant="secondary">Prestamo</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Corrections history */}
      {movement.corrections && movement.corrections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" /> Historial de cambios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {movement.corrections.map((c) => (
              <div key={c.id} className="text-xs text-muted-foreground flex justify-between">
                <span>
                  <span className="font-medium">{c.field}</span>: {c.oldValue || "(vacio)"} → {c.newValue}
                </span>
                <span>{new Date(c.createdAt).toLocaleDateString("es-MX")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {movement.source === "MANUAL" && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/movimientos/nuevo?edit=${movement.id}`)}
          >
            <Pencil className="h-4 w-4 mr-2" /> Editar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("¿Eliminar este movimiento?")) {
                deleteMovement.mutate({ id: movement.id });
              }
            }}
            disabled={deleteMovement.isLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
