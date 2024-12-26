import { test, expect } from "@playwright/test";

import { expectToMatchLightAndDarkThemesScreenshot } from "@/../tests/utils";

test("looks good", async ({ page }) => {
  await page.goto("/lesson-plan/clrnyapk90001wqebn7it9zqo");
  await expect(page).toHaveTitle("Demo Lesson Plan - Lesson Plan on ImprovDB - Find improv games, exercises, and formats on ImprovDB - Improv games and lesson plans for teachers and students");
  await expectToMatchLightAndDarkThemesScreenshot(page, "demo-lesson-plan");
});
