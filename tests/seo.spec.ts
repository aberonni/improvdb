import { test, expect, type APIRequestContext } from "@playwright/test";
import { XMLParser } from "fast-xml-parser";

const verifyOgImage = async ({ url, request, name }: { url: string; request: APIRequestContext; name: string }) => {
  const shouldSkipScreenshots = !!process.env.SKIP_SCREENSHOT_COMPARISON;

  expect(url).toContain("/api/og");

  // Remove domain if present
  const urlObj = new URL(url, "http://localhost");
  const response = await request.get(urlObj.pathname + urlObj.search);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");

  if (!shouldSkipScreenshots) {
    const imageBuffer = await response.body();
    expect(imageBuffer).toMatchSnapshot(name);
  }
};

test.describe("SEO metadata", () => {
  test("homepage has correct meta tags", async ({ page, request }) => {
    await page.goto("/");

    // Check title
    await expect(page).toHaveTitle(
      "Improv Games, Exercises & Lesson Plans | ImprovDB",
    );

    // Check meta description
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description).toContain("ImprovDB is the open-source database");

    // Check Open Graph tags
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toBe("Improv Games, Exercises & Lesson Plans | ImprovDB");

    const ogDescription = await page
      .locator('meta[property="og:description"]')
      .getAttribute("content");
    expect(ogDescription).toContain("ImprovDB");

    const ogType = await page
      .locator('meta[property="og:type"]')
      .getAttribute("content");
    expect(ogType).toBe("website");

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("/api/og");

    await verifyOgImage({
      url: ogImage ?? "",
      request,
      name: "og-homepage.png",
    });

    // Check Twitter Card tags
    const twitterCard = await page
      .locator('meta[name="twitter:card"]')
      .getAttribute("content");
    expect(twitterCard).toBe("summary_large_image");

    // Check canonical URL
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toBe("https://improvdb.com/");
  });

  test("resource page has correct meta tags", async ({ page, request }) => {
    await page.goto("/resource/blue-ball");

    // Wait for page to load
    await expect(page.getByTestId("resource-favourite-button")).toBeEnabled({
      timeout: 15000,
    });

    // Check title format
    await expect(page).toHaveTitle("Blue Ball - Improv exercise | ImprovDB");

    // Check Open Graph tags
    const ogType = await page
      .locator('meta[property="og:type"]')
      .getAttribute("content");
    expect(ogType).toBe("article");

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("/api/og");
    expect(ogImage).toContain("title=Blue");
    expect(ogImage).toContain("type=EXERCISE");

    await verifyOgImage({
      url: ogImage ?? "",
      request,
      name: "og-resource.png",
    });

    // Check canonical URL
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toBe("https://improvdb.com/resource/blue-ball");

    // Check structured data (JSON-LD)
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    expect(jsonLd).not.toBeNull();
    const structuredData = JSON.parse(jsonLd!);
    expect(structuredData["@type"]).toBe("Article");
    expect(structuredData.headline).toBe("Blue Ball");
  });

  test("browse resources page has correct meta tags", async ({ page, request }) => {
    await page.goto("/resource/browse");

    await expect(page).toHaveTitle("Browse Improv Resources | ImprovDB");

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description).toContain("improv warm-ups");

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toBe("https://improvdb.com/resource/browse");

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("/api/og");

    await verifyOgImage({
      url: ogImage ?? "",
      request,
      name: "og-browse-resources.png",
    });
  });

  test("browse lesson plans page has correct meta tags", async ({ page, request }) => {
    await page.goto("/lesson-plan/browse");

    await expect(page).toHaveTitle("Browse Improv Lesson Plans | ImprovDB");

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toBe("https://improvdb.com/lesson-plan/browse");

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toContain("/api/og");

    await verifyOgImage({
      url: ogImage ?? "",
      request,
      name: "og-browse-lesson-plans.png",
    });
  });
});

