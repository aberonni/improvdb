import type { GetStaticProps } from "next";

import { LessonPlanList } from "@/components/lesson-plan-list";
import { PageLayout } from "@/components/page-layout";
import { SEO } from "@/components/seo";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

export default function BrowseLessonPlans() {
  const queryResult = api.lessonPlan.getPublic.useQuery();

  return (
    <>
      <SEO
        title="Browse Improv Lesson Plans"
        description="Discover improv lesson plans created by teachers and performers. Find structured lesson plans for teaching improvisation, from beginner to advanced levels."
        canonical="/lesson-plan/browse"
      />
      <PageLayout
        title={
          <>
            Browse Lesson Plans
            <span className="mt-1 block text-sm font-normal tracking-normal">
              Find improv exercises and warm-ups, short form games, and long
              form formats
            </span>
          </>
        }
      >
        <LessonPlanList queryResult={queryResult} useFilters />
      </PageLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper();

  await ssg.lessonPlan.getPublic.prefetch();

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 60,
  };
};
