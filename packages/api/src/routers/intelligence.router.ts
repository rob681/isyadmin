import { router, protectedProcedure, getTenantId } from "../trpc";
import { generateFinancialIntelligence } from "../lib/financial-intelligence";

export const intelligenceRouter = router({
  analyze: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    return generateFinancialIntelligence(tenantId);
  }),
});
