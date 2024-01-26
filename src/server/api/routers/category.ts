import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const categoryRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.category.findMany({
      take: 100,
      orderBy: {
        name: "asc",
      },
    });
  }),
});
