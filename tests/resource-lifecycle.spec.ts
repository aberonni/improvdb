import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  test,
} from "@playwright/test";

import { mailpitUrl, signInWithEmail } from "@/../tests/auth";

// Each project edits its own Resource, as projects run in parallel
const RESOURCES: Record<string, { id: string; title: string }> = {
  chromium: { id: "agony-aunt", title: "Agony Aunt" },
  "Mobile Safari": { id: "anecdotes", title: "Anecdotes" },
};

async function expectMail(
  request: APIRequestContext,
  email: string,
  subject: string,
) {
  await expect
    .poll(
      async () => {
        // Search by recipient only: subjects can contain quotes
        const response = await request.get(`${mailpitUrl}/api/v1/search`, {
          params: { query: `to:"${email}"` },
        });
        const { messages } = (await response.json()) as {
          messages: { Subject: string }[];
        };
        return messages.map((message) => message.Subject);
      },
      { message: `No "${subject}" email for ${email}` },
    )
    .toContain(subject);
}

async function newSignedInPage(browser: Browser, email: string) {
  const page = await (await browser.newContext()).newPage();
  await signInWithEmail(page, email);
  return page;
}

/** Saves the Resource form, confirming if it asks */
async function save(page: Page) {
  await page.getByRole("button", { name: "Save" }).click();
  const confirm = page.getByRole("button", { name: "Continue" });
  if (await confirm.isVisible()) await confirm.click();
}

test("an edit is proposed, accepted by an admin, and both sides are emailed", async ({
  browser,
  request,
}, testInfo) => {
  test.skip(!mailpitUrl, "Needs Mailpit: run with `npm run test:e2e`");
  test.slow();

  const resource = RESOURCES[testInfo.project.name]!;
  const marker = `Edited in E2E ${Date.now()}`;

  // A new user proposes an edit
  const proposerEmail = `e2e-proposer-${resource.id}-${Date.now()}@example.com`;
  const proposer = await newSignedInPage(browser, proposerEmail);
  await proposer.goto(`/resource/${resource.id}/edit`);
  await expect(
    proposer.getByRole("heading", { name: /^Propose Changes/ }),
  ).toBeVisible();
  const description = proposer.locator("textarea[name=description]");
  await description.fill(`${await description.inputValue()}\n\n${marker}`);
  await save(proposer);
  await expect(proposer).toHaveURL(/\/user\/my-proposed-resources/);
  await expectMail(request, "admin@e2e.com", "New edit proposal");

  // The original is unchanged until an admin accepts the proposal
  await proposer.goto(`/resource/${resource.id}`);
  await expect(proposer.getByText(marker)).toHaveCount(0);

  // An admin reviews the proposal and accepts it
  const admin = await newSignedInPage(browser, "admin@e2e.com");
  await admin.goto("/admin/pending-publication");
  await admin
    .locator(`a[href^="/resource/${resource.id}_proposal_"]`)
    .first()
    .click();
  await admin.getByRole("link", { name: "Review Proposal" }).click();
  await expect(
    admin.getByRole("heading", { name: /^Review Proposal/ }),
  ).toBeVisible();
  await expect(admin.locator("textarea[name=description]")).toHaveValue(
    new RegExp(marker),
  );
  await save(admin);

  await expect(admin).toHaveURL(new RegExp(`/resource/${resource.id}$`));
  await expect(admin.getByText(marker)).toBeVisible();
  await expectMail(
    request,
    proposerEmail,
    `Your proposed edit to "${resource.title}" has been accepted`,
  );
});
