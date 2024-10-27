import Head from "next/head";
import Link from "next/link";

import { PageLayout } from "@/components/page-layout";
import { ResourceList } from "@/components/resource-list";
import { api } from "@/utils/api";

export default function BrowseResources() {
  const queryResult = api.resource.getAll.useQuery();

  return (
    <>
      <Head>
        <title>
          Browse Resources - Find improv games, exercises, and formats on
          ImprovDB - Improv games and lesson plans for teachers and students
        </title>
      </Head>
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
