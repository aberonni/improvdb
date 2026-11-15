import { test, expect } from "@playwright/test";

/*
 * The Catalogue's server HTML has only the first rows; the rest render after
 * load. If a later row's content could widen a column, the header and rows
 * would shift sideways (layout shift). The seed's later rows are too short
 * to show that, so this adds a row with a very long title.
 */
test("keeps the Catalogue's column widths when longer rows render", async ({
  page,
}) => {
  await page.goto("/");
  const list = page.getByTestId("resource-list");
  await expect(list).toHaveAttribute("data-loaded", "true");

  const headerWidths = () =>
    list
      .locator("thead th")
      .evaluateAll((cells) =>
        cells.map((cell) => Math.round(cell.getBoundingClientRect().width)),
      );
  const before = await headerWidths();

  await list.locator("tbody").evaluate((body: HTMLTableSectionElement) => {
    const row = body.rows[0]!.cloneNode(true) as HTMLTableRowElement;
    row.querySelector("a")!.textContent = "A very long title ".repeat(20);
    body.append(row);
  });

  expect(await headerWidths()).toEqual(before);
});
