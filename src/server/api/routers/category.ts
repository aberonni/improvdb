import { z } from "zod";

import { categoryLandingPageFields } from "@/lib/landing-page";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const categoryRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.category.findMany({
      take: 100,
      orderBy: {
        name: "asc",
      },
      select: categoryLandingPageFields,
    });
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.category.findUnique({
        where: { id: input.id },
        select: categoryLandingPageFields,
      });
    }),
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        description: z.string().max(5000),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.category.update({
        where: { id: input.id },
        data: { description: input.description.trim() || null },
      });
    }),
});
