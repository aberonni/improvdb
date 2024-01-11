import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // only "/create" is private
  // publicRoutes: ["((?!^/create).*)"],
  publicRoutes: (req) =>
    !req.url.includes("/create") && !req.url.includes("/user/"),
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
