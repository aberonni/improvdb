import { test, expect, type Page } from "@playwright/test";

import { mailpitUrl, signInWithEmail } from "@/../tests/auth";
import { expectToMatchLightAndDarkThemesScreenshot } from "@/../tests/utils";

type JsonLd = { "@type": string } & Record<string, unknown>;

async function structuredData(page: Page, type: string) {
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  return scripts
    .map((s) => JSON.parse(s) as JsonLd)
    .find((data) => data["@type"] === type);
}

async function canonical(page: Page) {
  return page.locator('link[rel="canonical"]').getAttribute("href");
}

/** Canonical as the server sends it, before any client-side JavaScript */
async function serverCanonical(page: Page, path: string) {
  const html = await (await page.request.get(path)).text();
  return /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
}

async function waitForList(page: Page) {
  await expect(page.getByTestId("resource-list")).toHaveAttribute(
    "data-loaded",
    "true",
  );
}

test.describe("Type landing pages", () => {
  test("short form games page", async ({ page }) => {
    await page.goto("/short-form-games");
    await expect(page).toHaveTitle("Short Form Improv Games | ImprovDB");
    await expect(
      page.getByRole("heading", { name: /Short Form Improv Games/ }),
    ).toBeVisible();
    expect(await canonical(page)).toBe("https://improvdb.com/short-form-games");
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    await waitForList(page);
    const types = await page
      .getByTestId("resource-list")
      .locator("tbody tr td:nth-child(3)")
      .allTextContents();
    expect(types.length).toBeGreaterThan(0);
    for (const type of types) expect(type).toContain("Short Form Game");

    const itemList = await structuredData(page, "ItemList");
    expect(itemList?.numberOfItems).toBe(types.length);

    const breadcrumbs = await structuredData(page, "BreadcrumbList");
    expect(breadcrumbs?.itemListElement).toEqual([
      expect.objectContaining({ name: "Home", item: "https://improvdb.com/" }),
      expect.objectContaining({ name: "Short Form Games" }),
    ]);

    await expectToMatchLightAndDarkThemesScreenshot(page, "short-form-games");
  });

  for (const [path, title] of [
    ["/exercises", "Improv Exercises & Warm-ups | ImprovDB"],
    ["/long-form-formats", "Long Form Improv Formats | ImprovDB"],
  ] as const) {
    test(`${path} page exists`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      await waitForList(page);
    });
  }

  test("changing a filter moves to the home page catalogue", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/short-form-games");
    await waitForList(page);

    if (isMobile) await page.getByRole("button", { name: "Filters" }).click();

    // typing filters in place
    await page.getByPlaceholder("Filter Title...").fill("Freeze");
    await expect(page).toHaveURL(/\/short-form-games$/);

    await page.getByTestId("filter-category").click();
    await page.getByRole("option", { name: "Listening" }).click();

    await expect(page).toHaveURL(
      /\/\?q=Freeze&type=short-form&category=listening$/,
    );
  });
});

test.describe("Category landing pages", () => {
  test("indexable category page", async ({ page }) => {
    await page.goto("/category/listening");
    await expect(page).toHaveTitle(
      "Listening Improv Games & Exercises | ImprovDB",
    );
    expect(await canonical(page)).toBe(
      "https://improvdb.com/category/listening",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(
      page.getByText(/improv games and exercises for practising listening/),
    ).toBeVisible();
  });

  test("small category page is not indexed", async ({ page }) => {
    await page.goto("/category/relationships");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex",
    );
  });

  test("unknown category is a 404", async ({ page }) => {
    const response = await page.goto("/category/does-not-exist");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Catalogue URL state", () => {
  test("filters and sort are kept in the URL", async ({ page, isMobile }) => {
    await page.goto("/");
    await waitForList(page);

    if (isMobile) await page.getByRole("button", { name: "Filters" }).click();
    await page.getByTestId("filter-type").click();
    await page.getByRole("option", { name: "⚡️ Short Form Game" }).click();
    await page.keyboard.press("Escape");
    if (isMobile) await page.getByRole("button", { name: "Close" }).click();

    await expect(page).toHaveURL(/\/\?type=short-form$/);
    expect(await canonical(page)).toBe("https://improvdb.com/");

    await page.getByRole("button", { name: "A–Z" }).click();
    await page.getByRole("menuitemradio", { name: "Newest" }).click();
    await expect(page).toHaveURL(/\/\?type=short-form&sort=newest$/);

    // survives a reload
    await page.reload();
    await waitForList(page);
    await expect(page.getByTestId("catalogue-pending")).toBeHidden();
    await expect(page.getByRole("button", { name: "Newest" })).toBeVisible();
    const types = await page
      .getByTestId("resource-list")
      .locator("tbody tr td:nth-child(3)")
      .allTextContents();
    for (const type of types) expect(type).toContain("Short Form Game");

    // navigating to the plain home page resets the filters
    await page.getByRole("link", { name: "Improv DB" }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: "A–Z" })).toBeVisible();
    await expect.poll(() => canonical(page)).toBe("https://improvdb.com/");
  });

  test("filtered views are canonical to the home page", async ({ page }) => {
    for (const path of [
      "/?type=short-form",
      "/?category=listening",
      "/?type=short-form&category=listening",
    ]) {
      expect(await serverCanonical(page, path)).toBe("https://improvdb.com/");
    }
  });

  // The dev server hides the page until its JavaScript runs, so the
  // pre-hydration moment is tested in parts rather than by blocking scripts.
  test("a filtered link hides the list until its filters apply", async ({
    page,
  }) => {
    const html = await (await page.request.get("/?type=long-form")).text();
    const head = html.slice(0, html.indexOf("<body"));
    expect(head).toContain('classList;c.add("catalogue-pending")');

    await page.goto("/?type=long-form");
    await waitForList(page);
    await expect(page.locator("html")).not.toHaveClass(/catalogue-pending/);
    await expect(page.getByTestId("catalogue-pending")).toBeHidden();
    const types = await page
      .getByTestId("resource-list")
      .locator("tbody tr td:nth-child(3)")
      .allTextContents();
    expect(types.length).toBeGreaterThan(0);
    for (const type of types) expect(type).toContain("Long Form");

    // While the class is set, the skeleton replaces the list
    await page.evaluate(() =>
      document.documentElement.classList.add("catalogue-pending"),
    );
    await expect(page.getByTestId("catalogue-pending")).toBeVisible();
    await expect(page.getByTestId("resource-list")).toBeHidden();
  });

  test("the unfiltered home page never hides the list", async ({ page }) => {
    await page.goto("/");
    await waitForList(page);
    expect(
      await page.evaluate(() =>
        document.documentElement.classList.contains("catalogue-pending"),
      ),
    ).toBe(false);
  });
});

