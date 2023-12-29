import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const resourceRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.resource.findMany({
      take: 1000,
      orderBy: {
        title: "asc",
      },
    });
  }),
});
