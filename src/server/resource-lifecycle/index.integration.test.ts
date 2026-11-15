import { PrismaClient, UserRole } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { type Email, inMemoryMailer } from "@/server/mailer";
import {
  type Actor,
  resourceLifecycle,
  type ResourceInput,
  ResourceState,
  stateOf,
} from "@/server/resource-lifecycle";
import { inMemoryRevalidator } from "@/server/revalidator";

/**
 * Runs against the database (see vitest.integration.config.ts). Everything it
 * creates is prefixed with RUN and deleted afterwards, so it can share the
 * database with the E2E suite.
 */
const db = new PrismaClient();
const RUN = `it-${Date.now()}`;

let mailer: ReturnType<typeof inMemoryMailer>;
let revalidator: ReturnType<typeof inMemoryRevalidator>;
let lifecycle: ReturnType<typeof resourceLifecycle>;

let admin: Actor;
let contributor: Actor;
let otherContributor: Actor;
let categories: { id: string }[];

async function user(name: string, role: UserRole = UserRole.USER) {
  const created = await db.user.create({
    data: { name, email: `${RUN}-${name}@example.com`, role },
  });
  return { ...created, role };
}

function input(id: string, overrides: Partial<ResourceInput> = {}) {
  return {
    id,
    title: `Title of ${id}`.slice(0, 50),
    description: "A Resource created by an integration test.",
    type: "EXERCISE",
    configuration: "CIRCLE",
    categories: [],
    relatedResources: [],
    alternativeNames: [],
    ...overrides,
  } satisfies ResourceInput;
}

let counter = 0;
const newId = (name: string) => `${RUN}-${name}-${++counter}`;

/** A Resource in the given state, created by `creator` */
async function resource(
  creator: Actor,
  state: "DRAFT" | "PUBLISHED",
  overrides: Partial<ResourceInput> = {},
) {
  const id = newId("resource");
  await lifecycle.create(creator, input(id, overrides));
  if (state === "PUBLISHED") {
    await db.resource.update({ where: { id }, data: { published: true } });
  }
  mailer.sent.length = 0;
  revalidator.paths.length = 0;
  return id;
}

const sentTo = (address: string) =>
  mailer.sent.filter((email: Email) =>
    [email.to]
      .flat()
      .some((to) =>
        typeof to === "string" ? to === address : to.address === address,
      ),
  );

beforeAll(async () => {
  admin = await user("admin", UserRole.ADMIN);
  contributor = await user("contributor");
  otherContributor = await user("other");
  categories = await Promise.all(
    ["a", "b", "c"].map((name) =>
      db.category.create({
        data: { id: `${RUN}-category-${name}`, name: `${RUN} ${name}` },
      }),
    ),
  );
});

beforeEach(() => {
  mailer = inMemoryMailer();
  revalidator = inMemoryRevalidator();
  lifecycle = resourceLifecycle({ db, mailer, revalidator });
});

afterAll(async () => {
  await db.resource.deleteMany({ where: { id: { startsWith: RUN } } });
  await db.category.deleteMany({ where: { id: { startsWith: RUN } } });
  await db.user.deleteMany({ where: { email: { startsWith: RUN } } });
  await db.$disconnect();
});

