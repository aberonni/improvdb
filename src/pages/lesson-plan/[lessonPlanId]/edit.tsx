import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import LessonPlanEditForm from "@/components/lesson-plan-edit-form";
import { LoadingPage } from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import { useToast } from "@/components/ui/use-toast";
import { useErrorToast } from "@/hooks/use-error-toast";
import { canEditLessonPlan } from "@/lib/access";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

export const LessonPlanEditPage: NextPage<{ lessonPlanId: string }> = ({
  lessonPlanId,
}) => {
  const { data: lessonPlan, isLoading } = api.lessonPlan.getById.useQuery({
    id: lessonPlanId,
  });

  const { data: session, status: sessionStatus } = useSession();

  const router = useRouter();
  const { toast } = useToast();
  const showError = useErrorToast();

  const { mutate: updateLessonPlan, isPending: isSubmitting } =
    api.lessonPlan.update.useMutation({
      onSuccess: ({ lessonPlan: res }) => {
        void router.push("/lesson-plan/" + res.id);
        toast({
          title: "Success!",
          description: "Lesson plan updated.",
        });
      },
      onError: (e) =>
        showError(e, "Failed to create lessonPlan! Please try again later."),
    });

  if (isLoading || sessionStatus === "loading") {
    return <LoadingPage />;
  }

  if (!lessonPlan || !canEditLessonPlan(session?.user, lessonPlan)) {
    return <div>404</div>;
  }

  return (
    <>
      <Head>
        <title>{`Edit: "${lessonPlan.title}" - ImprovDB`}</title>
      </Head>
      <PageLayout title={`Edit: "${lessonPlan.title}"`} authenticatedOnly>
        <LessonPlanEditForm
          lessonPlan={lessonPlan}
          isSubmitting={isSubmitting}
          onSubmit={(values) => {
            if (isSubmitting) {
              return;
            }
            updateLessonPlan({
              ...values,
              id: lessonPlanId,
            });
          }}
        />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const lessonPlanId = context.params?.lessonPlanId;

  if (typeof lessonPlanId !== "string" || lessonPlanId === "")
    throw new Error("No lessonPlanId");

  await ssg.lessonPlan.getById.prefetch({ id: lessonPlanId });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      lessonPlanId,
    },
  };
};

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default LessonPlanEditPage;
