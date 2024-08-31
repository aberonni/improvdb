import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { createColumnHelper } from "@tanstack/react-table";
import type { UseTRPCQueryResult } from "@trpc/react-query/shared";

import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { RouterOutputs } from "@/utils/api";

const columnHelper =
  createColumnHelper<RouterOutputs["user"]["getTopContributors"][0]>();

const columns = [
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" className="ml-2" />
    ),
    cell: ({ getValue }) => (
      <span className="ml-2">{getValue() ?? "Anonymous User"}</span>
    ),
  }),
  columnHelper.accessor("_count.resources", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Resources Created" />
    ),
  }),
];

const columnsWithoutSorting = columns.map((column) => ({
  ...column,
  enableSorting: false,
  enableHiding: false,
}));

export const UserList = ({
  useFilters = false,
  usePagination = false,
  queryResult,
}: {
  useFilters?: boolean;
  usePagination?: boolean;
  queryResult: UseTRPCQueryResult<
    RouterOutputs["user"]["getTopContributors"],
    unknown
  >;
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

  const dataTableColumns = useFilters ? columns : columnsWithoutSorting;

  return (
    <DataTable
      columns={dataTableColumns}
      data={data}
      isLoading={isLoading}
      filters={useFilters ? ["title"] : undefined}
      usePagination={usePagination}
      data-testid="user-list"
    />
  );
};
