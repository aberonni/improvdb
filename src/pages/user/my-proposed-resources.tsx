import Head from "next/head";
import { useState, useMemo } from "react";

import { PageLayout } from "@/components/page-layout";
import { ResourceList } from "@/components/resource-list";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";

enum TABS {
  SUBMITTED,
  DRAFT,
}

export default function MyProposedResources() {
  const [activeTab, updateActiveTab] = useState<TABS>(TABS.SUBMITTED);

  const drafts = api.resource.getMyDraftResources.useQuery();
  const submitted = api.resource.getMyProposedResources.useQuery();

  const activeResources = activeTab === TABS.DRAFT ? drafts : submitted;

  const onChangeResourceView = (type: TABS) => updateActiveTab(type);

  const chooseButtonVariant = (active: boolean) =>
    active ? "default" : "secondary";

  return (
    <>
      <Head>
        <title>My Proposed Resources - ImprovDB</title>
      </Head>
      <PageLayout title="My Proposed Resources">
        <div className="mb-4 mt-4 flex flex-1 items-center space-x-2">
          <Button
            variant={chooseButtonVariant(activeTab === TABS.SUBMITTED)}
            onClick={() => onChangeResourceView(TABS.SUBMITTED)}
          >
            Submitted
          </Button>
          <Button
            variant={chooseButtonVariant(activeTab === TABS.DRAFT)}
            onClick={() => onChangeResourceView(TABS.DRAFT)}
          >
            Drafts
          </Button>
        </div>
        <p className="mb-6 leading-7">
          {activeTab === TABS.DRAFT
            ? "These resources are not visible to anyone but you. Publish them to get admin approval."
            : 'These are resources you have proposed to the community. You can see the status of each resource below. Resources that are "Pending approval" are still being reviewed by our team.'}
        </p>

        <ResourceList
          queryResult={activeResources}
          showPublishedStatus={activeTab === TABS.SUBMITTED}
          useFilters
        />
      </PageLayout>
    </>
  );
}
