import * as Sentry from "@sentry/nextjs";
import { type NextApiResponse } from "next";

/**
 * Rebuilds statically generated pages now rather than when their `revalidate`
 * time runs out, so every visitor sees a change straight away. Never throws:
 * a failed rebuild is reported, and the page catches up on its own schedule.
 */
export type Revalidator = {
  revalidate(paths: string[]): Promise<void>;
};

/** Next.js on-demand revalidation, through the response of an API request */
export function nextRevalidator(res: Pick<NextApiResponse, "revalidate">) {
  return {
    async revalidate(paths) {
      const results = await Promise.allSettled(
        paths.map((path) => res.revalidate(path)),
      );
      results.forEach((result, i) => {
        if (result.status === "fulfilled") return;
        console.error(
          `[revalidator] Failed to revalidate ${paths[i]}`,
          result.reason,
        );
        Sentry.withScope((scope) => {
          // Group all failures into a single Sentry issue
          scope.setFingerprint(["revalidator"]);
          scope.setTag("revalidator.path", paths[i]);
          Sentry.captureException(result.reason);
        });
      });
    },
  } satisfies Revalidator;
}

/** Keeps the paths instead of rebuilding them, for tests */
export function inMemoryRevalidator(): Revalidator & { paths: string[] } {
  const paths: string[] = [];
  return {
    paths,
    async revalidate(revalidated) {
      paths.push(...revalidated);
    },
  };
}

/** For callers with no response to revalidate through, like getStaticProps */
export const noRevalidator: Revalidator = {
  async revalidate() {
    // Nothing to do
  },
};
