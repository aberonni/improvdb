import { describe, expect, it } from "vitest";

import { type Listing, pagesShowing } from "@/server/resource-lifecycle/pages";

const draft: Listing = {
  id: "zip-zap-zop",
  published: false,
  type: "EXERCISE",
  categoryIds: ["focus"],
};

describe("pagesShowing", () => {
  it("is only a Draft's own page", () => {
    expect(pagesShowing(draft)).toEqual(["/resource/zip-zap-zop"]);
  });

  it("adds the Catalogue and Landing Pages of a Published Resource", () => {
    expect(pagesShowing({ ...draft, published: true })).toEqual([
      "/resource/zip-zap-zop",
      "/",
      "/exercises",
      "/category/focus",
    ]);
  });

  it("covers every version, once each", () => {
    const before = { ...draft, published: true };
    const after: Listing = {
      ...before,
      type: "SHORT_FORM",
      categoryIds: ["focus", "energy"],
    };
    expect(pagesShowing(before, after)).toEqual([
      "/resource/zip-zap-zop",
      "/",
      "/exercises",
      "/category/focus",
      "/short-form-games",
      "/category/energy",
    ]);
  });
});
