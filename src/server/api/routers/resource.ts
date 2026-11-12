import {
  type CategoriesOnResources,
  type Category,
  type Resource,
  UserRole,
  LessonPlanVisibility,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { uniqBy } from "lodash";
import { z } from "zod";

import {
  createTRPCRouter,
  adminProcedure,
  privateProcedure,
  publicProcedure,
  type createTRPCContext,
} from "@/server/api/trpc";
import { enforceRateLimit } from "@/server/helpers/rateLimit";
import { sendMail, sendMailToAdmins } from "@/server/nodemailer";
import { resourceCreateSchema, resourceProposalSchema } from "@/utils/zod";

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

const updateResource = async ({
  ctx,
  input: updatedResource,
}: {
  ctx: Awaited<ReturnType<typeof createTRPCContext>>;
  input: z.infer<typeof resourceCreateSchema>;
}) => {
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
      message: `Couldn't find "${updatedResource.id}"`,
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
};

export const resourceRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.resource
      .findMany({
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
            orderBy: {
              category: {
                name: "asc",
              },
            },
          },
          _count: {
            select: {
              favouritedBy: true,
            },
          },
        },
      })
      .then(cleanCategories);
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
            where: {
              published: true,
            },
          },
          relatedResourceParent: {
            select: {
              id: true,
              title: true,
            },
            where: {
              published: true,
            },
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

      const userCanSeeResource =
        resource?.published ||
        ctx.session?.user.role === UserRole.ADMIN ||
        resource?.createdById === ctx.session?.user.id ||
        resource?.editProposalAuthorId === ctx.session?.user.id;

      if (!userCanSeeResource) {
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

      const resourceWithSameId = await ctx.db.resource.findUnique({
        where: {
          id: input.id,
        },
      });

      if (resourceWithSameId) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "A game or exercise already exists at this URL. Please choose a new URL.",
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

      if (ctx.session.user.role !== UserRole.ADMIN) {
        void sendMailToAdmins(
          {
            subject: "New game or exercise proposed",
            html: `<p>A new game or exercise has been proposed by ${ctx.session.user.name} (${ctx.session.user.email}). <a href="https://improvdb.com/resource/${resource.id}">View it</a></p>`,
          },
          ctx.db,
        );
      }

      return {
        resource,
      };
    }),
  update: adminProcedure.input(resourceCreateSchema).mutation(updateResource),
  proposeUpdate: privateProcedure
    .input(resourceCreateSchema)
    .mutation(async ({ ctx, input }) => {
      await enforceRateLimit(ctx.session.user);

      const originalResource = await ctx.db.resource.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!originalResource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Couldn't find "${input.id}"`,
        });
      }

      if (originalResource.editProposalOriginalResourceId) {
        throw new TRPCError({
          code: "METHOD_NOT_SUPPORTED",
          message: `"${input.id}" is already a proposed edit. Propose changes to the original (${originalResource.editProposalOriginalResourceId}) instead.`,
        });
      }

      const resource = await ctx.db.resource.create({
        data: {
          ...input,
          id: input.id + "_proposal_" + Date.now(),
          published: false,
          editProposalOriginalResourceId: input.id,
          editProposalAuthorId: ctx.session.user.id,
          createdById: originalResource.createdById,
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

      void sendMailToAdmins(
        {
          subject: "New edit proposal",
          html: `<p>A new edit proposal has been created by ${ctx.session.user.name} (${ctx.session.user.email}). <a href="https://improvdb.com/resource/${resource.id}">View it</a></p>`,
        },
        ctx.db,
      );

      return {
        resource,
      };
    }),
  acceptProposedUpdate: adminProcedure
    .input(resourceProposalSchema)
    .mutation(
      async ({ ctx, input: { id: proposalId, ...proposedUpdates } }) => {
        const proposal = await ctx.db.resource.findUnique({
          where: {
            id: proposalId,
          },
          select: {
            editProposalAuthor: {
              select: {
                email: true,
              },
            },
            editProposalOriginalResourceId: true,
          },
        });

        if (!proposal) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Couldn't find "${proposalId}"`,
          });
        }

        if (!proposal.editProposalOriginalResourceId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `"${proposalId}" is not a proposed edit`,
          });
        }

        const { resource } = await updateResource({
          ctx,
          input: {
            ...proposedUpdates,
            id: proposal.editProposalOriginalResourceId,
          },
        });

        if (proposal.editProposalAuthor?.email) {
          void sendMail({
            subject: `Your proposed edit to "${resource.title}" has been accepted`,
            html: `<p>Your proposed edit has been accepted: <a href="https://improvdb.com/resource/${proposal.editProposalOriginalResourceId}">View "${resource.title}"</a></p>`,
            to: proposal.editProposalAuthor.email,
          });
        }

        await ctx.db.resource.delete({
          where: {
            id: proposalId,
          },
        });

        return {
          resource,
        };
      },
    ),
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
      const resource = await ctx.db.resource.findUnique({
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

      const updatedResource = await ctx.db.resource.update({
        where: {
          id: input.id,
        },
        data: {
          published: input.published,
        },
        select: {
          createdBy: {
            select: {
              email: true,
            },
          },
        },
      });

      if (input.published && updatedResource.createdBy.email) {
        void sendMail({
          subject: `"${resource.title}", which you proposed, has been published`,
          html: `<p>Your proposed game or exercise has been published: <a href="https://improvdb.com/resource/${resource.id}">View "${resource.title}"</a></p>`,
          to: updatedResource.createdBy.email,
        });
      }

      return {
        resource: updatedResource,
      };
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
