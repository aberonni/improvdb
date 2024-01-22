import { UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

import {
  createTRPCRouter,
  adminProcedure,
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
      where: {
        published: true,
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
  getLatest: publicProcedure.query(({ ctx }) => {
    return ctx.db.resource.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      where: {
        published: true,
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
      where: {
        published: true,
      },
      select: {
        id: true,
        title: true,
      },
    });
  }),
  getMyProposedResources: privateProcedure.query(({ ctx }) => {
    return ctx.db.resource.findMany({
      where: {
        createdBy: ctx.session.user,
      },
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

      const userCanSeeResource =
        resource?.published ||
        ctx.session?.user.role === UserRole.ADMIN ||
        resource?.createdById === ctx.session?.user.id;

      if (!userCanSeeResource) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Resource ${input.id} not found`,
        });
      }

      return resource;
    }),
  create: privateProcedure
    .input(resourceCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id;

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
          message: "A resource with that URL already exists. Change URL",
        });
      }

      const resource = await ctx.db.resource.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
          categories: {
            createMany: {
              data: input.categories.map(({ value }) => ({
                categoryId: value,
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
  update: adminProcedure
    .input(resourceCreateSchema)
    .mutation(async ({ ctx, input: updatedResource }) => {
      const authorId = ctx.session.user.id;

      const { success } = await ratelimit.limit(authorId);

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
        });
      }

      const originalResource = await ctx.db.resource.findUnique({
        where: {
          id: updatedResource.id,
        },
        include: {
          categories: {
            select: {
              categoryId: true,
            },
          },
          relatedResources: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!originalResource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Resource ${updatedResource.id} not found`,
        });
      }

      const resource = await ctx.db.resource.update({
        where: {
          id: updatedResource.id,
        },
        data: {
          ...updatedResource,
          categories: {
            createMany: {
              data: updatedResource.categories
                .filter(
                  ({ value }) =>
                    !originalResource.categories.find(
                      ({ categoryId }) => categoryId === value,
                    ),
                )
                .map(({ value }) => ({
                  categoryId: value,
                })),
            },
            deleteMany: originalResource.categories.filter((cat) => {
              return !updatedResource.categories.find(
                ({ value }) => value === cat.categoryId,
              );
            }),
          },
          relatedResources: {
            connect: updatedResource.relatedResources.map(({ value }) => ({
              id: value,
            })),
            disconnect: originalResource.relatedResources.filter((res) => {
              return !updatedResource.relatedResources.find(
                ({ value }) => value === res.id,
              );
            }),
          },
          alternativeNames: updatedResource.alternativeNames
            .map(({ value }) => value)
            .join(";"),
        },
      });

      return {
        resource,
      };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      let resource = await ctx.db.resource.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Resource ${input.id} not found`,
        });
      }

      resource = await ctx.db.resource.delete({
        where: {
          id: input.id,
        },
      });

      return {
        resource,
      };
    }),
  setPublished: adminProcedure
    .input(
      z.object({
        id: z.string(),
        published: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let resource = await ctx.db.resource.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Resource ${input.id} not found`,
        });
      }

      resource = await ctx.db.resource.update({
        where: {
          id: input.id,
        },
        data: {
          published: input.published,
        },
      });

      return {
        resource,
      };
    }),
  getPendingPublication: adminProcedure.query(({ ctx }) => {
    return ctx.db.resource.findMany({
      where: {
        published: false,
      },
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
});
