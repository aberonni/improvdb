import { type PrismaClient, UserRole } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { env } from "@/env";

export type Recipient = string | { name: string; address: string };

export type Email = {
  to: Recipient | Recipient[];
  subject: string;
  html: string;
};

/** Sends notification emails. Never throws: a failed send is reported. */
export type Mailer = {
  send(email: Email): Promise<void>;
};

/**
 * The SMTP server every email goes through, sign-in emails included (see
 * src/server/auth.ts). Mailpit in E2E tests, see docker-compose.test.yml.
 */
export function smtpServer(): SMTPTransport.Options {
  return {
    host: env.EMAIL_SERVER_HOST,
    port: parseInt(env.EMAIL_SERVER_PORT),
    auth: {
      user: env.EMAIL_SERVER_USER,
      pass: env.EMAIL_SERVER_PASSWORD,
    },
  };
}

export function smtpMailer(
  server: SMTPTransport.Options = smtpServer(),
  from: string = env.EMAIL_FROM,
): Mailer {
  let transport: nodemailer.Transporter | undefined;

  return {
    async send(email) {
      if (Array.isArray(email.to) && email.to.length === 0) return;
      try {
        transport ??= nodemailer.createTransport(server);
        await transport.sendMail({ ...email, from });
      } catch (error) {
        console.error("[mailer] Failed to send email", error);
        Sentry.withScope((scope) => {
          // Group all send failures into a single Sentry issue. Only the error
          // is sent: the email itself contains addresses.
          scope.setFingerprint(["mailer"]);
          scope.setTag("mailer.subject", email.subject);
          Sentry.captureException(error);
        });
      }
    },
  };
}

/** Keeps emails instead of sending them, for tests */
export function inMemoryMailer(): Mailer & { sent: Email[] } {
  const sent: Email[] = [];
  return {
    sent,
    async send(email) {
      sent.push(email);
    },
  };
}

export const mailer: Mailer = smtpMailer();

/** Every admin with an email address */
export async function adminRecipients(db: PrismaClient): Promise<Recipient[]> {
  const admins = await db.user.findMany({
    where: { role: UserRole.ADMIN, email: { not: null } },
    select: { name: true, email: true },
  });

  return admins.map((admin) => ({
    address: admin.email!,
    name: admin.name ?? "",
  }));
}
