import { z } from "zod";
import { router, protectedProcedure, getTenantId } from "../trpc";
import { db } from "@isyadmin/db";
import { askClaude } from "../lib/claude";

export const categoryRouter = router({
  list: protectedProcedure.query(async () => {
    const categories = await db.category.findMany({
      include: {
        subcategories: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return categories;
  }),

  listCustom: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = getTenantId(ctx);
    return db.customCategory.findMany({ where: { tenantId } });
  }),

  createCustom: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      icon: z.string().optional(),
      color: z.string().optional(),
      parentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      return db.customCategory.create({
        data: { tenantId, ...input },
      });
    }),

  deleteCustom: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = getTenantId(ctx);
      await db.customCategory.deleteMany({ where: { id: input.id, tenantId } });
      return { success: true };
    }),

  suggest: protectedProcedure
    .input(z.object({
      description: z.string().min(2),
      amount: z.number().optional(),
      type: z.enum(["CARGO", "ABONO"]).optional(),
    }))
    .query(async ({ input }) => {
      const categories = await db.category.findMany({
        include: { subcategories: true },
        orderBy: { sortOrder: "asc" },
      });

      const categoryList = categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })),
      }));

      const prompt = `Eres un clasificador financiero mexicano. Dado el siguiente movimiento bancario, sugiere la categoría y subcategoría más apropiada.

Movimiento: "${input.description}"
${input.amount ? `Monto: $${input.amount}` : ""}
${input.type ? `Tipo: ${input.type === "CARGO" ? "Gasto" : "Ingreso"}` : ""}

Categorías disponibles:
${JSON.stringify(categoryList, null, 2)}

Responde SOLO con JSON válido (sin markdown):
{"categoryId": "...", "subcategoryId": "...", "confidence": 0.0-1.0, "merchantName": "..." o null}`;

      try {
        const response = await askClaude(
          "Clasificador financiero. Responde solo JSON.",
          prompt,
          { maxTokens: 200, temperature: 0.1 }
        );

        const parsed = JSON.parse(response.trim());
        return {
          categoryId: parsed.categoryId as string | null,
          subcategoryId: parsed.subcategoryId as string | null,
          confidence: parsed.confidence as number,
          merchantName: parsed.merchantName as string | null,
        };
      } catch {
        return { categoryId: null, subcategoryId: null, confidence: 0, merchantName: null };
      }
    }),
});
