import ReactMarkdown from "react-markdown";
import { useRouter } from "next/router";
import Link from "next/link";
import type * as z from "zod";

import type { RouterOutputs } from "~/utils/api";
import type { ResourceConfiguation, ResourceType } from "@prisma/client";
import { useMemo } from "react";
import { type resourceCreateSchema } from "~/utils/zod";
import { Button } from "./ui/button";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "./ui/separator";

export const ResourceTypeLabels: Record<ResourceType, string> = {
  EXERCISE: "🚀 Warm-up / Exercise",
  SHORT_FORM: "⚡️ Short Form Game",
  LONG_FORM: "🍿 Long Form Format",
};

export const ResourceConfiguationLabels: Record<ResourceConfiguation, string> =
  {
    SCENE: "🎭 Scene with N players",
    WHOLE_CLASS: "♾️ Whole Group",
    SOLO: "🧍 Solo",
    PAIRS: "👯 Pairs",
    GROUPS: "👨‍👨‍👦 Groups",
    CIRCLE: "⭕️ Circle",
  };

type ApiResource = Readonly<RouterOutputs["resource"]["getById"]>;
type CreationResource = z.infer<typeof resourceCreateSchema>;

type Props = {
  resource: ApiResource | CreationResource;
  hideBackToHome?: boolean;
};
export function SingleResourceComponent({ resource, hideBackToHome }: Props) {
  const router = useRouter();

  const subtitle = useMemo(() => {
    if (resource.type !== "EXERCISE") {
      return `${resource.groupSize} players`;
    }

    const confLabel = ResourceConfiguationLabels[resource.configuration];

    switch (resource.configuration) {
      case "SOLO":
      case "PAIRS":
        return confLabel;
      case "SCENE":
        return confLabel.replace("N", resource.groupSize.toString());
      case "GROUPS":
        return `${confLabel} of (minimum) ${resource.groupSize} players`;
      case "WHOLE_CLASS":
      case "CIRCLE":
        return `${confLabel} (minimum ${resource.groupSize} players)`;
    }
  }, [resource]);

  return (
    <article className="w-full">
      <div className="grid h-full items-stretch gap-0 md:grid-cols-[300px_1fr] lg:grid-cols-[400px_1fr]">
        <div className="top-28 col-span-1 flex flex-col space-y-4 self-start  md:sticky md:h-[calc(100vh-theme(spacing.28))]">
          <ScrollArea className="pt-8 md:pb-8 md:pr-16 md:pt-0">
            <div className="space-y-6">
              {!hideBackToHome && (
                <Button
                  variant="link"
                  onClick={() => router.back()}
                  className="h-auto p-0 text-sm"
                >
                  <ArrowLeftIcon className="mr-1 h-4 w-4" />
                  Back
                </Button>
              )}
              <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                {resource.title}
              </h1>
              <h4 className="tracking-tight text-muted-foreground">
                {ResourceTypeLabels[resource.type]}
                <br />
                {subtitle}
              </h4>

              {resource.alternativeNames && (
                <>
                  <Separator />
                  <p>
                    Also known as:
                    <ul className="ml-6 list-disc [&>li]:mt-0">
                      {(typeof resource.alternativeNames === "string"
                        ? resource.alternativeNames.split(";")
                        : resource.alternativeNames.map((name) => name.value)
                      ).map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </p>
                </>
              )}

              {resource.categories && resource.categories.length > 0 && (
                <>
                  <Separator />
                  <p>
                    Categories:
                    <ul className="ml-6 list-disc [&>li]:mt-0">
                      {resource.categories.map((category) => {
                        const name =
                          "category" in category
                            ? category.category.name
                            : category.label;
                        return <li key={name}>{name}</li>;
                      })}
                    </ul>
                  </p>
                </>
              )}

              {resource.relatedResources &&
                resource.relatedResources.length > 0 && (
                  <>
                    <Separator />
                    <p>
                      Related Resources:
                      <ul className="ml-6 list-disc [&>li]:mt-0">
                        {resource.relatedResources.map((resource) => {
                          let id;
                          let label;

                          if ("id" in resource) {
                            id = resource.id;
                            label = resource.title;
                          } else {
                            id = resource.value;
                            label = resource.label;
                          }

                          return (
                            <li key={id}>
                              <Link
                                href={`/resource/${id}`}
                                className="underline hover:opacity-80"
                              >
                                {label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </p>
                  </>
                )}

              {resource.showIntroduction && (
                <>
                  <Separator />
                  <blockquote className="mt-6 border-l-2 pl-6 italic">
                    "{resource.showIntroduction}"
                  </blockquote>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className="mb-6 mt-8 md:mt-20 md:border-l md:border-l-muted md:pl-8">
          <Separator className="mb-8 block md:hidden" />
          <ReactMarkdown
            children={resource.description}
            className="prose prose-zinc max-w-full rounded-md lg:prose-lg dark:prose-invert prose-headings:my-8 prose-h2:scroll-m-20 prose-h2:border-b prose-h2:pb-2 prose-h2:text-3xl prose-h2:font-semibold prose-h2:tracking-tight prose-h2:first:mt-0"
            components={{
              h1: ({ ...props }) => <h2 {...props} />,
              a: ({ href, ref, ...props }) => {
                if (!href || !href.startsWith("resource/")) {
                  return <a href={href} ref={ref} target="_blank" {...props} />;
                }

                return <Link href={"/" + href} {...props} />;
              },
            }}
          />
          {resource.video && (
            <iframe
              className="video mt-6 aspect-video w-full lg:mt-8"
              title="Youtube player"
              sandbox="allow-same-origin allow-forms allow-popups allow-scripts allow-presentation"
              src={`https://youtube.com/embed/${resource.video}?autoplay=0`}
            ></iframe>
          )}
        </div>
      </div>
    </article>
  );
}
