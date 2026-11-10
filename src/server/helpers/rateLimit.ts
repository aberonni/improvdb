import { UserRole } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit =
  process.env.NODE_ENV === "production"
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(3, "1 m"),
        analytics: true,
      })
    : undefined;

/**
 * Throws TOO_MANY_REQUESTS when a non-admin user goes over the rate limit.
 *
 * Fails open: if Upstash can't be reached the request is allowed and the error
 * is reported to Sentry, so a rate limiter outage doesn't block every write.
 */
export async function enforceRateLimit(user: { id: string; role: UserRole }) {
  if (!ratelimit || user.role === UserRole.ADMIN) return;

  let success: boolean;
  try {
    ({ success } = await ratelimit.limit(user.id));
  } catch (error) {
    console.error(
      "[ratelimit] Upstash request failed, allowing request",
      error,
    );
    Sentry.withScope((scope) => {
      // Group all limiter failures into a single Sentry issue.
      scope.setFingerprint(["ratelimit"]);
      Sentry.captureException(error);
    });
    return;
  }

  if (!success) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  }
}
