import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, getTenantId } from "../trpc";
import { db } from "@isyadmin/db";

const invoiceSchema = z.object({
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  vendor: z.string().min(1, "Vendor is required"),
  description: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  categoryId: z.string().optional(),
  isPaid: z.boolean().default(false),
  dueDate: z.string().optional().refine(
    (d) => !d || !isNaN(Date.parse(d)),
    "Invalid due date"
  ),
  scope: z.enum(["PERSONAL", "NEGOCIO"]).default("PERSONAL"),
  notes: z.string().optional(),
});

export const invoiceRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        scope: z.enum(["PERSONAL", "NEGOCIO"]).optional(),
        isPaid: z.boolean().optional(),
        page: z.number().default(1),
        limit: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const { scope, isPaid, page, limit } = input;

      const where: any = { tenantId };
      if (scope) where.scope = scope;
      if (isPaid !== undefined) where.isPaid = isPaid;

      const [invoices, total] = await Promise.all([
        db.invoice.findMany({
          where,
          orderBy: { dueDate: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.invoice.count({ where }),
      ]);

      return {
        invoices: invoices.map((i) => ({
          ...i,
          amount: Number(i.amount),
        })),
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const invoice = await db.invoice.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!invoice) return null;
      return { ...invoice, amount: Number(invoice.amount) };
    }),

  create: protectedProcedure
    .input(invoiceSchema)
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);

      const invoice = await db.invoice.create({
        data: {
          tenantId,
          date: new Date(input.date),
          vendor: input.vendor,
          description: input.description,
          amount: input.amount,
          categoryId: input.categoryId,
          isPaid: input.isPaid,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          scope: input.scope,
          notes: input.notes,
        },
      });

      return { ...invoice, amount: Number(invoice.amount) };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        ...invoiceSchema.partial().shape,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      const { id, ...data } = input;

      const invoice = await db.invoice.findFirst({
        where: { id, tenantId },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      const updateData: any = {};
      if (data.date) updateData.date = new Date(data.date);
      if (data.vendor) updateData.vendor = data.vendor;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.amount) updateData.amount = data.amount;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
      if (data.dueDate !== undefined) {
        updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      }
      if (data.scope) updateData.scope = data.scope;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await db.invoice.update({
        where: { id },
        data: updateData,
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);

      const invoice = await db.invoice.findFirst({
        where: { id: input.id, tenantId },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      await db.invoice.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
