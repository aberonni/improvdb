import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";

import { LoadingPage } from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import ResourceEditForm from "@/components/resource-edit-form";
import { useToast } from "@/components/ui/use-toast";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

export const ResourceClonePage: NextPage<{ id: string }> = ({ id }) => {
  const { data: resource, isLoading: isLoadingResource } =
    api.resource.getById.useQuery({
      id,
    });

  const router = useRouter();
  const { toast } = useToast();

  const { mutate: createResource, isLoading: isSubmitting } =
    api.resource.create.useMutation({
      onSuccess: ({ resource: res }) => {
        void router.push("/resource/" + res.id);
      },
      onError: (e) => {
        if (e.data?.code === "CONFLICT") {
          toast({
            title: "Uh oh! Something went wrong.",
            variant: "destructive",
            description:
              "A resource already exists at this URL. Please choose a new URL.",
          });
          return;
        }

        const errorMessage =
          e.message ??
          e.data?.zodError?.fieldErrors.content?.[0] ??
          "Failed to create resource! Please try again later.";

        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description: errorMessage,
        });
      },
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
