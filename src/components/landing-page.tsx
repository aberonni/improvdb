import Link from "next/link";
import { useMemo } from "react";

import {
  Catalogue,
  CatalogueStructuredData,
  useLandingCatalogueState,
} from "@/components/catalogue";
import { PageLayout } from "@/components/page-layout";
import { SEO } from "@/components/seo";
import { type CatalogueState } from "@/lib/catalogue";
import { api, type RouterOutputs } from "@/utils/api";

type Resource = RouterOutputs["resource"]["getAll"][0];

/**
 * A Catalogue view fixed to one type or one Category, with its own heading
 * and introduction (see docs/adr/0001).
 */
export function LandingPage({
  path,
  name,
  title,
  heading,
  subtitle,
  description,
  intro,
  initialState,
  matches,
  noIndex = false,
}: {
  path: string;
  /** Short name for breadcrumbs */
  name: string;
  /** <title>, without the site name */
  title: string;
  heading: string;
  subtitle: (count: number) => string;
  description: string;
  intro: string[];
  initialState: CatalogueState;
  /** Which Resources belong on this page (for the count and ItemList) */
  matches: (resource: Resource) => boolean;
  noIndex?: boolean;
}) {
  const queryResult = api.resource.getAll.useQuery();
  const [state, setState] = useLandingCatalogueState(initialState);

  const resources = useMemo(
    () => queryResult.data?.filter(matches),
    [queryResult.data, matches],
  );

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical={path}
        noIndex={noIndex}
      />
      {!noIndex && (
        <CatalogueStructuredData
          name={heading}
          path={path}
          resources={resources}
        />
      )}
      <PageLayout
        breadcrumbs={[{ name: "Home", href: "/" }, { name }]}
        title={
          <>
            {heading}
            {resources && (
              <span className="mt-1 block text-sm font-normal tracking-normal">
                {subtitle(resources.length)}
              </span>
            )}
          </>
        }
      >
        <div className="mb-8 max-w-3xl space-y-3 text-muted-foreground">
          {intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <Catalogue
          queryResult={queryResult}
          state={state}
          onStateChange={setState}
        />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline">
            Browse all games & exercises
          </Link>
        </p>
      </PageLayout>
    </>
  );
}
