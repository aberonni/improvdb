import { ResourcePublicationStatus, UserRole } from "@prisma/client";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import { LoadingPage } from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import ResourceEditForm from "@/components/resource-edit-form";
import { useToast } from "@/components/ui/use-toast";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

export const ResourceEditPage: NextPage<{ id: string }> = ({ id }) => {
  const { data: resource, isLoading: isLoadingResource } = api.resource.getById.useQuery({ id });
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const isAdmin = session?.user?.role === UserRole.ADMIN;
  const isEditingOwnDraft = session?.user?.id === resource?.createdById && resource?.publicationStatus === ResourcePublicationStatus.DRAFT;

  const reviewingProposal = isAdmin && resource?.editProposalOriginalResourceId != null;
  const apiCommand = (() => {
    if (reviewingProposal) return api.resource.acceptProposedUpdate
    return isAdmin || isEditingOwnDraft ? api.resource.update : api.resource.proposeUpdate
  })()

  const { mutate: updateResource, isLoading: isSubmitting } = (apiCommand).useMutation({
    onSuccess: ({ resource: res }) => {
      void router.push(
        isAdmin ? `/resource/${res.id}` : "/user/my-proposed-resources",
      );
      toast({
        title: "Success!",
        description: "Resource proposal saved.",
      });
    },
    onError: (e) => {
      const errorMessage =
        e.message ?? e.data?.zodError?.fieldErrors.content?.[0];

      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description:
          errorMessage ?? "Failed to update resource! Please try again later.",
      });
    },
  });

  if (isLoadingResource || status === "loading") return <LoadingPage />;

  if (!resource) return <div>404</div>;

  const title = `${
    reviewingProposal ? "Review Proposal" : isAdmin || isEditingOwnDraft ? "Edit" : "Propose Changes"
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
          isEditingProposal={reviewingProposal}
          onSubmit={(values) => {
            if (isSubmitting) return;
            updateResource(values);
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
