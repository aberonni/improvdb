import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import { LoadingPage } from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import { SingleResourceComponent } from "@/components/resource";
import { ResourceSEO } from "@/components/seo";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useErrorToast } from "@/hooks/use-error-toast";
import { isAdmin } from "@/lib/access";
import { typeLandingPage } from "@/lib/landing-page";
import { resourceState } from "@/lib/resource";
import { prefetchSiteFooter } from "@/server/helpers/siteFooterProps";
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
  const showError = useErrorToast();

  const { mutate: setPublished, isPending: isSettingPublishedStatus } =
    api.resource.setPublished.useMutation({
      onSuccess: () => {
        void utils.resource.getById.invalidate();
        toast({
          title: "Success!",
          description: `"${resource.title}" updated.`,
        });
      },
      onError: (e) =>
        showError(e, "Failed to update resource! Please try again later."),
    });

  const { mutate: deleteResource, isPending: isDeletingResource } =
    api.resource.delete.useMutation({
      onSuccess: () => {
        void router.back();
        toast({
          title: "Success!",
          description: `"${resource.title}" deleted.`,
        });
      },
      onError: (e) =>
        showError(e, "Failed to delete resource! Please try again later."),
    });

  return (
    <div className="mt-4 flex w-full items-center gap-2 rounded-md bg-accent p-2">
      <span className="mr-auto pl-2 text-sm font-bold uppercase text-muted-foreground">
        Admin Features
      </span>
      {resourceState(resource) === "EDIT_PROPOSAL" ? (
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
      <ResourceSEO
        title={resource.title}
        description={resource.description}
        type={resource.type}
        id={resource.id}
        categories={resource.categories.map((c) => c.category.name)}
      />
      <PageLayout
        title={resource.title}
        className="py-0"
        showBackButton
        breadcrumbs={[
          { name: "Home", href: "/" },
          {
            name: typeLandingPage(resource.type).name,
            href: typeLandingPage(resource.type).path,
          },
          { name: resource.title },
        ]}
      >
        {isAdmin(user) && <AdminToolbar resource={resource} />}
        <SingleResourceComponent
          resource={resource}
          showProposeChanges={resourceState(resource) !== "EDIT_PROPOSAL"}
        />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string" || id === "") throw new Error("No id");

  await Promise.all([
    ssg.resource.getById.prefetch({ id }),
    prefetchSiteFooter(ssg),
  ]);

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
    revalidate: 3600, // Revalidate every hour
  };
};

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default SingleResourcePage;
