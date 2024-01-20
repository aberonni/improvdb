import { zodResolver } from "@hookform/resolvers/zod";
import { type UseFormReturn, useForm, useFieldArray } from "react-hook-form";
import type * as z from "zod";
import { useToast } from "~/components/ui/use-toast";

import { type RouterOutputs, api } from "~/utils/api";
import { lessonPlanCreateSchema } from "~/utils/zod";
import { MultiSelectDropown } from "~/components/MultiSelectDropdown";
import { useMemo, useState } from "react";

import { Button, buttonVariants } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

import { cn } from "~/lib/utils";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HeightIcon,
  PlusIcon,
  ReloadIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { SingleLessonPlanComponent } from "./LessonPlan";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";

type CreateSchemaType = z.infer<typeof lessonPlanCreateSchema>;

const SaveButton = ({
  form,
  onSave,
  isSaving,
}: {
  form: UseFormReturn<CreateSchemaType>;
  onSave: () => void;
  isSaving: boolean;
}) => {
  const { toast } = useToast();

  if (!form.formState.isValid) {
    return (
      <Button
        type="button"
        onClick={() => {
          onSave();
          toast({
            title: "Uh oh!",
            // variant: "destructive",
            description: "Please fix the errors in the form before saving.",
          });
        }}
      >
        Save
      </Button>
    );
  }

  return (
    <Button disabled={isSaving} type="submit">
      {isSaving ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> Saving...
        </>
      ) : (
        "Save"
      )}
    </Button>
  );
};

const defaultEmptyItem: CreateSchemaType["sections"][0]["items"][0] = {
  text: "",
  duration: 0,
  resource: undefined,
};

const defaultEmptySection: CreateSchemaType["sections"][0] = {
  title: "",
  items: [
    {
      ...defaultEmptyItem,
    },
    {
      ...defaultEmptyItem,
    },
  ],
};

const editFormDefaults: Partial<CreateSchemaType> = {
  private: true,
  useDuration: true,
  sections: [],
};

