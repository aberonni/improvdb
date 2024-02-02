import Head from "next/head";
import { useRouter } from "next/router";

import { PageLayout } from "@/components/page-layout";
import ResourceEditForm from "@/components/resource-edit-form";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";

export default function Create() {
  const utils = api.useUtils();
  const router = useRouter();
  const { toast } = useToast();

  const { mutate: createResource, isLoading: isSubmitting } =
    api.resource.create.useMutation({
      onSuccess: ({ resource: res }) => {
        void router.push("/resource/" + res.id);
        // incredible magic that makes the "getAll" automatically re-trigger
        // XXX: do I need to invalidate all the getAlls?
        void utils.resource.getAll.invalidate();
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

  return (
    <>
      <Head>
        <title>Propose Resource - ImprovDB</title>
      </Head>
      <PageLayout title="Propose Resource" authenticatedOnly>
        <ResourceEditForm
          onSubmit={(values) => {
            if (isSubmitting) {
              return;
            }
            createResource(values);
          }}
          isSubmitting={isSubmitting}
        />
      </PageLayout>
    </>
  );
}
