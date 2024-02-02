import { categoryRouter } from "@/server/api/routers/category";
import { lessonPlanRouter } from "@/server/api/routers/lessonPlan";
import { resourceRouter } from "@/server/api/routers/resource";
import { userRouter } from "@/server/api/routers/user";
import { createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  category: categoryRouter,
  resource: resourceRouter,
  lessonPlan: lessonPlanRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
