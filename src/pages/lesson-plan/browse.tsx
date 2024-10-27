import Head from "next/head";

import { LessonPlanList } from "@/components/lesson-plan-list";
import { PageLayout } from "@/components/page-layout";
import { api } from "@/utils/api";

export default function BrowseLessonPlans() {
  const queryResult = api.lessonPlan.getPublic.useQuery();

  return (
    <>
      <Head>
        <title>
          Browse Lesson Plans - Find improv games, exercises, and formats on
          ImprovDB - Improv games and lesson plans for teachers and students
        </title>
      </Head>
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