describe("create", () => {
  it("makes a contributor's Resource a Draft and tells the admins", async () => {
    const id = newId("draft");
    await lifecycle.create(contributor, input(id));

    const created = await db.resource.findUniqueOrThrow({ where: { id } });
    expect(stateOf(created)).toBe(ResourceState.DRAFT);
    expect(created.createdById).toBe(contributor.id);
    expect(sentTo(admin.email!)).toMatchObject([
      { subject: "New game or exercise proposed" },
    ]);
    expect(revalidator.paths).toEqual([`/resource/${id}`]);
  });

  it("doesn't tell the admins about an admin's own Draft", async () => {
    await lifecycle.create(admin, input(newId("admin-draft")));
    expect(mailer.sent).toEqual([]);
  });

  it("refuses an id that is taken", async () => {
    const id = await resource(contributor, "DRAFT");
    await expect(
      lifecycle.create(contributor, input(id)),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("save", () => {
  it("applies an admin's changes directly, adding and removing links", async () => {
    const [a, b, c] = categories.map(({ id }) => ({ label: id, value: id }));
    const id = await resource(contributor, "PUBLISHED", {
      categories: [a!, b!],
      alternativeNames: [{ label: "Old", value: "Old" }],
    });

    const { outcome } = await lifecycle.save(
      admin,
      input(id, {
        title: "Edited by an admin",
        categories: [b!, c!],
        alternativeNames: [
          { label: "One", value: "One" },
          { label: "Two", value: "Two" },
        ],
      }),
    );

    expect(outcome).toBe("edited");
    const saved = await db.resource.findUniqueOrThrow({
      where: { id },
      include: { categories: true },
    });
    expect(saved.title).toBe("Edited by an admin");
    expect(saved.alternativeNames).toBe("One;Two");
    expect(saved.categories.map(({ categoryId }) => categoryId).sort()).toEqual(
      [b!.value, c!.value].sort(),
    );
    expect(mailer.sent).toEqual([]);
    // Including the Category it left and the one it joined
    expect(revalidator.paths.sort()).toEqual(
      [
        `/resource/${id}`,
        "/",
        "/exercises",
        ...[a!, b!, c!].map(({ value }) => `/category/${value}`),
      ].sort(),
    );
  });

  it("turns a contributor's changes into an Edit Proposal, leaving the original alone", async () => {
    const id = await resource(otherContributor, "PUBLISHED");

    const { resource: proposal, outcome } = await lifecycle.save(
      contributor,
      input(id, { title: "Proposed title" }),
    );

    expect(outcome).toBe("proposed");
    const saved = await db.resource.findUniqueOrThrow({
      where: { id: proposal.id },
    });
    expect(stateOf(saved)).toBe(ResourceState.EDIT_PROPOSAL);
    expect(saved).toMatchObject({
      title: "Proposed title",
      editProposalOriginalResourceId: id,
      editProposalAuthorId: contributor.id,
      createdById: contributor.id,
    });
    expect(
      (await db.resource.findUniqueOrThrow({ where: { id } })).title,
    ).not.toBe("Proposed title");
    expect(sentTo(admin.email!)).toMatchObject([
      { subject: "New edit proposal" },
    ]);
    // Nothing visitors see has changed
    expect(revalidator.paths).toEqual([]);
  });

  it("accepts an Edit Proposal when an admin saves it, with the admin's changes", async () => {
    const id = await resource(otherContributor, "PUBLISHED");
    const { resource: proposal } = await lifecycle.save(
      contributor,
      input(id, { title: "Proposed title" }),
    );
    mailer.sent.length = 0;

    const { resource: saved, outcome } = await lifecycle.save(
      admin,
      input(proposal.id, { title: "Proposed, then tweaked" }),
    );

    expect(outcome).toBe("accepted");
    expect(saved.id).toBe(id);
    expect((await db.resource.findUniqueOrThrow({ where: { id } })).title).toBe(
      "Proposed, then tweaked",
    );
    expect(
      await db.resource.findUnique({ where: { id: proposal.id } }),
    ).toBeNull();
    expect(sentTo(contributor.email!)).toMatchObject([
      {
        subject:
          'Your proposed edit to "Proposed, then tweaked" has been accepted',
      },
    ]);
    expect(revalidator.paths).toEqual(
      expect.arrayContaining([
        `/resource/${id}`,
        `/resource/${proposal.id}`,
        "/",
      ]),
    );
  });

  it("keeps an Edit Proposal, and sends nothing, when its original is gone", async () => {
    const proposalId = `${newId("orphan")}_proposal_1`;
    await db.resource.create({
      data: {
        ...input("ignored"),
        id: proposalId,
        alternativeNames: "",
        categories: undefined,
        relatedResources: undefined,
        createdById: contributor.id,
        editProposalAuthorId: contributor.id,
        editProposalOriginalResourceId: newId("missing"),
      },
    });

    await expect(
      lifecycle.save(admin, input(proposalId)),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(
      await db.resource.findUnique({ where: { id: proposalId } }),
    ).not.toBeNull();
    expect(mailer.sent).toEqual([]);
    expect(revalidator.paths).toEqual([]);
  });

  it("refuses a contributor's changes to an Edit Proposal", async () => {
    const id = await resource(otherContributor, "PUBLISHED");
    const { resource: proposal } = await lifecycle.save(contributor, input(id));

    await expect(
      lifecycle.save(contributor, input(proposal.id)),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("reject", () => {
  async function proposal() {
    const id = await resource(otherContributor, "PUBLISHED");
    const { resource: created } = await lifecycle.save(contributor, input(id));
    mailer.sent.length = 0;
    revalidator.paths.length = 0;
    return { id, proposalId: created.id };
  }

  it("discards the Edit Proposal and tells its proposer why, escaped", async () => {
    const { id, proposalId } = await proposal();

    await lifecycle.reject(admin, {
      id: proposalId,
      reason: "Duplicates <b>another</b> game",
    });

    expect(
      await db.resource.findUnique({ where: { id: proposalId } }),
    ).toBeNull();
    const [email] = sentTo(contributor.email!);
    expect(email?.subject).toBe(
      `Your proposed edit to "Title of ${id}" was not accepted`,
    );
    expect(email?.html).toContain(
      "Reason: Duplicates &lt;b&gt;another&lt;/b&gt; game",
    );
    expect(revalidator.paths).toEqual([`/resource/${proposalId}`]);
  });

  it("leaves the reason out when there is none", async () => {
    const { proposalId } = await proposal();
    await lifecycle.reject(admin, { id: proposalId });
    expect(sentTo(contributor.email!)[0]?.html).not.toContain("Reason");
  });

  it("is only for admins", async () => {
    const { proposalId } = await proposal();
    await expect(
      lifecycle.reject(contributor, { id: proposalId }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses anything but an Edit Proposal", async () => {
    const id = await resource(contributor, "DRAFT");
    await expect(lifecycle.reject(admin, { id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

describe("publish and unpublish", () => {
  it("publishes a Draft and tells its creator, once", async () => {
    const id = await resource(contributor, "DRAFT");

    await lifecycle.publish(admin, id);
    await lifecycle.publish(admin, id);

    const saved = await db.resource.findUniqueOrThrow({ where: { id } });
    expect(stateOf(saved)).toBe(ResourceState.PUBLISHED);
    expect(sentTo(contributor.email!)).toMatchObject([
      { subject: `"Title of ${id}", which you proposed, has been published` },
    ]);
    expect(revalidator.paths).toEqual(
      expect.arrayContaining([`/resource/${id}`, "/", "/exercises"]),
    );
  });

  it("turns a Published Resource back into a Draft", async () => {
    const id = await resource(contributor, "PUBLISHED");
    await lifecycle.unpublish(admin, id);
    expect(
      stateOf(await db.resource.findUniqueOrThrow({ where: { id } })),
    ).toBe(ResourceState.DRAFT);
    expect(revalidator.paths).toEqual([`/resource/${id}`, "/", "/exercises"]);
  });

  it("never publishes an Edit Proposal", async () => {
    const id = await resource(otherContributor, "PUBLISHED");
    const { resource: proposal } = await lifecycle.save(contributor, input(id));
    await expect(lifecycle.publish(admin, proposal.id)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("is only for admins", async () => {
    const id = await resource(contributor, "DRAFT");
    await expect(lifecycle.publish(contributor, id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(lifecycle.unpublish(contributor, id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("delete", () => {
  it("deletes a Resource with its pending Edit Proposals", async () => {
    const id = await resource(otherContributor, "PUBLISHED");
    const { resource: proposal } = await lifecycle.save(contributor, input(id));

    revalidator.paths.length = 0;

    await lifecycle.delete(admin, id);

    expect(await db.resource.findUnique({ where: { id } })).toBeNull();
    expect(
      await db.resource.findUnique({ where: { id: proposal.id } }),
    ).toBeNull();
    expect(revalidator.paths).toEqual([
      `/resource/${id}`,
      "/",
      "/exercises",
      `/resource/${proposal.id}`,
    ]);
  });

  it("refuses an Edit Proposal, which is rejected instead", async () => {
    const id = await resource(otherContributor, "PUBLISHED");
    const { resource: proposal } = await lifecycle.save(contributor, input(id));
    await expect(lifecycle.delete(admin, proposal.id)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("is only for admins", async () => {
    const id = await resource(contributor, "DRAFT");
    await expect(lifecycle.delete(contributor, id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
