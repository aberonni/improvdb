import Head from "next/head";
import { LessonPlanList } from "~/components/LessonPlanList";
import { PageLayout } from "~/components/PageLayout";

import { api } from "~/utils/api";

export default function MyLessonPlansPage() {
  const queryResult = api.lessonPlan.getMyLessonPlans.useQuery();

  return (
    <>
      <Head>
        <title>My Lesson Plans - ImprovDB</title>
      </Head>
      <PageLayout title="My Lesson Plans">
        <LessonPlanList
          noLessonPlansMessage="You must create Lesson Plans before they can show up here."
          queryResult={queryResult}
          showPrivateStatus
        />
      </PageLayout>
    </>
  );
}
