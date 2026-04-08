import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, getTenantId } from "../trpc";
import { db } from "@isyadmin/db";
import crypto from "crypto";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const sharingRouter = router({
  // List members this tenant is shared with
  listMembers: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);

    const members = await db.sharedTenantMember.findMany({
      where: { tenantId },
      include: {
        // Can't join User directly in Prisma due to relation setup
      },
    });

    // Fetch user details separately
    const usersMap = new Map();
    for (const member of members) {
      if (!usersMap.has(member.userId)) {
        const user = await db.user.findUnique({
          where: { id: member.userId },
          select: { id: true, email: true, name: true },
        });
        usersMap.set(member.userId, user);
      }
    }

    return members.map((m) => ({
      ...m,
      user: usersMap.get(m.userId),
    }));
  }),

  // List pending invites
  listInvites: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);

    return db.sharedTenantInvite.findMany({
      where: {
        tenantId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Send invite to email
  inviteUser: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const userId = ctx.session.user.id;

      // Verify user owns this tenant
      const tenant = await db.tenant.findFirst({
        where: { id: tenantId, users: { some: { id: userId } } },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No tienes permiso para compartir este tenant",
        });
      }

      // Check if already invited or member
      const existing = await db.sharedTenantMember.findFirst({
        where: { tenantId, userId: userId }, // This won't work as-is; needs proper check
      });

      // Generate token valid for 7 days
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      try {
        const invite = await db.sharedTenantInvite.upsert({
          where: {
            tenantId_email: { tenantId, email: input.email },
          },
          create: {
            tenantId,
            email: input.email,
            invitedBy: userId,
            token,
            expiresAt,
          },
          update: {
            token,
            expiresAt,
            invitedBy: userId,
            acceptedAt: null,
          },
        });

        // TODO: Send email with invite link to input.email
        // link format: /invites/accept?token=xyz

        return { success: true, inviteId: invite.id };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al crear invitación",
        });
      }
    }),

  // Accept invite (called by invited user)
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const user = ctx.session.user as any;

      const invite = await db.sharedTenantInvite.findFirst({
        where: {
          token: input.token,
          email: user.email,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitación inválida o expirada",
        });
      }

      // Create membership and mark invite as accepted
      try {
        await db.$transaction([
          db.sharedTenantMember.create({
            data: {
              tenantId: invite.tenantId,
              userId,
              role: "EDITOR",
              addedBy: invite.invitedBy,
            },
          }),
          db.sharedTenantInvite.update({
            where: { id: invite.id },
            data: { acceptedAt: new Date() },
          }),
        ]);

        return { success: true, tenantId: invite.tenantId };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error al aceptar invitación",
        });
      }
    }),

  // Remove a shared member
  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const userId = ctx.session.user.id;

      // Verify user owns this tenant
      const tenant = await db.tenant.findFirst({
        where: { id: tenantId, users: { some: { id: userId } } },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No tienes permiso para modificar este tenant",
        });
      }

      const member = await db.sharedTenantMember.findFirst({
        where: { id: input.memberId, tenantId },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Miembro no encontrado",
        });
      }

      await db.sharedTenantMember.delete({
        where: { id: input.memberId },
      });

      return { success: true };
    }),
});