test.describe("Catalogue payload", () => {
  for (const path of ["/", "/short-form-games", "/category/listening"]) {
    test(`${path} sends only what the list needs`, async ({ request }) => {
      const html = await (await request.get(path)).text();
      const nextData =
        /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s.exec(html)?.[1] ??
        "";
      const queries = (
        JSON.parse(nextData) as {
          props: {
            pageProps: {
              trpcState: {
                json: {
                  queries: {
                    queryKey: unknown[];
                    state: { data: unknown };
                  }[];
                };
              };
            };
          };
        }
      ).props.pageProps.trpcState.json.queries;
      const catalogue = queries.find(
        ({ queryKey }) =>
          JSON.stringify(queryKey[0]) ===
          JSON.stringify(["resource", "getCatalogue"]),
      )?.state.data as Record<string, unknown>[] | undefined;

      expect(catalogue?.length).toBeGreaterThan(0);
      // Full Resources (description, nested Category descriptions…) were
      // ~2.7 KB each and pushed production's home page past 2.5 MB
      expect(nextData.length / catalogue!.length).toBeLessThan(1024);
      expect(nextData.length).toBeLessThan(500 * 1024);
      expect(Object.keys(catalogue![0]!)).not.toContain("description");
    });
  }
});

test.describe("Navigation", () => {
  test("header dropdown links to type pages", async ({ page, isMobile }) => {
    await page.goto("/about");

    if (isMobile) {
      await page.getByRole("button", { name: "Toggle Menu" }).click();
    } else {
      await page.getByRole("button", { name: "Games & Exercises" }).click();
    }
    await page
      .getByRole(isMobile ? "link" : "menuitem", {
        name: "Short Form Games",
      })
      .click();

    await expect(page).toHaveURL(/\/short-form-games$/);
  });

  test("footer links to indexable categories only", async ({ page }) => {
    await page.goto("/about");
    const footer = page.getByRole("navigation", {
      name: "Browse by category",
    });
    await expect(
      footer.getByRole("link", { name: "Listening" }),
    ).toHaveAttribute("href", "/category/listening");
    await expect(
      footer.getByRole("link", { name: "Relationships" }),
    ).toHaveCount(0);
  });

  test("resource page has breadcrumbs and linked categories", async ({
    page,
  }) => {
    await page.goto("/resource/blue-ball");

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(
      breadcrumb.getByRole("link", { name: "Exercises" }),
    ).toHaveAttribute("href", "/exercises");

    const breadcrumbs = await structuredData(page, "BreadcrumbList");
    expect(breadcrumbs?.itemListElement).toEqual([
      expect.objectContaining({ name: "Home" }),
      expect.objectContaining({
        name: "Exercises",
        item: "https://improvdb.com/exercises",
      }),
      expect.objectContaining({ name: "Blue Ball" }),
    ]);

    await expect(
      page.getByRole("main").getByRole("link", { name: "Listening" }),
    ).toHaveAttribute("href", "/category/listening");
  });
});

test("admin can edit a category description", async ({
  page,
  browserName,
  isMobile,
}) => {
  test.skip(!mailpitUrl, "Needs Mailpit: run with `npm run test:e2e`");
  await signInWithEmail(page, "admin@e2e.com");

  // Unique per run so retries and repeats still change the text (Save is
  // disabled until it does)
  const description = `Spontaneity intro written by ${browserName}${isMobile ? " mobile" : ""} at ${Date.now()}.`;

  await page.goto("/admin/categories");
  const field = page.getByLabel("Spontaneity");
  await field.fill(description);
  await field
    .locator("xpath=ancestor::form")
    .getByRole("button", { name: "Save" })
    .click();
  await expect(
    page.getByText("Spontaneity updated.", { exact: true }),
  ).toBeVisible();

  await page.goto("/category/spontaneity");
  await expect(page.getByRole("main")).toContainText(description);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    description,
  );
});
