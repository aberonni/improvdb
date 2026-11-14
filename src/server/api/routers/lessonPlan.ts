import { LessonPlanVisibility } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  canEditLessonPlan,
  canViewLessonPlan,
  canViewResource,
  type Viewer,
} from "@/lib/access";
import {
  type createTRPCContext,
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { enforceRateLimit } from "@/server/helpers/rateLimit";
import { lessonPlanCreateSchema } from "@/utils/zod";

type LessonPlanCreateType = z.infer<typeof lessonPlanCreateSchema>;

const getLessonPlanSectionsForCreation = (
  sections: LessonPlanCreateType["sections"],
) => {
  return sections.map(({ id: _, ...section }, index) => ({
    ...section,
    order: index,
    items: {
      create: section.items.map(({ id: __, resource, ...item }, index) => ({
        ...item,
        order: index,
        resource: resource?.value
          ? {
              connect: {
                id: resource?.value,
              },
            }
          : undefined,
      })),
    },
  }));
};

/** Loads a Lesson Plan the viewer may change, or throws */
async function findEditableLessonPlan(
  ctx: Awaited<ReturnType<typeof createTRPCContext>>,
  viewer: Viewer,
  id: string,
) {
  const lessonPlan = await ctx.db.lessonPlan.findUnique({
    where: { id },
    include: { sections: true },
  });

  if (!lessonPlan) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Lesson Plan ${id} not found`,
    });
  }

  if (!canEditLessonPlan(viewer, lessonPlan)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Lesson Plan ${id} is not owned by you`,
    });
  }

  return lessonPlan;
}

export const lessonPlanRouter = createTRPCRouter({
  getPublic: publicProcedure
    .input(z.object({ take: z.number().optional() }).optional())
    .query(({ ctx, input }) => {
      return ctx.db.lessonPlan.findMany({
        where: {
          visibility: LessonPlanVisibility.PUBLIC,
        },
        take: input?.take ?? 1000,
        orderBy: {
          title: "asc",
        },
      });
    }),
  getMyLessonPlans: privateProcedure.query(({ ctx }) => {
    return ctx.db.lessonPlan.findMany({
      where: {
        createdBy: ctx.session.user,
      },
      take: 1000,
      orderBy: {
        title: "asc",
      },
    });
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const lessonPlan = await ctx.db.lessonPlan.findUnique({
        where: {
          id: input.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          sections: {
            include: {
              items: {
                include: {
                  resource: {
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      type: true,
                      configuration: true,
                      categories: true,
                      published: true,
                      createdById: true,
                      editProposalAuthorId: true,
                    },
                  },
                },
                orderBy: {
                  order: "asc",
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Lesson Plan ${input.id} not found`,
        });
      }

      const viewer = ctx.session?.user;

      if (!canViewLessonPlan(viewer, lessonPlan)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Lesson Plan ${input.id} not found`,
        });
      }

      // Leave out items whose Resource the viewer can't see, such as someone
      // else's unpublished Proposal
      return {
        ...lessonPlan,
        sections: lessonPlan.sections.map((section) => ({
          ...section,
          items: section.items
            .filter(
              ({ resource }) => !resource || canViewResource(viewer, resource),
            )
            .map(({ resource, ...item }) => ({
              ...item,
              resource: resource && {
                id: resource.id,
                title: resource.title,
                description: resource.description,
                type: resource.type,
                configuration: resource.configuration,
                categories: resource.categories,
              },
            })),
        })),
      };
    }),
  create: privateProcedure
    .input(lessonPlanCreateSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit(ctx.session.user);

      const lessonPlan = await ctx.db.lessonPlan.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
          sections: {
            create: getLessonPlanSectionsForCreation(input.sections),
          },
        },
      });

      return {
        lessonPlan,
      };
    }),
  update: privateProcedure
    .input(lessonPlanCreateSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input: { id, ...input } }) => {
      await enforceRateLimit(ctx.session.user);

      const originalLessonPlan = await findEditableLessonPlan(
        ctx,
        ctx.session.user,
        id,
      );

      const lessonPlan = await ctx.db.lessonPlan.update({
        where: {
          id,
        },
        data: {
          ...input,
          sections: {
            // delete all sections that are not in the new input
            // and just recreate everything from scratch
            deleteMany: originalLessonPlan.sections,
            create: getLessonPlanSectionsForCreation(input.sections),
          },
        },
      });

      return {
        lessonPlan,
      };
    }),
  delete: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await findEditableLessonPlan(ctx, ctx.session.user, input.id);

      const lessonPlan = await ctx.db.lessonPlan.delete({
        where: {
          id: input.id,
        },
      });

      return {
        lessonPlan,
      };
    }),
  setVisibility: privateProcedure
    .input(
      z.object({
        id: z.string(),
        visibility: z.enum(LessonPlanVisibility),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await findEditableLessonPlan(ctx, ctx.session.user, input.id);

      const lessonPlan = await ctx.db.lessonPlan.update({
        where: {
          id: input.id,
        },
        data: {
          visibility: input.visibility,
        },
      });

      return {
        lessonPlan,
      };
    }),
});
