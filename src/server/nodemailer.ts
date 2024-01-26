import { type PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import nodemailerSendgrid from "nodemailer-sendgrid";

import { env } from "@/env";

const transport = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: env.EMAIL_SERVER_PASSWORD,
  }),
);

export async function sendMail(
  options: Omit<nodemailer.SendMailOptions, "from">,
) {
  return transport.sendMail({
    ...options,
    from: "ImprovDB <improvdb.app@gmail.com>",
  });
}

export async function sendMailToAdmins(
  options: Omit<nodemailer.SendMailOptions, "from" | "to">,
  db: PrismaClient,
) {
  const admins = await db.user.findMany({
    where: {
      role: "ADMIN",
    },
  });

  const emails = admins
    .filter((admin) => admin.email !== null)
    .map((admin) => ({
      address: admin.email!,
      name: admin.name ?? "",
    }));

  return sendMail({
    ...options,
    to: emails,
  });
}
