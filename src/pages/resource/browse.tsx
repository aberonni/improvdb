import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { PageLayout } from "~/components/PageLayout";
import { ResourceList } from "~/components/ResourceList";
import { Input } from "~/components/ui/input";

import { api } from "~/utils/api";

export default function BrowseResources() {
  const queryResult = api.resource.getAll.useQuery();

  const [filter, setFilter] = useState("");

  return (
    <>
      <Head>
        <title>Browse Resources - ImprovDB</title>
      </Head>
      <PageLayout title="Browse Resources">
        <Input
          type="text"
          value={filter}
          placeholder="Filter resources..."
          onChange={(e) => {
            setFilter(e.currentTarget.value);
          }}
          className="mb-4"
        />
        <ResourceList
          queryResult={queryResult}
          noResourcesMessage="Try a different search query."
          filter={(resource) => {
            return resource.title.toLowerCase().includes(filter?.toLowerCase());
          }}
        />
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
