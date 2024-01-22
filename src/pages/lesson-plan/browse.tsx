import Head from "next/head";
import { useState } from "react";
import { LessonPlanList } from "~/components/LessonPlanList";
import { PageLayout } from "~/components/PageLayout";
import { Input } from "~/components/ui/input";

import { api } from "~/utils/api";

export default function BrowseLessonPlans() {
  const queryResult = api.lessonPlan.getPublic.useQuery();

  const [filter, setFilter] = useState("");

  return (
    <>
      <Head>
        <title>Browse Lesson Plans - ImprovDB</title>
      </Head>
      <PageLayout title="Browse Lesson Plans">
        <Input
          type="text"
          value={filter}
          placeholder="Filter lesson plans..."
          onChange={(e) => {
            setFilter(e.currentTarget.value);
          }}
          className="mb-4"
        />
        <LessonPlanList
          queryResult={queryResult}
          noLessonPlansMessage="Try a different search query."
          filter={(lessonPlan) => {
            return lessonPlan.title
              .toLowerCase()
              .includes(filter?.toLowerCase());
          }}
        />
      </PageLayout>
    </>
  );
}
