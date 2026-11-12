import { describe, expect, it } from "vitest";

import { isActiveLink } from "@/lib/utils";

describe("isActiveLink", () => {
  it("matches the home page only exactly", () => {
    expect(isActiveLink("/", "/")).toBe(true);
    expect(isActiveLink("/about", "/")).toBe(false);
  });

  it("matches a section and the pages under it", () => {
    expect(isActiveLink("/about", "/about")).toBe(true);
    expect(isActiveLink("/lesson-plan/browse", "/lesson-plan/browse")).toBe(
      true,
    );
    expect(isActiveLink("/lesson-plan/abc", "/lesson-plan")).toBe(true);
    expect(isActiveLink("/about", "/lesson-plan")).toBe(false);
  });

  it("is active when any of its children is", () => {
    const children = [{ href: "/exercises" }, { href: "/short-form-games" }];
    expect(isActiveLink("/short-form-games", "/", children)).toBe(true);
    expect(isActiveLink("/", "/", children)).toBe(true);
    expect(isActiveLink("/about", "/", children)).toBe(false);
  });
});
