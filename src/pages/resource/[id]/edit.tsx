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
import { resourceState } from "@/lib/resource";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

export const ResourceEditPage: NextPage<{ id: string }> = ({ id }) => {
  const { data: resource, isLoading: isLoadingResource } =
    api.resource.getById.useQuery({
      id,
    });

  const { data: session, status } = useSession();
  const isAdmin = isAdminUser(session?.user);

  const router = useRouter();
  const { toast } = useToast();
  const showError = useErrorToast();

  const reviewingProposal =
    isAdmin && !!resource && resourceState(resource) === "EDIT_PROPOSAL";

  const { mutate: save, isPending: isSubmitting } =
    api.resource.save.useMutation({
      onSuccess: ({ resource: saved, outcome }) => {
        void router.push(
          outcome === "proposed"
            ? "/user/my-proposed-resources"
            : `/resource/${saved.id}`,
        );
        toast({
          title: "Success!",
          description:
            outcome === "proposed"
              ? "Your proposed changes have been saved."
              : outcome === "accepted"
                ? "The proposed changes have been applied."
                : "Your changes have been saved.",
        });
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

  const title = `${
    reviewingProposal ? "Review Proposal" : isAdmin ? "Edit" : "Propose Changes"
  }: "${resource.title}"`;

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
