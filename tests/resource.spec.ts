import { test, expect } from "@playwright/test";

import { expectToMatchLightAndDarkThemesScreenshot } from "@/../tests/utils";

test("looks good", async ({ page }) => {
  await page.goto("/resource/blue-ball");
  await expect(page).toHaveTitle("Blue Ball - 🚀 Warm-up / Exercise on ImprovDB - Find improv games, exercises, and formats on ImprovDB - Improv games and lesson plans for teachers and students");
  await expect(page.getByTestId("resource-favourite-button")).toBeEnabled({
    timeout: 15000,
  });
  await expectToMatchLightAndDarkThemesScreenshot(page, "blue-ball");
});
