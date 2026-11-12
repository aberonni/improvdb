import {
  type CategoriesOnResources,
  type Category,
  LessonPlanVisibility,
  type PrismaClient,
  type Resource,
  ResourceType,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { uniqBy } from "lodash";
import { z } from "zod";

import { canViewResource, publishedResourcesWhere } from "@/lib/access";
import {
  createTRPCRouter,
  adminProcedure,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { enforceRateLimit } from "@/server/helpers/rateLimit";
import { smtpMailer } from "@/server/mailer";
import { resourceLifecycle } from "@/server/resource-lifecycle";
import { resourceCreateSchema, resourceUpdateSchema } from "@/utils/zod";

function cleanCategories(
  resources: (Resource & {
    categories: (CategoriesOnResources & { category: Category })[];
    _count?: { favouritedBy: number };
  })[],
) {
  return resources.map((resource) => ({
    ...resource,
    categories: resource.categories.map(({ category }) => category),
  }));
}

const lifecycle = (ctx: { db: PrismaClient }) =>
  resourceLifecycle({ db: ctx.db, mailer: smtpMailer });

export const resourceRouter = createTRPCRouter({
  /**
   * Published Resources for the Catalogue, with only the fields its list
   * shows. Landing Pages pass their type or Category to get just their slice.
   */
  getCatalogue: publicProcedure
    .input(
      z
        .object({
          type: z.nativeEnum(ResourceType).optional(),
          category: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const resources = await ctx.db.resource.findMany({
        orderBy: {
          title: "asc",
        },
        where: {
          ...publishedResourcesWhere,
          type: input?.type,
          categories: input?.category
            ? { some: { categoryId: input.category } }
            : undefined,
        },
        select: {
          id: true,
          title: true,
          type: true,
          configuration: true,
          alternativeNames: true,
          createdAt: true,
          categories: {
            select: {
              category: { select: { id: true, name: true } },
            },
            orderBy: {
              category: {
                name: "asc",
              },
            },
          },
        },
      });

      return resources.map((resource) => ({
        ...resource,
        categories: resource.categories.map(({ category }) => category),
      }));
    }),
  getAllOnlyIdAndTitle: publicProcedure.query(({ ctx }) => {
    return ctx.db.resource.findMany({
      take: 1000,
      orderBy: {
        title: "asc",
      },
      where: publishedResourcesWhere,
      select: {
        id: true,
        title: true,
      },
    });
  }),
  getMyProposedResources: privateProcedure.query(({ ctx }) => {
    return ctx.db.resource
      .findMany({
        where: {
          OR: [
            {
              createdBy: ctx.session.user,
            },
            {
              editProposalAuthor: ctx.session.user,
            },
          ],
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
            orderBy: {
              category: {
                name: "asc",
              },
            },
          },
        },
      })
      .then(cleanCategories);
  }),
  getMyFavouriteResources: privateProcedure.query(({ ctx }) => {
    return ctx.db.resource
      .findMany({
        where: {
          favouritedBy: {
            some: {
              userId: ctx.session.user.id,
            },
          },
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
            orderBy: {
              category: {
                name: "asc",
              },
            },
          },
        },
      })
      .then(cleanCategories);
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
            orderBy: {
              category: {
                name: "asc",
              },
            },
          },
          relatedResources: {
            select: {
              id: true,
              title: true,
            },
            where: publishedResourcesWhere,
          },
          relatedResourceParent: {
            select: {
              id: true,
              title: true,
            },
            where: publishedResourcesWhere,
          },
          lessonPlanItems: {
            where: {
              section: {
                lessonPlan: {
                  visibility: LessonPlanVisibility.PUBLIC,
                },
              },
            },
            select: {
              section: {
                select: {
                  lessonPlan: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              favouritedBy: true,
            },
          },
        },
      });

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Couldn't find "${input.id}"`,
        });
      }

      if (!canViewResource(ctx.session?.user, resource)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Couldn't find "${input.id}"`,
        });
      }

      const { lessonPlanItems, ...resourceWithoutLessonPlanItems } = resource;

      const lessonPlans: { id: string; title: string }[] = [];

      lessonPlanItems.forEach(({ section: { lessonPlan } }) => {
        lessonPlans.push(lessonPlan);
      });

      return {
        ...resourceWithoutLessonPlanItems,
        lessonPlans: uniqBy(lessonPlans, (lessonPlan) => lessonPlan.id),
      };
    }),
  create: privateProcedure
    .input(resourceCreateSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit(ctx.session.user);
      const resource = await lifecycle(ctx).create(ctx.session.user, input);
      return { resource };
    }),
  /**
   * Saves an edit: admins change the Resource (or accept the Edit Proposal)
   * directly, everyone else proposes an edit for review.
   */
  save: privateProcedure
    .input(resourceUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit(ctx.session.user);
      return lifecycle(ctx).save(ctx.session.user, input);
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
          message: `Couldn't find "${input.id}"`,
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
      const resource = await lifecycle(ctx).setPublished(
        input.id,
        input.published,
      );
      return { resource };
    }),
  getPendingPublication: adminProcedure.query(({ ctx }) => {
    return ctx.db.resource
      .findMany({
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
            orderBy: {
              category: {
                name: "asc",
              },
            },
          },
        },
      })
      .then(cleanCategories);
  }),
});
