import { type PrismaClient, type UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { isAdmin } from "@/lib/access";
import { ResourceState, stateOf } from "@/lib/resource-state";
import { type Mailer } from "@/server/mailer";
import { notifications } from "@/server/resource-lifecycle/notifications";
import {
  createData,
  type ResourceInput,
  updateData,
} from "@/server/resource-lifecycle/write";

/**
 * Every change to a Resource: creating it, saving changes (an edit, an Edit
 * Proposal, or accepting one), rejecting an Edit Proposal, publishing,
 * unpublishing and deleting. It decides which changes are legal in each
 * state and who may make them (see docs/adr/0002), and sends the email each
 * one triggers once its data is saved.
 */

export { ResourceState, stateOf };
export { decodeAlternativeNames } from "@/server/resource-lifecycle/write";
export type { ResourceInput };

/** The signed-in user making the change */
export type Actor = {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
};

/** What saving did, which depends on who saved and what they saved */
export type SaveOutcome = "edited" | "proposed" | "accepted";

const notFound = (id: string) =>
  new TRPCError({ code: "NOT_FOUND", message: `Couldn't find "${id}"` });

const badRequest = (message: string) =>
  new TRPCError({ code: "BAD_REQUEST", message });

function assertAdmin(actor: Actor) {
  if (!isAdmin(actor)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can do this.",
    });
  }
}

const withLinks = {
  categories: { select: { categoryId: true } },
  relatedResources: { select: { id: true } },
} as const;

export function resourceLifecycle({
  db,
  mailer,
}: {
  db: PrismaClient;
  mailer: Mailer;
}) {
  const notify = notifications(db, mailer);

  /** A Resource that isn't an Edit Proposal, for actions that only apply to those */
  async function findResource(id: string, refusal: string) {
    const resource = await db.resource.findUnique({
      where: { id },
      include: { createdBy: { select: { email: true } } },
    });
    if (!resource) throw notFound(id);
    if (stateOf(resource) === ResourceState.EDIT_PROPOSAL) {
      throw badRequest(`"${id}" is an Edit Proposal. ${refusal}`);
    }
    return resource;
  }

  return {
    /** A new Draft. Admins are told unless an admin created it. */
    async create(actor: Actor, input: ResourceInput) {
      if (await db.resource.findUnique({ where: { id: input.id } })) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "A game or exercise already exists at this URL. Please choose a new URL.",
        });
      }

      const resource = await db.resource.create({
        data: { ...createData(input), id: input.id, createdById: actor.id },
      });

      if (!isAdmin(actor)) await notify.draftProposed(resource, actor);
      return { resource };
    },

    /**
     * Saves the form for the Resource `input.id`:
     * - an admin's changes to a Draft or Published Resource apply directly;
     * - anyone else's become an Edit Proposal for admins to review;
     * - an admin saving an Edit Proposal accepts it, with their changes.
     */
    async save(
      actor: Actor,
      input: ResourceInput,
    ): Promise<{ resource: { id: string }; outcome: SaveOutcome }> {
      const target = await db.resource.findUnique({
        where: { id: input.id },
        include: {
          ...withLinks,
          editProposalAuthor: { select: { email: true } },
        },
      });
      if (!target) throw notFound(input.id);

      if (stateOf(target) === ResourceState.EDIT_PROPOSAL) {
        const originalId = target.editProposalOriginalResourceId!;
        if (!isAdmin(actor)) {
          throw badRequest(
            `"${target.id}" is already an Edit Proposal. Propose changes to the original (${originalId}) instead.`,
          );
        }

        const original = await db.$transaction(async (tx) => {
          const existing = await tx.resource.findUnique({
            where: { id: originalId },
            include: withLinks,
          });
          if (!existing) throw notFound(originalId);

          const updated = await tx.resource.update({
            where: { id: originalId },
            data: updateData(existing, { ...input, id: originalId }),
          });
          await tx.resource.delete({ where: { id: target.id } });
          return updated;
        });

        if (target.editProposalAuthor?.email) {
          await notify.editAccepted(original, target.editProposalAuthor.email);
        }
        return { resource: original, outcome: "accepted" };
      }

      if (isAdmin(actor)) {
        const resource = await db.resource.update({
          where: { id: target.id },
          data: updateData(target, input),
        });
        return { resource, outcome: "edited" };
      }

      const proposal = await db.resource.create({
        data: {
          ...createData(input),
          id: `${target.id}_proposal_${Date.now()}`,
          published: false,
          editProposalOriginalResourceId: target.id,
          editProposalAuthorId: actor.id,
          // The proposer, so the original's creator doesn't see it as theirs
          createdById: actor.id,
        },
      });
      await notify.editProposed(proposal, actor);
      return { resource: proposal, outcome: "proposed" };
    },

    /** Discards an Edit Proposal and tells its proposer, with the admin's reason */
    async reject(
      actor: Actor,
      { id, reason }: { id: string; reason?: string },
    ) {
      assertAdmin(actor);

      const proposal = await db.resource.findUnique({
        where: { id },
        include: { editProposalAuthor: { select: { email: true } } },
      });
      if (!proposal) throw notFound(id);
      if (stateOf(proposal) !== ResourceState.EDIT_PROPOSAL) {
        throw badRequest(`"${id}" is not an Edit Proposal.`);
      }

      await db.resource.delete({ where: { id } });

      const originalId = proposal.editProposalOriginalResourceId!;
      const original = await db.resource.findUnique({
        where: { id: originalId },
        select: { id: true, title: true },
      });
      if (proposal.editProposalAuthor?.email) {
        await notify.editRejected(
          original ?? { id: originalId, title: proposal.title },
          proposal.editProposalAuthor.email,
          reason,
        );
      }
      return { resource: proposal };
    },

    /** Makes a Draft visible to everyone, and tells its creator */
    async publish(actor: Actor, id: string) {
      assertAdmin(actor);
      const resource = await findResource(
        id,
        "Accept or reject it instead of publishing it.",
      );

      const published = await db.resource.update({
        where: { id },
        data: { published: true },
      });
      if (!resource.published && resource.createdBy.email) {
        await notify.published(published, resource.createdBy.email);
      }
      return { resource: published };
    },

    /** Turns a Published Resource back into a Draft */
    async unpublish(actor: Actor, id: string) {
      assertAdmin(actor);
      await findResource(id, "It was never published.");
      const resource = await db.resource.update({
        where: { id },
        data: { published: false },
      });
      return { resource };
    },

    /** Deletes a Resource together with its pending Edit Proposals */
    async delete(actor: Actor, id: string) {
      assertAdmin(actor);
      await findResource(id, "Reject it instead of deleting it.");

      const resource = await db.$transaction(async (tx) => {
        const proposals = await tx.resource.findMany({
          where: { editProposalOriginalResourceId: id },
          select: { id: true },
        });
        for (const proposal of proposals) {
          await tx.resource.delete({ where: { id: proposal.id } });
        }
        return tx.resource.delete({ where: { id } });
      });
      return { resource };
    },
  };
}