test.describe("Sitemap", () => {
  test("sitemap.xml returns valid XML with expected URLs", async ({ request }) => {
    const response = await request.get("/api/sitemap.xml");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/xml");

    const xmlContent = await response.text();

    // Parse XML to validate structure
    const parser = new XMLParser();
    const parsed = parser.parse(xmlContent);

    expect(parsed.urlset).toBeDefined();
    expect(parsed.urlset.url).toBeDefined();
    expect(Array.isArray(parsed.urlset.url)).toBe(true);

    // Check that required static pages are present
    const urls = parsed.urlset.url.map((u: { loc: string }) => u.loc);
    expect(urls).toContain("https://improvdb.com/");
    expect(urls).toContain("https://improvdb.com/about");
    expect(urls).toContain("https://improvdb.com/resource/browse");
    expect(urls).toContain("https://improvdb.com/lesson-plan/browse");
    expect(urls).toContain("https://improvdb.com/privacy");
    expect(urls).toContain("https://improvdb.com/terms");

    // Check that a known published resource is included (blue-ball from seed data)
    expect(urls).toContain("https://improvdb.com/resource/blue-ball");

    // Check that each URL entry has required fields
    for (const urlEntry of parsed.urlset.url) {
      expect(urlEntry.loc).toBeDefined();
      expect(urlEntry.lastmod).toBeDefined();
      expect(urlEntry.changefreq).toBeDefined();
      expect(urlEntry.priority).toBeDefined();
    }
  });

  test("sitemap.xml has correct caching headers", async ({ request }) => {
    const response = await request.get("/api/sitemap.xml");

    expect(response.status()).toBe(200);
    const cacheControl = response.headers()["cache-control"];
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("s-maxage=3600");
  });
});

test.describe("Robots.txt", () => {
  test("robots.txt is accessible and has correct content", async ({ request }) => {
    const response = await request.get("/robots.txt");

    expect(response.status()).toBe(200);

    const content = await response.text();

    // Check for required directives
    expect(content).toContain("User-agent: *");
    expect(content).toContain("Allow: /");
    expect(content).toContain("Disallow: /admin/");
    expect(content).toContain("Disallow: /api/");
    expect(content).toContain("Disallow: /auth/");
    expect(content).toContain("Disallow: /user/");
    expect(content).toContain("Sitemap: https://improvdb.com/api/sitemap.xml");
  });
});

test.describe("OG Image API", () => {
  const shouldSkipScreenshots = !!process.env.SKIP_SCREENSHOT_COMPARISON;

  test("returns an image for default request", async ({ request }) => {
    const response = await request.get("/api/og?title=Test%20Resource");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");

    if (!shouldSkipScreenshots) {
      const imageBuffer = await response.body();
      expect(imageBuffer).toMatchSnapshot("og-default.png");
    }
  });

  test("returns an image for exercise type", async ({ request }) => {
    const response = await request.get(
      "/api/og?title=Zip%20Zap%20Zop&type=EXERCISE&description=A%20classic%20warm-up%20game%20for%20focus%20and%20energy",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");

    if (!shouldSkipScreenshots) {
      const imageBuffer = await response.body();
      expect(imageBuffer).toMatchSnapshot("og-exercise.png");
    }
  });

  test("returns an image for short form type", async ({ request }) => {
    const response = await request.get(
      "/api/og?title=New%20Choice&type=SHORT_FORM&description=A%20fun%20short%20form%20game%20where%20players%20must%20redo%20their%20last%20line",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");

    if (!shouldSkipScreenshots) {
      const imageBuffer = await response.body();
      expect(imageBuffer).toMatchSnapshot("og-short-form.png");
    }
  });

  test("returns an image for long form type", async ({ request }) => {
    const response = await request.get(
      "/api/og?title=The%20Harold&type=LONG_FORM&description=The%20classic%20long%20form%20format%20developed%20by%20Del%20Close",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");

    if (!shouldSkipScreenshots) {
      const imageBuffer = await response.body();
      expect(imageBuffer).toMatchSnapshot("og-long-form.png");
    }
  });

  test("returns an image for lesson plan type", async ({ request }) => {
    const response = await request.get(
      "/api/og?title=Beginner%20Workshop&type=LESSON_PLAN&author=Dom%20Gemoli&description=A%20two-hour%20intro%20to%20improv%20for%20beginners",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");

    if (!shouldSkipScreenshots) {
      const imageBuffer = await response.body();
      expect(imageBuffer).toMatchSnapshot("og-lesson-plan.png");
    }
  });

  test("handles long titles gracefully", async ({ request }) => {
    const response = await request.get(
      "/api/og?title=This%20Is%20A%20Very%20Long%20Title%20That%20Should%20Be%20Displayed%20Smaller&type=EXERCISE",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");

    if (!shouldSkipScreenshots) {
      const imageBuffer = await response.body();
      expect(imageBuffer).toMatchSnapshot("og-long-title.png");
    }
  });
});
