import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { userUpdateSchema } from "@/utils/zod";

export const userRouter = createTRPCRouter({
  getUser: privateProcedure.query(({ ctx }) => {
    return ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      include: {
        favourites: true,
      },
    });
  }),
  updateUser: privateProcedure
    .input(userUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      let user = await ctx.db.user.findUniqueOrThrow({
        where: { id: input.id },
      });

      if (user.id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to edit this user",
        });
      }

      user = await ctx.db.user.update({
        where: {
          id: input.id,
        },
        data: input,
      });

      return {
        user,
      };
    }),
  setFavourite: privateProcedure
    .input(
      z.object({
        resourceId: z.string(),
        favourite: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { resourceId, favourite } = input;

      return await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          favourites: favourite
            ? {
                create: {
                  resourceId,
                },
              }
            : {
                deleteMany: [{ resourceId }],
              },
        },
      });
    }),
  getTopContributors: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        name: true,
        _count: true,
      },
      where: {
        resources: {
          some: {
            published: true,
          },
        },
      },
      orderBy: {
        resources: {
          _count: "desc",
        },
      },
      take: 5,
    });
  }),
});
