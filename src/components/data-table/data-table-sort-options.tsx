"use client";

import { CaretSortIcon } from "@radix-ui/react-icons";
import { type SortingState, type Table } from "@tanstack/react-table";
import { isEqual } from "lodash";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DataTableSortOption = {
  label: string;
  sorting: SortingState;
};

interface DataTableSortOptionsProps<TData> {
  table: Table<TData>;
  sortOptions: DataTableSortOption[];
}

export function DataTableSortOptions<TData>({
  table,
  sortOptions,
}: DataTableSortOptionsProps<TData>) {
  const sorting = table.getState().sorting;
  const current = sortOptions.find((option) =>
    isEqual(option.sorting, sorting),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex h-8">
          <CaretSortIcon className="mr-2 h-4 w-4" />
          {current?.label ?? "Sort"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={current?.label}
          onValueChange={(label) => {
            const option = sortOptions.find((o) => o.label === label);
            if (option) table.setSorting(option.sorting);
          }}
        >
          {sortOptions.map((option) => (
            <DropdownMenuRadioItem key={option.label} value={option.label}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
