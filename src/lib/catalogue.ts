import {
  ResourceConfiguration,
  ResourceType,
  type ResourceType as ResourceTypeValue,
} from "@prisma/client";
import {
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";

/**
 * The Catalogue's filter and sort state, as it appears in the URL
 * (see docs/adr/0001-catalogue-home-and-landing-page-urls.md).
 */
export type CatalogueState = {
  title: string;
  type: ResourceType[];
  configuration: ResourceConfiguration[];
  category: string[];
  sorting: SortingState;
};

export const EMPTY_CATALOGUE_STATE: CatalogueState = {
  title: "",
  type: [],
  configuration: [],
  category: [],
  sorting: [],
};

/** Category Landing Pages with fewer published Resources are not indexed. */
export const MIN_RESOURCES_TO_INDEX = 3;

export type TypeLandingPage = {
  type: ResourceTypeValue;
  path: string;
  /** Short name, used in breadcrumbs and navigation */
  name: string;
  /** Page title and H1 */
  heading: string;
  description: string;
  intro: string[];
};

export const TYPE_LANDING_PAGES: Record<ResourceTypeValue, TypeLandingPage> = {
  EXERCISE: {
    type: ResourceType.EXERCISE,
    path: "/exercises",
    name: "Exercises",
    heading: "Improv Exercises & Warm-ups",
    description:
      "Improv warm-ups and exercises for classes and rehearsals: listening, agreement, spontaneity and more, each with instructions and tips for teachers.",
    intro: [
      "Exercises are the backbone of any improv class. They warm a group up, build trust and train one skill at a time, from listening and agreement to spontaneity and commitment, without the pressure of performing for an audience.",
      "Every exercise here comes with instructions you can run straight away. Filter by category to find one that practises the skill your group needs today.",
    ],
  },
  SHORT_FORM: {
    type: ResourceType.SHORT_FORM,
    path: "/short-form-games",
    name: "Short Form Games",
    heading: "Short Form Improv Games",
    description:
      "Short form improv games for classes, jams and shows: quick scene games with a simple rule or gimmick, each with instructions and tips.",
    intro: [
      "Short form games are quick, structured scenes built around a rule or gimmick: freeze a scene and replace a player, speak only in questions, or let the audience steer the story. They are the format behind most improv comedy shows and a great way into scenework.",
      "Use them in class to practise a specific skill, at a jam to get everyone on stage, or in a show to give the audience something to play along with.",
    ],
  },
  LONG_FORM: {
    type: ResourceType.LONG_FORM,
    path: "/long-form-formats",
    name: "Long Form Formats",
    heading: "Long Form Improv Formats",
    description:
      "Long form improv formats explained: the structure of extended improvised pieces like the Armando and La Ronde, with tips for teaching and performing them.",
    intro: [
      "Long form formats give an extended improvised piece its shape: how scenes connect, when themes return and how the whole thing builds to an ending. They turn a run of scenes into a show.",
      "Each format here describes its structure and how to rehearse it, whether you are teaching your first long form class or looking for something new to perform.",
    ],
  },
};

export const TYPE_LANDING_PAGE_LIST = Object.values(TYPE_LANDING_PAGES);

export function categoryLandingPath(categoryId: string) {
  return `/category/${categoryId}`;
}

// URL values are lowercase and hyphenated: SHORT_FORM <-> short-form
const toParam = (value: string) => value.toLowerCase().replaceAll("_", "-");
const fromParam = <T extends string>(param: string, values: readonly T[]) =>
  values.find((value) => toParam(value) === param);

const RESOURCE_TYPES = Object.values(ResourceType);
const RESOURCE_CONFIGURATIONS = Object.values(ResourceConfiguration);

export const NEWEST_SORTING: SortingState = [{ id: "createdAt", desc: true }];

type Query = Record<string, string | string[] | undefined>;

function queryList(value: string | string[] | undefined) {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : value.split(","))
    .flatMap((v) => v.split(","))
    .filter(Boolean);
}

function parseSorting(value: string | undefined): SortingState {
  if (!value) return [];
  if (value === "newest") return NEWEST_SORTING;
  const desc = value.endsWith("-desc");
  const id = desc ? value.slice(0, -"-desc".length) : value;
  return id ? [{ id, desc }] : [];
}

function serializeSorting(sorting: SortingState): string | undefined {
  const [first] = sorting;
  if (!first) return undefined;
  if (first.id === "createdAt" && first.desc) return "newest";
  return first.desc ? `${first.id}-desc` : first.id;
}

export function parseCatalogueQuery(query: Query): CatalogueState {
  const single = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  return {
    title: single(query.q) ?? "",
    type: queryList(query.type)
      .map((v) => fromParam(v, RESOURCE_TYPES))
      .filter((v): v is ResourceType => !!v),
    configuration: queryList(query.configuration)
      .map((v) => fromParam(v, RESOURCE_CONFIGURATIONS))
      .filter((v): v is ResourceConfiguration => !!v),
    category: queryList(query.category),
    sorting: parseSorting(single(query.sort)),
  };
}

export function catalogueQuery(state: CatalogueState): Record<string, string> {
  const query: Record<string, string> = {};
  if (state.title) query.q = state.title;
  if (state.type.length) query.type = state.type.map(toParam).join(",");
  if (state.configuration.length)
    query.configuration = state.configuration.map(toParam).join(",");
  if (state.category.length) query.category = state.category.join(",");
  const sort = serializeSorting(state.sorting);
  if (sort) query.sort = sort;
  return query;
}

export function catalogueHref(state: CatalogueState) {
  const search = new URLSearchParams(catalogueQuery(state)).toString();
  return search ? `/?${search}` : "/";
}

/**
 * The Landing Page a Catalogue view is equivalent to, if any: exactly one
 * type, or exactly one category, and no other filter. Sorting is ignored
 * because it does not change which Resources are shown.
 */
export function landingPathFor(state: CatalogueState): string | undefined {
  if (state.title || state.configuration.length) return undefined;

  const [type] = state.type;
  if (type && state.type.length === 1 && state.category.length === 0) {
    return TYPE_LANDING_PAGES[type].path;
  }

  const [category] = state.category;
  if (category && state.category.length === 1 && state.type.length === 0) {
    return categoryLandingPath(category);
  }

  return undefined;
}

export function canonicalPathFor(state: CatalogueState) {
  return landingPathFor(state) ?? "/";
}

export function stateToColumnFilters(
  state: CatalogueState,
): ColumnFiltersState {
  const filters: ColumnFiltersState = [];
  if (state.title) filters.push({ id: "title", value: state.title });
  if (state.type.length) filters.push({ id: "type", value: state.type });
  if (state.configuration.length)
    filters.push({ id: "configuration", value: state.configuration });
  if (state.category.length)
    filters.push({ id: "categories", value: state.category });
  return filters;
}

export function columnFiltersToState(
  filters: ColumnFiltersState,
  sorting: SortingState,
): CatalogueState {
  const value = (id: string) => filters.find((f) => f.id === id)?.value;
  return {
    title: (value("title") as string | undefined) ?? "",
    type: (value("type") as ResourceType[] | undefined) ?? [],
    configuration:
      (value("configuration") as ResourceConfiguration[] | undefined) ?? [],
    category: (value("categories") as string[] | undefined) ?? [],
    sorting,
  };
}
