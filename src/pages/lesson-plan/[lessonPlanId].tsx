import Head from "next/head";
import { type RouterOutputs, api } from "~/utils/api";

import type { GetStaticProps, NextPage } from "next";
import { PageLayout } from "~/components/PageLayout";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { LoadingPage } from "~/components/Loading";
import { Button, buttonVariants } from "~/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
import { useToast } from "~/components/ui/use-toast";
import { SingleLessonPlanComponent } from "~/components/LessonPlan";
import { useMemo, useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { useSession } from "next-auth/react";

const AdminToolbar = ({
  lessonPlan,
  showResourceDescriptions,
  setShowResourceDescriptions,
  isOwner,
}: {
  lessonPlan: RouterOutputs["lessonPlan"]["getById"];
  isOwner: boolean;
  showResourceDescriptions: boolean;
  setShowResourceDescriptions: (show: boolean) => void;
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
    <div className="mt-4 flex w-full flex-col items-stretch gap-2 space-y-2 rounded bg-accent px-4 py-2 print:hidden md:flex-row md:items-center md:space-y-0">
      <Button onClick={() => window.print()} className="md:order-2">
        Print / Download
      </Button>
      {isOwner && (
        <>
          <Link
            href={`/lesson-plan/${lessonPlan.id}/edit`}
            className={cn(buttonVariants({ variant: "default" }), "md:order-3")}
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
              className="md:order-4"
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
              className="md:order-5"
            >
              Make private
            </Button>
          )}
          <Button
            onClick={() => deleteLessonPlan({ id: lessonPlan.id })}
            disabled={isDeletingLessonPlan}
            variant="destructive"
            className="md:order-6"
          >
            Delete
          </Button>
        </>
      )}
      <div className="mr-auto flex items-center py-2 md:order-1 md:py-0">
        <Checkbox
          id="showResourceDescriptions"
          checked={showResourceDescriptions}
          onCheckedChange={(e) =>
            setShowResourceDescriptions(Boolean(e.valueOf()))
          }
        />
        <label
          htmlFor="showResourceDescriptions"
          className="cursor-pointer select-none pl-2 text-sm font-medium leading-none"
        >
          Show Resource Descriptions
        </label>
      </div>
    </div>
  );
};

export const SingleLessonPlanPage: NextPage<{ lessonPlanId: string }> = ({
  lessonPlanId,
}) => {
  const { data: lessonPlan, isLoading } = api.lessonPlan.getById.useQuery({
    id: lessonPlanId,
  });

  const [showResourceDescriptions, setShowResourceDescriptions] =
    useState(false);

  const { data: session } = useSession();
  const { user } = session ?? {};

  const isOwner = useMemo(() => {
    return user?.id === lessonPlan?.createdById;
  }, [user, lessonPlan]);

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
      <PageLayout
        title={
          <div className="flex flex-col items-start space-y-2">
            <Badge variant="secondary" className="print:hidden">
              {lessonPlan.private ? "Private" : "Public"}
            </Badge>
            <span>{lessonPlan.title}</span>
          </div>
        }
        className="space-y-4 pt-0"
        showBackButton
      >
        <AdminToolbar
          lessonPlan={lessonPlan}
          showResourceDescriptions={showResourceDescriptions}
          setShowResourceDescriptions={setShowResourceDescriptions}
          isOwner={isOwner}
        />
        <SingleLessonPlanComponent
          lessonPlan={lessonPlan}
          showResourceDescriptions={showResourceDescriptions}
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

export default SingleLessonPlanPage;
