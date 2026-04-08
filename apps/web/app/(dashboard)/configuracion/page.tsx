"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAN_TIERS } from "@isyadmin/shared";
import { Settings, Building2, Users, CreditCard, Plus, Trash2, Copy, CheckCircle2 } from "lucide-react";

export default function ConfiguracionPage() {
  const { data: tenant, isLoading, refetch } = trpc.tenant.current.useQuery();
  const updateTenant = trpc.tenant.update.useMutation({ onSuccess: () => refetch() });

  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const members = trpc.sharing.listMembers.useQuery();
  const invites = trpc.sharing.listInvites.useQuery();

  const inviteUser = trpc.sharing.inviteUser.useMutation({
    onSuccess: () => {
      setInviteEmail("");
      members.refetch();
      invites.refetch();
    },
    onError: (err) => {
      alert(`Error: ${err.message}`);
    },
  });

  const removeMember = trpc.sharing.removeMember.useMutation({
    onSuccess: () => {
      members.refetch();
    },
    onError: (err) => {
      alert(`Error: ${err.message}`);
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      alert("Ingresa un email");
      return;
    }
    inviteUser.mutate({ email: inviteEmail });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInviteId(id);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!tenant) return null;

  const plan = PLAN_TIERS[tenant.planTier as keyof typeof PLAN_TIERS] ?? PLAN_TIERS.free;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold font-display">Configuración</h1>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" />
            Organización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{tenant.name}</p>
              <p className="text-xs text-muted-foreground">Tipo: {tenant.type}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setName(tenant.name);
                setEditing(!editing);
              }}
            >
              {editing ? "Cancelar" : "Editar"}
            </Button>
          </div>
          {editing && (
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la organización"
              />
              <Button
                onClick={() => {
                  updateTenant.mutate({ name });
                  setEditing(false);
                }}
                disabled={updateTenant.isLoading}
              >
                Guardar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Plan actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{plan.name}</p>
                <Badge variant="secondary">{tenant.planTier}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {plan.maxStatements === -1 ? "PDFs ilimitados" : `${plan.maxStatements} PDFs/mes`} | {plan.maxUsers} usuario(s)
              </p>
            </div>
            {tenant.planTier === "free" && (
              <Button size="sm">Mejorar plan</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {tenant._count.users} de {tenant.maxUsers} usuarios
          </p>
        </CardContent>
      </Card>

      {/* Shared Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Acceso compartido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite form */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Comparte tu cuenta con pareja, familia o colegas. Podrán ver y editar tus movimientos.
            </p>
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={inviteUser.isLoading}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Invitar
              </Button>
            </form>
          </div>

          {/* Active members */}
          {members.data && members.data.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Miembros activos ({members.data.length})</h3>
              <div className="space-y-2">
                {members.data.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{member.user?.name || member.user?.email}</p>
                      <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{member.role}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm("¿Estás seguro de que deseas eliminar este miembro?")) {
                            removeMember.mutate({ memberId: member.id });
                          }
                        }}
                        disabled={removeMember.isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending invites */}
          {invites.data && invites.data.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Invitaciones pendientes ({invites.data.length})</h3>
              <div className="space-y-2">
                {invites.data.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-amber-50"
                  >
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Vence: {new Date(invite.expiresAt).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pendiente</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(invite.token, invite.id)}
                      >
                        {copiedInviteId === invite.id ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {members.data?.length === 0 && invites.data?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay miembros compartiendo tu cuenta todavía.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
