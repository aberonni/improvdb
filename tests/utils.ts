import { expect, type Page } from "@playwright/test";

export async function expectToMatchLightAndDarkThemesScreenshot(
  page: Page,
  title: string,
) {
  if (process.env.SKIP_SCREENSHOT_COMPARISON) {
    console.warn(`Skipping screenshot comparison for ${title}.`);
    return;
  }

  // The footer loads its category links on the client; on pages that don't
  // prefetch them, wait so the screenshot doesn't race the request
  await expect(
    page.getByRole("navigation", { name: "Browse by category" }),
  ).toBeVisible();

  await expect(page).toHaveScreenshot(`${title}-light.png`, {
    fullPage: true,
    animations: "disabled",
  });

  // Switch to dark theme
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page).toHaveScreenshot(`${title}-dark.png`, {
    fullPage: true,
    animations: "disabled",
  });

  // Switch back to light theme
  await page.getByRole("button", { name: "Toggle theme" }).click();
}
