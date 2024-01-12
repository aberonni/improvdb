import Head from "next/head";
import { useState } from "react";
import { PageLayout } from "~/components/PageLayout";
import { ResourceList } from "~/components/ResourceList";
import { Input } from "~/components/ui/input";

import { api } from "~/utils/api";

export default function Home() {
  const queryResult = api.resource.getAll.useQuery();

  const [filter, setFilter] = useState("");

  return (
    <>
      <Head>
        <title>ImprovDB</title>
      </Head>
      <PageLayout>
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
      </PageLayout>
    </>
  );
}
