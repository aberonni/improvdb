import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { createColumnHelper } from "@tanstack/react-table";
import type { UseTRPCQueryResult } from "@trpc/react-query/shared";
import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { TitleCellContent } from "@/components/data-table/data-table-title-cell-content";
import { LessonPlanVisibilityLabels } from "@/components/lesson-plan";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { RouterOutputs } from "@/utils/api";

const columnHelper =
  createColumnHelper<RouterOutputs["lessonPlan"]["getMyLessonPlans"][0]>();

const columns = [
  columnHelper.accessor("title", {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={column.id}
        className="ml-2"
      />
    ),
    cell: ({ getValue, row, column: { getFilterValue } }) => (
      <Link
        href={`/lesson-plan/${row.original.id}`}
        className="ml-2 hover:underline"
      >
        <TitleCellContent
          title={getValue()}
          filter={getFilterValue() as string}
        />
      </Link>
    ),
  }),
  columnHelper.accessor("theme", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={column.id} />
    ),
  }),
  columnHelper.accessor("visibility", {
    header: () => null,
    cell: (props) => {
      return (
        <div className="text-right">
          <Badge variant="outline">
            {LessonPlanVisibilityLabels[props.getValue()].label}
          </Badge>
        </div>
      );
    },
  }),
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
  showVisibility = false,
}: {
  useFilters?: boolean;
  usePagination?: boolean;
  queryResult: UseTRPCQueryResult<
    RouterOutputs["lessonPlan"]["getMyLessonPlans"],
    unknown
  >;
  showVisibility?: boolean;
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

  if (!showVisibility) {
    dataTableColumns = dataTableColumns.filter(
      (column) => column.accessorKey !== "visibility",
    );
  }

  return (
    <DataTable
      columns={dataTableColumns}
      data={data}
      isLoading={isLoading}
      filters={useFilters ? ["title"] : undefined}
      usePagination={usePagination}
      data-testid="lesson-plan-list"
    />
  );
};
