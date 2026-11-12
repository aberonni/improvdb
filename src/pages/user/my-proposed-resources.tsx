import Head from "next/head";

import { PageLayout } from "@/components/page-layout";
import { ResourceList } from "@/components/resource-list";
import { api } from "@/utils/api";

export default function MyProposedResources() {
  const queryResult = api.resource.getMyProposedResources.useQuery();

  return (
    <>
      <Head>
        <title>My Proposals - ImprovDB</title>
      </Head>
      <PageLayout title="My Proposals" authenticatedOnly>
        <p className="mb-6 leading-7">
          These are the games and exercises you have proposed to the community,
          and their status. Those that are "Pending approval" are still being
          reviewed by our team.
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
