import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { db } from "@isyadmin/db";
import { registerSchema } from "@isyadmin/shared";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      const existing = await db.user.findFirst({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe una cuenta con este email",
        });
      }

      const passwordHash = await hash(input.password, 12);
      let slug = generateSlug(input.tenantName);

      // Ensure unique slug
      const slugExists = await db.tenant.findUnique({ where: { slug } });
      if (slugExists) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const tenant = await db.tenant.create({
        data: {
          name: input.tenantName,
          slug,
          type: input.userType as any,
          users: {
            create: {
              email: input.email,
              name: input.name,
              passwordHash,
              role: "ADMIN",
            },
          },
        },
        include: { users: true },
      });

      return { success: true, tenantId: tenant.id };
    }),

  requestReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await db.user.findFirst({
        where: { email: input.email, isActive: true },
      });

      // Always return success to prevent email enumeration
      if (!user) return { success: true };

      const token = crypto.randomUUID();
      await db.token.create({
        data: {
          token,
          type: "PASSWORD_RESET",
          email: input.email,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // TODO: Send email with reset link via Resend
      console.log(`[DEV] Reset token for ${input.email}: ${token}`);

      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const tokenRecord = await db.token.findUnique({
        where: { token: input.token },
      });

      if (!tokenRecord || tokenRecord.type !== "PASSWORD_RESET") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token inválido" });
      }
      if (tokenRecord.usedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token ya utilizado" });
      }
      if (tokenRecord.expiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token expirado" });
      }

      const passwordHash = await hash(input.password, 12);

      await db.$transaction([
        db.user.updateMany({
          where: { email: tokenRecord.email, isActive: true },
          data: { passwordHash },
        }),
        db.token.update({
          where: { id: tokenRecord.id },
          data: { usedAt: new Date() },
        }),
      ]);

      return { success: true };
    }),
});
