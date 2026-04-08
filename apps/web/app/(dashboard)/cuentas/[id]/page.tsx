"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@isyadmin/shared";
import { ArrowLeft, Building2, Trash2, ArrowLeftRight, FileText } from "lucide-react";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  credit_card: "Tarjeta de crédito",
  debit: "Tarjeta de débito",
  checking: "Cuenta de cheques",
  savings: "Cuenta de ahorro",
};

export default function CuentaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);

  const { data: account, isLoading, refetch } = trpc.account.getById.useQuery({ id: accountId });

  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    accountType: "debit",
    lastFourDigits: "",
  });

  const updateAccount = trpc.account.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      refetch();
    },
    onError: (err) => alert(err.message),
  });

  const deleteAccount = trpc.account.delete.useMutation({
    onSuccess: () => router.push("/cuentas"),
    onError: (err) => alert(err.message),
  });

  if (isLoading) return <div className="animate-pulse">Cargando...</div>;
  if (!account) return <div>Cuenta no encontrada</div>;

  const startEdit = () => {
    setFormData({
      name: account.name,
      institution: account.institution,
      accountType: account.accountType,
      lastFourDigits: account.lastFourDigits || "",
    });
    setIsEditing(true);
  };

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
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>
                  {account.name}
                  {account.lastFourDigits && (
                    <span className="text-muted-foreground font-normal"> ****{account.lastFourDigits}</span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{account.institution}</span>
                  <Badge variant="outline">
                    {ACCOUNT_TYPE_LABELS[account.accountType] || account.accountType}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Moneda</p>
                  <p className="text-sm font-medium">{account.currency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <Badge variant={account.isActive ? "default" : "secondary"}>
                    {account.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estados de cuenta</p>
                  <p className="text-sm font-medium">{account._count.statements}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Movimientos</p>
                  <p className="text-sm font-medium">{account._count.movements}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/movimientos?accountId=${accountId}`)}
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Ver movimientos
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/estados-cuenta?accountId=${accountId}`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver PDFs
                </Button>
                <Button onClick={startEdit}>Editar</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("¿Estás seguro?")) {
                      deleteAccount.mutate({ id: accountId });
                    }
                  }}
                  disabled={deleteAccount.isLoading || account._count.movements > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateAccount.mutate({
                  id: accountId,
                  name: formData.name,
                  institution: formData.institution,
                  accountType: formData.accountType as any,
                  lastFourDigits: formData.lastFourDigits || undefined,
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Nombre</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Institución</label>
                  <Input
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateAccount.isLoading}>
                  Guardar
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
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
