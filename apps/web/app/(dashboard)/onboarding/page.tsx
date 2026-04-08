"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, PenLine, ArrowRight, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto space-y-8 py-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Bienvenido a IsyAdmin
        </div>
        <h1 className="text-2xl font-bold font-display">
          Empieza a entender tu dinero
        </h1>
        <p className="text-muted-foreground text-sm">
          Elige cómo quieres comenzar. Puedes hacer ambas cosas después.
        </p>
      </div>

      <div className="space-y-4">
        <Card
          className="cursor-pointer card-hover border-2 hover:border-primary/30"
          onClick={() => router.push("/estados-cuenta")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-2xl bg-primary/10 p-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Subir estado de cuenta</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                La IA leerá tu PDF y organizará tus movimientos automáticamente.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer card-hover border-2 hover:border-primary/30"
          onClick={() => router.push("/movimientos/nuevo")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-2xl bg-green-100 p-4">
              <PenLine className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Capturar manualmente</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Agrega tus ingresos y gastos uno por uno.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Ir al dashboard directamente
      </button>
    </div>
  );
}
