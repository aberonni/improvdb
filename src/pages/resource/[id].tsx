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
import { TYPE_LANDING_PAGES } from "@/lib/catalogue";
import { ResourceState, stateOf } from "@/lib/resource-state";
import { prefetchSiteFooter } from "@/server/helpers/siteFooterProps";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { type RouterOutputs, api, PRE_BUILT_STALE_TIME } from "@/utils/api";

const AdminToolbar = ({
  resource,
}: {
  resource: RouterOutputs["resource"]["getById"];
}) => {
  const utils = api.useUtils();
  const router = useRouter();
  const { toast } = useToast();
  const showError = useErrorToast();

  const updated = {
    onSuccess: () => {
      void utils.resource.getById.invalidate();
      toast({
        title: "Success!",
        description: `"${resource.title}" updated.`,
      });
    },
    onError: (e: Parameters<typeof showError>[0]) =>
      showError(e, "Failed to update resource! Please try again later."),
  };
  const publish = api.resource.publish.useMutation(updated);
  const unpublish = api.resource.unpublish.useMutation(updated);

  const deleteResource = api.resource.delete.useMutation({
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

  const reject = api.resource.reject.useMutation({
    onSuccess: () => {
      void router.push(`/resource/${resource.editProposalOriginalResourceId}`);
      toast({
        title: "Success!",
        description: "The Edit Proposal has been rejected.",
      });
    },
    onError: (e) =>
      showError(e, "Failed to reject the proposal! Please try again later."),
  });

  const state = stateOf(resource);

  return (
    <div className="mt-4 flex w-full items-center gap-2 rounded-md bg-accent p-2">
      <span className="mr-auto pl-2 text-sm font-bold uppercase text-muted-foreground">
        Admin Features
      </span>
      {state === ResourceState.EDIT_PROPOSAL ? (
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
          <Button
            onClick={() => {
              const reason = window.prompt(
                "Why is this edit not being accepted? (optional)",
              );
              if (reason === null) return;
              reject.mutate({ id: resource.id, reason: reason.trim() });
            }}
            disabled={reject.isPending}
            variant="destructive"
          >
            Reject
          </Button>
        </>
      ) : (
        <>
          <Link
            href={`/resource/${resource.id}/edit`}
            className={buttonVariants({ variant: "default" })}
          >
            Edit
          </Link>
          {state === ResourceState.PUBLISHED ? (
            <Button
              onClick={() => unpublish.mutate({ id: resource.id })}
              disabled={unpublish.isPending}
            >
              Un-publish
            </Button>
          ) : (
            <Button
              onClick={() => publish.mutate({ id: resource.id })}
              disabled={publish.isPending}
            >
              Publish
            </Button>
          )}
          <Button
            onClick={() => deleteResource.mutate({ id: resource.id })}
            disabled={deleteResource.isPending}
            variant="destructive"
          >
            Delete
          </Button>
        </>
      )}
    </div>
  );
};

export const SingleResourcePage: NextPage<{ id: string }> = ({ id }) => {
  const { data: resource, isLoading } = api.resource.getById.useQuery(
    { id },
    { staleTime: PRE_BUILT_STALE_TIME },
  );

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
            name: TYPE_LANDING_PAGES[resource.type].name,
            href: TYPE_LANDING_PAGES[resource.type].path,
          },
          { name: resource.title },
        ]}
      >
        {isAdmin(user) && <AdminToolbar resource={resource} />}
        <SingleResourceComponent
          resource={resource}
          showProposeChanges={stateOf(resource) !== ResourceState.EDIT_PROPOSAL}
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
    // Every write to a Resource rebuilds this page at once (see `pagesShowing`
    // in the Resource lifecycle module), so this is only a safety net. Crawlers
    // visit every Resource page, and each hourly rebuild was billed as an ISR
    // write on Vercel.
    revalidate: 24 * 60 * 60,
  };
};

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default SingleResourcePage;
