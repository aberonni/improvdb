import * as Sentry from "@sentry/nextjs";

/**
 * Server-side error reporting. Sentry is only enabled when SENTRY_DSN is set,
 * so local development and E2E runs don't report anything.
 *
 * Alert rules (e.g. "notify me on a new issue") are configured in Sentry.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    // Error reporting only: no performance tracing.
    tracesSampleRate: 0,
    // Don't attach request data: cookies hold session tokens and the email
    // sign-in callback URL carries a login token in its query string.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
  });
}

export const onRequestError = Sentry.captureRequestError;
