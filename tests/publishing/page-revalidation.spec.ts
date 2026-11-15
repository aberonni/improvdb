import { expect, test } from "@playwright/test";

import { mailpitUrl } from "@/../tests/auth";
import {
  mutate,
  resourceInput,
  signedInPage,
  unique,
} from "@/../tests/resources";

const ADMIN = "admin@e2e.com";

test.describe("Statically generated pages", () => {
  test.skip(!mailpitUrl, "Needs Mailpit: run with `npm run test:e2e`");

  test("show a visitor an admin's edit as soon as it is saved", async ({
    browser,
  }, testInfo) => {
    const id = unique(testInfo, "revalidated");
    const originalTitle = `Original ${Date.now()}`;
    const editedTitle = `Edited ${Date.now()}`;

    const admin = await signedInPage(browser, ADMIN);
    await mutate(admin, "resource.create", resourceInput(id, originalTitle));
    await mutate(admin, "resource.publish", { id });

    // Signed out and without JavaScript, the visitor sees only the page the
    // server built, not data fetched after it loads
    const visitor = await (
      await browser.newContext({ javaScriptEnabled: false })
    ).newPage();
    await visitor.goto(`/resource/${id}`);
    await expect(
      visitor.getByRole("heading", { name: originalTitle }),
    ).toBeVisible();

    await mutate(admin, "resource.save", resourceInput(id, editedTitle));

    await visitor.reload();
    await expect(
      visitor.getByRole("heading", { name: editedTitle }),
    ).toBeVisible();
  });
});
