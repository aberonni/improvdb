import Head from "next/head";
import { PageLayout } from "~/components/PageLayout";
import { ResourceList } from "~/components/Resource";

import { api } from "~/utils/api";

export default function MyResources() {
  const queryResult = api.resource.getMyResources.useQuery();

  return (
    <>
      <Head>
        <title>My Resource - ImprovDB</title>
      </Head>
      <PageLayout>
        <ResourceList queryResult={queryResult} showPublishedStatus />
      </PageLayout>
    </>
  );
}
