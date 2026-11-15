import { expect, type Page, test } from "@playwright/test";

import { mailpitUrl } from "@/../tests/auth";
import {
  mutate,
  resourceInput,
  signedInPage,
  unique,
} from "@/../tests/resources";

const ADMIN = "admin@e2e.com";

/** The HTML the server sends, without any data fetched after it loads */
async function serverHtml(page: Page, path: string) {
  const response = await page.request.get(path);
  expect(response.ok()).toBe(true);
  return response.text();
}

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

  test("list a Resource in the Catalogue and its Landing Pages as soon as it is published", async ({
    browser,
  }, testInfo) => {
    const id = unique(testInfo, "listed");
    const title = `Listed ${Date.now()}`;
    const admin = await signedInPage(browser, ADMIN);
    const [category] = await categories(admin);
    if (!category) throw new Error("The seed data has no Categories");
    const listings = ["/", "/exercises", `/category/${category.id}`];

    // Build the pages before the Resource exists
    for (const path of listings) {
      expect(await serverHtml(admin, path)).not.toContain(title);
    }

    await mutate(admin, "resource.create", {
      ...resourceInput(id, title),
      categories: [{ label: category.name, value: category.id }],
    });
    await mutate(admin, "resource.publish", { id });

    for (const path of listings) {
      expect(await serverHtml(admin, path), path).toContain(title);
    }
  });

  test("show a Category's new description as soon as an admin saves it", async ({
    browser,
  }) => {
    const admin = await signedInPage(browser, ADMIN);
    const [category] = await categories(admin);
    if (!category) throw new Error("The seed data has no Categories");
    const path = `/category/${category.id}`;
    const description = `Revalidated description ${Date.now()}`;

    expect(await serverHtml(admin, path)).not.toContain(description);
    try {
      await mutate(admin, "category.update", { id: category.id, description });
      expect(await serverHtml(admin, path)).toContain(description);
    } finally {
      await mutate(admin, "category.update", {
        id: category.id,
        description: category.description ?? "",
      });
    }
  });
});

async function categories(page: Page) {
  const response = await page.request.get("/api/trpc/category.getAll");
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as {
    result: {
      data: {
        json: { id: string; name: string; description: string | null }[];
      };
    };
  };
  return body.result.data.json;
}
