"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@isyadmin/shared";
import { ArrowLeft, Briefcase, Home, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);

  const { data: invoice, isLoading, refetch } = trpc.invoice.getById.useQuery({
    id: invoiceId,
  });

  const [formData, setFormData] = useState(() => ({
    date: invoice?.date ? new Date(invoice.date).toISOString().split("T")[0] : "",
    vendor: invoice?.vendor || "",
    description: invoice?.description || "",
    amount: invoice?.amount?.toString() || "",
    dueDate: invoice?.dueDate
      ? new Date(invoice.dueDate).toISOString().split("T")[0]
      : "",
    scope: invoice?.scope || ("PERSONAL" as const),
    isPaid: invoice?.isPaid || false,
  }));

  const updateInvoice = trpc.invoice.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      refetch();
    },
    onError: (err) => {
      alert(`Error: ${err.message}`);
    },
  });

  const deleteInvoice = trpc.invoice.delete.useMutation({
    onSuccess: () => {
      router.push("/facturas");
    },
    onError: (err) => {
      alert(`Error: ${err.message}`);
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvoice.mutate({
      id: invoiceId,
      date: formData.date,
      vendor: formData.vendor,
      description: formData.description || undefined,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate || undefined,
      scope: formData.scope,
      isPaid: formData.isPaid,
    });
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!invoice) {
    return <div>Factura no encontrada</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{invoice.vendor}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(invoice.date).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {invoice.scope === "NEGOCIO" && (
                <Badge variant="outline">
                  <Briefcase className="h-3 w-3 mr-1" />
                  Negocio
                </Badge>
              )}
              <Badge variant={invoice.isPaid ? "default" : "secondary"}>
                {invoice.isPaid ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Pagada
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pendiente
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Monto</p>
                  <p className="text-2xl font-bold">{formatMoney(invoice.amount)}</p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Vencimiento</p>
                    <p className="text-lg font-semibold">
                      {new Date(invoice.dueDate).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                )}
              </div>
              {invoice.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Descripción</p>
                  <p className="text-sm">{invoice.description}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(true)}>Editar</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("¿Estás seguro?")) {
                      deleteInvoice.mutate({ id: invoiceId });
                    }
                  }}
                  disabled={deleteInvoice.isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Comercio</label>
                <Input
                  value={formData.vendor}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor: e.target.value })
                  }
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción (opcional)"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Vencimiento</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      scope: "PERSONAL",
                    })
                  }
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.scope === "PERSONAL"
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-secondary text-muted-foreground border border-transparent"
                  }`}
                >
                  <Home className="h-3.5 w-3.5 inline mr-1" /> Personal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      scope: "NEGOCIO",
                    })
                  }
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    formData.scope === "NEGOCIO"
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-secondary text-muted-foreground border border-transparent"
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5 inline mr-1" /> Negocio
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={updateInvoice.isLoading}
                  className="flex-1"
                >
                  {updateInvoice.isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
