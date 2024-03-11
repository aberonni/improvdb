import Head from "next/head";

import { LessonPlanList } from "@/components/lesson-plan-list";
import { PageLayout } from "@/components/page-layout";
import { api } from "@/utils/api";

export default function MyLessonPlansPage() {
  const queryResult = api.lessonPlan.getMyLessonPlans.useQuery();

  return (
    <>
      <Head>
        <title>My Lesson Plans - ImprovDB</title>
      </Head>
      <PageLayout title="My Lesson Plans" authenticatedOnly>
        <LessonPlanList queryResult={queryResult} showVisibility />
      </PageLayout>
    </>
  );
}
