"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { type Table } from "@tanstack/react-table";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { ResourceConfigurationLabels, ResourceTypeLabels } from "../Resource";
import type { ResourceConfiguration, ResourceType } from "@prisma/client";
import { api } from "~/utils/api";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const { data: categories, isLoading: isLoadingCategories } =
    api.category.getAll.useQuery();

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("categories") && (
          <DataTableFacetedFilter
            column={table.getColumn("categories")}
            title="Category"
            options={(categories ?? []).map(({ id, name }) => ({
              label: name,
              value: id,
            }))}
            disabled={isLoadingCategories}
          />
        )}
        {table.getColumn("type") && (
          <DataTableFacetedFilter
            column={table.getColumn("type")}
            title="Type"
            options={Object.keys(ResourceTypeLabels).map((type) => ({
              label: ResourceTypeLabels[type as ResourceType],
              value: type,
            }))}
          />
        )}
        {table.getColumn("configuration") && (
          <DataTableFacetedFilter
            column={table.getColumn("configuration")}
            title="Configuration"
            options={Object.keys(ResourceConfigurationLabels).map(
              (configuration) => ({
                label:
                  ResourceConfigurationLabels[
                    configuration as ResourceConfiguration
                  ],
                value: configuration,
              }),
            )}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
