"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SEVERITY_LABELS } from "@isyadmin/shared";
import { Bell, CheckCheck, X, AlertTriangle, AlertCircle, Info } from "lucide-react";

export default function AlertasPage() {
  const { data: alerts, isLoading, refetch } = trpc.alert.list.useQuery({ includeRead: true });
  const markRead = trpc.alert.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.alert.markAllRead.useMutation({ onSuccess: () => refetch() });
  const dismiss = trpc.alert.dismiss.useMutation({ onSuccess: () => refetch() });

  const unreadCount = alerts?.filter((a) => !a.isRead).length ?? 0;

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "RED": return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "YELLOW": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default: return <Info className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Alertas</h1>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isLoading}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : !alerts?.length ? (
        <EmptyState
          icon={Bell}
          title="Sin alertas"
          description="Cuando detectemos algo importante sobre tus finanzas, aparecerá aquí."
        />
      ) : (
        <div className="space-y-3">
          {/* Group by severity */}
          {(["RED", "YELLOW", "GREEN"] as const).map((severity) => {
            const group = alerts.filter((a) => a.severity === severity && !a.isDismissed);
            if (!group.length) return null;

            return (
              <div key={severity} className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {SEVERITY_LABELS[severity]}
                </h2>
                {group.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`transition-opacity ${alert.isRead ? "opacity-60" : ""} ${
                      severity === "RED" ? "border-red-200 dark:border-red-900" :
                      severity === "YELLOW" ? "border-amber-200 dark:border-amber-900" :
                      "border-green-200 dark:border-green-900"
                    }`}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      {severityIcon(severity)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.createdAt).toLocaleDateString("es-MX", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!alert.isRead && (
                          <button
                            type="button"
                            onClick={() => markRead.mutate({ id: alert.id })}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
                            title="Marcar como leída"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => dismiss.mutate({ id: alert.id })}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
                          title="Descartar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
