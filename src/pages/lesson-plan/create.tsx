import Head from "next/head";
import { useRouter } from "next/router";

import LessonPlanEditForm from "@/components/lesson-plan-edit-form";
import { PageLayout } from "@/components/page-layout";
import { useErrorToast } from "@/hooks/use-error-toast";
import { api } from "@/utils/api";

export default function Create() {
  const router = useRouter();
  const showError = useErrorToast();

  const { mutate: createLessonPlan, isPending: isSubmitting } =
    api.lessonPlan.create.useMutation({
      onSuccess: ({ lessonPlan: lp }) => {
        void router.push("/lesson-plan/" + lp.id);
      },
      onError: (e) =>
        showError(e, "Failed to create lesson plan! Please try again later."),
    });

  return (
    <>
      <Head>
        <title>Create Lesson Plan - ImprovDB</title>
      </Head>
      <PageLayout title="Create Lesson Plan" authenticatedOnly>
        <LessonPlanEditForm
          onSubmit={(values) => {
            if (isSubmitting) {
              return;
            }
            createLessonPlan(values);
          }}
          isSubmitting={isSubmitting}
        />
      </PageLayout>
    </>
  );
}
