import { test, expect } from "@playwright/test";

import { expectToMatchLightAndDarkThemesScreenshot } from "@/../tests/fixtures";

test("looks good", async ({ page }) => {
  await page.goto("/lesson-plan/clrnyapk90001wqebn7it9zqo");
  await expect(page).toHaveTitle(/Demo Lesson Plan - ImprovDB/);
  await expectToMatchLightAndDarkThemesScreenshot(page, "demo-lesson-plan");
});
