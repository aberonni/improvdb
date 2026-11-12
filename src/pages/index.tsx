import type { GetServerSideProps } from "next";
import Link from "next/link";

import {
  Catalogue,
  CatalogueStructuredData,
  useUrlCatalogueState,
} from "@/components/catalogue";
import { PageLayout } from "@/components/page-layout";
import { SEO } from "@/components/seo";
import { canonicalPathFor } from "@/lib/catalogue";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

export default function Home() {
  const queryResult = api.resource.getAll.useQuery();
  const [state, setState] = useUrlCatalogueState();
  const count = queryResult.data?.length;

  return (
    <>
      <SEO
        title="Improv Games, Exercises & Warm-ups"
        description="ImprovDB is the open-source database for improv games and exercises. Find warm-ups, short form games and long form formats for your next improv class or rehearsal, and share lesson plans with other improv teachers."
        canonical={canonicalPathFor(state)}
      />
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

// Server-rendered (not static) so the canonical tag can follow the query
// string; the CDN cache keeps it about as cheap as the old ISR page.
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=600",
  );

  const ssg = generateSSGHelper();

  await Promise.all([
    ssg.resource.getAll.prefetch(),
    ssg.category.getAll.prefetch(),
  ]);

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
  };
};
