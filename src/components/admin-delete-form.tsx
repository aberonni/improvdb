import React, {useEffect} from "react";
import {infer as zodInfer} from "zod";
import { useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { AreYouSureDialog } from "@/components/are-you-sure-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { resourceDeleteSchema } from "@/utils/zod";

type CreateSchemaType = zodInfer<typeof resourceDeleteSchema>;

const defaultValues: Partial<CreateSchemaType> = { id: "" }

interface SubmitButtonProps {
  isLoading?: boolean;
  onClick?: () => void;
}

const SubmitButton:React.FC<SubmitButtonProps> = ({ isLoading, onClick }) => (
  <Button disabled={isLoading} type="button" variant={"destructive"} onClick={onClick}>
    {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
    <span>{isLoading ? "Deleting..." : "Delete"}</span>
  </Button>
);


interface Props {
    isSubmitting: boolean;
    onSubmit: (values: zodInfer<typeof resourceDeleteSchema>) => void;
}

const AdminDeleteForm: React.FC<Props> = ({isSubmitting, onSubmit}) => {
    const form = useForm<CreateSchemaType>({
        resolver: zodResolver(resourceDeleteSchema),
        defaultValues,
      });

      const {control, formState, handleSubmit, reset, clearErrors} = form

      const idFieldState = form.watch("id");

      // clear fields when submitted
      useEffect(() => void formState.isSubmitSuccessful && reset(), [formState.isSubmitSuccessful])

      // clear errors when submitting
      useEffect(() => void formState.isSubmitting && clearErrors(), [formState.isSubmitting])

      // clear errors when field is changed
      useEffect(() => form.clearErrors(), [idFieldState])

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="h-full">
                <FormField
                  control={control}
                  name="id"
                  render={({ field }) => (
                    <FormItem className="mb-2">
                      <FormLabel>Delete Resource</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="id"
                            className="lg:max-w-48"
                            disabled={false}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      {formState.errors.id?.message ? (
                        <FormMessage>{formState.errors.id?.message}</FormMessage>
                      ) : (
                        <FormDescription>
                          Enter ID of resource to delete it (usefull for clearing out abandoned drafts)
                        </FormDescription>
                      )}
                    </FormItem>
                  )}
                />
                <AreYouSureDialog
                  isFormValid={formState.isValid}
                  dialog="AdminResourceDelete"
                  description={`You are about to delete a resource that may not belong to you. This action cannot be undone.`}
                  onSave={handleSubmit(onSubmit)}
                  isSaving={isSubmitting}
                  customButton={SubmitButton}
                />
            </form>
        </Form>
    )
}

export default AdminDeleteForm