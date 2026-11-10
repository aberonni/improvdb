import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type UserRole } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";

import { env } from "@/env";
import { db } from "@/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user, session, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      if (trigger === "update") {
        try {
          if (session.name) token.name = session.name;
        } catch {}

        try {
          if (session.image) token.image = session.image;
        } catch {}
      }

      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
        role: token.role,
      },
    }),
  },
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT ?? "465"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    // Show errors (e.g. an expired sign-in link) on the sign-in page instead
    // of NextAuth's built-in error page.
    error: "/auth/signin",
  },
  logger: {
    // NextAuth catches errors such as a failing email provider and only logs
    // them, so report them to Sentry to get alerted.
    error(code, metadata) {
      const error = getError(metadata);
      console.error(`[next-auth][error][${code}]`, error);
      Sentry.withScope((scope) => {
        scope.setTag("nextauth.code", code);
        const providerId = getProviderId(metadata);
        if (providerId) scope.setTag("nextauth.provider", providerId);
        // Group by NextAuth code so repeated failures raise a single issue.
        scope.setFingerprint(["next-auth", code]);
        // Only the error is sent: metadata can contain the user's email and
        // the sign-in link, which is a working login.
        Sentry.captureException(error);
      });
    },
  },
};

function getError(metadata: unknown): Error {
  if (metadata instanceof Error) return metadata;
  if (
    metadata &&
    typeof metadata === "object" &&
    "error" in metadata &&
    metadata.error instanceof Error
  ) {
    return metadata.error;
  }
  return new Error("Unknown NextAuth error");
}

function getProviderId(metadata: unknown): string | undefined {
  if (
    metadata &&
    typeof metadata === "object" &&
    "providerId" in metadata &&
    typeof metadata.providerId === "string"
  ) {
    return metadata.providerId;
  }
}

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
