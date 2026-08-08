import type { ResourceConfiguration, ResourceType } from "@prisma/client";
import { Cross2Icon, MixerHorizontalIcon } from "@radix-ui/react-icons";
import {
    type Column,
    type ReactTable,
    type RowData,
    type TableFeatures,
} from "@tanstack/react-table";

import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import {
    ResourceConfigurationLabels,
    ResourceTypeLabels,
} from "@/components/resource";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";

interface DataTableFiltersProps<TData extends RowData> {
  table: ReactTable<TableFeatures, TData>;
  filters: string[];
}

function DataTableFiltersContent<TData extends RowData>({
  table,
  className,
  filters,
}: DataTableFiltersProps<TData> & { className?: string }) {
  const isFiltered = table.state.columnFilters.length > 0;
  const { data: categories, isLoading: isLoadingCategories } =
    api.category.getAll.useQuery();

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
          column={
            table.getColumn("type") as
              | Column<TableFeatures, TData, unknown>
              | undefined
          }
          title="Type"
          options={Object.keys(ResourceTypeLabels).map((type) => ({
            label: ResourceTypeLabels[type as ResourceType],
            value: type,
          }))}
        />
      )}
      {filters.includes("configuration") && (
        <DataTableFacetedFilter
          column={
            table.getColumn("configuration") as
              | Column<TableFeatures, TData, unknown>
              | undefined
          }
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
          column={
            table.getColumn("categories") as
              | Column<TableFeatures, TData, unknown>
              | undefined
          }
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

export function DataTableFilters<TData extends RowData>({
  table,
  filters,
}: DataTableFiltersProps<TData>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <DataTableFiltersContent<TData>
        table={table}
        filters={filters}
      />
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">
          <MixerHorizontalIcon className="mr-2 h-4 w-4" /> Filters
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>
              <MixerHorizontalIcon className="mr-2 inline h-4 w-4" />
              Filters
            </DrawerTitle>
          </DrawerHeader>
          <DataTableFiltersContent<TData>
            table={table}
            filters={filters}
            className="flex-col items-stretch space-x-0 space-y-2 p-4 [&>*]:w-full"
          />
          <DrawerFooter className="pt-4">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
