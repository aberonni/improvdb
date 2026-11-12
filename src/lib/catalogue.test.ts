import { ResourceConfiguration, ResourceType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  type CatalogueState,
  EMPTY_CATALOGUE_STATE,
  NEWEST_SORTING,
  catalogueHref,
  catalogueQuery,
  parseCatalogueQuery,
} from "@/lib/catalogue";

const state = (overrides: Partial<CatalogueState>): CatalogueState => ({
  ...EMPTY_CATALOGUE_STATE,
  ...overrides,
});

describe("parseCatalogueQuery", () => {
  it("returns the empty state for an empty query", () => {
    expect(parseCatalogueQuery({})).toEqual(EMPTY_CATALOGUE_STATE);
  });

  it("reads every parameter", () => {
    expect(
      parseCatalogueQuery({
        q: "freeze",
        type: "short-form",
        configuration: "whole-class",
        category: "listening",
        sort: "newest",
      }),
    ).toEqual({
      title: "freeze",
      type: [ResourceType.SHORT_FORM],
      configuration: [ResourceConfiguration.WHOLE_CLASS],
      category: ["listening"],
      sorting: NEWEST_SORTING,
    });
  });

  it("reads lists as comma separated or repeated parameters", () => {
    const expected = [ResourceType.EXERCISE, ResourceType.LONG_FORM];
    expect(parseCatalogueQuery({ type: "exercise,long-form" }).type).toEqual(
      expected,
    );
    expect(
      parseCatalogueQuery({ type: ["exercise", "long-form"] }).type,
    ).toEqual(expected);
    expect(
      parseCatalogueQuery({ category: ["listening,agreement", "status"] })
        .category,
    ).toEqual(["listening", "agreement", "status"]);
  });

  it("ignores empty list entries", () => {
    expect(parseCatalogueQuery({ category: ",listening,," }).category).toEqual([
      "listening",
    ]);
    expect(parseCatalogueQuery({ type: "" }).type).toEqual([]);
  });

  it("drops unknown types and configurations", () => {
    const parsed = parseCatalogueQuery({
      type: "short-form,musical,SHORT_FORM",
      configuration: "pairs,crowd",
    });
    expect(parsed.type).toEqual([ResourceType.SHORT_FORM]);
    expect(parsed.configuration).toEqual([ResourceConfiguration.PAIRS]);
  });

  it("takes the first value of repeated single parameters", () => {
    const parsed = parseCatalogueQuery({
      q: ["freeze", "tag"],
      sort: ["newest", "title"],
    });
    expect(parsed.title).toBe("freeze");
    expect(parsed.sorting).toEqual(NEWEST_SORTING);
  });

  it.each([
    ["newest", NEWEST_SORTING],
    ["title", [{ id: "title", desc: false }]],
    ["title-desc", [{ id: "title", desc: true }]],
    ["createdAt", [{ id: "createdAt", desc: false }]],
    ["-desc", []],
    ["", []],
  ])("parses sort=%j", (sort, sorting) => {
    expect(parseCatalogueQuery({ sort }).sorting).toEqual(sorting);
  });
});

describe("catalogueQuery and catalogueHref", () => {
  it("leaves the empty state off the URL", () => {
    expect(catalogueQuery(EMPTY_CATALOGUE_STATE)).toEqual({});
    expect(catalogueHref(EMPTY_CATALOGUE_STATE)).toBe("/");
  });

  it("writes lowercase, hyphenated enum values", () => {
    expect(
      catalogueQuery(
        state({
          type: [ResourceType.SHORT_FORM, ResourceType.LONG_FORM],
          configuration: [ResourceConfiguration.WHOLE_CLASS],
        }),
      ),
    ).toEqual({ type: "short-form,long-form", configuration: "whole-class" });
  });

  it.each([
    [NEWEST_SORTING, "newest"],
    [[{ id: "title", desc: false }], "title"],
    [[{ id: "title", desc: true }], "title-desc"],
    [[{ id: "createdAt", desc: false }], "createdAt"],
  ])("writes sorting %j as sort=%s", (sorting, sort) => {
    expect(catalogueQuery(state({ sorting })).sort).toBe(sort);
  });

  it("builds a home page link in a stable parameter order", () => {
    expect(
      catalogueHref(
        state({
          sorting: NEWEST_SORTING,
          category: ["listening"],
          type: [ResourceType.SHORT_FORM],
          title: "Freeze Tag",
        }),
      ),
    ).toBe("/?q=Freeze+Tag&type=short-form&category=listening&sort=newest");
  });

  it.each<[string, CatalogueState]>([
    ["empty", EMPTY_CATALOGUE_STATE],
    [
      "everything set",
      {
        title: "zip & zap, 100%",
        type: [ResourceType.EXERCISE, ResourceType.SHORT_FORM],
        configuration: [
          ResourceConfiguration.CIRCLE,
          ResourceConfiguration.WHOLE_CLASS,
        ],
        category: ["listening", "agreement"],
        sorting: [{ id: "title", desc: true }],
      },
    ],
    ["newest", state({ sorting: NEWEST_SORTING })],
  ])("round-trips the %s state through the URL", (_, original) => {
    const search = catalogueHref(original).replace(/^\/\??/, "");
    const query = Object.fromEntries(new URLSearchParams(search));
    expect(parseCatalogueQuery(query)).toEqual(original);
  });
});
