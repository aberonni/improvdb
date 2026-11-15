import { test, expect } from "@playwright/test";

import { expectToMatchLightAndDarkThemesScreenshot } from "@/../tests/utils";

test("looks good", async ({ page }) => {
  await page.goto("/resource/blue-ball");
  await expect(page).toHaveTitle("Blue Ball - Improv exercise | ImprovDB");
  await expect(page.getByTestId("resource-favourite-button")).toBeEnabled({
    timeout: 15000,
  });
  await expectToMatchLightAndDarkThemesScreenshot(page, "blue-ball");
});

test("asks signed-out visitors to sign in before saving a favourite", async ({
  page,
}) => {
  await page.goto("/resource/blue-ball");
  const favouriteButton = page.getByTestId("resource-favourite-button");
  await expect(favouriteButton).toBeEnabled({ timeout: 15000 });
  await favouriteButton.click();
  // The Toaster only loads once the first toast is shown
  await expect(
    page
      .getByRole("region", { name: /Notifications/ })
      .getByText("Sign in to save your favourites."),
  ).toBeVisible();
});
