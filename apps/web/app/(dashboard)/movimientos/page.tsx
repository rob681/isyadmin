"use client";

import { Suspense, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { ListSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney, SCOPE_LABELS } from "@isyadmin/shared";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Home,
  Briefcase,
  FileText,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type MovementType = "CARGO" | "ABONO" | "COMISION" | "INTERES" | "PAGO" | "MSI" | "DOMICILIACION";

const TYPE_LABELS: Record<string, string> = {
  CARGO: "Gastos",
  ABONO: "Ingresos",
  COMISION: "Comisiones",
  INTERES: "Intereses",
  PAGO: "Pagos",
  MSI: "MSI",
  DOMICILIACION: "Domiciliaciones",
};

export default function MovimientosPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={8} />}>
      <MovimientosContent />
    </Suspense>
  );
}

function MovimientosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAccountId = searchParams.get("accountId");

  const [scope, setScope] = useState<"PERSONAL" | "NEGOCIO" | undefined>();
  const [type, setType] = useState<MovementType | undefined>();
  const [accountId, setAccountId] = useState<string | undefined>(urlAccountId || undefined);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Sync accountId from URL
  useEffect(() => {
    if (urlAccountId) {
      setAccountId(urlAccountId);
      setShowFilters(true);
    }
  }, [urlAccountId]);

  const accounts = trpc.account.list.useQuery();

  const hasActiveFilters = scope || type || accountId || dateFrom || dateTo;

  const { data, isLoading } = trpc.movement.list.useQuery({
    scope,
    type,
    accountId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search || undefined,
    page,
    limit: 30,
  });

  const clearFilters = () => {
    setScope(undefined);
    setType(undefined);
    setAccountId(undefined);
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Movimientos</h1>
        <Button onClick={() => router.push("/movimientos/nuevo")}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Search + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar movimiento..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3.5 w-3.5 mr-1" />
          Filtros
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1">
              {[scope, type, accountId, dateFrom, dateTo].filter(Boolean).length}
            </Badge>
          )}
          {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <Card className="bg-accent/30">
          <CardContent className="p-4 space-y-4">
            {/* Scope */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ámbito</label>
              <div className="flex gap-2">
                <Button
                  variant={scope === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setScope(undefined); setPage(1); }}
                >
                  Todo
                </Button>
                <Button
                  variant={scope === "PERSONAL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setScope("PERSONAL"); setPage(1); }}
                >
                  <Home className="h-3.5 w-3.5 mr-1" /> Personal
                </Button>
                <Button
                  variant={scope === "NEGOCIO" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setScope("NEGOCIO"); setPage(1); }}
                >
                  <Briefcase className="h-3.5 w-3.5 mr-1" /> Negocio
                </Button>
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={type === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setType(undefined); setPage(1); }}
                >
                  Todos
                </Button>
                {(["CARGO", "ABONO", "COMISION", "INTERES", "PAGO", "MSI", "DOMICILIACION"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={type === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setType(t); setPage(1); }}
                  >
                    {TYPE_LABELS[t]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Account */}
            {accounts.data && accounts.data.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Cuenta</label>
                <select
                  value={accountId || ""}
                  onChange={(e) => {
                    setAccountId(e.target.value || undefined);
                    setPage(1);
                  }}
                  className="h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Todas las cuentas</option>
                  {accounts.data.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institution})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date range */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fecha</label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="h-9 max-w-[160px]"
                />
                <span className="text-xs text-muted-foreground">a</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="h-9 max-w-[160px]"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results summary */}
      {data && (
        <p className="text-xs text-muted-foreground">
          {data.total} movimiento{data.total !== 1 ? "s" : ""}
          {hasActiveFilters && " (filtrado)"}
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <ListSkeleton rows={8} />
      ) : !data?.movements.length ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Sin movimientos"
          description={
            hasActiveFilters
              ? "No se encontraron movimientos con los filtros seleccionados."
              : "Agrega tu primer movimiento o sube un estado de cuenta para comenzar."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button onClick={() => router.push("/movimientos/nuevo")}>
                  <Plus className="h-4 w-4 mr-2" /> Agregar
                </Button>
                <Button variant="outline" onClick={() => router.push("/estados-cuenta")}>
                  Subir PDF
                </Button>
              </div>
            )
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {data.movements.map((m) => (
              <Card
                key={m.id}
                className="cursor-pointer card-hover"
                onClick={() => router.push(`/movimientos/${m.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${m.type === "ABONO" ? "bg-green-100" : "bg-red-100"}`}>
                      {m.type === "ABONO" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.merchantName || m.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {new Date(m.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                        </span>
                        {m.category && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {m.category.name}
                          </Badge>
                        )}
                        {m.scope === "NEGOCIO" && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            <Briefcase className="h-2.5 w-2.5 mr-0.5" />
                            Negocio
                          </Badge>
                        )}
                        {m.isDeductible && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700">
                            <FileText className="h-2.5 w-2.5 mr-0.5" />
                            Deducible
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${m.type === "ABONO" ? "text-green-600" : "text-foreground"}`}>
                    {m.type === "ABONO" ? "+" : "-"}{formatMoney(m.amount)}
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
