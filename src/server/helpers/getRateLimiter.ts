import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 3 requests per 1 minute
export const getRateLimiter = () =>
  process.env.NODE_ENV === "production"
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(3, "1 m"),
        analytics: true,
      })
    : undefined;
