import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // only "/create" is private
  publicRoutes: ["((?!^/create).*)"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