const SectionItems = ({
  sectionIndex,
  form,
  resources,
  resourcesLoading,
  durationEnabled,
}: {
  sectionIndex: number;
  form: UseFormReturn<CreateSchemaType>;
  resources?: RouterOutputs["resource"]["getAllOnlyIdAndTitle"];
  resourcesLoading: boolean;
  durationEnabled: boolean;
}) => {
  const {
    control,
    formState: { errors },
    register,
  } = form;

  const {
    fields: items,
    remove,
    append,
    swap,
  } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.items`,
  });

  const getErrorMessage = useMemo(() => {
    return (
      sectionIndex: number,
      itemIndex: number,
      field: keyof CreateSchemaType["sections"][0]["items"][0],
    ) => {
      const errorMessage =
        errors.sections?.[sectionIndex]?.items?.[itemIndex]?.[field]?.message;

      if (!errorMessage) {
        return null;
      }

      return <FormMessage>{errorMessage}</FormMessage>;
    };
  }, [errors]);

  return (
    <>
      {items.map((item, itemIndex) => (
        <>
          <div
            className={cn(
              "flex w-full flex-row gap-4",
              // itemIndex % 2 === 0 ? "bg-accent" : "border",
            )}
            key={item.id}
          >
            <div className="flex shrink-0 flex-col">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="mt-4 shrink-0"
                title="Move item up"
                disabled={itemIndex === 0}
                onClick={() => {
                  swap(itemIndex, itemIndex - 1);
                }}
              >
                <ArrowUpIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="mt-4 shrink-0"
                title="Move item down"
                disabled={itemIndex === items.length - 1}
                onClick={() => {
                  swap(itemIndex, itemIndex + 1);
                }}
              >
                <ArrowDownIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="mt-4 shrink-0 text-destructive"
                title="Delete item"
                onClick={() => {
                  remove(itemIndex);
                }}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex w-full flex-col gap-4 rounded border p-4 ">
              <FormLabel>Item {itemIndex + 1}</FormLabel>
              <div className="flex w-full flex-row gap-4">
                {durationEnabled && (
                  <FormField
                    control={control}
                    name={`sections.${sectionIndex}.items.${itemIndex}.duration`}
                    render={({ field }) => (
                      <FormItem className="w-full max-w-52 grow bg-background">
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-0 top-0 flex h-full select-none items-center ">
                              <span className="pl-3 text-sm leading-none">
                                Duration (mins):
                              </span>
                            </div>
                            <Input
                              placeholder="0"
                              className="min-h-[38px] pl-32"
                              type="number"
                              {...field}
                              {...register(
                                `sections.${sectionIndex}.items.${itemIndex}.duration`,
                                {
                                  valueAsNumber: true,
                                },
                              )}
                            />
                          </div>
                        </FormControl>
                        {getErrorMessage(sectionIndex, itemIndex, "duration")}
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={control}
                  name={`sections.${sectionIndex}.items.${itemIndex}.resource`}
                  render={({ field }) => {
                    if (field.value?.value === null) {
                      // This means the user selected "No Resource"
                      return <></>;
                    }

                    return (
                      <FormItem className="w-full grow bg-background">
                        <FormControl>
                          <MultiSelectDropown
                            {...{
                              ...field,
                              ref: null,
                            }}
                            placeholder="Select resource (optional)..."
                            instanceId="relatedResources"
                            isLoading={resourcesLoading}
                            loadingMessage={() => "Loading resources..."}
                            options={resources?.map(({ id, title }) => ({
                              label: title,
                              value: id,
                            }))}
                            isClearable
                          />
                        </FormControl>
                        {getErrorMessage(sectionIndex, itemIndex, "resource")}
                      </FormItem>
                    );
                  }}
                />
              </div>
              <div className="w-full">
                <FormField
                  control={control}
                  name={`sections.${sectionIndex}.items.${itemIndex}.text`}
                  render={({ field }) => (
                    <FormItem className="w-full grow bg-background">
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          className="min-h-9"
                          placeholder={"Add text to item (optional)..."}
                        />
                      </FormControl>
                      {getErrorMessage(sectionIndex, itemIndex, "text")}
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </>
      ))}
      <div className="flex w-full flex-row gap-2">
        <Button
          type="button"
          onClick={() => {
            append({
              ...defaultEmptyItem,
            });
          }}
          variant="outline"
          className="w-full"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Item to Section
        </Button>
      </div>
    </>
  );
};

export default function LessonPlanEditForm({
  lessonPlan,
  onSubmit,
  isSubmitting,
}: {
  lessonPlan?: Readonly<RouterOutputs["lessonPlan"]["getById"]>;
  onSubmit: (values: z.infer<typeof lessonPlanCreateSchema>) => void;
  isSubmitting: boolean;
}) {
  const [previewData, setPreviewData] = useState<CreateSchemaType | null>(null);
  const [sectionClosed, setSectionClosed] = useState<Record<number, boolean>>(
    {},
  );

  const { data: resources, isLoading: isLoadingResources } =
    api.resource.getAllOnlyIdAndTitle.useQuery();

  let defaultValues = editFormDefaults;

  if (lessonPlan) {
    const keys = Object.keys(lessonPlan) as (keyof typeof lessonPlan)[];
    defaultValues = keys.reduce((acc, key) => {
      if (lessonPlan[key] == null) {
        return acc;
      }

      if (key !== "sections") {
        return {
          ...acc,
          [key]: lessonPlan[key],
        };
      }

      // I really dislike the transformations I'm doing here
      return {
        ...acc,
        sections: lessonPlan.sections.map((section) => {
          return {
            ...section,
            items: section.items.map((item) => {
              // This especially feels prone to bugs
              // XXX: I should probably just use the "resource" field somehow
              const resource =
                item.resource == null
                  ? { label: "No Resource", value: null }
                  : {
                      label: item.resource.title,
                      value: item.resource.id,
                    };

              return {
                ...item,
                resource,
              };
            }),
          };
        }),
      };
    }, {});
  }

  const form = useForm<CreateSchemaType>({
    resolver: zodResolver(lessonPlanCreateSchema),
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
  } = form;

  const durationEnabled = watch("useDuration");

  const {
    fields: sections,
    append: appendSection,
    remove: removeSection,
  } = useFieldArray({
    control,
    name: "sections",
    rules: {
      minLength: 1,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="h-full">
        {previewData ? (
          <>
            <SingleLessonPlanComponent lessonPlan={previewData} />
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
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormControl>
                    <Input placeholder="Lesson plan title" {...field} />
                  </FormControl>
                  {errors.title?.message && (
                    <FormMessage>{errors.title?.message}</FormMessage>
                  )}
                </FormItem>
              )}
            />

            <div className="grid h-full items-stretch gap-6 md:grid-cols-[300px_1fr]">
              <div className="flex flex-col space-y-4">
                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={8}
                          placeholder="Lesson plan description (optional)"
                        />
                      </FormControl>
                      {errors.description && (
                        <FormMessage>{errors.description.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="private"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Private</FormLabel>
                        <FormDescription className="pl-0">
                          If checked, the lesson plan will only be visible to
                          you. You can change this later.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="useDuration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Use "duration" fields</FormLabel>
                        <FormDescription className="pl-0">
                          If checked, each item in the lesson plan will have a
                          duration field, and the total duration of the lesson
                          plan will be automatically calculated.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-0 border-0 p-0">
                <div className="flex h-full flex-col space-y-4">
                  {sections.length > 0 ? (
                    sections.map((section, sectionIndex) => (
                      <Collapsible
                        key={section.id}
                        open={!sectionClosed[sectionIndex]}
                        onOpenChange={(open) =>
                          setSectionClosed((s) => ({
                            ...s,
                            [sectionIndex]: !open,
                          }))
                        }
                      >
                        <div className="rounded border p-4">
                          <div className="flex w-full flex-row gap-4">
                            <FormField
                              control={control}
                              name={`sections.${sectionIndex}.title`}
                              render={({ field }) => (
                                <FormItem className="grow">
                                  <FormControl>
                                    <Input
                                      placeholder={`Section ${
                                        sectionIndex + 1
                                      } title (eg. Warmup, Exercises, Main Activities, Games etc.)`}
                                      {...field}
                                    />
                                  </FormControl>
                                  {errors.sections?.[sectionIndex]?.title
                                    ?.message && (
                                    <FormMessage>
                                      {
                                        errors.sections?.[sectionIndex]?.title
                                          ?.message
                                      }
                                    </FormMessage>
                                  )}
                                </FormItem>
                              )}
                            />
                            <Button
                              onClick={() => {
                                removeSection(sectionIndex);
                              }}
                              variant="outline"
                              className="text-destructive"
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              Delete Section
                            </Button>
                            <CollapsibleTrigger
                              className={cn(
                                buttonVariants({
                                  variant: "secondary",
                                  size: "icon",
                                }),
                                "shrink-0",
                              )}
                            >
                              {sectionClosed[sectionIndex] ? (
                                <ChevronDownIcon className="h-4 w-4" />
                              ) : (
                                <ChevronUpIcon className="h-4 w-4" />
                              )}
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <div className="mt-4 space-y-4">
                              <SectionItems
                                sectionIndex={sectionIndex}
                                form={form}
                                resources={resources}
                                resourcesLoading={isLoadingResources}
                                durationEnabled={durationEnabled}
                              />
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))
                  ) : (
                    <>
                      <div className="flex h-full flex-col items-center justify-center rounded border p-4 ">
                        <div className="text-md font-bold text-muted-foreground">
                          {" "}
                          Add a{" "}
                          <Popover>
                            <PopoverTrigger className="underline decoration-dashed underline-offset-4">
                              section
                            </PopoverTrigger>
                            <PopoverContent className="w-80 space-y-2 text-sm">
                              <p>
                                Each lesson plan is made up of <b>sections</b>.
                                Think of sections as a way to split up your
                                lesson plan into different parts.
                              </p>
                              <p>
                                For example, you might have a section for the
                                warmup, a section for the main exercises, and a
                                section for the performance games.
                              </p>
                              <p>
                                Each section is made up of <b>items</b>. Items
                                are the building blocks of your lesson plan, and
                                they can be linked to resources, or just contain
                                text.
                              </p>
                              <Separator />
                              <p>
                                The easiest way to get started is to build your
                                own lesson plan and see how it works! You can
                                always go back and edit it later.
                              </p>
                            </PopoverContent>
                          </Popover>{" "}
                          to get started!
                        </div>
                      </div>
                    </>
                  )}
                  <Button
                    type="button"
                    onClick={() => {
                      appendSection({
                        ...defaultEmptySection,
                      });
                    }}
                    className="w-full"
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Section
                  </Button>
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
              <SaveButton
                form={form}
                isSaving={isSubmitting}
                onSave={handleSubmit(onSubmit)}
              />
            </div>
          </>
        )}
      </form>
    </Form>
  );
}
