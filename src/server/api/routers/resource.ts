import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { resourceCreateSchema } from "~/utils/zod";

export const resourceRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.resource.findMany({
      take: 1000,
      orderBy: {
        title: "asc",
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const resource = await ctx.db.resource.findUnique({
        where: {
          id: input.id,
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Resource ${input.id} not found`,
        });
      }

      return resource;
    }),
  create: privateProcedure
    .input(resourceCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      // TODO: add ratelimiting
      // Create a new ratelimiter, that allows 10 requests per 10 seconds
      // const { success } = await ratelimit.limit(authorId);

      // if (!success) {
      //   throw new TRPCError({
      //     code: "TOO_MANY_REQUESTS",
      //   });
      // }

      const resourceWithSameId = await ctx.db.resource.findUnique({
        where: {
          id: input.id,
        },
      });

      if (resourceWithSameId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This resource already exists: " + input.id,
        });
      }

      const resource = await ctx.db.resource.create({
        data: {
          ...input,
          categories: {
            createMany: {
              data: input.categories.map((id) => ({
                categoryId: id,
                assignedBy: authorId,
              })),
            },
          },
        },
      });

      return {
        resource,
      };
    }),
});