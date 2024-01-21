import Head from "next/head";
import { PageLayout } from "~/components/PageLayout";

import { api } from "~/utils/api";

import Link from "next/link";
import type { UseTRPCQueryResult } from "@trpc/react-query/shared";
import { LoadingPage } from "~/components/Loading";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ExclamationTriangleIcon, EyeClosedIcon } from "@radix-ui/react-icons";

import type { RouterOutputs } from "~/utils/api";

const LessonPlanList = ({
  filter,
  queryResult,
  noLessonPlansMessage,
  showPrivateStatus = false,
}: {
  queryResult: UseTRPCQueryResult<
    RouterOutputs["lessonPlan"]["getMyLessonPlans"],
    unknown
  >;
  filter?: (
    lessonPlan: RouterOutputs["lessonPlan"]["getMyLessonPlans"][0],
  ) => boolean;
  showPrivateStatus?: boolean;
  noLessonPlansMessage: string;
}) => {
  const { data, isLoading } = queryResult;

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Oh no!</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try reloading the page.
        </AlertDescription>
      </Alert>
    );
  }

  const lessonPlans = !filter ? data : data.filter(filter);

  if (lessonPlans.length === 0) {
    return (
      <Alert>
        <EyeClosedIcon className="h-4 w-4" />
        <AlertTitle>No Lesson Plans found.</AlertTitle>
        <AlertDescription>{noLessonPlansMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {lessonPlans.map((lessonPlan) => (
        <Link
          key={lessonPlan.id}
          className="flex w-full flex-row items-center rounded-lg border bg-background px-4 py-3 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          href={`/lesson-plan/${lessonPlan.id}`}
        >
          <div className="grow">
            <h3 className="font-medium leading-none tracking-tight">
              {lessonPlan.title}
            </h3>
          </div>
          {showPrivateStatus && (
            <Badge>{lessonPlan.private ? "Private" : "Public"}</Badge>
          )}
        </Link>
      ))}
    </div>
  );
};

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
