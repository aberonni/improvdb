import { type PrismaClient, UserRole } from "@prisma/client";
import nodemailer, { type Transporter } from "nodemailer";

import { env } from "@/env";

export type Mail = { to: string | string[]; subject: string; html: string };

/** Sends email. The seam lets the Resource lifecycle stay free of SMTP. */
export type Mailer = { send(mail: Mail): Promise<void> };

let transport: Transporter | undefined;

/**
 * Sends through the same SMTP server as sign-in emails (SendGrid in
 * production, Mailpit in E2E tests), so tests can read what was sent.
 */
export const smtpMailer: Mailer = {
  async send(mail) {
    transport ??= nodemailer.createTransport({
      host: env.EMAIL_SERVER_HOST,
      port: parseInt(env.EMAIL_SERVER_PORT),
      auth: { user: env.EMAIL_SERVER_USER, pass: env.EMAIL_SERVER_PASSWORD },
    });
    await transport.sendMail({ ...mail, from: env.EMAIL_FROM });
  },
};

export async function adminEmails(db: PrismaClient) {
  const admins = await db.user.findMany({
    where: { role: UserRole.ADMIN, email: { not: null } },
    select: { email: true },
  });
  return admins.map(({ email }) => email!);
}
