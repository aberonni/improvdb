import { expect, test } from "@playwright/test";

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
    await mutate(admin, "resource.setPublished", { id, published: true });

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
    await mutate(admin, "resource.setPublished", { id, published: true });

    const proposer = await signedInPage(browser, proposerEmail);
    const { resource: proposal } = await mutate<{ resource: { id: string } }>(
      proposer,
      "resource.proposeUpdate",
      resourceInput(id, proposedTitle),
    );

    const proposed = await expectEmail(proposer.request, {
      to: ADMIN,
      text: proposal.id,
    });
    expect(proposed.Subject).toBe("New edit proposal");
    expect(proposed.HTML).toContain(proposerEmail);

    await mutate(admin, "resource.acceptProposedUpdate", {
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
