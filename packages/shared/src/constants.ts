import type { Role, StatementStatus, MovementType, AlertSeverity, HealthLevel, Scope } from "./types";

// ── Roles ──
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  MIEMBRO: "Miembro",
};

// ── Statement Status ──
export const STATEMENT_STATUS_LABELS: Record<StatementStatus, string> = {
  UPLOADED: "Subido",
  EXTRACTING: "Extrayendo texto",
  INTERPRETING: "Interpretando",
  VALIDATING: "Validando",
  REVIEW: "Listo para revisión",
  CONFIRMED: "Confirmado",
  FAILED: "Error",
};

export const STATEMENT_STATUS_COLORS: Record<StatementStatus, string> = {
  UPLOADED: "bg-gray-100 text-gray-700",
  EXTRACTING: "bg-blue-100 text-blue-700",
  INTERPRETING: "bg-indigo-100 text-indigo-700",
  VALIDATING: "bg-purple-100 text-purple-700",
  REVIEW: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

// ── Movement Types ──
export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  CARGO: "Cargo",
  ABONO: "Abono",
  COMISION: "Comisión",
  INTERES: "Interés",
  PAGO: "Pago",
  MSI: "Meses sin intereses",
  DOMICILIACION: "Domiciliación",
};

// ── Scope ──
export const SCOPE_LABELS: Record<Scope, string> = {
  PERSONAL: "Personal",
  NEGOCIO: "Negocio",
};

// ── Severity ──
export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  RED: "Urgente",
  YELLOW: "Atención",
  GREEN: "Informativo",
};

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  RED: "bg-red-100 text-red-700 border-red-200",
  YELLOW: "bg-amber-100 text-amber-700 border-amber-200",
  GREEN: "bg-green-100 text-green-700 border-green-200",
};

// ── Health ──
export const HEALTH_LABELS: Record<HealthLevel, string> = {
  GREEN: "Estable",
  YELLOW: "Atención",
  RED: "Urgencia",
};

export const HEALTH_COLORS: Record<HealthLevel, string> = {
  GREEN: "text-green-600",
  YELLOW: "text-amber-600",
  RED: "text-red-600",
};

export const HEALTH_BG_COLORS: Record<HealthLevel, string> = {
  GREEN: "bg-green-50 border-green-200",
  YELLOW: "bg-amber-50 border-amber-200",
  RED: "bg-red-50 border-red-200",
};

// ── Plans ──
export const PLAN_TIERS = {
  free: { name: "Gratis", maxStatements: 3, maxUsers: 1, price: 0 },
  basic: { name: "Básico", maxStatements: 15, maxUsers: 3, price: 199 },
  pro: { name: "Profesional", maxStatements: -1, maxUsers: 10, price: 499 },
} as const;

export type PlanTier = keyof typeof PLAN_TIERS;

// ── Products (Ecosystem) ──
export const PRODUCTS = {
  ISYADMIN: { name: "IsyAdmin", description: "Administración financiera", color: "#0ea5e9" },
  ISYTASK: { name: "IsyTask", description: "Gestión de tareas", color: "#6366f1" },
  ISYSOCIAL: { name: "IsySocial", description: "Redes sociales", color: "#ec4899" },
} as const;

// ── Currency ──
export const DEFAULT_CURRENCY = "MXN";

export const CURRENCY_FORMAT = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
  return CURRENCY_FORMAT.format(amount);
}
