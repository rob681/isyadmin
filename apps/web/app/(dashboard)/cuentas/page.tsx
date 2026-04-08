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
  CreditCard,
  Plus,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  X,
} from "lucide-react";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  credit_card: "Tarjeta de crédito",
  debit: "Tarjeta de débito",
  checking: "Cuenta de cheques",
  savings: "Cuenta de ahorro",
};

const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  credit_card: "💳",
  debit: "🏧",
  checking: "🏦",
  savings: "🐖",
};

const COMMON_INSTITUTIONS = [
  "BBVA",
  "Citibanamex",
  "Banorte",
  "Santander",
  "HSBC",
  "Scotiabank",
  "Inbursa",
  "Nu",
  "Hey Banco",
  "Banco Azteca",
  "BanCoppel",
  "Afirme",
  "Otro",
];

export default function CuentasPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    accountType: "debit" as "credit_card" | "debit" | "checking" | "savings",
    lastFourDigits: "",
  });
  const [error, setError] = useState("");

  const { data: accounts, isLoading, refetch } = trpc.account.list.useQuery();
  const summary = trpc.account.summary.useQuery();

  const createAccount = trpc.account.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setFormData({ name: "", institution: "", accountType: "debit", lastFourDigits: "" });
      setError("");
      refetch();
      summary.refetch();
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.institution) {
      setError("Nombre e institución son requeridos");
      return;
    }
    createAccount.mutate({
      name: formData.name,
      institution: formData.institution,
      accountType: formData.accountType,
      lastFourDigits: formData.lastFourDigits || undefined,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Mis cuentas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? "Cancelar" : "Agregar cuenta"}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="bg-accent/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Nombre de la cuenta</label>
                  <Input
                    placeholder='Ej: "Nómina BBVA", "TDC Citibanamex"'
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Institución</label>
                  <select
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Seleccionar banco</option>
                    {COMMON_INSTITUTIONS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Tipo de cuenta</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountType: e.target.value as any,
                      })
                    }
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="debit">Tarjeta de débito</option>
                    <option value="credit_card">Tarjeta de crédito</option>
                    <option value="checking">Cuenta de cheques</option>
                    <option value="savings">Cuenta de ahorro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Últimos 4 dígitos (opcional)</label>
                  <Input
                    placeholder="1234"
                    maxLength={4}
                    value={formData.lastFourDigits}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastFourDigits: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="h-9"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={createAccount.isLoading} size="sm">
                {createAccount.isLoading ? "Guardando..." : "Crear cuenta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Account summary cards */}
      {summary.data && summary.data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {summary.data.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer card-hover"
              onClick={() => router.push(`/movimientos?accountId=${s.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ACCOUNT_TYPE_ICONS[s.accountType] || "🏦"}</span>
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.institution}
                        {s.lastFourDigits && ` ****${s.lastFourDigits}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {ACCOUNT_TYPE_LABELS[s.accountType] || s.accountType}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Ingresos</p>
                    <p className="text-xs font-semibold text-green-600">{formatMoney(s.income)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Gastos</p>
                    <p className="text-xs font-semibold text-red-600">{formatMoney(s.expenses)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Balance</p>
                    <p className={`text-xs font-semibold ${s.balance >= 0 ? "text-foreground" : "text-red-600"}`}>
                      {formatMoney(s.balance)}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground mt-2 text-right">
                  {s.movementCount} mov. este mes
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Accounts list */}
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : !accounts?.length ? (
        <EmptyState
          icon={CreditCard}
          title="Sin cuentas"
          description="Agrega tus cuentas bancarias para organizar mejor tus movimientos y estados de cuenta."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Agregar cuenta
            </Button>
          }
        />
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Todas las cuentas ({accounts.length})
          </h2>
          <div className="space-y-2">
            {accounts.map((account) => (
              <Card
                key={account.id}
                className="cursor-pointer card-hover"
                onClick={() => router.push(`/cuentas/${account.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {account.name}
                        {account.lastFourDigits && (
                          <span className="text-muted-foreground"> ****{account.lastFourDigits}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{account.institution}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {ACCOUNT_TYPE_LABELS[account.accountType] || account.accountType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{account._count.statements} PDFs</span>
                      <span>{account._count.movements} mov.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
