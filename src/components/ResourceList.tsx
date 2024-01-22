import Link from "next/link";
import type { UseTRPCQueryResult } from "@trpc/react-query/shared";
import clsx from "clsx";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ExclamationTriangleIcon, EyeClosedIcon } from "@radix-ui/react-icons";

import type { RouterOutputs } from "~/utils/api";
import { ResourceTypeLabels } from "./Resource";
import { Skeleton } from "./ui/skeleton";

export const ResourceList = ({
  filter,
  queryResult,
  noResourcesMessage = "No resources found.",
  showPublishedStatus = false,
}: {
  queryResult: UseTRPCQueryResult<RouterOutputs["resource"]["getAll"], unknown>;
  filter?: (resource: RouterOutputs["resource"]["getAll"][0]) => boolean;
  showPublishedStatus?: boolean;
  noResourcesMessage?: string;
}) => {
  const { data, isLoading } = queryResult;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1">
        {" "}
        {Array.from({ length: 5 }).map((_) => (
          <div className="flex w-full items-center rounded-lg border bg-background px-4 py-3 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
            <div className="grow">
              <Skeleton className="mb-2 h-4 w-[250px]" />
              <Skeleton className="h-3 w-[200px]" />
            </div>
            <Skeleton className="inline-flex h-5 w-16 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Oh no!</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try reloading the page.
        </AlertDescription>
      </Alert>
    );
  }

  const resources = !filter ? data : data.filter(filter);

  if (resources.length === 0) {
    return (
      <Alert>
        <EyeClosedIcon className="h-4 w-4" />
        <AlertTitle>No resources found.</AlertTitle>
        <AlertDescription>{noResourcesMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {resources.map((resource) => (
        <Link
          key={resource.id}
          className="flex w-full flex-row items-center rounded-lg border bg-background px-4 py-3 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          href={`/resource/${resource.id}`}
        >
          <div className="grow">
            <h3 className="font-medium leading-none tracking-tight">
              {resource.title}
            </h3>
            {resource.categories.length > 0 && (
              <p className="mt-1.5 text-sm leading-none text-muted-foreground">{`Categories: ${resource.categories
                .map(({ category }) => category.name)
                .join(", ")}`}</p>
            )}
          </div>
          {showPublishedStatus ? (
            <Badge
              className={clsx(
                "self-start text-white",
                resource.published && "bg-green-700",
                !resource.published && "bg-orange-600",
              )}
            >
              {resource.published ? "Published" : "Pending approval"}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-nowrap">
              <span className="hidden md:block">
                {ResourceTypeLabels[resource.type]}
              </span>
              <span className="block md:hidden">
                {ResourceTypeLabels[resource.type].split(" ")[0]}
              </span>
            </Badge>
          )}
        </Link>
      ))}
    </div>
  );
};
