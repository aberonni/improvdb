"use client";

import type { UseTRPCQueryResult } from "@trpc/react-query/shared";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

import { type ColumnDef } from "@tanstack/react-table";
import { type RouterOutputs } from "~/utils/api";
import { ResourceConfigurationLabels, ResourceTypeLabels } from "./Resource";
import type {
  Category,
  ResourceConfiguration,
  ResourceType,
} from "@prisma/client";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { DataTable } from "~/components/ui/data-table";
import { DataTableColumnHeader } from "~/components/ui/data-table-column-header";
import { cn } from "~/lib/utils";

type CategoriesInResource = { category: Category }[];

const columns: ColumnDef<RouterOutputs["resource"]["getAll"][0]>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={column.id}
        className="ml-2"
      />
    ),
    cell: (props) => (
      <Link
        href={`/resource/${props.row.original.id}`}
        className="hover:underline"
      >
        {props.getValue<string>()}
      </Link>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={column.id} />
    ),
    cell: (props) => ResourceTypeLabels[props.getValue<ResourceType>()],
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue<string>(id));
    },
  },
  {
    accessorKey: "configuration",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={column.id} />
    ),
    cell: (props) =>
      ResourceConfigurationLabels[props.getValue<ResourceConfiguration>()],
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue<string>(id));
    },
  },
  {
    accessorKey: "categories",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={column.id} />
    ),
    cell: (props) => (
      <div className="space-x-2">
        {(props.getValue<CategoriesInResource>() ?? [])
          .sort(({ category: cA }, { category: cB }) =>
            cA.name.localeCompare(cB.name),
          )
          .map(({ category }) => (
            <Badge>{category.name}</Badge>
          ))}
      </div>
    ),
    filterFn: (row, id, value: string[]) => {
      const categories = row.getValue<CategoriesInResource>(id);
      return value.every((v) =>
        categories.find(({ category }) => v === category.id),
      );
    },
  },
  {
    accessorKey: "published",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={column.id} />
    ),
    cell: (props) => {
      const published = props.getValue<boolean>();
      return (
        <Badge
          className={cn(
            "self-start text-white",
            published && "bg-green-700",
            !published && "bg-orange-600",
          )}
        >
          {published ? "Published" : "Pending approval"}
        </Badge>
      );
    },
  },
];

const columnsWithoutSorting = columns.map((column) => ({
  ...column,
  enableSorting: false,
  enableHiding: false,
}));

export const ResourceList = ({
  useFilters = false,
  usePagination = false,
  queryResult,
  showPublishedStatus = false,
}: {
  useFilters?: boolean;
  usePagination?: boolean;
  queryResult: UseTRPCQueryResult<RouterOutputs["resource"]["getAll"], unknown>;
  showPublishedStatus?: boolean;
}) => {
  const { data, isLoading } = queryResult;

  if (!isLoading && !data) {
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

  let dataTableColumns = useFilters ? columns : columnsWithoutSorting;

  if (!showPublishedStatus) {
    dataTableColumns = dataTableColumns.filter(
      // @ts-expect-error some bug in tanstack type defs here
      (column) => column.accessorKey !== "published",
    );
  }

  return (
    <DataTable
      columns={dataTableColumns}
      data={data}
      isLoading={isLoading}
      useFilters={useFilters}
      usePagination={usePagination}
    />
  );
};
