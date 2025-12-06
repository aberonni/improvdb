import type { GetStaticProps } from "next";
import Link from "next/link";

import { PageLayout } from "@/components/page-layout";
import { ResourceList } from "@/components/resource-list";
import { SEO } from "@/components/seo";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

export default function BrowseResources() {
  const queryResult = api.resource.getAll.useQuery();

  return (
    <>
      <SEO
        title="Browse Improv Resources"
        description="Browse our collection of improv warm-ups, exercises, short form games, and long form formats. Find the perfect activity for your next improv class or rehearsal."
        canonical="/resource/browse"
      />
      <PageLayout
        title={
          <>
            Browse Resources
            <span className="mt-1 block text-sm font-normal tracking-normal">
              Find improv exercises and warm-ups, short form games, and long
              form formats
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
