"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { EyeOpenIcon } from "@radix-ui/react-icons";
import { type Table } from "@tanstack/react-table";
import { startCase } from "lodash";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@/hooks/use-media-query";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
  /** Columns hidden below md until the visitor picks them (see DataTable) */
  hiddenColumnsOnMobile?: string[];
}

export function DataTableViewOptions<TData>({
  table,
  hiddenColumnsOnMobile = [],
}: DataTableViewOptionsProps<TData>) {
  // Only read once the menu is open, so it never shifts the page
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { columnVisibility } = table.getState();

  const isShown = (columnId: string, isVisible: boolean) =>
    hiddenColumnsOnMobile.includes(columnId) &&
    columnVisibility[columnId] === undefined
      ? isDesktop
      : isVisible;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto flex h-8">
          <EyeOpenIcon className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide(),
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={isShown(column.id, column.getIsVisible())}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {startCase(column.id)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
