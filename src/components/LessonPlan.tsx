import ReactMarkdown from "react-markdown";
import Link from "next/link";
import type * as z from "zod";

import type { RouterOutputs } from "~/utils/api";
import { useMemo } from "react";
import { type lessonPlanCreateSchema } from "~/utils/zod";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { ResourceTypeLabels, getResourceConfigurationLabel } from "./Resource";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

type ApiLessonPlan = Readonly<RouterOutputs["lessonPlan"]["getById"]>;
type CreationLessonPlan = z.infer<typeof lessonPlanCreateSchema>;
type LessonPlanUnion = ApiLessonPlan | CreationLessonPlan;

function LessonPlanInfoBox({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow">
      <div className="flex-grow">
        <Label>{title}</Label>
        <p className="text-[0.8rem] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function LessonPlanDuration({
  lessonPlan,
}: {
  lessonPlan: LessonPlanUnion;
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
    />
  );
}

export function SingleLessonPlanComponent({
  lessonPlan,
  showResourceDescriptions,
}: {
  lessonPlan: LessonPlanUnion;
  showResourceDescriptions?: boolean;
}) {
  const isPreviewItem = (
    item: LessonPlanUnion["sections"][0]["items"][0],
  ): item is CreationLessonPlan["sections"][0]["items"][0] => {
    return !!item.resource && "label" in item.resource;
  };

  return (
    <div>
      <div className="space-y-2">
        {lessonPlan.description && (
          <LessonPlanInfoBox
            title="Description"
            description={lessonPlan.description}
          />
        )}
        {lessonPlan.theme && (
          <LessonPlanInfoBox title="Theme" description={lessonPlan.theme} />
        )}
        <LessonPlanDuration lessonPlan={lessonPlan} />
      </div>
      {lessonPlan.sections.map((section, index) => (
        <Table className="relative mt-8" key={index}>
          <TableHeader>
            <TableRow className="border-none">
              <TableHead
                colSpan={lessonPlan.useDuration ? 3 : 2}
                className="sticky top-0 bg-background p-0 text-lg shadow-sm print:relative"
              >
                <span className="block p-2">
                  {section.title ? section.title : `Section {index + 1}`}
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
                    <TableCell className="w-[calc(100%-200px)]">
                      {isPreviewItem(item) ? (
                        <Link
                          href={`/resource/${item.resource.value}`}
                          className="font-medium text-primary underline underline-offset-4"
                        >
                          {item.resource.label}
                        </Link>
                      ) : (
                        <Link
                          href={`/resource/${item.resource.id}`}
                          className="font-medium text-primary underline underline-offset-4"
                        >
                          {item.resource.title}
                        </Link>
                      )}
                      {item.text && (
                        <>
                          <br />
                          <span className="inline-block pt-2">{item.text}</span>
                        </>
                      )}
                      {showResourceDescriptions && !isPreviewItem(item) && (
                        <>
                          <br />
                          <ReactMarkdown
                            children={item.resource.description}
                            className="prose-sm prose-zinc mt-2 max-w-full rounded-md border p-4 dark:prose-invert prose-headings:my-8 prose-h2:scroll-m-20 prose-h2:border-b prose-h2:pb-2 prose-h2:text-3xl prose-h2:font-semibold prose-h2:tracking-tight prose-h2:first:mt-0"
                            components={{
                              h1: ({ ...props }) => <h3 {...props} />,
                              h2: ({ ...props }) => <h3 {...props} />,
                              a: ({ href, ref, ...props }) => {
                                if (!href || !href.startsWith("resource/")) {
                                  return (
                                    <a
                                      href={href}
                                      ref={ref}
                                      target="_blank"
                                      {...props}
                                    />
                                  );
                                }

                                return <Link href={"/" + href} {...props} />;
                              },
                            }}
                          />
                        </>
                      )}
                    </TableCell>
                    <TableCell className="w-[130px] text-right">
                      {!isPreviewItem(item) &&
                        (item.resource.type === "EXERCISE"
                          ? getResourceConfigurationLabel(item.resource)
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
