import Head from "next/head";
import { type RouterOutputs, api } from "~/utils/api";

import type { GetStaticProps, NextPage } from "next";
import { PageLayout } from "~/components/PageLayout";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { LoadingPage } from "~/components/Loading";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { Button, buttonVariants } from "~/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
import { useToast } from "~/components/ui/use-toast";
import { SingleLessonPlanComponent } from "~/components/LessonPlan";

const AdminToolbar = ({
  lessonPlan,
}: {
  lessonPlan: RouterOutputs["lessonPlan"]["getById"];
}) => {
  const utils = api.useUtils();
  const router = useRouter();
  const { toast } = useToast();

  const { mutate: setPrivate, isLoading: isSettingPublishedStatus } =
    api.lessonPlan.setPrivate.useMutation({
      onSuccess: () => {
        void utils.lessonPlan.getById.invalidate();
        toast({
          title: "Success!",
          description: "Lesson plan updated.",
        });
      },
      onError: (e) => {
        const errorMessage =
          e.message ??
          e.data?.zodError?.fieldErrors.content?.[0] ??
          "Failed to update lesson plan! Please try again later.";
        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description: errorMessage,
        });
      },
    });

  const { mutate: deleteLessonPlan, isLoading: isDeletingLessonPlan } =
    api.lessonPlan.delete.useMutation({
      onSuccess: () => {
        void router.back();
        toast({
          title: "Success!",
          description: "Lesson plan successfully deleted.",
        });
      },
      onError: (e) => {
        const errorMessage =
          e.message ??
          e.data?.zodError?.fieldErrors.content?.[0] ??
          "Failed to delete lessonPlan! Please try again later.";
        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description: errorMessage,
        });
      },
    });

  return (
    <div className="mt-4 flex w-full items-center gap-2 rounded bg-accent p-2 ">
      <span className="mr-auto pl-2 text-sm font-bold uppercase text-muted-foreground">
        Admin Features
      </span>
      <Link
        href={`/lesson-plan/${lessonPlan.id}/edit`}
        className={buttonVariants({ variant: "default" })}
      >
        Edit
      </Link>
      {lessonPlan.private ? (
        <Button
          onClick={() =>
            setPrivate({
              id: lessonPlan.id,
              private: false,
            })
          }
          disabled={isSettingPublishedStatus}
        >
          Make public
        </Button>
      ) : (
        <Button
          onClick={() =>
            setPrivate({
              id: lessonPlan.id,
              private: true,
            })
          }
          disabled={isSettingPublishedStatus}
        >
          Make private
        </Button>
      )}
      <Button
        onClick={() => deleteLessonPlan({ id: lessonPlan.id })}
        disabled={isDeletingLessonPlan}
        variant="destructive"
      >
        Delete
      </Button>
    </div>
  );
};

export const SingleLessonPlanPage: NextPage<{ lessonPlanId: string }> = ({
  lessonPlanId,
}) => {
  const { data: lessonPlan, isLoading } = api.lessonPlan.getById.useQuery({
    id: lessonPlanId,
  });

  // const { data: session } = useSession();
  // const { user } = session ?? {};

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!lessonPlan) {
    return <div>404</div>;
  }

  return (
    <>
      <Head>
        <title>{`${lessonPlan.title} - ImprovDB`}</title>
      </Head>
      <PageLayout title={lessonPlan.title} className="py-0" showBackButton>
        <AdminToolbar lessonPlan={lessonPlan} />
        <SingleLessonPlanComponent lessonPlan={lessonPlan} />
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

export default SingleLessonPlanPage;
