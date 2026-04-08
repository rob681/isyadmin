import { router } from "./trpc";
import { authRouter } from "./routers/auth.router";
import { dashboardRouter } from "./routers/dashboard.router";
import { movementRouter } from "./routers/movement.router";
import { statementRouter } from "./routers/statement.router";
import { categoryRouter } from "./routers/category.router";
import { alertRouter } from "./routers/alert.router";
import { recurringRouter } from "./routers/recurring.router";
import { healthRouter } from "./routers/health.router";
import { tenantRouter } from "./routers/tenant.router";
import { intelligenceRouter } from "./routers/intelligence.router";
import { invoiceRouter } from "./routers/invoice.router";
import { sharingRouter } from "./routers/sharing.router";
import { accountRouter } from "./routers/account.router";

export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
  movement: movementRouter,
  statement: statementRouter,
  category: categoryRouter,
  alert: alertRouter,
  recurring: recurringRouter,
  health: healthRouter,
  tenant: tenantRouter,
  intelligence: intelligenceRouter,
  invoice: invoiceRouter,
  sharing: sharingRouter,
  account: accountRouter,
});

export type AppRouter = typeof appRouter;
