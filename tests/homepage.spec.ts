import { test, expect } from "@playwright/test";

import { expectToMatchLightAndDarkThemesScreenshot } from "@/../tests/utils";

test("looks good", async ({ page, isMobile }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(
    "Improv Games, Exercises & Warm-ups | ImprovDB",
  );
  await expect(
    page.getByRole("heading", { name: /Improv Games & Exercises/ }),
  ).toBeVisible();

  await expect(page.getByTestId("resource-list")).toHaveAttribute(
    "data-loaded",
    "true",
  );

  for (const favouriteButton of await page
    .getByTestId("resource-favourite-button")
    .all()) {
    await expect(favouriteButton).toBeEnabled({
      timeout: 15000,
    });
  }

  await expectToMatchLightAndDarkThemesScreenshot(page, "home");

  // apply filters
  if (isMobile) {
    await page.getByRole("button", { name: "Filters" }).click();
  }

  await page.getByPlaceholder("Filter Title...").fill("ou");

  await page.getByTestId("filter-type").click();
  await page.getByRole("option", { name: "🚀 Warm-up / Exercise" }).click();
  await page.keyboard.press("Escape");

  await page.getByTestId("filter-configuration").click();
  await page.getByRole("option", { name: "⭕️ Circle" }).click();
  await page.keyboard.press("Escape");

  await page.getByTestId("filter-category").click();
  await page.getByRole("option", { name: "Listening" }).click();
  await page.getByRole("option", { name: "Spontaneity" }).click();
  await page.getByRole("option", { name: "Warm Up" }).click();
  await page.keyboard.press("Escape");

  if (isMobile) {
    await page.getByRole("button", { name: "Close" }).click();
  }

  // add extra column in view
  await page.getByRole("button", { name: "View" }).click();
  await page
    .getByRole("menuitemcheckbox", { name: "Alternative Names" })
    .click();

  // sort by desc
  await page.getByRole("button", { name: "Alternative Names" }).click();
  await page.getByRole("menuitem", { name: "Desc" }).click();

  await expectToMatchLightAndDarkThemesScreenshot(page, "home-with-filters");

  // reset filters
  if (isMobile) {
    await page.getByRole("button", { name: "Filters" }).click();
  }
  await page.getByRole("button", { name: "Reset" }).click();
  if (isMobile) {
    await page.getByRole("button", { name: "Close" }).click();
  }

  await expectToMatchLightAndDarkThemesScreenshot(page, "home-reset-filters");
});

test("sorts by newest", async ({ page }) => {
  await page.goto("/");
  const list = page.getByTestId("resource-list");
  await expect(list).toHaveAttribute("data-loaded", "true");

  const titles = list.locator("tbody tr td a");
  const alphabetical = await titles.allTextContents();

  await page.getByRole("button", { name: "A–Z" }).click();
  await page.getByRole("menuitemradio", { name: "Newest" }).click();

  await expect(page.getByRole("button", { name: "Newest" })).toBeVisible();
  await expect(titles).not.toHaveText(alphabetical);

  await page.getByRole("button", { name: "Newest" }).click();
  await page.getByRole("menuitemradio", { name: "A–Z" }).click();
  await expect(titles).toHaveText(alphabetical);
});
