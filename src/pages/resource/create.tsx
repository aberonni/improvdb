import Head from "next/head";
import { useRouter } from "next/router";

import { PageLayout } from "@/components/page-layout";
import ResourceEditForm from "@/components/resource-edit-form";
import { useErrorToast } from "@/hooks/use-error-toast";
import { api } from "@/utils/api";

export default function Create() {
  const utils = api.useUtils();
  const router = useRouter();
  const showError = useErrorToast();

  const { mutate: createResource, isPending: isSubmitting } =
    api.resource.create.useMutation({
      onSuccess: ({ resource: res }) => {
        void router.push("/resource/" + res.id);
        // incredible magic that makes the "getAll" automatically re-trigger
        // XXX: do I need to invalidate all the getAlls?
        void utils.resource.getCatalogue.invalidate();
      },
      onError: (e) =>
        showError(e, "Failed to create resource! Please try again later."),
    });

  return (
    <>
      <Head>
        <title>Propose a Game or Exercise - ImprovDB</title>
      </Head>
      <PageLayout title="Propose a Game or Exercise" authenticatedOnly>
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
