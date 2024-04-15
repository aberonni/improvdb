import { type LessonPlanVisibility, ResourceType } from "@prisma/client";
import {
  MinusIcon,
  OpenInNewWindowIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type * as z from "zod";

import {
  ResourceConfigurationLabels,
  ResourceTypeLabels,
} from "@/components/resource";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/api";
import { type lessonPlanCreateSchema } from "@/utils/zod";

type ApiLessonPlan = Readonly<RouterOutputs["lessonPlan"]["getById"]>;
type CreationLessonPlan = z.infer<typeof lessonPlanCreateSchema>;
type LessonPlanUnion = ApiLessonPlan | CreationLessonPlan;

export const LessonPlanVisibilityLabels: Record<
  LessonPlanVisibility,
  { label: string; description: string }
> = {
  PUBLIC: {
    label: "🌎 Public",
    description:
      "Anyone can view this lesson plan. It will be listed amongst the public lesson plans.",
  },
  UNLISTED: {
    label: "🔗 Unlisted",
    description: "Anyone with the link can view this lesson plan.",
  },
  PRIVATE: {
    label: "🔒 Private",
    description: "Only you can view this lesson plan.",
  },
};

function LessonPlanInfoBox({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow",
        className,
      )}
    >
      <div className="flex-grow">
        <Label>{title}</Label>
        <p className="text-[0.8rem] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function LessonPlanDuration({
  lessonPlan,
  className,
}: {
  lessonPlan: LessonPlanUnion;
  className?: string;
}) {
  const totalDuration = useMemo(() => {
    return lessonPlan.sections.reduce((acc, section) => {
      return (
        acc +
        section.items.reduce((acc, item) => {
          return acc + (item.duration ?? 0);
        }, 0)
      );
    }, 0);
  }, [lessonPlan]);

  return (
    <LessonPlanInfoBox
      title="Total Duration"
      description={`${totalDuration ?? 0} minutes`}
      className={className}
    />
  );
}

export function SingleLessonPlanComponent({
  lessonPlan,
  showAllResourceDescriptions = false,
}: {
  lessonPlan: LessonPlanUnion;
  showAllResourceDescriptions?: boolean;
}) {
  const isPreviewItem = (
    item: LessonPlanUnion["sections"][0]["items"][0],
  ): item is CreationLessonPlan["sections"][0]["items"][0] => {
    return !!item.resource && "label" in item.resource;
  };

  const [showSpecificResourceDescription, setShowSpecificResourceDescription] =
    useState<Record<string, boolean>>({});

  return (
    <div>
      <div className="space-y-2">
        <div className="flex flex-row space-x-4">
          {lessonPlan.theme && (
            <LessonPlanInfoBox
              title="Theme"
              description={lessonPlan.theme}
              className="w-full"
            />
          )}
          {lessonPlan.useDuration && (
            <LessonPlanDuration lessonPlan={lessonPlan} className="w-full" />
          )}
        </div>
        {lessonPlan.description && (
          <LessonPlanInfoBox
            title="Description"
            description={lessonPlan.description}
          />
        )}
      </div>
      {lessonPlan.sections.map((section, sectionIndex) => (
        <Table className="relative mt-8" key={sectionIndex}>
          <TableHeader>
            <TableRow className="border-none">
              <TableHead
                colSpan={lessonPlan.useDuration ? 3 : 2}
                className="sticky top-0 bg-background p-0 text-lg shadow-sm print:relative"
              >
                <span className="block p-2">
                  {section.title
                    ? section.title
                    : `Section ${sectionIndex + 1}`}
                </span>
                <Separator />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&>tr>td]:py-4 [&>tr>td]:align-top">
            {section.items.map((item, itemIndex) => (
              <TableRow key={itemIndex}>
                {item.resource ? (
                  <>
                    {lessonPlan.useDuration && (
                      <TableCell className="w-[70px]">
                        {item.duration ?? 0} <small>mins</small>
                      </TableCell>
                    )}
                    <TableCell
                      className={cn(
                        lessonPlan.useDuration
                          ? "w-[calc(100%-200px)]"
                          : "w-[calc(100%-130px)]",
                      )}
                    >
                      <Collapsible
                        open={
                          showAllResourceDescriptions ||
                          showSpecificResourceDescription[
                            `${sectionIndex}-${itemIndex}`
                          ]
                        }
                        onOpenChange={(open) =>
                          setShowSpecificResourceDescription((s) => ({
                            ...s,
                            [`${sectionIndex}-${itemIndex}`]: open,
                          }))
                        }
                      >
                        <CollapsibleTrigger className="flex items-center text-left font-medium text-primary underline underline-offset-4 hover:opacity-75">
                          {isPreviewItem(item)
                            ? item.resource.label
                            : item.resource.title}
                          {showAllResourceDescriptions ||
                          showSpecificResourceDescription[
                            `${sectionIndex}-${itemIndex}`
                          ] ? (
                            <MinusIcon className="ml-1 inline-block h-4 w-4 shrink-0 print:hidden" />
                          ) : (
                            <PlusIcon className="ml-1 inline-block h-4 w-4 shrink-0 print:hidden" />
                          )}
                        </CollapsibleTrigger>
                        {item.text && (
                          <>
                            <span className="inline-block pt-2">
                              {item.text}
                            </span>
                          </>
                        )}
                        <CollapsibleContent>
                          {!isPreviewItem(item) ? (
                            <>
                              <ReactMarkdown
                                // eslint-disable-next-line react/no-children-prop
                                children={item.resource.description}
                                className="prose-sm prose-zinc mt-4 max-w-full rounded-md border p-4 dark:prose-invert prose-headings:my-8 prose-h2:scroll-m-20 prose-h2:border-b prose-h2:pb-2 prose-h2:text-3xl prose-h2:font-semibold prose-h2:tracking-tight prose-h2:first:mt-0"
                                components={{
                                  h1: ({ ...props }) => <h3 {...props} />,
                                  h2: ({ ...props }) => <h3 {...props} />,
                                  a: ({ href, ref, ...props }) => {
                                    if (!href?.startsWith("resource/")) {
                                      return (
                                        <a
                                          href={href}
                                          ref={ref}
                                          target="_blank"
                                          rel="noreferrer"
                                          {...props}
                                        />
                                      );
                                    }

                                    return (
                                      <Link href={"/" + href} {...props} />
                                    );
                                  },
                                }}
                              />
                              <Link
                                href={`/resource/${item.resource.id}`}
                                className="float-right mt-2 flex items-center underline hover:opacity-75 print:hidden"
                                target="_blank"
                              >
                                <OpenInNewWindowIcon className="mr-1 inline-block h-3 w-3" />
                                Open resource in new tab
                              </Link>
                            </>
                          ) : (
                            <p className="mt-4 w-full rounded-md border p-4 italic text-muted-foreground">
                              In the final lesson plan, this will be
                              automatically populated with the description of "
                              {item.resource.label}".
                            </p>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </TableCell>
                    <TableCell className="w-[130px] text-right">
                      {!isPreviewItem(item) &&
                        (item.resource.type === ResourceType.EXERCISE
                          ? ResourceConfigurationLabels[
                              item.resource.configuration
                            ]
                          : ResourceTypeLabels[item.resource.type])}
                    </TableCell>
                  </>
                ) : (
                  <>
                    {lessonPlan.useDuration && (
                      <TableCell className="w-[70px]">
                        {item.duration ?? 0} <small>mins</small>
                      </TableCell>
                    )}
                    <TableCell className="w-[calc(100%-70px)]" colSpan={2}>
                      {item.text}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ))}
    </div>
  );
}
