import { type PrismaClient } from "@prisma/client";

import { escapeHtml } from "@/lib/utils";
import { adminRecipients, type Mailer } from "@/server/mailer";

const SITE_URL = "https://improvdb.com";

type Named = { id: string; title: string };
type Person = { name?: string | null; email?: string | null };

function link(resource: Named, text = `View "${resource.title}"`) {
  const url = `${SITE_URL}/resource/${encodeURIComponent(resource.id)}`;
  return `<a href="${url}">${escapeHtml(text)}</a>`;
}

function byline(person: Person) {
  return `${escapeHtml(person.name)} (${escapeHtml(person.email)})`;
}

/** The email each lifecycle transition sends */
export function notifications(db: PrismaClient, mailer: Mailer) {
  const toAdmins = async (subject: string, html: string) =>
    mailer.send({ to: await adminRecipients(db), subject, html });

  return {
    draftProposed: (draft: Named, proposer: Person) =>
      toAdmins(
        "New game or exercise proposed",
        `<p>A new game or exercise has been proposed by ${byline(proposer)}. ${link(draft, "View it")}</p>`,
      ),

    editProposed: (proposal: Named, proposer: Person) =>
      toAdmins(
        "New edit proposal",
        `<p>A new edit proposal has been created by ${byline(proposer)}. ${link(proposal, "View it")}</p>`,
      ),

    editAccepted: (original: Named, proposerEmail: string) =>
      mailer.send({
        to: proposerEmail,
        subject: `Your proposed edit to "${original.title}" has been accepted`,
        html: `<p>Your proposed edit has been accepted: ${link(original)}</p>`,
      }),

    editRejected: (original: Named, proposerEmail: string, reason?: string) =>
      mailer.send({
        to: proposerEmail,
        subject: `Your proposed edit to "${original.title}" was not accepted`,
        html:
          `<p>Your proposed edit was not accepted: ${link(original)}</p>` +
          (reason ? `<p>Reason: ${escapeHtml(reason)}</p>` : ""),
      }),

    published: (resource: Named, creatorEmail: string) =>
      mailer.send({
        to: creatorEmail,
        subject: `"${resource.title}", which you proposed, has been published`,
        html: `<p>Your proposed game or exercise has been published: ${link(resource)}</p>`,
      }),
  };
}
