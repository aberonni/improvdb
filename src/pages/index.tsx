import Link from "next/link";

import {
  Catalogue,
  CataloguePendingScript,
  CatalogueStructuredData,
  useUrlCatalogueState,
} from "@/components/catalogue";
import { PageLayout } from "@/components/page-layout";
import { SEO } from "@/components/seo";
import { catalogueStaticProps } from "@/server/helpers/landingPageProps";
import { api } from "@/utils/api";

export default function Home() {
  const queryResult = api.resource.getCatalogue.useQuery();
  const [state, setState] = useUrlCatalogueState();
  const count = queryResult.data?.length;

  return (
    <>
      <SEO
        title="Improv Games, Exercises & Warm-ups"
        description="ImprovDB is the open-source database for improv games and exercises. Find warm-ups, short form games and long form formats for your next improv class or rehearsal, and share lesson plans with other improv teachers."
        canonical="/"
      />
      <CataloguePendingScript />
      <CatalogueStructuredData
        name="Improv Games & Exercises"
        path="/"
        resources={queryResult.data}
      />
      <PageLayout
        title={
          <>
            Improv Games & Exercises
            <span className="mt-1 block text-sm font-normal tracking-normal">
              {count ? `${count} ` : ""}warm-ups, exercises, short form games
              and long form formats, free and open source
            </span>
          </>
        }
      >
        <Catalogue
          queryResult={queryResult}
          state={state}
          onStateChange={setState}
        />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          See something missing? You can{" "}
          <Link href="/resource/create" className="underline">
            propose a new one.
          </Link>
        </p>
      </PageLayout>
    </>
  );
}

// Pre-built, so the canonical is always "/", even for filtered views; see
// docs/adr/0001.
export const getStaticProps = catalogueStaticProps();
