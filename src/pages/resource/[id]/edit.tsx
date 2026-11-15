import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import { LoadingPage } from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import ResourceEditForm from "@/components/resource-edit-form";
import { useToast } from "@/components/ui/use-toast";
import { useErrorToast } from "@/hooks/use-error-toast";
import { isAdmin as isAdminUser } from "@/lib/access";
import { ResourceState, stateOf } from "@/lib/resource-state";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

const SAVED_MESSAGES = {
  edited: "Your changes have been saved.",
  proposed: "Your proposed changes have been sent for review.",
  accepted: "The Edit Proposal has been accepted.",
} as const;

export const ResourceEditPage: NextPage<{ id: string }> = ({ id }) => {
  const { data: resource, isLoading: isLoadingResource } =
    api.resource.getById.useQuery({
      id,
    });

  const { data: session, status } = useSession();
  const isAdmin = isAdminUser(session?.user);

  const router = useRouter();
  const utils = api.useUtils();
  const { toast } = useToast();
  const showError = useErrorToast();

  const { mutate: save, isPending: isSubmitting } =
    api.resource.save.useMutation({
      onSuccess: async ({ resource: saved, outcome }) => {
        toast({ title: "Success!", description: SAVED_MESSAGES[outcome] });
        if (outcome === "proposed") {
          void router.push("/user/my-proposed-resources");
          return;
        }
        // Saving rebuilt the Resource's page, but this browser may have
        // prefetched the old one (a link to it was on screen); fresher data
        // in the cache wins over the page's when it loads
        await utils.resource.getById.fetch({ id: saved.id }, { staleTime: 0 });
        void router.push(`/resource/${saved.id}`);
      },
      onError: (e) =>
        showError(e, "Failed to save your changes! Please try again later."),
    });

  if (isLoadingResource || status === "loading") {
    return <LoadingPage />;
  }

  if (!resource) {
    return <div>404</div>;
  }

  const action =
    stateOf(resource) === ResourceState.EDIT_PROPOSAL && isAdmin
      ? "Review Proposal"
      : isAdmin
        ? "Edit"
        : "Propose Changes";
  const title = `${action}: "${resource.title}"`;

  return (
    <>
      <Head>
        <title>{`${title}" - ImprovDB`}</title>
      </Head>
      <PageLayout title={title} authenticatedOnly>
        <ResourceEditForm
          resource={resource}
          isSubmitting={isSubmitting}
          isEditing
          onSubmit={(values) => {
            if (isSubmitting) {
              return;
            }
            save(values);
          }}
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

export default ResourceEditPage;
