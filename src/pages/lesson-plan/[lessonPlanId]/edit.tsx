import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import LessonPlanEditForm from "@/components/lesson-plan-edit-form";
import { LoadingPage } from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import { useToast } from "@/components/ui/use-toast";
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

  const { mutate: updateLessonPlan, isLoading: isSubmitting } =
    api.lessonPlan.update.useMutation({
      onSuccess: ({ lessonPlan: res }) => {
        void router.push("/lesson-plan/" + res.id);
        toast({
          title: "Success!",
          description: "Lesson plan updated.",
        });
      },
      onError: (e) => {
        if (e.data?.code === "CONFLICT") {
          toast({
            title: "Uh oh! Something went wrong.",
            variant: "destructive",
            description:
              "A lessonPlan already exists at this URL. Please choose a new URL.",
          });
          return;
        }

        const errorMessage =
          e.message ?? e.data?.zodError?.fieldErrors.content?.[0];

        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description:
            errorMessage ??
            "Failed to create lessonPlan! Please try again later.",
        });
      },
    });

  if (isLoading || sessionStatus === "loading") {
    return <LoadingPage />;
  }

  if (!lessonPlan || lessonPlan.createdById !== session?.user?.id) {
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
