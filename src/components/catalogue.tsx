import {
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { isEqual } from "lodash";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import { PageLayout } from "@/components/page-layout";
import { ResourceList } from "@/components/resource-list";
import { SEO } from "@/components/seo";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type CatalogueState,
  catalogueHref,
  catalogueQuery,
  parseCatalogueQuery,
} from "@/lib/catalogue";
import { type LandingPage } from "@/lib/landing-page";
import { SITE_URL } from "@/lib/site";
import { api, type RouterOutputs } from "@/utils/api";

type Resources = RouterOutputs["resource"]["getCatalogue"];

/** The home page Catalogue, or a Landing Page */
export type CatalogueView = "home" | LandingPage;

const HOME = {
  path: "/",
  title: "Improv Games, Exercises & Warm-ups",
  heading: "Improv Games & Exercises",
  description:
    "ImprovDB is the open-source database for improv games and exercises. Find warm-ups, short form games and long form formats for your next improv class or rehearsal, and share lesson plans with other improv teachers.",
  // The count is its own text node, as before, so the text renders the same
  subtitle: (count: number | undefined) => (
    <>
      {count ? `${count} ` : ""}warm-ups, exercises, short form games and long
      form formats, free and open source
    </>
  ),
};

/**
 * A page listing published Resources: the home page Catalogue, whose filters
 * live in the URL, or a Landing Page, whose own filter is fixed. Loads its
 * Resources and renders the heading, SEO metadata and structured data.
 */
export function CataloguePage({ view }: { view: CatalogueView }) {
  const isHome = view === "home";
  const queryResult = api.resource.getCatalogue.useQuery(
    isHome ? undefined : view.filter,
  );
  const [state, setState] = useCatalogueState(view);
  const count = queryResult.data?.length;

  return (
    <>
      <SEO
        title={isHome ? HOME.title : view.title}
        description={isHome ? HOME.description : view.description}
        canonical={isHome ? HOME.path : view.path}
        noIndex={!isHome && !view.indexable}
      />
      {isHome && <CataloguePendingScript />}
      {(isHome || view.indexable) && (
        <CatalogueStructuredData
          name={isHome ? HOME.heading : view.heading}
          path={isHome ? HOME.path : view.path}
          resources={queryResult.data}
        />
      )}
      <PageLayout
        breadcrumbs={
          isHome
            ? undefined
            : [{ name: "Home", href: "/" }, { name: view.name }]
        }
        title={
          <>
            {isHome ? HOME.heading : view.heading}
            {(isHome || count !== undefined) && (
              <span className="mt-1 block text-sm font-normal tracking-normal">
                {isHome ? HOME.subtitle(count) : view.subtitle(count ?? 0)}
              </span>
            )}
          </>
        }
      >
        {!isHome && (
          <div className="mb-8 max-w-3xl space-y-3 text-muted-foreground">
            {view.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
        <div className="relative">
          <div className="[.catalogue-pending_&]:invisible">
            <ResourceList
              queryResult={queryResult}
              useFilters
              showFavourites
              linkBadges
              columnFilters={stateToColumnFilters(state)}
              onColumnFiltersChange={(filters) =>
                setState(columnFiltersToState(filters, state.sorting))
              }
              sorting={state.sorting}
              onSortingChange={(sorting) => setState({ ...state, sorting })}
            />
          </div>
          <div
            aria-hidden
            data-testid="catalogue-pending"
            className="absolute inset-x-0 top-0 hidden space-y-4 [.catalogue-pending_&]:block"
          >
            <Skeleton className="h-9 w-full max-w-md" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isHome ? (
            <>
              See something missing? You can{" "}
              <Link href="/resource/create" className="underline">
                propose a new one.
              </Link>
            </>
          ) : (
            <Link href="/" className="underline">
              Browse all games & exercises
            </Link>
          )}
        </p>
      </PageLayout>
    </>
  );
}

const PENDING_CLASS = "catalogue-pending";

/**
 * The home page is pre-built without a query string, so a filtered link
 * first renders the unfiltered list. This blocking script hides the list
 * behind a skeleton until useCatalogueState has applied the URL's filters
 * (or after a few seconds, in case that never happens).
 */
function CataloguePendingScript() {
  return (
    <Head>
      <script
        key="catalogue-pending"
        dangerouslySetInnerHTML={{
          __html: `if(location.search){var c=document.documentElement.classList;c.add("${PENDING_CLASS}");setTimeout(function(){c.remove("${PENDING_CLASS}")},5000)}`,
        }}
      />
    </Head>
  );
}

const toSearch = (state: CatalogueState) =>
  new URLSearchParams(catalogueQuery(state)).toString();

/**
 * On the home page, the state lives in the query string. Local state is the
 * source of truth while typing; the URL is updated shallowly behind it and
 * read back only on outside navigation (back button, nav links).
 *
 * On a Landing Page, the page's own filter is fixed, so changing a filter or
 * the sort moves to the home page Catalogue with that state. Typing in the
 * title search filters in place, so focus is kept.
 */
function useCatalogueState(view: CatalogueView) {
  const isHome = view === "home";
  const router = useRouter();
  const [state, setState] = useState(() =>
    isHome ? parseCatalogueQuery(router.query) : view.initialState,
  );
  const pendingWrites = useRef(new Set<string>());

  useEffect(() => {
    if (!isHome) return;
    const fromUrl = parseCatalogueQuery(router.query);
    if (pendingWrites.current.delete(toSearch(fromUrl))) return;
    setState((current) => (isEqual(current, fromUrl) ? current : fromUrl));
  }, [isHome, router.query]);

  // Runs after the commit that rendered the URL's filters
  useEffect(() => {
    if (
      isHome &&
      router.isReady &&
      isEqual(state, parseCatalogueQuery(router.query))
    ) {
      document.documentElement.classList.remove(PENDING_CLASS);
    }
  }, [isHome, router.isReady, router.query, state]);

  const update = (next: CatalogueState) => {
    if (!isHome) {
      if (isEqual({ ...next, title: "" }, { ...state, title: "" })) {
        setState(next);
      } else {
        void router.push(catalogueHref(next));
      }
      return;
    }

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

/** The list's column filters for a CatalogueState, and back */
function stateToColumnFilters(state: CatalogueState): ColumnFiltersState {
  const filters: ColumnFiltersState = [];
  if (state.title) filters.push({ id: "title", value: state.title });
  if (state.type.length) filters.push({ id: "type", value: state.type });
  if (state.configuration.length)
    filters.push({ id: "configuration", value: state.configuration });
  if (state.category.length)
    filters.push({ id: "categories", value: state.category });
  return filters;
}

function columnFiltersToState(
  filters: ColumnFiltersState,
  sorting: SortingState,
): CatalogueState {
  const value = (id: string) => filters.find((f) => f.id === id)?.value;
  return {
    title: (value("title") as string | undefined) ?? "",
    type: (value("type") as CatalogueState["type"] | undefined) ?? [],
    configuration:
      (value("configuration") as CatalogueState["configuration"] | undefined) ??
      [],
    category: (value("categories") as string[] | undefined) ?? [],
    sorting,
  };
}

/** schema.org ItemList of the Resources a Catalogue view shows */
function CatalogueStructuredData({
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
