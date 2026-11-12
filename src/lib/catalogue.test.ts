import { ResourceConfiguration, ResourceType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  type CatalogueState,
  EMPTY_CATALOGUE_STATE,
  NEWEST_SORTING,
  TYPE_LANDING_PAGE_LIST,
  TYPE_LANDING_PAGES,
  canonicalPathFor,
  catalogueHref,
  catalogueQuery,
  categoryLandingPath,
  columnFiltersToState,
  landingPathFor,
  parseCatalogueQuery,
  stateToColumnFilters,
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

describe("landingPathFor and canonicalPathFor", () => {
  it.each(TYPE_LANDING_PAGE_LIST.map((page) => [page.type, page.path]))(
    "a single %s type is its type Landing Page",
    (type, path) => {
      expect(landingPathFor(state({ type: [type] }))).toBe(path);
    },
  );

  it("a single category is its category Landing Page", () => {
    expect(landingPathFor(state({ category: ["listening"] }))).toBe(
      "/category/listening",
    );
  });

  it("ignores sorting", () => {
    expect(
      landingPathFor(
        state({ type: [ResourceType.SHORT_FORM], sorting: NEWEST_SORTING }),
      ),
    ).toBe("/short-form-games");
  });

  it.each<[string, Partial<CatalogueState>]>([
    ["no filters", {}],
    ["only sorting", { sorting: NEWEST_SORTING }],
    ["two types", { type: [ResourceType.EXERCISE, ResourceType.SHORT_FORM] }],
    ["two categories", { category: ["listening", "agreement"] }],
    [
      "a type and a category",
      { type: [ResourceType.SHORT_FORM], category: ["listening"] },
    ],
    [
      "a type and a title search",
      { type: [ResourceType.SHORT_FORM], title: "freeze" },
    ],
    [
      "a category and a configuration",
      {
        category: ["listening"],
        configuration: [ResourceConfiguration.PAIRS],
      },
    ],
    ["only a configuration", { configuration: [ResourceConfiguration.PAIRS] }],
  ])("has no Landing Page with %s", (_, overrides) => {
    expect(landingPathFor(state(overrides))).toBeUndefined();
    expect(canonicalPathFor(state(overrides))).toBe("/");
  });

  it("canonical is the Landing Page when there is one", () => {
    expect(canonicalPathFor(state({ category: ["listening"] }))).toBe(
      "/category/listening",
    );
  });
});

describe("column filters", () => {
  it("maps the category filter to the categories column", () => {
    expect(
      stateToColumnFilters(
        state({ title: "zip", category: ["listening"], type: [] }),
      ),
    ).toEqual([
      { id: "title", value: "zip" },
      { id: "categories", value: ["listening"] },
    ]);
  });

  it("has no filters for the empty state", () => {
    expect(stateToColumnFilters(EMPTY_CATALOGUE_STATE)).toEqual([]);
  });

  it("round-trips through column filters, keeping the sorting given", () => {
    const original: CatalogueState = {
      title: "zip",
      type: [ResourceType.EXERCISE],
      configuration: [ResourceConfiguration.CIRCLE],
      category: ["listening"],
      sorting: NEWEST_SORTING,
    };
    expect(
      columnFiltersToState(stateToColumnFilters(original), original.sorting),
    ).toEqual(original);
  });

  it("treats missing filters as empty", () => {
    expect(columnFiltersToState([], [])).toEqual(EMPTY_CATALOGUE_STATE);
  });
});

describe("Landing Page paths", () => {
  it("has one type Landing Page per resource type", () => {
    for (const type of Object.values(ResourceType)) {
      expect(TYPE_LANDING_PAGES[type].type).toBe(type);
    }
  });

  it("gives every Landing Page its own path", () => {
    const paths = [
      ...TYPE_LANDING_PAGE_LIST.map((page) => page.path),
      categoryLandingPath("listening"),
    ];
    expect(new Set(paths).size).toBe(paths.length);
  });
});
