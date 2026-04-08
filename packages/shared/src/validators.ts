import { z } from "zod";

// ── Auth ──
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  tenantName: z.string().min(2, "Mínimo 2 caracteres"),
  userType: z.enum(["PERSONAL", "EMPRENDEDOR", "EMPRESA"]),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

// ── Movements ──
export const createMovementSchema = z.object({
  date: z.string().or(z.date()),
  description: z.string().min(1, "Descripción requerida"),
  amount: z.number().positive("Monto debe ser positivo"),
  type: z.enum(["CARGO", "ABONO", "COMISION", "INTERES", "PAGO", "MSI", "DOMICILIACION"]),
  scope: z.enum(["PERSONAL", "NEGOCIO"]).default("PERSONAL"),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  merchantName: z.string().optional(),
  notes: z.string().optional(),
  accountId: z.string().optional(),
});

export const updateMovementSchema = createMovementSchema.partial().extend({
  id: z.string(),
});

export const movementFiltersSchema = z.object({
  scope: z.enum(["PERSONAL", "NEGOCIO"]).optional(),
  type: z.enum(["CARGO", "ABONO", "COMISION", "INTERES", "PAGO", "MSI", "DOMICILIACION"]).optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(50),
});

// ── Statements ──
export const confirmStatementSchema = z.object({
  statementId: z.string(),
  corrections: z.array(
    z.object({
      movementId: z.string(),
      field: z.string(),
      newValue: z.string(),
    })
  ).optional(),
});

// ── Accounts ──
export const createAccountSchema = z.object({
  name: z.string().min(1),
  institution: z.string().min(1),
  accountType: z.enum(["credit_card", "debit", "checking", "savings"]),
  lastFourDigits: z.string().length(4).optional(),
  currency: z.string().default("MXN"),
});

// ── Recurring ──
export const createRecurringSchema = z.object({
  name: z.string().min(1),
  estimatedAmount: z.number().positive(),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "BIMONTHLY", "QUARTERLY", "ANNUAL"]),
  scope: z.enum(["PERSONAL", "NEGOCIO"]).default("PERSONAL"),
  isSubscription: z.boolean().default(false),
  isService: z.boolean().default(false),
  nextExpectedDate: z.string().optional(),
});

// ── Tenant ──
export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(["PERSONAL", "EMPRENDEDOR", "EMPRESA"]).optional(),
});
