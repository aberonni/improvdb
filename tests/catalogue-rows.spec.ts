import { test, expect } from "@playwright/test";

import { CATALOGUE_INITIAL_ROWS } from "@/lib/catalogue";

// The server sends only the first rows (tests/http/catalogue-rows.spec.ts);
// the rest render without scrolling or clicking, so crawlers see every link
test("renders every Catalogue row once the page is idle", async ({ page }) => {
  await page.goto("/");
  const list = page.getByTestId("resource-list");
  await expect(list).toHaveAttribute("data-loaded", "true");

  const rows = await list.locator("tbody tr").count();
  expect(rows).toBeGreaterThan(CATALOGUE_INITIAL_ROWS);
  // The seed's alphabetically last published Resource
  await expect(list.getByRole("link", { name: /Zip Zap Zop/ })).toBeAttached();
});
