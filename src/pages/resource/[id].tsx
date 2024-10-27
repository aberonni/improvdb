import { UserRole } from "@prisma/client";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import { LoadingPage } from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import {
  ResourceTypeLabels,
  SingleResourceComponent,
} from "@/components/resource";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { type RouterOutputs, api } from "@/utils/api";

const AdminToolbar = ({
  resource,
}: {
  resource: RouterOutputs["resource"]["getById"];
}) => {
  const utils = api.useUtils();
  const router = useRouter();
  const { toast } = useToast();

  const { mutate: setPublished, isLoading: isSettingPublishedStatus } =
    api.resource.setPublished.useMutation({
      onSuccess: () => {
        void utils.resource.getById.invalidate();
        toast({
          title: "Success!",
          description: "Resource updated.",
        });
      },
      onError: (e) => {
        const errorMessage =
          e.message ??
          e.data?.zodError?.fieldErrors.content?.[0] ??
          "Failed to update resource! Please try again later.";
        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description: errorMessage,
        });
      },
    });

  const { mutate: deleteResource, isLoading: isDeletingResource } =
    api.resource.delete.useMutation({
      onSuccess: () => {
        void router.back();
        toast({
          title: "Success!",
          description: "Resource successfully deleted.",
        });
      },
      onError: (e) => {
        const errorMessage =
          e.message ??
          e.data?.zodError?.fieldErrors.content?.[0] ??
          "Failed to delete resource! Please try again later.";
        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description: errorMessage,
        });
      },
    });

  return (
    <div className="mt-4 flex w-full items-center gap-2 rounded-md bg-accent p-2">
      <span className="mr-auto pl-2 text-sm font-bold uppercase text-muted-foreground">
        Admin Features
      </span>
      {resource.editProposalOriginalResourceId ? (
        <>
          <Link
            href={`/resource/${resource.editProposalOriginalResourceId}/`}
            className={buttonVariants({ variant: "outline" })}
            target="_blank"
          >
            View original resource
          </Link>
          <Link
            href={`/resource/${resource.id}/edit`}
            className={buttonVariants({ variant: "default" })}
          >
            Review Proposal
          </Link>
        </>
      ) : (
        <>
          <Link
            href={`/resource/${resource.id}/edit`}
            className={buttonVariants({ variant: "default" })}
          >
            Edit
          </Link>
          {resource.published ? (
            <Button
              onClick={() =>
                setPublished({
                  id: resource.id,
                  published: false,
                })
              }
              disabled={isSettingPublishedStatus}
            >
              Un-publish
            </Button>
          ) : (
            <Button
              onClick={() =>
                setPublished({
                  id: resource.id,
                  published: true,
                })
              }
              disabled={isSettingPublishedStatus}
            >
              Publish
            </Button>
          )}
        </>
      )}

      <Button
        onClick={() => deleteResource({ id: resource.id })}
        disabled={isDeletingResource}
        variant="destructive"
      >
        Delete
      </Button>
    </div>
  );
};

export const SingleResourcePage: NextPage<{ id: string }> = ({ id }) => {
  const { data: resource, isLoading } = api.resource.getById.useQuery({
    id,
  });

  const { data: session } = useSession();
  const { user } = session ?? {};

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!resource) {
    return <div>404</div>;
  }

  return (
    <>
      <Head>
        <title>{`${resource.title} - ImprovDB`}</title>
      </Head>
      <Head>
        <title>{`${resource.title} - ${ResourceTypeLabels[resource.type]} on ImprovDB - Find improv games, exercises, and formats on ImprovDB - Improv games and lesson plans for teachers and students`}</title>
        <meta
          name="description"
          content={
            resource.description ??
            `ImprovDB is the open-source database for improv games and lesson plans. Whether you're a teacher or a student, you'll find everything you need here: from warm-up exercises to short form games to long form formats, we've got you covered.`
          }
          key="desc"
        />
      </Head>
      <PageLayout title={resource.title} className="py-0" showBackButton>
        {user?.role === UserRole.ADMIN && <AdminToolbar resource={resource} />}
        <SingleResourceComponent
          resource={resource}
          showProposeChanges={!resource.editProposalOriginalResourceId}
        />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string" || id === "") throw new Error("No id");

  await ssg.resource.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default SingleResourcePage;
