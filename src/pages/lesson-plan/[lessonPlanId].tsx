import { DownloadIcon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";

import {
  LessonPlanVisibilityLabels,
  SingleLessonPlanComponent,
} from "@/components/lesson-plan";
import { LessonPlanSharePopover } from "@/components/lesson-plan-share-popover";
import { LoadingPage } from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { type RouterOutputs, api } from "@/utils/api";

const AdminToolbar = ({
  lessonPlan,
  showAllResourceDescriptions,
  setShowAllResourceDescriptions,
  isOwner,
}: {
  lessonPlan: RouterOutputs["lessonPlan"]["getById"];
  isOwner: boolean;
  showAllResourceDescriptions: boolean;
  setShowAllResourceDescriptions: (show: boolean) => void;
}) => {
  const router = useRouter();
  const { toast } = useToast();

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
    <div className="mt-4 flex w-full flex-col items-stretch gap-2 py-2 md:flex-row md:items-center md:rounded-md md:bg-accent md:px-4 print:hidden">
      <div className="shrink-0 space-y-2 md:order-1 md:space-x-2 md:space-y-0 [&>*]:w-full [&>*]:md:w-auto">
        <Button onClick={() => window.print()}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Print / Download
        </Button>
        {isOwner && (
          <>
            <Link
              href={`/lesson-plan/${lessonPlan.id}/edit`}
              className={buttonVariants({ variant: "default" })}
            >
              <Pencil2Icon className="mr-2 h-4 w-4" />
              Edit
            </Link>
            <LessonPlanSharePopover
              lessonPlanId={lessonPlan.id}
              visibility={lessonPlan.visibility}
            />
            <Button
              onClick={() => deleteLessonPlan({ id: lessonPlan.id })}
              disabled={isDeletingLessonPlan}
              variant="destructive"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </>
        )}
      </div>
      <div className="mt-4 flex w-full items-center rounded-md bg-accent p-4 md:mt-0 md:p-0">
        <Checkbox
          id="showAllResourceDescriptions"
          checked={showAllResourceDescriptions}
          onCheckedChange={(e) =>
            setShowAllResourceDescriptions(Boolean(e.valueOf()))
          }
        />
        <label
          htmlFor="showAllResourceDescriptions"
          className="cursor-pointer select-none pl-2 text-sm font-medium leading-none"
        >
          Show All Resource Descriptions
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

  const [showAllResourceDescriptions, setShowAllResourceDescriptions] =
    useState(false);

  const { data: session } = useSession();
  const { user } = session ?? {};

  const isOwner = useMemo(() => {
    return user?.id === lessonPlan?.createdById;
  }, [user, lessonPlan]);

  const creator = useMemo(() => {
    if (!lessonPlan?.createdBy.name && lessonPlan?.createdBy.name === "")
      return "Unnamed User";
    return lessonPlan?.createdBy.name;
  }, [lessonPlan]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!lessonPlan) {
    return <div>404</div>;
  }

  return (
    <>
      <Head>
        <title>{`${lessonPlan.title} Lesson Plan - ImprovDB - Find improv games, exercises, and formats on ImprovDB - Improv games and lesson plans for teachers and students`}</title>
        <meta
          name="description"
          content={
            lessonPlan.description ??
            `ImprovDB is the open-source database for improv games and lesson plans. Whether you're a teacher or a student, you'll find everything you need here: from warm-up exercises to short form games to long form formats, we've got you covered.`
          }
          key="desc"
        />
      </Head>
      <PageLayout
        title={
          <div className="flex flex-col items-start space-y-2">
            <Badge variant="secondary" className="print:hidden">
              {LessonPlanVisibilityLabels[lessonPlan.visibility].label}
            </Badge>
            <span>{lessonPlan.title}</span>
            <span className="mt-1 block text-sm font-normal tracking-normal">
              Created by: {creator}
            </span>
          </div>
        }
        className="space-y-4 pt-0"
        showBackButton
      >
        <AdminToolbar
          lessonPlan={lessonPlan}
          showAllResourceDescriptions={showAllResourceDescriptions}
          setShowAllResourceDescriptions={setShowAllResourceDescriptions}
          isOwner={isOwner}
        />
        <SingleLessonPlanComponent
          lessonPlan={lessonPlan}
          showAllResourceDescriptions={showAllResourceDescriptions}
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
