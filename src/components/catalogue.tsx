import type { UseTRPCQueryResult } from "@trpc/react-query/shared";
import { isEqual } from "lodash";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import { ResourceList } from "@/components/resource-list";
import {
  type CatalogueState,
  catalogueHref,
  catalogueQuery,
  columnFiltersToState,
  parseCatalogueQuery,
  stateToColumnFilters,
} from "@/lib/catalogue";
import { type RouterOutputs } from "@/utils/api";

type Resources = RouterOutputs["resource"]["getAll"];

const SITE_URL = "https://improvdb.com";

/**
 * The filterable list of all published Resources, driven by a
 * CatalogueState held outside it (the URL, or a Landing Page).
 */
export function Catalogue({
  queryResult,
  state,
  onStateChange,
}: {
  queryResult: UseTRPCQueryResult<Resources, unknown>;
  state: CatalogueState;
  onStateChange: (state: CatalogueState) => void;
}) {
  return (
    <ResourceList
      queryResult={queryResult}
      useFilters
      showFavourites
      linkBadges
      columnFilters={stateToColumnFilters(state)}
      onColumnFiltersChange={(filters) =>
        onStateChange(columnFiltersToState(filters, state.sorting))
      }
      sorting={state.sorting}
      onSortingChange={(sorting) => onStateChange({ ...state, sorting })}
    />
  );
}

const toSearch = (state: CatalogueState) =>
  new URLSearchParams(catalogueQuery(state)).toString();

/**
 * Catalogue state kept in the home page's query string. Local state is the
 * source of truth while typing; the URL is updated shallowly behind it and
 * read back only on outside navigation (back button, nav links).
 */
export function useUrlCatalogueState() {
  const router = useRouter();
  const [state, setState] = useState(() => parseCatalogueQuery(router.query));
  const pendingWrites = useRef(new Set<string>());

  useEffect(() => {
    const fromUrl = parseCatalogueQuery(router.query);
    const search = toSearch(fromUrl);
    if (pendingWrites.current.delete(search)) return;
    setState((current) => (isEqual(current, fromUrl) ? current : fromUrl));
  }, [router.query]);

  const update = (next: CatalogueState) => {
    setState(next);
    pendingWrites.current.add(toSearch(next));
    void router.replace(
      { pathname: router.pathname, query: catalogueQuery(next) },
      undefined,
      { shallow: true, scroll: false },
    );
  };

  return [state, update] as const;
}

/**
 * Catalogue state on a Landing Page: the page's own filter is fixed, so
 * changing a filter or the sort moves to the home page Catalogue with that
 * state. Typing in the title search filters in place, so focus is kept.
 */
export function useLandingCatalogueState(initial: CatalogueState) {
  const router = useRouter();
  const [state, setState] = useState(initial);

  const update = (next: CatalogueState) => {
    if (isEqual({ ...next, title: "" }, { ...state, title: "" })) {
      setState(next);
      return;
    }
    void router.push(catalogueHref(next));
  };

  return [state, update] as const;
}

/** schema.org ItemList of the Resources a Catalogue view shows */
export function CatalogueStructuredData({
  name,
  path,
  resources,
}: {
  name: string;
  path: string;
  resources: Resources | undefined;
}) {
  if (!resources?.length) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: `${SITE_URL}${path}`,
    numberOfItems: resources.length,
    itemListElement: resources.map((resource, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: resource.title,
      url: `${SITE_URL}/resource/${resource.id}`,
    })),
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        key="catalogue-item-list"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
}
