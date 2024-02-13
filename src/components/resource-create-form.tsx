import React, { useEffect } from "react";
import { infer as zodInfer } from "zod";
import { useForm } from "react-hook-form";
import { kebabCase } from "lodash";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormMessage,
  } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { resourceCreateSchema } from "@/utils/zod";
import { CreateSchemaType, createFormDefaults } from "@/lib/defaults";

interface Props {
    isSubmitting: boolean;
    onSubmit: (values: zodInfer<typeof resourceCreateSchema>) => void;
}

const ResourceCreateForm: React.FC<Props> =({ isSubmitting, onSubmit }) => {
    const form = useForm<CreateSchemaType>({
        resolver: zodResolver(resourceCreateSchema),
        defaultValues: createFormDefaults,
    });

    const { control, formState, handleSubmit, reset, clearErrors, setValue } = form

    const idFieldState = form.watch("id");
    const titleFieldState = form.watch("title");

    // update ID field when the title field is updated
    useEffect(() => {
        setValue("id", kebabCase(titleFieldState));
        clearErrors("id");
      }, [clearErrors, setValue, titleFieldState]);

    // clear fields when submitted
    useEffect(() => void formState.isSubmitSuccessful && reset(), [formState.isSubmitSuccessful])

    // clear errors when submitting
    useEffect(() => void formState.isSubmitting && clearErrors(), [formState.isSubmitting])

    // clear errors when field is changed
    useEffect(() => form.clearErrors(), [idFieldState,titleFieldState])

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="w-full h-full flex justify-between my-6">
                <div>
                    <FormField
                        control={control}
                        name="id"
                        render={({ field }) => (
                            <FormItem className="max-w-85">
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
                                        The ID is used in the URL when you visit a resource (e.g. improvdb.com/resource/<i>my-resource-id</i>). 
                                        <br />
                                        This <i>cannot</i> be changed once you proceed to the next step
                                    </FormDescription>
                                )}
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="title"
                        render={({ field }) => (
                            <FormItem className="my-4 max-w-85">
                                <FormControl>
                                    <Input placeholder="Title" {...field} />
                                </FormControl>
                                {formState.errors.title?.message && (
                                    <FormMessage>{formState.errors.title?.message}</FormMessage>
                                )}
                            </FormItem>
                        )}
                    />
                </div>
                
                <div className="flex items-end max-w-sm">
                    <Separator orientation={'vertical'} className="mx-6 y-full" />
                    <div className="my-6">
                        <FormDescription className="my-4 w-max-prose">In the next step, you can fill out details (e.g. description, alternative names, etc.)</FormDescription>
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
    )
}

export default ResourceCreateForm;