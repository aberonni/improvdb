import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";

import { LoadingPage } from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import ResourceEditForm from "@/components/resource-edit-form";
import { useErrorToast } from "@/hooks/use-error-toast";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

export const ResourceClonePage: NextPage<{ id: string }> = ({ id }) => {
  const { data: resource, isLoading: isLoadingResource } =
    api.resource.getById.useQuery({
      id,
    });

  const router = useRouter();
  const showError = useErrorToast();

  const { mutate: createResource, isPending: isSubmitting } =
    api.resource.create.useMutation({
      onSuccess: ({ resource: res }) => {
        void router.push("/resource/" + res.id);
      },
      onError: (e) =>
        showError(e, "Failed to create resource! Please try again later."),
    });

  if (isLoadingResource) {
    return <LoadingPage />;
  }

  if (!resource) {
    return <div>404</div>;
  }

  const title = `Clone: "${resource.title}"`;

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
            createResource(values);
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

export default ResourceClonePage;
