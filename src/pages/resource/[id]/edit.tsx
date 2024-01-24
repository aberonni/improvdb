import Head from "next/head";
import { api } from "~/utils/api";

import type { GetStaticProps, NextPage } from "next";
import { PageLayout } from "~/components/PageLayout";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { LoadingPage } from "~/components/Loading";
import ResourceEditForm from "~/components/ResourceEditForm";
import { useRouter } from "next/router";
import { useToast } from "~/components/ui/use-toast";
import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";

export const ResourceEditPage: NextPage<{ id: string }> = ({ id }) => {
  const { data: resource, isLoading: isLoadingResource } =
    api.resource.getById.useQuery({
      id,
    });

  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === UserRole.ADMIN;

  const router = useRouter();
  const { toast } = useToast();

  const { mutate: updateResource, isLoading: isSubmitting } = (
    isAdmin ? api.resource.update : api.resource.proposeUpdate
  ).useMutation({
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

  if (isLoadingResource || status === "loading") {
    return <LoadingPage />;
  }

  if (!resource) {
    return <div>404</div>;
  }

  const title = `${isAdmin ? "Edit" : "Propose Changes"}: "${resource.title}"`;

  return (
    <>
      <Head>
        <title>{`${title}" - ImprovDB`}</title>
      </Head>
      <PageLayout title={title} authenticatedOnly>
        <ResourceEditForm
          resource={resource}
          isSubmitting={isSubmitting}
          onSubmit={(values) => {
            if (isSubmitting) {
              return;
            }
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
