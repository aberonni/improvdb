import Head from "next/head";
import { useState } from "react";
import { PageLayout } from "~/components/PageLayout";
import { ResourceList } from "~/components/Resource";

import { api } from "~/utils/api";

export default function Home() {
  const queryResult = api.resource.getAll.useQuery();

  const [filter, setFilter] = useState("");

  return (
    <>
      <Head>
        <title>Improverse</title>
      </Head>
      <PageLayout>
        <input
          type="text"
          value={filter}
          placeholder="Filter resources..."
          onChange={(e) => {
            setFilter(e.currentTarget.value);
          }}
          className="mb-4 w-full rounded-sm  border border-slate-300 px-4 py-3"
        />
        <ResourceList
          queryResult={queryResult}
          filter={(resource) => {
            return resource.title.toLowerCase().includes(filter?.toLowerCase());
          }}
        />
      </PageLayout>
    </>
  );
}
