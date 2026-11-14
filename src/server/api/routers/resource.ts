import {
  type CategoriesOnResources,
  type Category,
  type PrismaClient,
  type Resource,
  ResourceType,
  LessonPlanVisibility,
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
import { mailer } from "@/server/mailer";
import {
  decodeAlternativeNames,
  resourceLifecycle,
} from "@/server/resource-lifecycle";
import { resourceCreateSchema, resourceSaveSchema } from "@/utils/zod";

function cleanCategories(
  resources: (Resource & {
    categories: (CategoriesOnResources & { category: Category })[];
    _count?: { favouritedBy: number };
  })[],
) {
  return resources.map((resource) => ({
    ...resource,
    alternativeNames: decodeAlternativeNames(resource.alternativeNames),
    categories: resource.categories.map(({ category }) => category),
  }));
}

/** Writes go through the Resource lifecycle module (see docs/adr/0002) */
const lifecycle = (ctx: { db: PrismaClient }) =>
  resourceLifecycle({ db: ctx.db, mailer });

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
        alternativeNames: decodeAlternativeNames(resource.alternativeNames),
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
        alternativeNames: decodeAlternativeNames(resource.alternativeNames),
        lessonPlans: uniqBy(lessonPlans, (lessonPlan) => lessonPlan.id),
      };
    }),
  create: privateProcedure
    .input(resourceCreateSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit(ctx.session.user);
      return lifecycle(ctx).create(ctx.session.user, input);
    }),
  /** Edits, proposes an edit or accepts an Edit Proposal; see resourceLifecycle */
  save: privateProcedure
    .input(resourceSaveSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit(ctx.session.user);
      return lifecycle(ctx).save(ctx.session.user, input);
    }),
  reject: privateProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().trim().max(1000).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      lifecycle(ctx).reject(ctx.session.user, {
        id: input.id,
        reason: input.reason || undefined,
      }),
    ),
  publish: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      lifecycle(ctx).publish(ctx.session.user, input.id),
    ),
  unpublish: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      lifecycle(ctx).unpublish(ctx.session.user, input.id),
    ),
  delete: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      lifecycle(ctx).delete(ctx.session.user, input.id),
    ),
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
