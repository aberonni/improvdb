import { zodResolver } from "@hookform/resolvers/zod";
import { ResourceConfiguration, ResourceType } from "@prisma/client";
import { ChevronDownIcon, PlusIcon } from "@radix-ui/react-icons";
import { kebabCase, pickBy } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type * as z from "zod";

import { AreYouSureDialog } from "@/components/are-you-sure-dialog";
import { MultiSelectDropown } from "@/components/multi-select-dropdown";
import {
  ResourceConfigurationLabels,
  ResourceTypeLabels,
  SingleResourceComponent,
} from "@/components/resource";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type RouterOutputs, api } from "@/utils/api";
import { resourceCreateSchema, resourceProposalSchema } from "@/utils/zod";

type CreateSchemaType = z.infer<typeof resourceCreateSchema>;

const editFormDefaults: Partial<CreateSchemaType> = {
  alternativeNames: [],
  categories: [],
  relatedResources: [],
  type: ResourceType.EXERCISE,
  configuration: ResourceConfiguration.SCENE,
  description: `Write a description of the warm-up/exercise/game etc. Include any and all details that you think are important. This is the first thing people will see when looking at your resource.

You can use markdown to format your text. For example **bold text**, *italic text*, and [links](https://your.url). Click on the "Preview" button to see what your text will look like.

Here are some sections that you might want to include in your description:

## Setup

How do you set up the activity? What are the rules? How do you explain them to the participants? How do you get the participants to start?

## Learning Objectives

What are the learning objectives of the activity? What skills does it help the participants develop?

## Examples

You could consider writing a sample dialogue between you and the participants, a sample playthrough of the activity, or anything else that you think is relevant.

## Tips

Any tips that you have for the participants? Any common mistakes that you want to warn them about? Any advice that you want to give them?

## Variations

Are there any variations of this activity that you want to share? For example, you could change the rules, add/remove some constraints, change the goal of the activity, or anything else that you think is relevant.`,
};

