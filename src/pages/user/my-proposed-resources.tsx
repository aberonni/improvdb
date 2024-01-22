import Head from "next/head";
import { PageLayout } from "~/components/PageLayout";
import { ResourceList } from "~/components/ResourceList";

import { api } from "~/utils/api";

export default function MyProposedResources() {
  const queryResult = api.resource.getMyProposedResources.useQuery();

  return (
    <>
      <Head>
        <title>My Proposed Resources - ImprovDB</title>
      </Head>
      <PageLayout title="My Proposed Resources">
        <p className="mb-6 leading-7">
          These are resources you have proposed to the community. You can see
          the status of each resource below. Resources that are "Pending
          approval" are still being reviewed by our team.
        </p>
        <ResourceList
          noResourcesMessage="You must create resources before they can show up here."
          queryResult={queryResult}
          showPublishedStatus
        />
      </PageLayout>
    </>
  );
}
