import Head from "next/head";

import { PageLayout } from "@/components/page-layout";
import { ResourceList } from "@/components/resource-list";
import { api } from "@/utils/api";

export default function MyProposedResources() {
  const queryResult = api.resource.getMyProposedResources.useQuery();

  return (
    <>
      <Head>
        <title>My Proposed Resources - ImprovDB</title>
      </Head>
      <PageLayout title="My Proposed Resources" authenticatedOnly>
        <p className="mb-6 leading-7">
          These are resources you have proposed to the community. You can see
          the status of each resource below. Resources that are "Pending
          approval" are still being reviewed by our team.
        </p>
        <ResourceList
          queryResult={queryResult}
          showPublishedStatus
          useFilters
        />
      </PageLayout>
    </>
  );
}
