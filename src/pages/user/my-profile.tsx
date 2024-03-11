import { zodResolver } from "@hookform/resolvers/zod";
import { pickBy } from "lodash";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import type * as z from "zod";

import { LoadingPage } from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { type RouterOutputs, api } from "@/utils/api";
import { userUpdateSchema } from "@/utils/zod";

const MyProfileForm = ({
  user,
}: {
  user: RouterOutputs["user"]["getUser"];
}) => {
  const { update } = useSession();
  const { toast } = useToast();

  const { mutate: updateUser, isLoading: isSaving } =
    api.user.updateUser.useMutation({
      onSuccess: ({ user: updatedUser }) => {
        toast({
          title: "Success!",
          description: "User updated.",
        });

        void update(updatedUser);
      },
      onError: (e) => {
        const errorMessage =
          e.message ?? e.data?.zodError?.fieldErrors.content?.[0];

        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description:
            errorMessage ?? "Failed to update user! Please try again later.",
        });
      },
    });

  const form = useForm<z.infer<typeof userUpdateSchema>>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: pickBy(user),
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = form;
  return (
    <Form {...form}>
      <form
        // extracting email to avoid changing it
        onSubmit={handleSubmit(({ email: _, ...values }) => {
          if (isSaving) {
            return;
          }
          updateUser(values);
        })}
      >
        <FormField
          control={control}
          name="name"
          disabled={isSaving}
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Name" {...field} />
              </FormControl>
              {errors.name?.message && (
                <FormMessage>{errors.name?.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="email"
          disabled
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input placeholder="Email" {...field} />
              </FormControl>
              {errors.email?.message && (
                <FormMessage>{errors.email?.message}</FormMessage>
              )}
            </FormItem>
          )}
        />
        <Button disabled={isSaving} type="submit">
          {isSaving ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default function MyProfile() {
  const { data, isLoading: isLoadingUser } = api.user.getUser.useQuery();

  if (isLoadingUser) {
    return <LoadingPage />;
  }

  if (!data) {
    return <div>404</div>;
  }

  return (
    <>
      <Head>
        <title>My Profile - ImprovDB</title>
      </Head>
      <PageLayout title="My Profile" authenticatedOnly>
        <MyProfileForm user={data} />
      </PageLayout>
    </>
  );
}
