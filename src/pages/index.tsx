import Link from "next/link";

import { PageLayout } from "@/components/page-layout";
import { ResourceList } from "@/components/resource-list";
import { buttonVariants } from "@/components/ui/button";
import { UserList } from "@/components/user-list";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";

export default function Home() {
  const resourcesQueryResult = api.resource.getLatest.useQuery();
  const topContributorsQueryResult = api.user.getTopContributors.useQuery();

  return (
    <>
      <PageLayout
        title={
          <>
            Welcome to ImprovDB!
            <span className="mt-1 block text-sm font-normal tracking-normal">
              The open-source database for improv games and lesson plans
            </span>
          </>
        }
      >
        <h2 className="scroll-m-20 pb-1 text-3xl font-semibold tracking-tight">
          Recently Updated Resources
        </h2>
        <p className="mb-6 text-sm">
          Improv warm-ups, exercises, short form games, and long form formats{" "}
        </p>
        <ResourceList queryResult={resourcesQueryResult} />
        <Link
          href="/resource/browse"
          className={cn(buttonVariants({ variant: "link" }), "mt-2")}
        >
          Browse all resources
        </Link>
        <h2 className="mb-6 mt-16 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight">
          Top Contributors
        </h2>
        <UserList queryResult={topContributorsQueryResult} />
      </PageLayout>
    </>
  );
}
