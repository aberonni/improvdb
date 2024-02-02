import { zodResolver } from "@hookform/resolvers/zod";
import { LessonPlanVisibility } from "@prisma/client";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DesktopIcon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import AutowidthInput from "react-autowidth-input";
import { type UseFormReturn, useForm, useFieldArray } from "react-hook-form";
import type * as z from "zod";

import { AreYouSureDialog } from "@/components/are-you-sure-dialog";
import {
  LessonPlanVisibilityLabels,
  SingleLessonPlanComponent,
} from "@/components/lesson-plan";
import { ResponsiveCombobox } from "@/components/responsive-combobox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type RouterOutputs, api } from "@/utils/api";
import { lessonPlanCreateSchema } from "@/utils/zod";

type CreateSchemaType = z.infer<typeof lessonPlanCreateSchema>;

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
  ],
};

const editFormDefaults: Partial<CreateSchemaType> = {
  visibility: LessonPlanVisibility.PRIVATE,
  useDuration: true,
  sections: [],
};

const SectionItems = ({
  sectionIndex,
  form,
  resources,
  durationEnabled,
}: {
  sectionIndex: number;
  form: UseFormReturn<CreateSchemaType>;
  resources?: RouterOutputs["resource"]["getAllOnlyIdAndTitle"];
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

  const resourceOptions = useMemo(() => {
    return (resources ?? []).map(({ id, title }) => ({
      label: title,
      value: id,
    }));
  }, [resources]);

  return (
    <>
      {items.map((item, itemIndex) => (
        <TableRow key={item.id} className="group">
          {durationEnabled && (
            <TableCell className="w-[80px] pl-4">
              <FormField
                control={control}
                name={`sections.${sectionIndex}.items.${itemIndex}.duration`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <>
                        <Label>
                          <AutowidthInput
                            placeholder="0"
                            minWidth={0}
                            className="border-none bg-transparent p-0 outline-none focus-within:!ring-0"
                            type="number"
                            extraWidth={3}
                            {...field}
                            {...register(
                              `sections.${sectionIndex}.items.${itemIndex}.duration`,
                              {
                                valueAsNumber: true,
                              },
                            )}
                          />
                          <small>mins</small>
                        </Label>
                      </>
                    </FormControl>
                    {getErrorMessage(sectionIndex, itemIndex, "duration")}
                  </FormItem>
                )}
              />
            </TableCell>
          )}
          <TableCell
            className={cn(
              durationEnabled
                ? "w-[calc(100%-130px)]"
                : "w-[calc(100%-50px)] pl-4",
            )}
          >
            <FormField
              control={control}
              name={`sections.${sectionIndex}.items.${itemIndex}.resource`}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <ResponsiveCombobox
                      options={resourceOptions}
                      onSelect={(value) => {
                        const selectedResource = resourceOptions.find(
                          (res) => res.value === value,
                        );
                        if (!selectedResource) {
                          return;
                        }
                        form.setValue(
                          `sections.${sectionIndex}.items.${itemIndex}.resource`,
                          selectedResource,
                        );
                      }}
                    >
                      <span
                        className={cn(
                          "block font-medium text-primary underline underline-offset-4 hover:opacity-75",
                          !field.value && "font-normal text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? field.value.label
                          : "Select resource (optional)..."}
                      </span>
                    </ResponsiveCombobox>
                  </FormControl>
                  {getErrorMessage(sectionIndex, itemIndex, "resource")}
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`sections.${sectionIndex}.items.${itemIndex}.text`}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      className="mt-2 border-none bg-transparent p-0 shadow-none outline-none focus-within:!ring-0"
                      placeholder={"Item text (optional)..."}
                    />
                  </FormControl>
                  {getErrorMessage(sectionIndex, itemIndex, "text")}
                </FormItem>
              )}
            />
          </TableCell>
          <TableCell className="w-[50px] pr-2">
            <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
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
                variant="ghost"
                className="shrink-0"
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
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:bg-destructive hover:text-white"
                title="Delete item"
                onClick={() => {
                  remove(itemIndex);
                }}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
      <TableRow>
        {durationEnabled && <TableCell></TableCell>}
        <TableCell
          colSpan={durationEnabled ? 2 : 3}
          className={cn(durationEnabled ? "!p-0" : "!p-0 !pl-4")}
        >
          <Button
            type="button"
            onClick={() => {
              append({
                ...defaultEmptyItem,
              });
            }}
            variant="link"
            className="w-full justify-start px-0 text-muted-foreground hover:text-primary"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Item to Section
          </Button>
        </TableCell>
      </TableRow>
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

  const { data: resources } = api.resource.getAllOnlyIdAndTitle.useQuery();

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

      return {
        ...acc,
        sections: lessonPlan.sections.map((section) => {
          return {
            ...section,
            items: section.items.map((item) => {
              const resource =
                item.resource == null
                  ? undefined
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

  const durationEnabled = watch("useDuration");

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="h-full">
        {previewData ? (
          <>
            <h1 className="mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
              {previewData.title}
            </h1>
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
            <Alert variant="warning" className="mb-4 md:hidden">
              <DesktopIcon className="h-4 w-4" />
              <AlertTitle>Try this page on a larger screen</AlertTitle>
              <AlertDescription>
                The lesson plan editor is not optimised for small screens yet.
              </AlertDescription>
            </Alert>
            <div className="grid h-full items-stretch gap-6 md:grid-cols-[300px_1fr]">
              <div className="flex flex-col space-y-4">
                <FormField
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Title" {...field} />
                      </FormControl>
                      {errors.title?.message && (
                        <FormMessage>{errors.title?.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={2}
                          placeholder={
                            'Theme (eg. "Characters", "Emotions", "Embracing failure", etc.) (optional)'
                          }
                          {...field}
                        />
                      </FormControl>
                      {errors.description && (
                        <FormMessage>{errors.description.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Description (optional)"
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
                  name="visibility"
                  render={({ field }) => (
                    <FormItem className="w-full space-y-3 rounded-md border border-input p-4">
                      <FormLabel>Visibility</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {Object.entries(LessonPlanVisibilityLabels).map(
                            ([visibilityKey, visibilityLabel]) => (
                              <FormItem
                                className="flex items-start space-x-3 space-y-0"
                                key={visibilityKey}
                              >
                                <FormControl>
                                  <RadioGroupItem value={visibilityKey} />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {visibilityLabel.label}
                                  <br />
                                  <span className="mt-1 inline-block text-muted-foreground">
                                    {visibilityLabel.description}
                                  </span>
                                </FormLabel>
                              </FormItem>
                            ),
                          )}
                        </RadioGroup>
                      </FormControl>
                      {errors.visibility && (
                        <FormMessage>{errors.visibility.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="useDuration"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-row items-start space-x-3 space-y-0 rounded-md border border-input p-4">
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
                {sections.length > 0 ? (
                  sections.map((section, sectionIndex) => (
                    <div
                      className="relative mt-8 rounded-md border border-input first:mt-0 has-[thead:hover]:bg-accent"
                      key={section.id}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow className="border-none">
                            <TableHead
                              colSpan={durationEnabled ? 3 : 2}
                              className="p-0"
                            >
                              <div className="flex w-full flex-row gap-4 p-2">
                                <FormField
                                  control={control}
                                  name={`sections.${sectionIndex}.title`}
                                  render={({ field }) => (
                                    <>
                                      <FormItem className="grow">
                                        <FormControl>
                                          <Input
                                            placeholder={`Section ${
                                              sectionIndex + 1
                                            } title (eg. Warm ups, Exercises, Main Activities, Games etc.)`}
                                            className="w-full !border-none p-2 text-lg !shadow-none !outline-none focus-within:!ring-0"
                                            {...field}
                                          />
                                        </FormControl>
                                        {errors.sections?.[sectionIndex]?.title
                                          ?.message && (
                                          <FormMessage>
                                            {
                                              errors.sections?.[sectionIndex]
                                                ?.title?.message
                                            }
                                          </FormMessage>
                                        )}
                                      </FormItem>
                                      <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                          <TooltipTrigger asChild>
                                            <Button
                                              onClick={() => {
                                                removeSection(sectionIndex);
                                              }}
                                              variant="ghost"
                                              size={"icon"}
                                              className="text-destructive hover:bg-destructive hover:text-white"
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-foreground text-background">
                                            <p>
                                              Delete Section
                                              {field.value &&
                                                `: "${field.value}"`}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </>
                                  )}
                                />
                              </div>
                              <Separator />
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="[&>tr>td]:py-4 [&>tr>td]:align-top">
                          <SectionItems
                            sectionIndex={sectionIndex}
                            form={form}
                            resources={resources}
                            durationEnabled={durationEnabled}
                          />
                        </TableBody>
                      </Table>
                    </div>
                  ))
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-md border border-input p-4 md:h-full">
                    <div className="text-md font-bold text-muted-foreground">
                      {" "}
                      Add a{" "}
                      <Popover modal>
                        <PopoverTrigger className="underline decoration-dashed underline-offset-4">
                          section
                        </PopoverTrigger>
                        <PopoverContent className="w-80 space-y-2 text-sm">
                          <p>
                            Each lesson plan is made up of <b>sections</b>.
                            Think of sections as a way to split up your lesson
                            plan into different parts.
                          </p>
                          <p>
                            For example, you might have a section for the
                            warmup, a section for the main exercises, and a
                            section for the performance games.
                          </p>
                          <p>
                            Each section is made up of <b>items</b>. Items are
                            the building blocks of your lesson plan, and they
                            can be linked to resources, or just contain text.
                          </p>
                          <Separator />
                          <p>
                            The easiest way to get started is to build your own
                            lesson plan and see how it works! You can always go
                            back and edit it later.
                          </p>
                        </PopoverContent>
                      </Popover>{" "}
                      to get started!
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex w-full justify-end space-x-2">
              <Button
                type="button"
                onClick={() => {
                  appendSection({
                    ...defaultEmptySection,
                  });
                }}
                variant="outline"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Section
              </Button>
              <Button
                onClick={() => setPreviewData(getValues())}
                type="button"
                variant="outline"
              >
                Preview
              </Button>
              <AreYouSureDialog
                isFormValid={form.formState.isValid}
                dialog="LessonPlanSave"
                description={`We do not condone the use of this website for sharing lesson plans that are not your own. Please only share lesson plans that you have created yourself.`}
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
