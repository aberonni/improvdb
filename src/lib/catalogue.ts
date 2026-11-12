import { ResourceConfiguration, ResourceType } from "@prisma/client";
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
