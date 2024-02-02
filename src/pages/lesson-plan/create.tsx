import Head from "next/head";
import { useRouter } from "next/router";

import LessonPlanEditForm from "@/components/lesson-plan-edit-form";
import { PageLayout } from "@/components/page-layout";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";

export default function Create() {
  const router = useRouter();
  const { toast } = useToast();

  const { mutate: createLessonPlan, isLoading: isSubmitting } =
    api.lessonPlan.create.useMutation({
      onSuccess: ({ lessonPlan: lp }) => {
        void router.push("/lesson-plan/" + lp.id);
      },
      onError: (e) => {
        const errorMessage =
          e.message ??
          e.data?.zodError?.fieldErrors.content?.[0] ??
          "Failed to create lesson plan! Please try again later.";

        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description: errorMessage,
        });
      },
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
