import Link from "next/link";

import {
  Catalogue,
  CatalogueStructuredData,
  useLandingCatalogueState,
} from "@/components/catalogue";
import { PageLayout } from "@/components/page-layout";
import { SEO } from "@/components/seo";
import { type LandingPage as LandingPageData } from "@/lib/landing-page";
import { api } from "@/utils/api";

/**
 * A Catalogue view fixed to one type or one Category, with its own heading
 * and introduction (see docs/adr/0001).
 */
export function LandingPage({ page }: { page: LandingPageData }) {
  const {
    path,
    name,
    title,
    heading,
    subtitle,
    description,
    intro,
    initialState,
    filter,
    indexable,
  } = page;
  const queryResult = api.resource.getCatalogue.useQuery(filter);
  const [state, setState] = useLandingCatalogueState(initialState);
  const resources = queryResult.data;

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical={path}
        noIndex={!indexable}
      />
      {indexable && (
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
