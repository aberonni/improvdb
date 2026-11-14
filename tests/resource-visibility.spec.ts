import {
  type Browser,
  expect,
  type Page,
  test,
  type TestInfo,
} from "@playwright/test";

import { mailpitUrl, signInWithEmail } from "@/../tests/auth";

/** Calls a tRPC mutation as the signed-in user of `page` */
async function mutate<T>(page: Page, path: string, input: unknown) {
  const response = await page.request.post(`/api/trpc/${path}`, {
    data: { json: input },
  });
  expect(response.ok(), `${path}: ${await response.text()}`).toBe(true);
  const body = (await response.json()) as { result: { data: { json: T } } };
  return body.result.data.json;
}

async function signedInPage(browser: Browser, email: string) {
  const page = await (await browser.newContext()).newPage();
  await signInWithEmail(page, email);
  return page;
}

/** Unique per test run and project, as projects run in parallel */
function unique(testInfo: TestInfo, name: string) {
  const project = testInfo.project.name.toLowerCase().replace(/\W+/g, "-");
  // Resource ids must end with a letter, so the timestamp goes first
  return `e2e-${Date.now()}-${project}-${name}`;
}

function resourceInput(id: string, title: string) {
  return {
    id,
    title,
    description: "An exercise created by an end-to-end test.",
    type: "EXERCISE",
    configuration: "CIRCLE",
    categories: [],
    relatedResources: [],
    alternativeNames: [],
  };
}

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

    // A user's Resource, published by an admin
    const creator = await signedInPage(browser, `${id}@example.com`);
    await mutate(creator, "resource.create", resourceInput(id, title));
    const admin = await signedInPage(browser, "admin@e2e.com");
    await mutate(admin, "resource.setPublished", { id, published: true });

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
