import { test, expect } from "@playwright/test";

import { expectToMatchLightAndDarkThemesScreenshot } from "@/../tests/utils";

test("looks good", async ({ page, isMobile }) => {
  await page.goto("/resource/browse");
  await expect(page).toHaveTitle(/Browse Resources - ImprovDB/);

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

  await expectToMatchLightAndDarkThemesScreenshot(page, "browse-resources");

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

  await expectToMatchLightAndDarkThemesScreenshot(
    page,
    "browse-resources-with-filters",
  );

  // reset filters
  if (isMobile) {
    await page.getByRole("button", { name: "Filters" }).click();
  }
  await page.getByRole("button", { name: "Reset" }).click();
  if (isMobile) {
    await page.getByRole("button", { name: "Close" }).click();
  }

  await expectToMatchLightAndDarkThemesScreenshot(
    page,
    "browse-resources-reset-filters",
  );
});
