import { uniqBy } from "lodash";
import { type AnchorHTMLAttributes, type RefAttributes, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type * as z from "zod";

import Link from "@/components/link";
import {
  SplitPageLayout,
  SplitPageLayoutContent,
  SplitPageLayoutSidebar,
} from "@/components/page-layout";
import { ResourceFavouriteButton } from "@/components/resource-favourite-button";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { categoryLandingPath, TYPE_LANDING_PAGES } from "@/lib/catalogue";
import { ResourceType } from "@/lib/enums";
import {
  ResourceConfigurationLabels,
  ResourceTypeLabels,
} from "@/lib/resource-labels";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/api";
import { type resourceCreateSchema } from "@/utils/zod";

type ApiResource = Readonly<RouterOutputs["resource"]["getById"]>;
type CreationResource = z.infer<typeof resourceCreateSchema>;

function isApiResource(
  resource: ApiResource | CreationResource,
): resource is ApiResource {
  return "relatedResourceParent" in resource;
}

type Props = {
  resource: ApiResource | CreationResource;
  showProposeChanges?: boolean;
};
export function SingleResourceComponent({
  resource,
  showProposeChanges = false,
}: Props) {
  const alternativeNames = useMemo(
    () =>
      isApiResource(resource)
        ? resource.alternativeNames
        : resource.alternativeNames.map((name) => name.value),
    [resource],
  );

  const relatedResources = useMemo<{ id: string; title: string }[]>(() => {
    if (!isApiResource(resource)) {
      return resource.relatedResources.map(({ value, label }) => ({
        id: value,
        title: label,
      }));
    }

    return uniqBy(
      [...resource.relatedResources, ...resource.relatedResourceParent],
      (resource) => resource.id,
    );
  }, [resource]);

  return (
    <SplitPageLayout>
      <SplitPageLayoutSidebar>
        <div className="space-y-6 md:flex md:min-h-full md:flex-col">
          <ResourceFavouriteButton
            resourceId={resource.id}
            showLabel
            className="w-full"
          />

          <p className="tracking-tight text-muted-foreground">
            {isApiResource(resource) ? (
              <Link
                href={TYPE_LANDING_PAGES[resource.type].path}
                className="hover:underline"
              >
                {ResourceTypeLabels[resource.type]}
              </Link>
            ) : (
              ResourceTypeLabels[resource.type]
            )}
            <br />
            {resource.type !== ResourceType.LONG_FORM &&
              ResourceConfigurationLabels[resource.configuration]}
          </p>

          {alternativeNames.length > 0 && (
            <>
              <Separator />
              <div>
                Also known as:
                <ul className="ml-6 list-disc [&>li]:mt-0">
                  {alternativeNames.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {resource.categories && resource.categories.length > 0 && (
            <>
              <Separator />
              <div>
                Categories:
                <ul className="ml-6 list-disc [&>li]:mt-0">
                  {resource.categories.map((category) => {
                    const { id, name } =
                      "category" in category
                        ? category.category
                        : { id: category.value, name: category.label };
                    return (
                      <li key={id}>
                        {isApiResource(resource) ? (
                          <Link
                            href={categoryLandingPath(id)}
                            className="underline hover:opacity-80"
                          >
                            {name}
                          </Link>
                        ) : (
                          name
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}

          {relatedResources.length > 0 && (
            <>
              <Separator />
              <div>
                Related Games & Exercises:
                <ul className="ml-6 list-disc [&>li]:mt-0">
                  {relatedResources.map(({ id, title }) => {
                    return (
                      <li key={id}>
                        <Link
                          href={`/resource/${id}`}
                          className="underline hover:opacity-80"
                        >
                          {title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
          {"lessonPlans" in resource && resource.lessonPlans.length > 0 && (
            <>
              <Separator />
              <div>
                Lesson Plans:
                <ul className="ml-6 list-disc [&>li]:mt-0">
                  {resource.lessonPlans.map(({ id, title }) => {
                    return (
                      <li key={id}>
                        <Link
                          href={`/lesson-plan/${id}`}
                          className="underline hover:opacity-80"
                        >
                          {title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
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
          {showProposeChanges && (
            <div className="flex w-full flex-row gap-2 md:mt-auto">
              <Link
                href={`/resource/${resource.id}/edit`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "grow text-center",
                )}
              >
                Propose Changes
              </Link>
              <Link
                href={`/resource/${resource.id}/clone`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "grow text-center",
                )}
              >
                Clone
              </Link>
            </div>
          )}
        </div>
      </SplitPageLayoutSidebar>
      <SplitPageLayoutContent>
        {/* Descriptions mostly use ### for their sections, so this keeps the
            heading levels in order after the page's h1 */}
        <h2 className="sr-only">Description</h2>
        <div className="prose prose-zinc max-w-full rounded-md dark:prose-invert lg:prose-lg prose-headings:my-8 prose-h2:scroll-m-20 prose-h2:border-b prose-h2:pb-2 prose-h2:text-3xl prose-h2:font-semibold prose-h2:tracking-tight prose-h2:first:mt-0">
          <ReactMarkdown
            // eslint-disable-next-line react/no-children-prop
            children={resource.description}
            components={{
              h1: ({ ...props }) => <h2 {...props} />,
              a: (
                props: AnchorHTMLAttributes<HTMLAnchorElement> &
                  RefAttributes<HTMLAnchorElement>,
              ) => {
                const { href, ref } = props;
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

                return <Link href={"/" + href} {...props} />;
              },
            }}
          />
        </div>
        {resource.video && (
          <iframe
            className="video mt-6 aspect-video w-full lg:mt-8"
            title="Youtube player"
            sandbox="allow-same-origin allow-forms allow-popups allow-scripts allow-presentation"
            src={`https://youtube.com/embed/${resource.video}?autoplay=0`}
          ></iframe>
        )}
      </SplitPageLayoutContent>
    </SplitPageLayout>
  );
}
