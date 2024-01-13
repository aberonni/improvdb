import Head from "next/head";
import { PageLayout } from "~/components/PageLayout";
import { ResourceList } from "~/components/ResourceList";

import { api } from "~/utils/api";

export default function MyContributions() {
  const queryResult = api.resource.getMyContributions.useQuery();

  return (
    <>
      <Head>
        <title>My Contributions - ImprovDB</title>
      </Head>
      <PageLayout title="My Contributions">
        <ResourceList
          noResourcesMessage="You must create resources before they can show up here."
          queryResult={queryResult}
          showPublishedStatus
        />
      </PageLayout>
    </>
  );
}
