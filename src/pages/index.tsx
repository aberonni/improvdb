import type { GetStaticProps } from "next";
import Link from "next/link";

import { PageLayout } from "@/components/page-layout";
import { ResourceList } from "@/components/resource-list";
import { SEO } from "@/components/seo";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

export default function Home() {
  const queryResult = api.resource.getAll.useQuery();
  const count = queryResult.data?.length;

  return (
    <>
      <SEO
        title="Improv Games, Exercises & Warm-ups"
        description="ImprovDB is the open-source database for improv games and exercises. Find warm-ups, short form games and long form formats for your next improv class or rehearsal, and share lesson plans with other improv teachers."
        canonical="/"
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
        <ResourceList queryResult={queryResult} useFilters showFavourites />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          See something missing? You can{" "}
          <Link href="/resource/create" className="underline">
            propose a new resource.
          </Link>
        </p>
      </PageLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper();

  await ssg.resource.getAll.prefetch();

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 60, // Revalidate every 60 seconds
  };
};
