"use client";

import type { UseTRPCQueryResult } from "@trpc/react-query/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { type RouterOutputs } from "@/utils/api";
import { ResourceConfigurationLabels, ResourceTypeLabels } from "./resource";
import type { ResourceConfiguration, ResourceType } from "@prisma/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { cn } from "@/lib/utils";

type CategoriesInResource =
  RouterOutputs["resource"]["getAll"][0]["categories"];

function getColumns({
  showPublishedStatus,
  showEditProposals,
  showSelection,
  useFilters,
}: {
  showPublishedStatus: boolean;
  showEditProposals: boolean;
  showSelection: boolean;
  useFilters: boolean;
}) {
  const columns: (ColumnDef<RouterOutputs["resource"]["getAll"][0]> & {
    accessorKey?: string;
  })[] = [
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {(props.getValue<CategoriesInResource>() ?? [])
            .sort(({ name: a }, { name: b }) => a.localeCompare(b))
            .map(({ id, name }) => (
              <Badge key={id}>{name}</Badge>
            ))}
        </div>
      ),
      filterFn: (row, columnId, value: string[]) => {
        const categories = row.getValue<CategoriesInResource>(columnId);

        return value.some((v) => categories.find(({ id }) => v === id));
      },
      getUniqueValues: (row) => {
        return row.categories.map(({ id }) => id);
      },
    },
  ];

  if (showPublishedStatus) {
    columns.push({
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
            {published ? "Published" : "Pending"}
          </Badge>
        );
      },
    });
  }

  if (showEditProposals) {
    columns.push({
      accessorKey: "editProposalOriginalResourceId",
      header: () => null,
      cell: (props) => {
        const originalResourceId = props.getValue<string>();
        return originalResourceId && <Badge>Proposal</Badge>;
      },
    });
  }

  if (showSelection) {
    columns.unshift({
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={column.id}
          className="ml-2"
        />
      ),
      cell: (props) => props.getValue<string>(),
    });

    columns.unshift({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    });
  } else {
    columns.unshift({
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
    });
  }

  return useFilters
    ? columns
    : columns.map((column) => ({
        ...column,
        enableSorting: false,
        enableHiding: false,
      }));
}

export const ResourceList = ({
  useFilters = false,
  usePagination = false,
  queryResult,
  showPublishedStatus = false,
  showEditProposals = false,
  onSelectionChange,
}: {
  useFilters?: boolean;
  usePagination?: boolean;
  queryResult: UseTRPCQueryResult<RouterOutputs["resource"]["getAll"], unknown>;
  showPublishedStatus?: boolean;
  showEditProposals?: boolean;
  onSelectionChange?: (
    selectedRows: Row<RouterOutputs["resource"]["getAll"][0]>[],
  ) => void;
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

  const columns = getColumns({
    showPublishedStatus,
    showEditProposals,
    showSelection: !!onSelectionChange,
    useFilters,
  });

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      useFilters={useFilters}
      usePagination={usePagination}
      hiddenColumnsOnMobile={["categories", "configuration"]}
      onSelectionChange={onSelectionChange}
    />
  );
};