import { router, protectedProcedure, adminProcedure, getTenantId } from "../trpc";
import { db } from "@isyadmin/db";
import { updateTenantSchema } from "@isyadmin/shared";

export const tenantRouter = router({
  current: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    return db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        planTier: true,
        maxUsers: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
    });
  }),

  update: adminProcedure
    .input(updateTenantSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      return db.tenant.update({
        where: { id: tenantId },
        data: input as any,
      });
    }),
});
