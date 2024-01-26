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
} from "@tanstack/react-table";
import { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";

interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data?: TData[];
  usePagination?: boolean;
  useFilters?: boolean;
  isLoading?: boolean;
  hiddenColumnsOnMobile?: (keyof VisibilityState)[];
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  usePagination = false,
  useFilters = false,
  isLoading = false,
  hiddenColumnsOnMobile = [],
}: DataTableProps<TData, TValue>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    if (hiddenColumnsOnMobile.length === 0) return;

    setColumnVisibility((prev) => ({
      ...prev,
      ...Object.fromEntries(
        hiddenColumnsOnMobile
          .filter((key) => !prev[key])
          .map((key) => [key, isDesktop]),
      ),
    }));
  }, [hiddenColumnsOnMobile, isDesktop, setColumnVisibility]);

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: useFilters ? getFilteredRowModel() : undefined,
    getPaginationRowModel: usePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: useFilters ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: useFilters ? getFacetedUniqueValues() : undefined,
  });

  return (
    <div className="space-y-4">
      {useFilters && <DataTableToolbar table={table} />}
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
