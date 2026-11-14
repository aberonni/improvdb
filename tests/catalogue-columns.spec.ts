import { test, expect } from "@playwright/test";

/*
 * Configuration and Categories are hidden on mobile by CSS (so nothing shifts
 * after load), but the View menu can still show them, and hide them on
 * desktop.
 */
for (const column of ["Configuration", "Categories"]) {
  test(`toggles the ${column} column from the View menu`, async ({
    page,
    isMobile,
  }) => {
    await page.goto("/");
    const list = page.getByTestId("resource-list");
    await expect(list).toHaveAttribute("data-loaded", "true");

    const header = list.getByRole("columnheader", {
      name: new RegExp(column, "i"),
    });
    // Favourite, title, type, configuration, categories. Only checked while
    // all of them are rendered (CSS hides cells; the View menu removes them)
    const cell = list
      .locator("tbody tr")
      .first()
      .locator("td")
      .nth(column === "Configuration" ? 3 : 4);

    await expect(header).toBeVisible({ visible: !isMobile });
    await expect(cell).toBeVisible({ visible: !isMobile });

    await page.getByRole("button", { name: "View" }).click();
    const checkbox = page.getByRole("menuitemcheckbox", { name: column });
    await expect(checkbox).toHaveAttribute(
      "aria-checked",
      isMobile ? "false" : "true",
    );
    await checkbox.click();

    await expect(header).toBeVisible({ visible: isMobile });
    if (isMobile) await expect(cell).toBeVisible();
  });
}
