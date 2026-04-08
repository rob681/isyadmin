"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const acceptInvite = trpc.sharing.acceptInvite.useMutation();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de invitación no válido");
      return;
    }
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setLoading(true);
    setStatus("loading");

    try {
      const result = await acceptInvite.mutateAsync({ token });
      setStatus("success");
      setMessage("¡Invitación aceptada!");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Error al aceptar la invitación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceptar invitación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "idle" && (
            <>
              <p className="text-sm text-muted-foreground">
                Te han invitado a compartir una cuenta de IsyAdmin. Haz clic en el botón a continuación para aceptar la invitación.
              </p>
              <Button onClick={handleAccept} disabled={!token || loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? "Aceptando..." : "Aceptar invitación"}
              </Button>
            </>
          )}

          {status === "loading" && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">¡Éxito!</p>
                <p className="text-sm text-muted-foreground">{message}</p>
                <p className="text-xs text-muted-foreground">Redirigiendo al dashboard...</p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">Error</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
                Volver al login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
