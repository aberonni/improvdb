import Head from "next/head";
import { kebabCase } from "lodash";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
import { useToast } from "~/components/ui/use-toast";

import { PageLayout } from "~/components/PageLayout";

import { api } from "~/utils/api";
import { resourceCreateSchema } from "~/utils/zod";
import { useRouter } from "next/router";
import { MultiSelectDropown } from "~/components/MultiSelectDropdown";
import { ResourceConfiguation, ResourceType } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import {
  ResourceConfiguationLabels,
  ResourceTypeLabels,
  SingleResourceComponent,
} from "~/components/Resource";

import { Button, buttonVariants } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

import { cn } from "~/lib/utils";
import { ChevronDownIcon, PlusIcon, ReloadIcon } from "@radix-ui/react-icons";

type CreateSchemaType = z.infer<typeof resourceCreateSchema>;

export default function Create() {
  const router = useRouter();
  const { toast } = useToast();

  const [previewData, setPreviewData] = useState<CreateSchemaType | null>(null);
  const [optionalFieldsOpen, setOptionalFieldsOpen] = useState(true);

  const { data: categories, isLoading: isLoadingCategories } =
    api.category.getAll.useQuery();
  const { data: resources, isLoading: isLoadingResources } =
    api.resource.getAllOnlyIdAndTitle.useQuery();

  const utils = api.useUtils();

  const { mutate: createResource, isLoading: isCreating } =
    api.resource.create.useMutation({
      onSuccess: ({ resource }) => {
        void router.push("/resource/" + resource.id);
        // incredible magic that makes the "getAll" automatically re-trigger
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
          e.message ?? e.data?.zodError?.fieldErrors.content?.[0];
        if (errorMessage) {
          toast({
            title: "Uh oh! Something went wrong.",
            variant: "destructive",
            description: errorMessage,
          });
          return;
        }
        toast({
          title: "Uh oh! Something went wrong.",
          variant: "destructive",
          description: "Failed to create resource! Please try again later.",
        });
      },
    });

  const form = useForm<CreateSchemaType>({
    resolver: zodResolver(resourceCreateSchema),
    defaultValues: {
      alternativeNames: [],
      categories: [],
      relatedResources: [],
      configuration: ResourceConfiguation.SCENE,
      groupSize: 2,
      description: `Write a description of the warm-up/exercise/game etc. Include any and all details that you think are important. This is the first thing people will see when looking at your resource.

You can use markdown to format your text. For example **bold text**, *italic text*, and [links](https://your.url). Click on the "Preview" button to see what your text will look like.

Here are some sections that you might want to include in your description:

## Introduction

Any introduction that you want to give to the warm-up/exercise/game etc. This could be a short description of the activity, a story about how you came up with it, or anything else that you think is relevant.

## Setup

How do you set up the activity? How do you explain the rules to the participants? How do you get the participants to start?

## Rules

What are the rules of the activity? How do you play it?

## Learning Objectives

What are the learning objectives of the activity? What skills does it help the participants develop?

## Tips

Any tips that you have for the participants? Any common mistakes that you want to warn them about? Any advice that you want to give them?

## Examples

You could consider writing a sample dialogue between you and the participants, a sample playthrough of the activity, or anything else that you think is relevant.

## Variations

Are there any variations of this activity that you want to share? For example, you could change the rules, add/remove some constraints, change the goal of the activity, or anything else that you think is relevant.`,
    },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = form;

  useEffect(() => {
    const title = getValues("title");
    setValue("id", kebabCase(title));
  }, [watch("title")]);

  const watchType = watch("type");
  const configurationDisabled = useMemo(
    () => watchType !== ResourceType.EXERCISE,
    [watchType],
  );

  useEffect(() => {
    const type = getValues("type");
    if (type !== ResourceType.EXERCISE) {
      setValue("configuration", ResourceConfiguation.SCENE);
    }
  }, [watch("type")]);

  const watchConfiguration = watch("configuration");
  const groupSizeDisabled = useMemo(
    () =>
      watchConfiguration === ResourceConfiguation.SOLO ||
      watchConfiguration === ResourceConfiguation.PAIRS,
    [watchConfiguration],
  );

  useEffect(() => {
    const configuration = getValues("configuration");
    if (configuration === ResourceConfiguation.SOLO) {
      setValue("groupSize", 1);
    } else if (configuration === ResourceConfiguation.PAIRS) {
      setValue("groupSize", 2);
    }
  }, [watchConfiguration]);

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof resourceCreateSchema>) {
    if (isCreating) {
      return;
    }
    createResource(values);
  }

  // if (errors) {
  //   console.log("Form errors:");
  //   console.log(errors);
  //   console.log("Form values:");
  //   console.log(getValues());
  // }

  return (
    <>
      <Head>
        <title>Create Resource - ImprovDB</title>
      </Head>
      <PageLayout>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="h-full py-6">
            {previewData ? (
              <>
                <SingleResourceComponent
                  resource={previewData}
                  hideBackToHome
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewData(null)}
                >
                  Edit
                </Button>
              </>
            ) : (
              <>
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
                              <div className="absolute left-0 top-[1px] flex h-full select-none items-center ">
                                <span className="pl-3 text-sm">/resource/</span>
                              </div>
                              <Input
                                placeholder="id"
                                className="pl-20"
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
                            <FormControl className="rounded-bl-none rounded-br-none">
                              <SelectTrigger>
                                <SelectValue placeholder="Select a resource type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Resource types</SelectLabel>
                                {Object.keys(ResourceType).map((typeKey) => (
                                  <SelectItem key={typeKey} value={typeKey}>
                                    {
                                      ResourceTypeLabels[
                                        typeKey as ResourceType
                                      ]
                                    }
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
                                className={cn(
                                  "rounded-tl-none rounded-tr-none",
                                  !groupSizeDisabled &&
                                    "rounded-bl-none rounded-br-none",
                                )}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a configuration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Configurations</SelectLabel>
                                  {Object.keys(ResourceConfiguation).map(
                                    (confKey) => (
                                      <SelectItem key={confKey} value={confKey}>
                                        {
                                          ResourceConfiguationLabels[
                                            confKey as ResourceConfiguation
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

                    {!groupSizeDisabled && (
                      <FormField
                        control={control}
                        name="groupSize"
                        render={({ field }) => (
                          <FormItem className="!mt-0 peer-has-[button:focus]:[&_input]:border-t-transparent">
                            <FormControl>
                              <div className="relative">
                                <div className="absolute left-0 top-[1px] flex h-full select-none items-center ">
                                  <span className="pl-3 text-sm">
                                    Group size:{" "}
                                  </span>
                                </div>
                                <Input
                                  className="rounded-tl-none rounded-tr-none pl-[90px]"
                                  type="number"
                                  {...field}
                                  {...register("groupSize", {
                                    valueAsNumber: true,
                                  })}
                                />
                              </div>
                            </FormControl>
                            {errors.groupSize?.message && (
                              <FormMessage>
                                {errors.groupSize?.message}
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
                      <CollapsibleContent className="flex flex-col space-y-4 ">
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
                                  options={resources?.map(({ id, title }) => ({
                                    label: title,
                                    value: id,
                                  }))}
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
                                <Input
                                  placeholder="YouTube Video ID"
                                  {...field}
                                />
                              </FormControl>
                              {errors.video?.message && (
                                <FormMessage>
                                  {errors.video?.message}
                                </FormMessage>
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
                                className="min-h-[400px] flex-1 p-4 md:min-h-[700px] lg:min-h-[700px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This field supports{" "}
                              <a
                                href="https://www.markdownguide.org/basic-syntax/"
                                target="_blank"
                                className="underline hover:no-underline"
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
                      <div className="flex items-center space-x-2">
                        <Button disabled={isCreating} type="submit">
                          {isCreating ? (
                            <>
                              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />{" "}
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </Button>
                        <Button
                          onClick={() => setPreviewData(getValues())}
                          type="button"
                          variant="outline"
                        >
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </form>
        </Form>
      </PageLayout>
    </>
  );
}
