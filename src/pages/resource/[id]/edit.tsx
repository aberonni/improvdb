import Head from "next/head";
import { api } from "~/utils/api";

import type { GetStaticProps, NextPage } from "next";
import { PageLayout } from "~/components/PageLayout";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { LoadingPage } from "~/components/Loading";
import EditResourceForm from "~/components/EditResourceForm";
import { useRouter } from "next/router";
import { useToast } from "~/components/ui/use-toast";
import { UserRole } from "@prisma/client";

export const ResourceEditPage: NextPage<{ id: string }> = ({ id }) => {
  const { data: resource, isLoading } = api.resource.getById.useQuery({
    id,
  });

  const utils = api.useUtils();
  const router = useRouter();
  const { toast } = useToast();

  const { mutate: createResource, isLoading: isSubmitting } =
    api.resource.update.useMutation({
      onSuccess: ({ resource: res }) => {
        void router.push("/resource/" + res.id);
        // incredible magic that makes the "getAll" automatically re-trigger
        // XXX: do I need to invalidate all the getAlls?
        void utils.resource.getAll.invalidate();
        toast({
          title: "Success!",
          description: "Resource updated.",
        });
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
          e.message ?? e.data?.zodError?.fieldErrors.content?.[0];

        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description:
            errorMessage ??
            "Failed to create resource! Please try again later.",
        });
      },
    });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!resource) {
    return <div>404</div>;
  }

  return (
    <>
      <Head>
        <title>{`Edit: "${resource.title}" - ImprovDB`}</title>
      </Head>
      <PageLayout
        title={`Edit: "${resource.title}"`}
        showBackButton
        authenticatedOnly={[UserRole.ADMIN]}
      >
        <EditResourceForm
          resource={resource}
          isSubmitting={isSubmitting}
          onSubmit={(values) => {
            if (isSubmitting) {
              return;
            }
            createResource({
              ...values,
              originalId: resource?.id,
            });
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
