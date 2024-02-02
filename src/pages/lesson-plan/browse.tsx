import Head from "next/head";

import { LessonPlanList } from "@/components/lesson-plan-list";
import { PageLayout } from "@/components/page-layout";
import { api } from "@/utils/api";

export default function BrowseLessonPlans() {
  const queryResult = api.lessonPlan.getPublic.useQuery();

  return (
    <>
      <Head>
        <title>Browse Lesson Plans - ImprovDB</title>
      </Head>
      <PageLayout title="Browse Lesson Plans">
        <LessonPlanList queryResult={queryResult} useFilters />
      </PageLayout>
    </>
  );
}
