import Head from "next/head";

import { PageLayout } from "@/components/page-layout";
import { ResourceList } from "@/components/resource-list";
import { api } from "@/utils/api";

export default function MyFavouriteResources() {
  const queryResult = api.resource.getMyFavouriteResources.useQuery();

  return (
    <>
      <Head>
        <title>My Favourites - ImprovDB</title>
      </Head>
      <PageLayout title="My Favourites" authenticatedOnly>
        <ResourceList queryResult={queryResult} useFilters showFavourites />
      </PageLayout>
    </>
  );
}
