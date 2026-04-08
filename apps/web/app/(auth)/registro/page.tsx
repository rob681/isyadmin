"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { User, Briefcase, Building2 } from "lucide-react";

const USER_TYPES = [
  { value: "PERSONAL", label: "Personal / Hogar", icon: User, desc: "Controla tus gastos personales" },
  { value: "EMPRENDEDOR", label: "Emprendedor", icon: Briefcase, desc: "Separa personal y negocio" },
  { value: "EMPRESA", label: "Empresa pequeña", icon: Building2, desc: "Gestiona tu empresa" },
] as const;

export default function RegistroPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      // Auto-login after registration
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/onboarding");
        router.refresh();
      }
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    register.mutate({
      name,
      email,
      password,
      tenantName: tenantName || name,
      userType: userType as any,
    });

    setLoading(false);
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
            {step === 1 ? "¿Cómo usarás IsyAdmin?" : "Crea tu cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div className="space-y-3">
              {USER_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setUserType(type.value);
                    setStep(2);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:border-primary/50 hover:bg-accent ${
                    userType === type.value ? "border-primary bg-accent" : ""
                  }`}
                >
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <type.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                  </div>
                </button>
              ))}
              <p className="text-center text-sm text-muted-foreground mt-4">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Nombre</label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required className="h-11" />
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-email" className="text-sm font-medium">Correo electrónico</label>
                <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required className="h-11" />
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-password" className="text-sm font-medium">Contraseña</label>
                <Input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} className="h-11" />
              </div>
              {(userType === "EMPRENDEDOR" || userType === "EMPRESA") && (
                <div className="space-y-2">
                  <label htmlFor="tenant" className="text-sm font-medium">Nombre del negocio</label>
                  <Input id="tenant" value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Mi Empresa S.A." className="h-11" />
                </div>
              )}
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" className="w-full h-11" disabled={loading || register.isLoading}>
                {loading || register.isLoading ? "Creando cuenta..." : "Crear cuenta gratis"}
              </Button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-muted-foreground hover:text-foreground">
                ← Cambiar tipo de cuenta
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
