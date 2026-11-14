import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import dynamic from "next/dynamic";
import { useState } from "react";

import {
  DataTableFiltersContent,
  type DataTableFiltersProps,
} from "@/components/data-table/data-table-filters-content";
import type DataTableFiltersDrawerComponent from "@/components/data-table/data-table-filters-drawer";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

// The drawer library is only needed once a mobile visitor opens it
const DataTableFiltersDrawer = dynamic(
  () => import("@/components/data-table/data-table-filters-drawer"),
  { ssr: false },
) as typeof DataTableFiltersDrawerComponent;

/**
 * Inline filters on desktop, a "Filters" button opening a drawer on mobile.
 * Which one shows is decided by CSS, so the server-rendered HTML fits the
 * screen. On mobile the hidden inline filters are then removed, so the
 * drawer's inputs are the only ones on the page.
 */
export function DataTableFilters<TData>(props: DataTableFiltersProps<TData>) {
  const isDesktop = useMediaQuery("(min-width: 768px)", true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoaded, setDrawerLoaded] = useState(false);

  return (
    <>
      {isDesktop && (
        <DataTableFiltersContent {...props} className="hidden md:flex" />
      )}
      <Button
        variant="outline"
        className="md:hidden"
        onClick={() => {
          setDrawerLoaded(true);
          setDrawerOpen(true);
        }}
      >
        <MixerHorizontalIcon className="mr-2 h-4 w-4" /> Filters
      </Button>
      {drawerLoaded && (
        <DataTableFiltersDrawer
          {...props}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}
    </>
  );
}
