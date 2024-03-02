import { test, expect } from "@playwright/test";

import { expectToMatchLightAndDarkThemesScreenshot } from "@/../tests/utils";

test("looks good", async ({ page }) => {
  await page.goto("/resource/blue-ball");
  await expect(page).toHaveTitle(/Blue Ball - ImprovDB/);
  await expectToMatchLightAndDarkThemesScreenshot(page, "blue-ball");
});
