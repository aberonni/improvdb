import { absoluteUrl } from "@/lib/site";

/**
 * The email sent for each step of the Resource lifecycle. Titles and names
 * come from users, so they are escaped.
 */

type Person = { name?: string | null; email?: string | null };

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const link = (resourceId: string, text: string) =>
  `<a href="${absoluteUrl(`/resource/${encodeURIComponent(resourceId)}`)}">${escapeHtml(text)}</a>`;

const who = ({ name, email }: Person) =>
  escapeHtml(`${name ?? "Someone"}${email ? ` (${email})` : ""}`);

/** To admins, when a non-admin proposes a new Resource */
export function proposalCreatedEmail(resourceId: string, author: Person) {
  return {
    subject: "New game or exercise proposed",
    html: `<p>A new game or exercise has been proposed by ${who(author)}. ${link(resourceId, "View it")}</p>`,
  };
}

/** To admins, when someone proposes an edit */
export function editProposalCreatedEmail(proposalId: string, author: Person) {
  return {
    subject: "New edit proposal",
    html: `<p>A new edit proposal has been created by ${who(author)}. ${link(proposalId, "View it")}</p>`,
  };
}

/** To the proposer, when an admin accepts their Edit Proposal */
export function editProposalAcceptedEmail(resourceId: string, title: string) {
  return {
    subject: `Your proposed edit to "${title}" has been accepted`,
    html: `<p>Your proposed edit has been accepted: ${link(resourceId, `View "${title}"`)}</p>`,
  };
}

/** To the proposer, when an admin publishes their Proposal */
export function proposalPublishedEmail(resourceId: string, title: string) {
  return {
    subject: `"${title}", which you proposed, has been published`,
    html: `<p>Your proposed game or exercise has been published: ${link(resourceId, `View "${title}"`)}</p>`,
  };
}
