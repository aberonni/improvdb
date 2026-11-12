import { test, expect } from "@playwright/test";

// The footer's category links are internal links to the category Landing
// Pages for crawlers, so they must be in the HTML the server sends, not only
// added once the client loads
const PUBLIC_PAGES = [
  "/",
  "/short-form-games",
  "/category/listening",
  "/resource/blue-ball",
  "/lesson-plan/clrnyapk90001wqebn7it9zqo",
  "/lesson-plan/browse",
  "/about",
  "/privacy",
  "/terms",
];

test.describe("site footer", () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} server-renders the category links`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);

      const html = await response.text();
      expect(html).toContain('aria-label="Browse by category"');
      expect(html).toContain('href="/category/listening"');
    });
  }
});
