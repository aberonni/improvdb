import type { GetStaticProps } from "next";
import Link from "next/link";

import { PageLayout } from "@/components/page-layout";
import { ResourceList } from "@/components/resource-list";
import { SEO } from "@/components/seo";
import { buttonVariants } from "@/components/ui/button";
import { UserList } from "@/components/user-list";
import { cn } from "@/lib/utils";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

export default function Home() {
  const resourcesQueryResult = api.resource.getLatest.useQuery();
  const topContributorsQueryResult = api.user.getTopContributors.useQuery();

  return (
    <>
      <SEO
        title="Improv Games, Exercises & Lesson Plans"
        description="ImprovDB is the open-source database for improv games and lesson plans. Find warm-up exercises, short form games, long form formats, and share lesson plans with other improv teachers."
        canonical="/"
      />
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

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper();

  await Promise.all([
    ssg.resource.getLatest.prefetch(),
    ssg.user.getTopContributors.prefetch(),
  ]);

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 60, // Revalidate every 60 seconds
  };
};
