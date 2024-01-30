import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { userUpdateSchema } from "@/utils/zod";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getUser: privateProcedure.query(({ ctx }) => {
    return ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
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
});
