import { LessonPlanVisibility, UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { lessonPlanCreateSchema } from "@/utils/zod";

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

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

      const userCantSeeLessonPlan =
        lessonPlan.visibility === LessonPlanVisibility.PRIVATE &&
        ctx.session?.user.role !== UserRole.ADMIN &&
        lessonPlan.createdById !== ctx.session?.user.id;

      if (userCantSeeLessonPlan) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Lesson Plan ${input.id} not found`,
        });
      }

      return lessonPlan;
    }),
  create: privateProcedure
    .input(lessonPlanCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id;

      if (ctx.session.user.role !== UserRole.ADMIN) {
        const { success } = await ratelimit.limit(authorId);

        if (!success) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
          });
        }
      }

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
      const authorId = ctx.session.user.id;

      if (ctx.session.user.role !== UserRole.ADMIN) {
        const { success } = await ratelimit.limit(authorId);

        if (!success) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
          });
        }
      }

      const originalLessonPlan = await ctx.db.lessonPlan.findUnique({
        where: {
          id,
        },
        include: {
          sections: true,
        },
      });

      if (!originalLessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Lesson plan ${id} not found`,
        });
      }

      if (originalLessonPlan.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Lesson plan ${id} not found`,
        });
      }

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
      let lessonPlan = await ctx.db.lessonPlan.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Lesson Plan ${input.id} not found`,
        });
      }

      lessonPlan = await ctx.db.lessonPlan.delete({
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
        visibility: z.nativeEnum(LessonPlanVisibility),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let lessonPlan = await ctx.db.lessonPlan.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!lessonPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Lesson Plan ${input.id} not found`,
        });
      }

      if (lessonPlan.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Lesson Plan ${input.id} is not owned by you`,
        });
      }

      lessonPlan = await ctx.db.lessonPlan.update({
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
