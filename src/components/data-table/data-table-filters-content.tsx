import type { ResourceConfiguration, ResourceType } from "@prisma/client";
import { Cross2Icon } from "@radix-ui/react-icons";
import { type Table } from "@tanstack/react-table";

import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResourceConfigurationLabels,
  ResourceTypeLabels,
} from "@/lib/resource-labels";
import { cn } from "@/lib/utils";
import { api, PRE_BUILT_STALE_TIME } from "@/utils/api";

export interface DataTableFiltersProps<TData> {
  table: Table<TData>;
  filters: string[];
}

/** The filter inputs, inline on desktop and in a drawer on mobile */
export function DataTableFiltersContent<TData>({
  table,
  className,
  filters,
}: DataTableFiltersProps<TData> & { className?: string }) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const { data: categories, isLoading: isLoadingCategories } =
    api.category.getAll.useQuery(undefined, {
      staleTime: PRE_BUILT_STALE_TIME,
    });

  return (
    <div className={cn("flex flex-1 items-center space-x-2", className)}>
      {filters.includes("title") && (
        <Input
          placeholder="Filter Title..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
      )}
      {filters.includes("type") && (
        <DataTableFacetedFilter
          column={table.getColumn("type")}
          title="Type"
          options={Object.keys(ResourceTypeLabels).map((type) => ({
            label: ResourceTypeLabels[type as ResourceType],
            value: type,
          }))}
        />
      )}
      {filters.includes("configuration") && (
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
      {filters.includes("categories") && (
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
  );
}
