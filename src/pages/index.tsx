import Head from "next/head";
import Link from "next/link";
import { LessonPlanList } from "~/components/LessonPlanList";
import { PageLayout } from "~/components/PageLayout";
import { ResourceList } from "~/components/ResourceList";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

export default function Home() {
  const resourcesQueryResult = api.resource.getLatest.useQuery();
  const lessonPlansQueryResult = api.lessonPlan.getPublic.useQuery({ take: 5 });

  return (
    <>
      <Head>
        <title>ImprovDB</title>
      </Head>
      <PageLayout
        title={
          <>
            Welcome to ImprovDB!
            <span className="block text-sm font-normal tracking-normal">
              Your new home for everything improv
            </span>
          </>
        }
      >
        <h2 className="mb-6 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight">
          Recently Updated Resources
        </h2>
        <ResourceList queryResult={resourcesQueryResult} />
        <Link
          href="/resource/browse"
          className={cn(buttonVariants({ variant: "link" }), " mt-2")}
        >
          Browse all resources
        </Link>
        <h2 className="mb-6 mt-16 scroll-m-20 pb-2 text-3xl font-semibold tracking-tight">
          Recently Published Lesson Plans
        </h2>
        <LessonPlanList queryResult={lessonPlansQueryResult} />
        <Link
          href="/lesson-plan/browse"
          className={cn(buttonVariants({ variant: "link" }), " mt-2")}
        >
          Browse all public lesson plans
        </Link>
      </PageLayout>
    </>
  );
}
