import { test, expect } from "@playwright/test";

import { expectToMatchLightAndDarkThemesScreenshot } from "@/../tests/utils";

test("looks good", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ImprovDB/);

  await expect(page.getByTestId("resource-list")).toHaveAttribute(
    "data-loaded",
    "true",
  );
  await expect(page.getByTestId("user-list")).toHaveAttribute(
    "data-loaded",
    "true",
  );

  await expectToMatchLightAndDarkThemesScreenshot(page, "home");
});
