"use client";

import {
  type ColumnDef,
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_arrIncludesAll,
  filterFn_arrIncludesSome,
  filterFn_includesString,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  stockFeatures,
  tableFeatures,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type TableFeatures,
  useTable
} from "@tanstack/react-table";
import { useEffect, useState } from "react";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface DataTableProps<TData extends RowData>
  extends React.HTMLAttributes<HTMLDivElement> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ReadonlyArray<ColumnDef<TableFeatures, TData, any>>;
  data?: TData[];
  usePagination?: boolean;
  filters?: string[];
  isLoading: boolean;
  hiddenColumnsByDefault?: (keyof ColumnVisibilityState)[];
  hiddenColumnsOnMobile?: (keyof ColumnVisibilityState)[];
  onSelectionChange?: (selectedRows: Row<TableFeatures, TData>[]) => void;
}

function buildInitialColumnVisibility(
  hiddenColumnsByDefault: (keyof ColumnVisibilityState)[],
  hiddenColumnsOnMobile: (keyof ColumnVisibilityState)[],
  isDesktop: boolean,
): ColumnVisibilityState {
  const visibility: ColumnVisibilityState = {};

  for (const columnKey of hiddenColumnsOnMobile) {
    visibility[columnKey] = isDesktop;
  }

  for (const columnKey of hiddenColumnsByDefault) {
    visibility[columnKey] = false;
  }

  return visibility;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  usePagination = false,
  filters,
  isLoading,
  hiddenColumnsByDefault = [],
  hiddenColumnsOnMobile = [],
  onSelectionChange,
  ...props
}: DataTableProps<TData>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(
    () =>
      buildInitialColumnVisibility(
        hiddenColumnsByDefault,
        hiddenColumnsOnMobile,
        isDesktop,
      ),
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const features = tableFeatures({
    ...stockFeatures,
    rowSortingFeature,
    rowSelectionFeature,
    rowPaginationFeature,
    columnVisibilityFeature,
    columnFilteringFeature,
    columnFacetingFeature,
    sortedRowModel: createSortedRowModel(),
    filteredRowModel: createFilteredRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    facetedRowModel: createFacetedRowModel(),
    facetedUniqueValues: createFacetedUniqueValues(),
    filterFns: {
      arrIncludes: filterFn_arrIncludes,
      arrIncludesAll: filterFn_arrIncludesAll,
      arrIncludesSome: filterFn_arrIncludesSome,
      includesString: filterFn_includesString,
    },
  });

  const table = useTable({
    features,
    data: data ?? [],
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
  });

  useEffect(() => {
    if (!onSelectionChange) return;

    onSelectionChange(table.getFilteredSelectedRowModel().rows);
  }, [onSelectionChange, rowSelection, table]);

  return (
    <div className="space-y-4" data-loaded={!isLoading} {...props}>
      {filters && <DataTableToolbar table={table} filters={filters} />}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="capitalize">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {table.getVisibleFlatColumns().map((col, j) => (
                    <TableCell key={j} className="h-[40px]">
                      <Skeleton
                        className="h-[18px]"
                        style={{ width: `${60 + ((i + j) % 3) * 40}px` }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() =>
                    onSelectionChange &&
                    row.toggleSelected(!row.getIsSelected())
                  }
                  className={cn(onSelectionChange && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-[40px]">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {usePagination && <DataTablePagination table={table} />}
    </div>
  );
}
