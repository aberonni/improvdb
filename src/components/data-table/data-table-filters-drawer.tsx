import { MixerHorizontalIcon } from "@radix-ui/react-icons";

import {
  DataTableFiltersContent,
  type DataTableFiltersProps,
} from "@/components/data-table/data-table-filters-content";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

/** The mobile filters drawer; loaded on first open (see DataTableFilters) */
export default function DataTableFiltersDrawer<TData>({
  open,
  onOpenChange,
  ...props
}: DataTableFiltersProps<TData> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>
              <MixerHorizontalIcon className="mr-2 inline h-4 w-4" />
              Filters
            </DrawerTitle>
          </DrawerHeader>
          <DataTableFiltersContent
            {...props}
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
