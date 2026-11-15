import { type Browser, expect, test, type TestInfo } from "@playwright/test";

import { mailpitUrl } from "@/../tests/auth";
import { expectEmail } from "@/../tests/mailpit";
import {
  mutate,
  resourceInput,
  signedInPage,
  unique,
} from "@/../tests/resources";

const ADMIN = "admin@e2e.com";

test.describe("Notification emails", () => {
  test.skip(!mailpitUrl, "Needs Mailpit: run with `npm run test:e2e`");

  test("a Draft is emailed to admins, and its publication to its creator", async ({
    browser,
  }, testInfo) => {
    const id = unique(testInfo, "draft");
    const title = `Draft ${Date.now()}`;
    const creatorEmail = `${id}@example.com`;

    const creator = await signedInPage(browser, creatorEmail);
    await mutate(creator, "resource.create", resourceInput(id, title));

    const proposed = await expectEmail(creator.request, {
      to: ADMIN,
      text: id,
    });
    expect(proposed.Subject).toBe("New game or exercise proposed");
    expect(proposed.HTML).toContain(creatorEmail);

    const admin = await signedInPage(browser, ADMIN);
    await mutate(admin, "resource.publish", { id });

    const published = await expectEmail(admin.request, {
      to: creatorEmail,
      text: id,
    });
    expect(published.Subject).toBe(
      `"${title}", which you proposed, has been published`,
    );
  });

  test("an Edit Proposal is emailed to admins, and its acceptance to its proposer", async ({
    browser,
  }, testInfo) => {
    const id = unique(testInfo, "original");
    const proposedTitle = `Edited ${Date.now()}`;
    const proposerEmail = `${unique(testInfo, "proposer")}@example.com`;

    const admin = await signedInPage(browser, ADMIN);
    await mutate(admin, "resource.create", resourceInput(id, "Original"));
    await mutate(admin, "resource.publish", { id });

    const proposer = await signedInPage(browser, proposerEmail);
    const { resource: proposal } = await mutate<{ resource: { id: string } }>(
      proposer,
      "resource.save",
      resourceInput(id, proposedTitle),
    );

    const proposed = await expectEmail(proposer.request, {
      to: ADMIN,
      text: proposal.id,
    });
    expect(proposed.Subject).toBe("New edit proposal");
    expect(proposed.HTML).toContain(proposerEmail);

    await mutate(admin, "resource.save", {
      ...resourceInput(proposal.id, proposedTitle),
    });

    const accepted = await expectEmail(admin.request, {
      to: proposerEmail,
      text: id,
    });
    expect(accepted.Subject).toBe(
      `Your proposed edit to "${proposedTitle}" has been accepted`,
    );
  });
});

test.describe("Reviewing an Edit Proposal", () => {
  test.skip(!mailpitUrl, "Needs Mailpit: run with `npm run test:e2e`");

  /** A published Resource, and an Edit Proposal to it by a new user */
  async function proposeEdit(
    browser: Browser,
    testInfo: TestInfo,
    proposedTitle: string,
  ) {
    const id = unique(testInfo, "original");
    const proposerEmail = `${unique(testInfo, "proposer")}@example.com`;

    const admin = await signedInPage(browser, ADMIN);
    await mutate(admin, "resource.create", resourceInput(id, "Original"));
    await mutate(admin, "resource.publish", { id });

    const proposer = await signedInPage(browser, proposerEmail);
    const { resource: proposal } = await mutate<{ resource: { id: string } }>(
      proposer,
      "resource.save",
      resourceInput(id, proposedTitle),
    );
    return { admin, id, proposalId: proposal.id, proposerEmail };
  }

  test("an admin accepts it from the review form", async ({
    browser,
  }, testInfo) => {
    const proposedTitle = `Accepted ${Date.now()}`;
    const { admin, id, proposalId, proposerEmail } = await proposeEdit(
      browser,
      testInfo,
      proposedTitle,
    );

    await admin.goto(`/resource/${proposalId}`);
    await admin.getByRole("link", { name: "Review Proposal" }).click();
    await expect(
      admin.getByRole("heading", { name: /^Review Proposal:/ }),
    ).toBeVisible();
    await admin.getByRole("button", { name: "Save" }).click();
    await admin
      .getByRole("alertdialog")
      .getByRole("button", { name: "Continue" })
      .click();

    await expect(admin).toHaveURL(new RegExp(`/resource/${id}$`));
    await expect(
      admin.getByRole("heading", { name: proposedTitle }),
    ).toBeVisible();
    const accepted = await expectEmail(admin.request, {
      to: proposerEmail,
      text: id,
    });
    expect(accepted.Subject).toBe(
      `Your proposed edit to "${proposedTitle}" has been accepted`,
    );
  });

  test("an admin rejects it with a reason", async ({ browser }, testInfo) => {
    const { admin, id, proposalId, proposerEmail } = await proposeEdit(
      browser,
      testInfo,
      `Rejected ${Date.now()}`,
    );

    await admin.goto(`/resource/${proposalId}`);
    await expect(admin.getByRole("button", { name: "Delete" })).toHaveCount(0);
    admin.once("dialog", (dialog) => {
      expect(dialog.type()).toBe("prompt");
      void dialog.accept("Duplicates <b>another</b> game");
    });
    await admin.getByRole("button", { name: "Reject" }).click();

    await expect(admin).toHaveURL(new RegExp(`/resource/${id}$`));
    const rejected = await expectEmail(admin.request, {
      to: proposerEmail,
      text: id,
    });
    expect(rejected.Subject).toBe(
      'Your proposed edit to "Original" was not accepted',
    );
    expect(rejected.HTML).toContain(
      "Reason: Duplicates &lt;b&gt;another&lt;/b&gt; game",
    );

    const response = await admin.request.get(
      `/api/trpc/resource.getById?input=${encodeURIComponent(
        JSON.stringify({ json: { id: proposalId } }),
      )}`,
    );
    expect(response.status()).toBe(404);
  });
});
