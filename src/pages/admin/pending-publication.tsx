import { UserRole } from "@prisma/client";
import Head from "next/head";
import { PageLayout } from "~/components/PageLayout";
import { ResourceList } from "~/components/ResourceList";

import { api } from "~/utils/api";

export default function MyContributions() {
  const queryResult = api.resource.getPendingPublication.useQuery();

  return (
    <>
      <Head>
        <title>Pending Publication - ImprovDB</title>
      </Head>
      <PageLayout
        title="Pending Publication"
        authenticatedOnly={[UserRole.ADMIN]}
      >
        <ResourceList queryResult={queryResult} useFilters showEditProposals />
      </PageLayout>
    </>
  );
}
