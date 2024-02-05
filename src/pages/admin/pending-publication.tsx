import { UserRole } from "@prisma/client";
import Head from "next/head";
import {infer as zodInfer} from "zod";


import { PageLayout } from "@/components/page-layout";
import { ResourceList } from "@/components/resource-list";
import { resourceDeleteSchema } from "@/utils/zod";
import { api } from "@/utils/api";
import AdminDeleteForm from "@/components/admin-delete-form";
import { useToast } from "@/components/ui/use-toast";

export default function MyContributions() {
  const { toast } = useToast();
  const queryResult = api.resource.getPendingPublication.useQuery();
  const utils = api.useUtils();
  

  const { mutate: deleteResource, isLoading } =
    api.resource.delete.useMutation({
      onSuccess: () => {
        utils.resource.getAll.invalidate();
        toast({
          title: "Success!",
          description: "Resource successfully deleted.",
        });
      },
      onError: (e) => {
        if (e.data?.code === "NOT_FOUND") {
          toast({
            title: "Uh oh! Something went wrong.",
            variant: "destructive",
            description:
              "Cannot find resource (either the ID is misspelled or it's already gone!)",
          });
          return;
        }

        const errorMessage =
          e.message ??
          e.data?.zodError?.fieldErrors.content?.[0] ??
          "Failed to delete resource! Please try again later.";

        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description: errorMessage,
        });
      },
    });

  const onDeleteResource = (values: zodInfer<typeof resourceDeleteSchema>) => deleteResource(values)

  return (
    <>
      <Head>
        <title>Pending Publication - ImprovDB</title>
      </Head>
      <PageLayout
        title="Pending Publication"
        authenticatedOnly={[UserRole.ADMIN]}
      >
        <ResourceList queryResult={queryResult} useFilters showEditProposals />
        <div className="my-8 lg:max-w-sm">
          <AdminDeleteForm 
          onSubmit={onDeleteResource}
          isSubmitting={isLoading}
          />
        </div>
      </PageLayout>
    </>
  );
}
