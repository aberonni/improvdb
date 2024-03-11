import { get } from "@vercel/edge-config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)?",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

export async function middleware(request: NextRequest) {
  let isInMaintenanceMode = false;

  try {
    isInMaintenanceMode =
      // Don't show the maintenance page in development
      process.env.VERCEL_ENV === "production" &&
      // Check Edge Config to see if the maintenance page should be shown
      ((await get("maintenanceMode")) ?? false);
  } catch (e) {
    // Edge Config not accessible, log the error
    console.error(e);
  }

  if (isInMaintenanceMode) {
    request.nextUrl.pathname = `/maintenance`;
    return NextResponse.rewrite(request.nextUrl);
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  return response;
}