export default function ResourceEditForm({
  resource,
  onSubmit,
  isSubmitting,
  isEditing = false,
  isEditingProposal = false,
}: {
  resource?: Readonly<RouterOutputs["resource"]["getById"]>;
  onSubmit: (values: z.infer<typeof resourceCreateSchema>) => void;
  isSubmitting: boolean;
  isEditing?: boolean;
  isEditingProposal?: boolean;
}) {
  const [previewData, setPreviewData] = useState<CreateSchemaType | null>(null);
  const [optionalFieldsOpen, setOptionalFieldsOpen] = useState(true);

  const { data: categories, isLoading: isLoadingCategories } =
    api.category.getAll.useQuery();
  const { data: resources, isLoading: isLoadingResources } =
    api.resource.getAllOnlyIdAndTitle.useQuery();

  let defaultValues = editFormDefaults;

  if (resource) {
    const resourceWithoutNulls = pickBy(resource, (v) => v !== null);

    defaultValues = {
      ...resourceWithoutNulls,
      categories: resource.categories.map(({ category }) => ({
        label: category.name,
        value: category.id,
      })),
      relatedResources: resource.relatedResources.map((relatedResource) => ({
        label: relatedResource.title,
        value: relatedResource.id,
      })),
      alternativeNames: (resource.alternativeNames ?? "")
        .split(";")
        .filter((s) => s !== "")
        .map((name) => ({
          label: name,
          value: name,
        })),
    };
  }

  const resolverSchema = isEditingProposal
    ? resourceProposalSchema
    : resourceCreateSchema;

  const form = useForm<CreateSchemaType>({
    resolver: zodResolver(resolverSchema),
    defaultValues,
  });

  const {
    control,
    clearErrors,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = form;

  const watchTitle = watch("title");

  useEffect(() => {
    if (isEditing) {
      return;
    }
    const title = getValues("title");
    setValue("id", kebabCase(title));
    clearErrors("id");
  }, [clearErrors, getValues, isEditing, setValue, watchTitle]);

  const watchType = watch("type");
  const configurationDisabled = useMemo(
    () => watchType === ResourceType.LONG_FORM,
    [watchType],
  );

  useEffect(() => {
    const type = getValues("type");
    if (type === ResourceType.LONG_FORM) {
      setValue("configuration", ResourceConfiguration.SCENE);
    }
  }, [getValues, setValue, watchType]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="h-full">
        {previewData ? (
          <>
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
              {previewData.title}
            </h1>
            <SingleResourceComponent resource={previewData} />
            <Separator className="my-6" />
            <div className="flex w-full justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewData(null)}
              >
                Back to Edit
              </Button>
            </div>
          </>
        ) : (
          <>
            <Alert className="mb-4" variant="warning">
              <AlertTitle>About proposing new resources</AlertTitle>
              <AlertDescription>
                <br />
                Currently, anyone can propose new resources, but only admins can
                approve them, and subsequently edit or delete them. You will not
                be able to use them in your lesson plans until they have been
                approved by an admin.
                <br />
                <br />
                This website is a work in progress, and these limitations on new
                resources are subject to change.
              </AlertDescription>
            </Alert>
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormControl>
                    <Input placeholder="Title" {...field} />
                  </FormControl>
                  {errors.title?.message && (
                    <FormMessage>{errors.title?.message}</FormMessage>
                  )}
                </FormItem>
              )}
            />

            <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_300px]">
              <div className="flex flex-col space-y-4 md:order-2">
                <FormField
                  control={control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-0 top-0 flex h-full select-none items-center">
                            <span className="pl-3 text-sm leading-none">
                              /resource/
                            </span>
                          </div>
                          <Input
                            placeholder="id"
                            className="pl-20"
                            disabled={isEditing}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      {errors.id?.message && (
                        <FormMessage>{errors.id?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="peer">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl
                          className={cn(
                            !configurationDisabled &&
                              "rounded-bl-none rounded-br-none",
                          )}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a resource type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Resource types</SelectLabel>
                            {Object.keys(ResourceType).map((typeKey) => (
                              <SelectItem key={typeKey} value={typeKey}>
                                {ResourceTypeLabels[typeKey as ResourceType]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {errors.type?.message && (
                        <FormMessage className="!mb-2">
                          {errors.type?.message}
                        </FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                {!configurationDisabled && (
                  <FormField
                    control={control}
                    name="configuration"
                    render={({ field }) => (
                      <FormItem className="peer !mt-0 peer-has-[button:focus]:[&_button]:border-t-transparent">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl
                            className={cn("rounded-tl-none rounded-tr-none")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a configuration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Configurations</SelectLabel>
                              {Object.keys(ResourceConfiguration).map(
                                (confKey) => (
                                  <SelectItem key={confKey} value={confKey}>
                                    {
                                      ResourceConfigurationLabels[
                                        confKey as ResourceConfiguration
                                      ]
                                    }
                                  </SelectItem>
                                ),
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {errors.configuration?.message && (
                          <FormMessage className="!mb-2">
                            {errors.configuration?.message}
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                )}

                <Collapsible
                  open={optionalFieldsOpen}
                  onOpenChange={setOptionalFieldsOpen}
                >
                  <CollapsibleTrigger
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      "w-full",
                    )}
                  >
                    Optional Fields{" "}
                    {optionalFieldsOpen ? (
                      <ChevronDownIcon className="ml-2 h-4 w-4" />
                    ) : (
                      <PlusIcon className="ml-2 h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex flex-col space-y-4">
                    <FormField
                      control={control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormControl>
                            <MultiSelectDropown
                              {...{
                                ...field,
                                ref: null,
                              }}
                              instanceId="categories"
                              isLoading={isLoadingCategories}
                              placeholder="Categories..."
                              loadingMessage={() => "Loading categories..."}
                              options={categories?.map(({ id, name }) => ({
                                label: name,
                                value: id,
                              }))}
                              isMulti
                            />
                          </FormControl>
                          {errors.categories?.message && (
                            <FormMessage>
                              {errors.categories?.message}
                            </FormMessage>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="alternativeNames"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <MultiSelectDropown
                              {...{
                                ...field,
                                ref: null,
                              }}
                              placeholder="Alternative Names..."
                              instanceId="alternativeNames"
                              isMulti
                              isCreatable
                            />
                          </FormControl>
                          {errors.alternativeNames?.message ? (
                            <FormMessage>
                              {errors.alternativeNames.message}
                            </FormMessage>
                          ) : (
                            <FormDescription>
                              Press ENTER or TAB to add names
                            </FormDescription>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="showIntroduction"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Show Introduction (what an MC would say before the game during a show)"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          {errors.showIntroduction?.message && (
                            <FormMessage>
                              {errors.showIntroduction?.message}
                            </FormMessage>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="relatedResources"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <MultiSelectDropown
                              {...{
                                ...field,
                                ref: null,
                              }}
                              placeholder="Related Resources..."
                              instanceId="relatedResources"
                              isLoading={isLoadingResources}
                              loadingMessage={() => "Loading resources..."}
                              options={(isEditing
                                ? resources?.filter(
                                    (r) => r.id !== resource?.id,
                                  )
                                : resources
                              )?.map(({ id, title }) => ({
                                label: title,
                                value: id,
                              }))}
                              isMulti
                            />
                          </FormControl>
                          {errors.relatedResources?.message && (
                            <FormMessage>
                              {errors.relatedResources?.message}
                            </FormMessage>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="video"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="YouTube Video ID" {...field} />
                          </FormControl>
                          {errors.video?.message && (
                            <FormMessage>{errors.video?.message}</FormMessage>
                          )}
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <div className="mt-0 border-0 p-0 md:order-1">
                <div className="flex h-full flex-col space-y-4">
                  <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            className="h-[400px] flex-1 p-4 md:h-[700px] lg:h-[700px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This field supports{" "}
                          <a
                            href="https://www.markdownguide.org/basic-syntax/"
                            target="_blank"
                            className="underline hover:no-underline"
                            rel="noreferrer"
                          >
                            Markdown
                          </a>
                        </FormDescription>
                        {errors.description && (
                          <FormMessage>
                            {errors.description.message}
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="flex w-full justify-end space-x-2">
              <Button
                onClick={() => setPreviewData(getValues())}
                type="button"
                variant="outline"
              >
                Preview
              </Button>
              <AreYouSureDialog
                isFormValid={form.formState.isValid}
                dialog="ResourceSave"
                description={`You are about to propose a new resource. This action cannot be undone. Your new resource will be pending publication after you submit it. You can monitor the status in your "My Proposed Resources\" page.`}
                onSave={handleSubmit(onSubmit)}
                isSaving={isSubmitting}
              />
            </div>
          </>
        )}
      </form>
    </Form>
  );
}
