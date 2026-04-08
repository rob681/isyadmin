"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Home, Briefcase, Sparkles, Loader2 } from "lucide-react";

export default function NuevoMovimientoPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<"CARGO" | "ABONO">("CARGO");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [scope, setScope] = useState<"PERSONAL" | "NEGOCIO">("PERSONAL");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [aiApplied, setAiApplied] = useState(false);
  const [aiMerchant, setAiMerchant] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced description for AI suggestion
  const [debouncedDesc, setDebouncedDesc] = useState("");
  useEffect(() => {
    if (description.length < 3) {
      setDebouncedDesc("");
      return;
    }
    debounceRef.current = setTimeout(() => setDebouncedDesc(description), 800);
    return () => clearTimeout(debounceRef.current);
  }, [description]);

  const categories = trpc.category.list.useQuery();

  const suggestion = trpc.category.suggest.useQuery(
    { description: debouncedDesc, amount: amount ? parseFloat(amount) : undefined, type: tipo },
    { enabled: debouncedDesc.length >= 3 && !aiApplied }
  );

  // Auto-apply AI suggestion
  useEffect(() => {
    if (suggestion.data && suggestion.data.categoryId && suggestion.data.confidence > 0.5 && !aiApplied) {
      setCategoryId(suggestion.data.categoryId);
      if (suggestion.data.subcategoryId) setSubcategoryId(suggestion.data.subcategoryId);
      if (suggestion.data.merchantName) setAiMerchant(suggestion.data.merchantName);
      setAiApplied(true);
    }
  }, [suggestion.data, aiApplied]);

  // Reset AI when description changes significantly
  useEffect(() => {
    setAiApplied(false);
    setAiMerchant(null);
  }, [description]);

  // Get subcategories for selected category
  const selectedCategory = categories.data?.find((c) => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories ?? [];

  const createMovement = trpc.movement.create.useMutation({
    onSuccess: () => {
      router.push("/movimientos");
      router.refresh();
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    createMovement.mutate({
      date,
      description,
      amount: parseFloat(amount),
      type: tipo,
      scope,
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      merchantName: aiMerchant || undefined,
      notes: notes || undefined,
    });
  };

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

      <Card>
        <CardHeader>
          <CardTitle>Nuevo movimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo("CARGO")}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  tipo === "CARGO"
                    ? "bg-red-100 text-red-700 border-2 border-red-300"
                    : "bg-secondary text-muted-foreground border-2 border-transparent"
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setTipo("ABONO")}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  tipo === "ABONO"
                    ? "bg-green-100 text-green-700 border-2 border-green-300"
                    : "bg-secondary text-muted-foreground border-2 border-transparent"
                }`}
              >
                Ingreso
              </button>
            </div>

            {/* Amount */}
            <div className="text-center">
              <label className="text-sm text-muted-foreground">Monto</label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-center text-3xl font-bold py-4 pl-8 bg-transparent border-b-2 border-input focus:border-primary outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Description + AI suggestion indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Descripcion</label>
                {suggestion.isFetching && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Clasificando...
                  </span>
                )}
                {aiApplied && (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="h-3 w-3" />
                    IA sugiere
                  </span>
                )}
              </div>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Ej: "Uber a oficina", "Netflix mensual"'
                required
                className="h-11"
              />
              {aiMerchant && (
                <p className="text-xs text-muted-foreground">
                  Comercio detectado: <span className="font-medium">{aiMerchant}</span>
                </p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Categoria</label>
                {aiApplied && selectedCategory && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    {selectedCategory.name}
                  </Badge>
                )}
              </div>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                  setAiApplied(false);
                }}
                className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Seleccionar categoria</option>
                {categories.data
                  ?.filter((c) => {
                    if (tipo === "ABONO") return c.type === "INGRESO";
                    return c.type !== "INGRESO";
                  })
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Subcategory (shown when category selected) */}
            {subcategories.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Subcategoria</label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Seleccionar subcategoria</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scope toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ambito</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope("PERSONAL")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    scope === "PERSONAL"
                      ? "bg-primary/10 text-primary border-2 border-primary/30"
                      : "bg-secondary text-muted-foreground border-2 border-transparent"
                  }`}
                >
                  <Home className="h-4 w-4" /> Personal
                </button>
                <button
                  type="button"
                  onClick={() => setScope("NEGOCIO")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    scope === "NEGOCIO"
                      ? "bg-primary/10 text-primary border-2 border-primary/30"
                      : "bg-secondary text-muted-foreground border-2 border-transparent"
                  }`}
                >
                  <Briefcase className="h-4 w-4" /> Negocio
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
                className="h-11"
              />
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button
              type="submit"
              className="w-full h-12"
              disabled={createMovement.isLoading}
            >
              {createMovement.isLoading ? "Guardando..." : "Guardar movimiento"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
