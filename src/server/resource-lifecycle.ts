import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { isAdmin, type Viewer } from "@/lib/access";
import {
  type ResourceFormValues,
  resourceCreateData,
  resourceState,
  resourceUpdateData,
} from "@/lib/resource";
import { adminEmails, type Mail, type Mailer } from "@/server/mailer";
import {
  editProposalAcceptedEmail,
  editProposalCreatedEmail,
  proposalCreatedEmail,
  proposalPublishedEmail,
} from "@/server/notifications";

type Actor = NonNullable<Viewer> & {
  name?: string | null;
  email?: string | null;
};

/**
 * How a Resource moves between Proposal, Edit Proposal and Published (see
 * GLOSSARY.md), with the email each step sends. Callers say what the user
 * wants (create, save, publish) and this module works out which transition
 * that is.
 */
export function resourceLifecycle({
  db,
  mailer,
}: {
  db: PrismaClient;
  mailer: Mailer;
}) {
  /** Emails are best effort: a failure is logged, never thrown */
  function notify(mail: Mail) {
    mailer.send(mail).catch((error: unknown) => {
      console.error("Failed to send email", mail.subject, error);
    });
  }

  async function notifyAdmins(mail: Omit<Mail, "to">) {
    const to = await adminEmails(db);
    if (to.length) notify({ ...mail, to });
  }

  async function findOrThrow(id: string) {
    const resource = await db.resource.findUnique({
      where: { id },
      include: {
        categories: { select: { categoryId: true } },
        relatedResources: { select: { id: true } },
        createdBy: { select: { email: true } },
        editProposalAuthor: { select: { email: true } },
      },
    });
    if (!resource) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Couldn't find "${id}"`,
      });
    }
    return resource;
  }

  type StoredResource = Awaited<ReturnType<typeof findOrThrow>>;

  /** An admin edits a Resource directly */
  async function update(target: StoredResource, values: ResourceFormValues) {
    return db.resource.update({
      where: { id: target.id },
      data: resourceUpdateData(target, { ...values, id: target.id }),
    });
  }

  /** An admin accepts an Edit Proposal: apply it to the original, drop it */
  async function acceptEdit(
    proposal: StoredResource,
    values: ResourceFormValues,
  ) {
    const original = await findOrThrow(proposal.editProposalOriginalResourceId!);
    const resource = await update(original, values);
    await db.resource.delete({ where: { id: proposal.id } });

    if (proposal.editProposalAuthor?.email) {
      notify({
        ...editProposalAcceptedEmail(resource.id, resource.title),
        to: proposal.editProposalAuthor.email,
      });
    }
    return resource;
  }

  /** Someone suggests a change: stored as a new, unpublished Resource */
  async function proposeEdit(
    author: Actor,
    original: StoredResource,
    values: ResourceFormValues,
  ) {
    const resource = await db.resource.create({
      data: {
        ...resourceCreateData(values),
        id: `${original.id}_proposal_${Date.now()}`,
        published: false,
        createdById: author.id,
        editProposalOriginalResourceId: original.id,
        editProposalAuthorId: author.id,
      },
    });

    await notifyAdmins(editProposalCreatedEmail(resource.id, author));
    return resource;
  }

  return {
    /**
     * A new Resource, unpublished until an admin publishes it. Admins are
     * not notified about their own.
     */
    async create(author: Actor, values: ResourceFormValues) {
      const existing = await db.resource.findUnique({
        where: { id: values.id },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "A game or exercise already exists at this URL. Please choose a new URL.",
        });
      }

      const resource = await db.resource.create({
        data: { ...resourceCreateData(values), createdById: author.id },
      });

      if (!isAdmin(author)) {
        await notifyAdmins(proposalCreatedEmail(resource.id, author));
      }
      return resource;
    },

    /**
     * Saves changes to the Resource `values.id`: admins edit it directly or,
     * for an Edit Proposal, accept it; everyone else proposes an edit.
     */
    async save(editor: Actor, values: ResourceFormValues) {
      const target = await findOrThrow(values.id);
      const state = resourceState(target);

      if (isAdmin(editor)) {
        return state === "EDIT_PROPOSAL"
          ? { resource: await acceptEdit(target, values), outcome: "accepted" as const }
          : { resource: await update(target, values), outcome: "updated" as const };
      }

      if (state === "EDIT_PROPOSAL") {
        throw new TRPCError({
          code: "METHOD_NOT_SUPPORTED",
          message: `"${target.id}" is already a proposed edit. Propose changes to the original (${target.editProposalOriginalResourceId}) instead.`,
        });
      }

      return {
        resource: await proposeEdit(editor, target, values),
        outcome: "proposed" as const,
      };
    },

    /** Publishing tells whoever proposed the Resource */
    async setPublished(id: string, published: boolean) {
      const target = await findOrThrow(id);
      const resource = await db.resource.update({
        where: { id },
        data: { published },
      });

      if (published && !target.published && target.createdBy.email) {
        notify({
          ...proposalPublishedEmail(resource.id, resource.title),
          to: target.createdBy.email,
        });
      }
      return resource;
    },
  };
}
