"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@isyadmin/shared";
import {
  FileText,
  Plus,
  Briefcase,
  Home,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

export default function FacturasPage() {
  const router = useRouter();
  const [scope, setScope] = useState<"PERSONAL" | "NEGOCIO" | undefined>();
  const [isPaid, setIsPaid] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    vendor: "",
    description: "",
    amount: "",
    dueDate: "",
    scope: "PERSONAL" as "PERSONAL" | "NEGOCIO",
    isPaid: false,
  });

  const { data, isLoading, refetch } = trpc.invoice.list.useQuery({
    scope,
    isPaid,
    page,
    limit: 30,
  });

  const createInvoice = trpc.invoice.create.useMutation({
    onSuccess: () => {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        vendor: "",
        description: "",
        amount: "",
        dueDate: "",
        scope: "PERSONAL",
        isPaid: false,
      });
      setShowForm(false);
      refetch();
    },
    onError: (err) => {
      alert(`Error: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor || !formData.amount) {
      alert("Vendor y Amount son requeridos");
      return;
    }
    createInvoice.mutate({
      date: formData.date,
      vendor: formData.vendor,
      description: formData.description || undefined,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate || undefined,
      scope: formData.scope,
      isPaid: formData.isPaid,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Facturas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Cancelar" : "Agregar Factura"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-accent/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Fecha</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium">Comercio</label>
                  <Input
                    placeholder="Nombre del proveedor"
                    value={formData.vendor}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Monto</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Vencimiento</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium">Descripción</label>
                  <Input
                    placeholder="Descripción (opcional)"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Estado</label>
                  <select
                    value={formData.isPaid ? "paid" : "pending"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isPaid: e.target.value === "paid",
                      })
                    }
                    className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagada</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        scope: "PERSONAL",
                      })
                    }
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      formData.scope === "PERSONAL"
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-secondary text-muted-foreground border border-transparent"
                    }`}
                  >
                    <Home className="h-3 w-3 inline mr-1" /> Personal
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        scope: "NEGOCIO",
                      })
                    }
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      formData.scope === "NEGOCIO"
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-secondary text-muted-foreground border border-transparent"
                    }`}
                  >
                    <Briefcase className="h-3 w-3 inline mr-1" /> Negocio
                  </button>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createInvoice.isLoading}
                  className="sm:px-6"
                >
                  {createInvoice.isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          <Button
            variant={scope === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setScope(undefined);
              setPage(1);
            }}
          >
            Todo
          </Button>
          <Button
            variant={scope === "PERSONAL" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setScope("PERSONAL");
              setPage(1);
            }}
          >
            <Home className="h-3.5 w-3.5 mr-1" /> Personal
          </Button>
          <Button
            variant={scope === "NEGOCIO" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setScope("NEGOCIO");
              setPage(1);
            }}
          >
            <Briefcase className="h-3.5 w-3.5 mr-1" /> Negocio
          </Button>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            variant={isPaid === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsPaid(undefined);
              setPage(1);
            }}
          >
            Todas
          </Button>
          <Button
            variant={isPaid === false ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsPaid(false);
              setPage(1);
            }}
          >
            <AlertCircle className="h-3.5 w-3.5 mr-1" /> Pendientes
          </Button>
          <Button
            variant={isPaid === true ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsPaid(true);
              setPage(1);
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Pagadas
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <ListSkeleton rows={8} />
      ) : !data?.invoices.length ? (
        <EmptyState
          icon={FileText}
          title="Sin facturas"
          description="Agrega tu primera factura para comenzar."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar Factura
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {data.invoices.map((inv) => (
              <Card
                key={inv.id}
                className="cursor-pointer card-hover"
                onClick={() => router.push(`/facturas/${inv.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`rounded-lg p-2 ${
                        inv.isPaid
                          ? "bg-green-100"
                          : "bg-amber-100"
                      }`}
                    >
                      {inv.isPaid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{inv.vendor}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {new Date(inv.date).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        {inv.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Vence:{" "}
                            {new Date(inv.dueDate).toLocaleDateString("es-MX", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
                        {inv.scope === "NEGOCIO" && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            <Briefcase className="h-2.5 w-2.5 mr-0.5" />
                            Negocio
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatMoney(inv.amount)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
