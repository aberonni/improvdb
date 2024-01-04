import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { resourceCreateSchema } from "~/utils/zod";

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

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
  getAllOnlyIdAndTitle: publicProcedure.query(({ ctx }) => {
    return ctx.db.resource.findMany({
      take: 1000,
      orderBy: {
        title: "asc",
      },
      select: {
        id: true,
        title: true,
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
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          relatedResources: {
            select: {
              id: true,
              title: true,
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

      const { success } = await ratelimit.limit(authorId);

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
        });
      }

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
          createdBy: authorId,
          categories: {
            createMany: {
              data: input.categories.map(({ value }) => ({
                categoryId: value,
                assignedBy: authorId,
              })),
            },
          },
          relatedResources: {
            connect: input.relatedResources.map(({ value }) => ({
              id: value,
            })),
          },
          alternativeNames: input.alternativeNames
            .map(({ value }) => value)
            .join(";"),
        },
      });

      return {
        resource,
      };
    }),
});
