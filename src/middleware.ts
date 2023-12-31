import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // everything public
  publicRoutes: () => true,
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
