import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";
import type { Role } from "@isyadmin/shared";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// ── Auth middleware ──
const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No autenticado" });
  }
  return next({ ctx: { session: ctx.session } });
});

// ── Rate limiter ──
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 200;
const rateLimitMap = new Map<string, number[]>();

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap) {
    const valid = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) rateLimitMap.delete(key);
    else rateLimitMap.set(key, valid);
  }
}, 5 * 60_000);

const rateLimit = t.middleware(({ ctx, next }) => {
  const userId = ctx.session?.user?.id;
  if (!userId) return next();

  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) ?? [];
  const windowTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (windowTimestamps.length >= RATE_LIMIT_MAX) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Demasiadas solicitudes. Intenta de nuevo en un momento.",
    });
  }

  windowTimestamps.push(now);
  rateLimitMap.set(userId, windowTimestamps);
  return next();
});

export const protectedProcedure = t.procedure.use(isAuthenticated).use(rateLimit);

// ── Role middleware ──
function requireRole(...roles: Role[]) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "No autenticado" });
    }
    const userRole = ctx.session.user.role as Role;
    if (userRole === "SUPER_ADMIN" || roles.includes(userRole)) {
      return next({ ctx: { session: ctx.session } });
    }
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tienes permisos para esta acción",
    });
  });
}

export const adminProcedure = protectedProcedure.use(requireRole("ADMIN"));
export const superAdminProcedure = protectedProcedure.use(requireRole("SUPER_ADMIN" as Role));

// ── Tenant helper ──
export function getTenantId(ctx: { session: { user: { tenantId?: string; role?: string } } }): string {
  const { tenantId, role } = ctx.session.user;
  if (!tenantId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: role === "SUPER_ADMIN"
        ? "Esta operación requiere contexto de tenant."
        : "No se encontró tenantId en la sesión.",
    });
  }
  return tenantId;
}
