"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const requestReset = trpc.auth.requestReset.useMutation({
    onSuccess: () => setSent(true),
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    requestReset.mutate({ email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-[hsl(199,89%,48%)] opacity-[0.04] blur-[100px]" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-[hsl(172,66%,50%)] opacity-[0.04] blur-[100px]" />
      </div>

      <Card className="w-full max-w-md relative glass-card shadow-soft">
        <CardHeader className="text-center space-y-4 pb-2">
          <h1 className="text-2xl font-bold gradient-text font-display">IsyAdmin</h1>
          <CardDescription>
            {sent ? "Revisa tu correo" : "Recupera tu contraseña"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" className="w-full h-11" disabled={requestReset.isLoading}>
                {requestReset.isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
              <Link href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3 w-3 inline mr-1" />
                Volver al login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
