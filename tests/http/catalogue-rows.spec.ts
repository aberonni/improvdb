import { test, expect } from "@playwright/test";

import { CATALOGUE_INITIAL_ROWS } from "@/lib/catalogue";

// The pre-built Catalogue only holds its first rows, which keeps the page
// light and quick to hydrate; tests/catalogue-rows.spec.ts checks the rest
// appear once it loads
test("the home page's HTML holds only the first Catalogue rows", async ({
  request,
}) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);

  const html = await response.text();
  const rows = html.match(/data-testid="resource-favourite-button"/g) ?? [];
  expect(rows).toHaveLength(CATALOGUE_INITIAL_ROWS);
});
