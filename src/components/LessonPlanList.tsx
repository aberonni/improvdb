import Link from "next/link";
import type { UseTRPCQueryResult } from "@trpc/react-query/shared";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

import type { RouterOutputs } from "~/utils/api";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./ui/data-table-column-header";
import { DataTable } from "./ui/data-table";

const columns: ColumnDef<RouterOutputs["lessonPlan"]["getMyLessonPlans"][0]>[] =
  [
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
          href={`/lesson-plan/${props.row.original.id}`}
          className="hover:underline"
        >
          {props.getValue<string>()}
        </Link>
      ),
    },
    {
      accessorKey: "theme",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={column.id} />
      ),
    },
    {
      accessorKey: "private",
      header: () => null,
      cell: (props) => {
        return (
          <Badge>{props.getValue<boolean>() ? "Private" : "Public"}</Badge>
        );
      },
    },
  ];

const columnsWithoutSorting = columns.map((column) => ({
  ...column,
  enableSorting: false,
  enableHiding: false,
}));

export const LessonPlanList = ({
  useFilters = false,
  usePagination = false,
  queryResult,
  showPrivateStatus = false,
}: {
  useFilters?: boolean;
  usePagination?: boolean;
  queryResult: UseTRPCQueryResult<
    RouterOutputs["lessonPlan"]["getMyLessonPlans"],
    unknown
  >;
  showPrivateStatus?: boolean;
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

  if (!showPrivateStatus) {
    dataTableColumns = dataTableColumns.filter(
      // @ts-expect-error some bug in tanstack type defs here
      (column) => column.accessorKey !== "private",
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
