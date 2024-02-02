"use client";

import { type Table } from "@tanstack/react-table";

import { DataTableFilters } from "@/components/data-table/data-table-filters";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filters: string[];
}

export function DataTableToolbar<TData>({
  table,
  filters,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between">
      <DataTableFilters table={table} filters={filters} />
      <DataTableViewOptions table={table} />
    </div>
  );
}
