// ── Roles ──
export type Role = "SUPER_ADMIN" | "ADMIN" | "MIEMBRO";
export type UserType = "PERSONAL" | "EMPRENDEDOR" | "EMPRESA";

// ── Statements ──
export type StatementStatus =
  | "UPLOADED"
  | "EXTRACTING"
  | "INTERPRETING"
  | "VALIDATING"
  | "REVIEW"
  | "CONFIRMED"
  | "FAILED";

// ── Movements ──
export type MovementType =
  | "CARGO"
  | "ABONO"
  | "COMISION"
  | "INTERES"
  | "PAGO"
  | "MSI"
  | "DOMICILIACION";

export type MovementSource = "PDF_EXTRACTED" | "MANUAL" | "API";
export type Scope = "PERSONAL" | "NEGOCIO";

// ── Recurrents ──
export type RecurrenceFrequency =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "BIMONTHLY"
  | "QUARTERLY"
  | "ANNUAL";

// ── Alerts ──
export type AlertSeverity = "RED" | "YELLOW" | "GREEN";
export type AlertType =
  | "PAYMENT_DUE"
  | "SPENDING_SPIKE"
  | "CASH_FLOW_RISK"
  | "NEW_RECURRING"
  | "INSTALLMENT_END"
  | "ANOMALY";

// ── Health ──
export type HealthLevel = "GREEN" | "YELLOW" | "RED";

export interface HealthInputs {
  totalIncome: number;
  totalExpenses: number;
  totalDebt: number;
  minimumPayments: number;
  monthlyInstallments: number;
  overduePayments: number;
  upcomingPayments7d: number;
  spendingVsAverage: number;
  savingsRate: number;
}

export interface HealthResult {
  score: number;
  level: HealthLevel;
  summary: string;
  factors: string[];
}

// ── Dashboard ──
export interface DashboardOverview {
  totalIncome: number;
  totalExpenses: number;
  available: number;
  upcomingTotal: number;
  health: HealthResult;
}

// ── AI Pipeline ──
export interface ParsedStatement {
  institution: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  cutoffDate: string | null;
  paymentDueDate: string | null;
  currentBalance: number | null;
  minimumPayment: number | null;
  noInterestPayment: number | null;
  movements: ParsedMovement[];
}

export interface ParsedMovement {
  date: string;
  description: string;
  originalDescription: string;
  amount: number;
  type: MovementType;
  category: string | null;
  subcategory: string | null;
  merchantName: string | null;
  isRecurring: boolean;
  isSubscription: boolean;
  isService: boolean;
  isLoan: boolean;
  isInstallment: boolean;
  totalInstallments: number | null;
  remainingInstallments: number | null;
  confidence: number;
}
