"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  getSortedRowModel,
  type ColumnFiltersState,
  getFilteredRowModel,
  type VisibilityState,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  type RowSelectionState,
  type Row,
  type Updater,
  functionalUpdate,
} from "@tanstack/react-table";
import { startTransition, useEffect, useState } from "react";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { type DataTableSortOption } from "@/components/data-table/data-table-sort-options";
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
import { cn } from "@/lib/utils";

interface DataTableProps<
  TData,
  TValue = unknown,
> extends React.HTMLAttributes<HTMLDivElement> {
  columns: (ColumnDef<TData, TValue> & {
    accessorKey?: string;
  })[];
  data?: TData[];
  usePagination?: boolean;
  filters?: string[];
  sortOptions?: DataTableSortOption[];
  isLoading: boolean;
  hiddenColumnsByDefault?: (keyof VisibilityState)[];
  hiddenColumnsOnMobile?: (keyof VisibilityState)[];
  onSelectionChange?: (selectedRows: Row<TData>[]) => void;
  /** Pass to control filters from outside (e.g. the URL) */
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  /** Pass to control sorting from outside (e.g. the URL) */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /**
   * Render only this many rows at first (in the server HTML and hydration),
   * then the rest in chunks while the browser is idle
   */
  initialRowCount?: number;
}

/** Rows added per idle callback after initialRowCount */
const ROW_CHUNK = 100;

/** requestIdleCallback, or a timeout where it's missing (older Safari) */
function onIdle(callback: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback);
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 1);
  return () => clearTimeout(id);
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  usePagination = false,
  filters,
  sortOptions,
  isLoading,
  hiddenColumnsByDefault = [],
  hiddenColumnsOnMobile = [],
  onSelectionChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  sorting: controlledSorting,
  onSortingChange,
  initialRowCount = Infinity,
  ...props
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalColumnFilters, setInternalColumnFilters] =
    useState<ColumnFiltersState>([]);

  const sorting = controlledSorting ?? internalSorting;
  const columnFilters = controlledColumnFilters ?? internalColumnFilters;

  const setSorting = (updater: Updater<SortingState>) => {
    const next = functionalUpdate(updater, sorting);
    if (onSortingChange) onSortingChange(next);
    else setInternalSorting(next);
  };
  const setColumnFilters = (updater: Updater<ColumnFiltersState>) => {
    const next = functionalUpdate(updater, columnFilters);
    if (onColumnFiltersChange) onColumnFiltersChange(next);
    else setInternalColumnFilters(next);
  };
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => Object.fromEntries(hiddenColumnsByDefault.map((key) => [key, false])),
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  /**
   * Columns in hiddenColumnsOnMobile are hidden below the md breakpoint with
   * CSS, so the server-rendered HTML already fits the screen and nothing
   * shifts after hydration. Once the visitor picks them in the View menu,
   * that choice (kept in columnVisibility) wins over the breakpoint.
   */
  const responsiveClassName = (columnId: string) =>
    hiddenColumnsOnMobile.includes(columnId) &&
    columnVisibility[columnId] === undefined
      ? "hidden md:table-cell"
      : undefined;

  const table = useReactTable({
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
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: filters ? getFilteredRowModel() : undefined,
    getPaginationRowModel: usePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: filters ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: filters ? getFacetedUniqueValues() : undefined,
  });

  /*
   * Hundreds of rows would make the first render and hydration block the
   * main thread for seconds on phones, so only the first rows are rendered
   * up front. The rest follow without any interaction, so search engines
   * still see (and follow) every row's links. Each chunk renders in a
   * transition, which React splits into short tasks.
   */
  const rows = table.getRowModel().rows;
  const [renderedRowCount, setRenderedRowCount] = useState(initialRowCount);
  const isComplete = renderedRowCount >= rows.length;

  useEffect(() => {
    if (isComplete) return;
    return onIdle(() =>
      startTransition(() => setRenderedRowCount((count) => count + ROW_CHUNK)),
    );
  }, [isComplete, renderedRowCount]);

  useEffect(() => {
    if (!onSelectionChange) return;

    onSelectionChange(table.getFilteredSelectedRowModel().rows);
  }, [onSelectionChange, rowSelection, table]);

  return (
    <div
      className="space-y-4"
      data-loaded={!isLoading && isComplete}
      {...props}
    >
      {filters && (
        <DataTableToolbar
          table={table}
          filters={filters}
          sortOptions={sortOptions}
          hiddenColumnsOnMobile={hiddenColumnsOnMobile}
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "capitalize",
                        responsiveClassName(header.column.id),
                      )}
                    >
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
                    <TableCell
                      key={j}
                      className={cn("h-[40px]", responsiveClassName(col.id))}
                    >
                      <Skeleton
                        className="h-[18px]"
                        style={{ width: `${60 + ((i + j) % 3) * 40}px` }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              rows.slice(0, renderedRowCount).map((row) => (
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
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "h-[40px]",
                        responsiveClassName(cell.column.id),
                      )}
                    >
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
