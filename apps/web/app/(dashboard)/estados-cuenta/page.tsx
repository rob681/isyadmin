"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { STATEMENT_STATUS_LABELS, STATEMENT_STATUS_COLORS, formatMoney } from "@isyadmin/shared";
import { FileText, Upload, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function EstadosCuentaPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const { data: statements, isLoading, refetch: refetchStatements } = trpc.statement.list.useQuery();
  const accounts = trpc.account.list.useQuery();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    // Validate all files
    for (const file of acceptedFiles) {
      if (file.type !== "application/pdf") {
        setUploadError("Solo se aceptan archivos PDF");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setUploadError("El archivo no debe superar 20 MB");
        return;
      }
    }

    setUploading(true);
    setUploadError("");

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        if (selectedAccountId) {
          formData.append("accountId", selectedAccountId);
        }

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(`${file.name}: ${err.error || "Error al subir"}`);
        }

        const { statementId } = await uploadRes.json();
        return { fileName: file.name, statementId };
      });

      const results = await Promise.all(uploadPromises);

      // If single file, navigate to detail page
      if (results.length === 1) {
        router.push(`/estados-cuenta/${results[0].statementId}`);
      } else {
        // Multiple files: refresh list and show success
        refetchStatements();
      }
    } catch (err: any) {
      setUploadError(err.message || "Error al subir archivos");
    } finally {
      setUploading(false);
    }
  }, [router, refetchStatements]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 20,
    disabled: uploading,
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "FAILED": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "REVIEW": return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold font-display">Estados de cuenta</h1>

      {/* Upload zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl bg-muted p-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              {uploading ? (
                <p className="text-sm text-muted-foreground">Subiendo archivos...</p>
              ) : isDragActive ? (
                <p className="text-sm text-primary font-medium">Suelta tus PDFs aquí</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Arrastra tus PDFs aquí</p>
                  <p className="text-xs text-muted-foreground">o haz clic para seleccionar (máximo 20)</p>
                </>
              )}
              <p className="text-xs text-muted-foreground">Formatos: PDF | Máximo: 20 MB por archivo</p>
            </div>
          </div>

          {/* Account selector */}
          {accounts.data && accounts.data.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Asignar a cuenta:
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="h-8 flex-1 max-w-xs rounded-lg border border-input bg-background px-2 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Detectar automáticamente</option>
                {accounts.data.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.institution})
                  </option>
                ))}
              </select>
            </div>
          )}

          {uploadError && (
            <p className="text-sm text-destructive text-center mt-3">{uploadError}</p>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : !statements?.length ? (
        <EmptyState
          icon={FileText}
          title="Sin estados de cuenta"
          description="Sube tu primer estado de cuenta en PDF y la IA lo leerá por ti."
        />
      ) : (
        <div className="space-y-2">
          {statements.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer card-hover"
              onClick={() => router.push(`/estados-cuenta/${s.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(s.status)}
                  <div>
                    <p className="text-sm font-medium">
                      {s.institution || s.fileName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {s.periodStart && s.periodEnd && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.periodStart).toLocaleDateString("es-MX", { month: "short", year: "numeric" })}
                        </span>
                      )}
                      <Badge
                        className={`text-[10px] px-1.5 py-0 ${STATEMENT_STATUS_COLORS[s.status as keyof typeof STATEMENT_STATUS_COLORS]}`}
                      >
                        {STATEMENT_STATUS_LABELS[s.status as keyof typeof STATEMENT_STATUS_LABELS]}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {s.movementsCount != null && (
                    <span className="text-xs text-muted-foreground">{s.movementsCount} mov.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
