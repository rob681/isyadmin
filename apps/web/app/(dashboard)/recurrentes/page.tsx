"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@isyadmin/shared";
import { RefreshCw, CreditCard, Zap } from "lucide-react";

export default function RecurrentesPage() {
  const subscriptions = trpc.recurring.subscriptions.useQuery();
  const services = trpc.recurring.services.useQuery();
  const installments = trpc.recurring.installments.useQuery();

  const isLoading = subscriptions.isLoading || services.isLoading || installments.isLoading;

  if (isLoading) return <ListSkeleton rows={8} />;

  const subsTotal = subscriptions.data?.reduce((s, i) => s + i.estimatedAmount, 0) ?? 0;
  const servTotal = services.data?.reduce((s, i) => s + i.estimatedAmount, 0) ?? 0;
  const instTotal = installments.data?.reduce((s, i) => s + i.monthlyAmount, 0) ?? 0;

  const hasData = (subscriptions.data?.length ?? 0) + (services.data?.length ?? 0) + (installments.data?.length ?? 0) > 0;

  if (!hasData) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold font-display mb-6">Recurrentes</h1>
        <EmptyState
          icon={RefreshCw}
          title="Sin pagos recurrentes"
          description="Cuando subas estados de cuenta, detectaremos automáticamente tus suscripciones, servicios y mensualidades."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold font-display">Recurrentes</h1>

      {/* Subscriptions */}
      {subscriptions.data && subscriptions.data.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <RefreshCw className="h-4 w-4 text-primary" />
                Suscripciones
              </CardTitle>
              <span className="text-sm font-semibold text-muted-foreground">
                Total: {formatMoney(subsTotal)}/mes
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscriptions.data.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.nextExpectedDate
                      ? `Próx: ${new Date(item.nextExpectedDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`
                      : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold">{formatMoney(item.estimatedAmount)}/mes</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {services.data && services.data.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4 text-amber-500" />
                Servicios
              </CardTitle>
              <span className="text-sm font-semibold text-muted-foreground">
                Total: {formatMoney(servTotal)}/mes
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.data.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{item.frequency.toLowerCase()}</p>
                </div>
                <span className="text-sm font-semibold">~{formatMoney(item.estimatedAmount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Installments */}
      {installments.data && installments.data.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-purple-500" />
                Mensualidades (MSI / Préstamos)
              </CardTitle>
              <span className="text-sm font-semibold text-muted-foreground">
                Comprometido: {formatMoney(instTotal)}/mes
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {installments.data.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {item.paidInstallments} de {item.totalInstallments}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Termina: {new Date(item.estimatedEndDate).toLocaleDateString("es-MX", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold">{formatMoney(item.monthlyAmount)}/mes</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
