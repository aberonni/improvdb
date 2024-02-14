import { zodResolver } from "@hookform/resolvers/zod";
import { kebabCase } from "lodash";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { type infer as zodInfer } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SaveAsDraftButton } from "@/components/ui/save-as-draft-button";
import { Separator } from "@/components/ui/separator";
import { type CreateSchemaType, createFormDefaults } from "@/lib/defaults";
import { resourceCreateSchema } from "@/utils/zod";

interface Props {
  isSubmitting: boolean;
  onSubmit: (values: zodInfer<typeof resourceCreateSchema>) => void;
}

const ResourceCreateForm: React.FC<Props> = ({ isSubmitting, onSubmit }) => {
  const form = useForm<CreateSchemaType>({
    resolver: zodResolver(resourceCreateSchema),
    defaultValues: createFormDefaults,
  });

  const { control, formState, handleSubmit, reset, clearErrors, setValue } =
    form;

  const idFieldState = form.watch("id");
  const titleFieldState = form.watch("title");

  // update ID field when the title field is updated
  useEffect(() => {
    setValue("id", kebabCase(titleFieldState));
    clearErrors("id");
  }, [clearErrors, setValue, titleFieldState]);

  // clear fields when submitted
  useEffect(
    () => void formState.isSubmitSuccessful && reset(),
    [reset, formState.isSubmitSuccessful],
  );

  // clear errors when submitting
  useEffect(
    () => void formState.isSubmitting && clearErrors(),
    [clearErrors, formState.isSubmitting],
  );

  // clear errors when field is changed
  useEffect(() => form.clearErrors(), [form, idFieldState, titleFieldState]);

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="my-6 flex h-full w-full justify-between"
      >
        <div>
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem className="max-w-85">
                <FormControl>
                  <Input placeholder="Title" {...field} />
                </FormControl>
                {formState.errors.title?.message && (
                  <FormMessage>{formState.errors.title?.message}</FormMessage>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="id"
            render={({ field }) => (
              <FormItem className="max-w-85 my-4">
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-0 top-0 flex h-full select-none items-center ">
                      <span className="pl-3 text-sm leading-none">
                        /resource/
                      </span>
                    </div>
                    <Input
                      placeholder="id"
                      className="pl-20"
                      disabled={false}
                      {...field}
                    />
                  </div>
                </FormControl>
                {formState.errors.id?.message ? (
                  <FormMessage>{formState.errors.id?.message}</FormMessage>
                ) : (
                  <FormDescription>
                    The ID is used in the URL when you visit a resource (e.g.
                    improvdb.com/resource/<i>my-resource-id</i>).
                    <br />
                    This <i>cannot</i> be changed once you proceed to the next
                    step
                  </FormDescription>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="flex max-w-sm items-end">
          <Separator orientation={"vertical"} className="y-full mx-6" />
          <div className="my-6">
            <FormDescription className="w-max-prose my-4">
              In the next step, you can fill out details (e.g. description,
              alternative names, etc.)
            </FormDescription>
            <SaveAsDraftButton
              isLoading={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            />
            <Button
              onClick={handleSubmit(onSubmit)}
              type="button"
              variant="default"
            >
              Next step
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default ResourceCreateForm;
