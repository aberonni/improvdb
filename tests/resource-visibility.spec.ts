import { expect, test } from "@playwright/test";

import { mailpitUrl } from "@/../tests/auth";
import {
  mutate,
  resourceInput,
  signedInPage,
  unique,
} from "@/../tests/resources";

test.describe("Resource visibility", () => {
  test.skip(!mailpitUrl, "Needs Mailpit: run with `npm run test:e2e`");

  test("a public lesson plan hides its creator's unpublished Proposal from others", async ({
    browser,
  }, testInfo) => {
    const name = unique(testInfo, "proposal");
    const title = `Proposal ${Date.now()}`.slice(0, 50);

    const owner = await signedInPage(browser, `${name}@example.com`);
    await mutate(owner, "resource.create", resourceInput(name, title));
    const { lessonPlan } = await mutate<{ lessonPlan: { id: string } }>(
      owner,
      "lessonPlan.create",
      {
        title: "Public plan",
        useDuration: false,
        visibility: "PUBLIC",
        sections: [
          {
            title: "Warm-up",
            items: [{ resource: { label: title, value: name } }],
          },
        ],
      },
    );

    await owner.goto(`/lesson-plan/${lessonPlan.id}`);
    await expect(owner.getByText(title)).toBeVisible();

    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto(`/lesson-plan/${lessonPlan.id}`);
    await expect(
      visitor.getByRole("heading", { name: "Public plan" }),
    ).toBeVisible();
    await expect(visitor.getByText(title)).toHaveCount(0);
  });

  test("an Edit Proposal is listed for its proposer, not for the Resource's creator", async ({
    browser,
  }, testInfo) => {
    const id = unique(testInfo, "original");
    const title = `Original ${Date.now()}`.slice(0, 50);
    const proposedTitle = `Edited ${Date.now()}`.slice(0, 50);

    // A user's Resource. Left unpublished: proposing an edit doesn't need
    // it, and a published one would appear in other specs' Catalogue
    // screenshots.
    const creator = await signedInPage(browser, `${id}@example.com`);
    await mutate(creator, "resource.create", resourceInput(id, title));

    // Another user proposes an edit to it
    const proposer = await signedInPage(
      browser,
      `${unique(testInfo, "proposer")}@example.com`,
    );
    const { resource: proposal } = await mutate<{ resource: { id: string } }>(
      proposer,
      "resource.proposeUpdate",
      resourceInput(id, proposedTitle),
    );

    await proposer.goto("/user/my-proposed-resources");
    await expect(proposer.getByText(proposedTitle)).toBeVisible();

    await creator.goto("/user/my-proposed-resources");
    await expect(creator.getByText(title)).toBeVisible();
    await expect(creator.getByText(proposedTitle)).toHaveCount(0);

    const response = await creator.request.get(
      `/api/trpc/resource.getById?input=${encodeURIComponent(
        JSON.stringify({ json: { id: proposal.id } }),
      )}`,
    );
    expect(response.status()).toBe(403);
  });
});
