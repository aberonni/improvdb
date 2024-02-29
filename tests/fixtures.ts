import { expect, type Page } from "@playwright/test";

export async function expectToMatchLightAndDarkThemesScreenshot(
  page: Page,
  title: string,
) {
  await expect(page).toHaveScreenshot(`${title}-light.png`, {
    fullPage: true,
  });

  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page).toHaveScreenshot(`${title}-dark.png`, {
    fullPage: true,
    animations: "disabled",
  });
}
