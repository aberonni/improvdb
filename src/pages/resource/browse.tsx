import Head from "next/head";
import Link from "next/link";
import { PageLayout } from "~/components/PageLayout";
import { ResourceList } from "~/components/ResourceList";

import { api } from "~/utils/api";

export default function BrowseResources() {
  const queryResult = api.resource.getAll.useQuery();

  return (
    <>
      <Head>
        <title>Browse Resources - ImprovDB</title>
      </Head>
      <PageLayout title="Browse Resources">
        <ResourceList queryResult={queryResult} useFilters />
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
