import ReactMarkdown from "react-markdown";
import Link from "next/link";
import type * as z from "zod";

import type { RouterOutputs } from "~/utils/api";
import type { ResourceConfiguation, ResourceType } from "@prisma/client";
import { use, useMemo } from "react";
import { lessonPlanCreateSchema, type resourceCreateSchema } from "~/utils/zod";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "./ui/separator";

type ApiLessonPlan = Readonly<RouterOutputs["lessonPlan"]["getById"]>;
type CreationLessonPlan = z.infer<typeof lessonPlanCreateSchema>;
type LessonPlanUnion = ApiLessonPlan | CreationLessonPlan;

type Props = {
  lessonPlan: LessonPlanUnion;
};
export function SingleLessonPlanComponent({ lessonPlan }: Props) {
  const isPreviewItem = (
    item: LessonPlanUnion["sections"][0]["items"][0],
  ): item is CreationLessonPlan["sections"][0]["items"][0] => {
    return !!item.resource && "label" in item.resource;
  };

  return (
    <div className="prose dark:prose-invert">
      <p>{lessonPlan.description}</p>
      {lessonPlan.sections.map((section, index) => (
        <div key={index}>
          <h2>{section.title}</h2>
          {section.items.map((item, itemIndex) => (
            <div key={itemIndex}>
              {isPreviewItem(item)
                ? item.resource?.label
                : item.resource?.title}
              - {item.text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
