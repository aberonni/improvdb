"use client";

import { type Table } from "@tanstack/react-table";

import { DataTableFilters } from "@/components/data-table/data-table-filters";
import {
  type DataTableSortOption,
  DataTableSortOptions,
} from "@/components/data-table/data-table-sort-options";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filters: string[];
  sortOptions?: DataTableSortOption[];
}

export function DataTableToolbar<TData>({
  table,
  filters,
  sortOptions,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between">
      <DataTableFilters table={table} filters={filters} />
      <div className="ml-auto flex items-center gap-2">
        {sortOptions && (
          <DataTableSortOptions table={table} sortOptions={sortOptions} />
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
