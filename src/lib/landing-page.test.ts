import { ResourceType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  categoryLandingPage,
  type LandingPageCategory,
  typeLandingPage,
  typeLandingPages,
} from "@/lib/landing-page";

const category = (
  overrides: Partial<LandingPageCategory> = {},
): LandingPageCategory => ({
  id: "listening",
  name: "Listening",
  description: null,
  _count: { resources: 5 },
  ...overrides,
});

describe("type Landing Pages", () => {
  it("has one page per type, filtered to that type", () => {
    for (const type of Object.values(ResourceType)) {
      const page = typeLandingPage(type);
      expect(page.filter).toEqual({ type });
      expect(page.initialState.type).toEqual([type]);
      expect(page.indexable).toBe(true);
    }
    expect(typeLandingPages).toHaveLength(Object.values(ResourceType).length);
  });

  it("counts Resources in the subtitle", () => {
    expect(typeLandingPage(ResourceType.SHORT_FORM).subtitle(12)).toBe(
      "12 short form games, free and open source",
    );
  });
});

describe("category Landing Pages", () => {
  it("lives at /category/[id] and lists that Category", () => {
    const page = categoryLandingPage(category());
    expect(page.path).toBe("/category/listening");
    expect(page.filter).toEqual({ category: "listening" });
    expect(page.initialState.category).toEqual(["listening"]);
    expect(page.title).toBe("Listening Improv Games & Exercises");
  });

  it("splits the description into intro paragraphs on blank lines", () => {
    const page = categoryLandingPage(
      category({ description: "First.\n\n  Second.  \n \nThird." }),
    );
    expect(page.intro).toEqual(["First.", "Second.", "Third."]);
    expect(page.description).toBe("First.");
  });

  it("falls back to a generated intro without a description", () => {
    const page = categoryLandingPage(category());
    expect(page.intro).toEqual([
      "Improv games and exercises for practising listening. Filter them by type or group setup to find one for your next class or rehearsal.",
    ]);
    expect(page.description).toBe(page.intro[0]);
  });

  it("caps the meta description at 300 characters", () => {
    const page = categoryLandingPage(
      category({ description: "x".repeat(400) }),
    );
    expect(page.description).toHaveLength(300);
  });

  it("is indexed from 3 published Resources", () => {
    expect(
      categoryLandingPage(category({ _count: { resources: 2 } })).indexable,
    ).toBe(false);
    expect(
      categoryLandingPage(category({ _count: { resources: 3 } })).indexable,
    ).toBe(true);
  });

  it("says game or exercise in the singular", () => {
    const page = categoryLandingPage(category());
    expect(page.subtitle(1)).toBe(
      "1 improv game or exercise for practising listening",
    );
    expect(page.subtitle(4)).toBe(
      "4 improv games and exercises for practising listening",
    );
  });
});

it("gives every Landing Page its own path", () => {
  const paths = [
    ...typeLandingPages.map((page) => page.path),
    categoryLandingPage(category()).path,
  ];
  expect(new Set(paths).size).toBe(paths.length);
});
