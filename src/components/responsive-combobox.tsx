// https://ui.shadcn.com/docs/components/combobox
"use client";

import type { Command as CommandPrimitive } from "cmdk";
import * as React from "react";
import { useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";

type Option = {
  value: string;
  label: string;
};

export interface ResponsiveComboboxProps
  extends Required<React.PropsWithChildren>,
    Omit<
      React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>,
      "children"
    > {
  options: Option[];
}

export function ResponsiveCombobox({
  children,
  options,
  onSelect,
  ...props
}: ResponsiveComboboxProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  function onSelectOption(value: string) {
    setOpen(false);
    onSelect?.(value);
  }

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <OptionList onSelect={onSelectOption} options={options} {...props} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <OptionList onSelect={onSelectOption} options={options} {...props} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface OptionListProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> {
  options: Option[];
}

const OptionList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  OptionListProps
>(({ options, ...props }, ref) => (
  <Command>
    <CommandInput placeholder="Filter options..." />
    <CommandList>
      <CommandEmpty>No options found.</CommandEmpty>
      <CommandGroup>
        {options.map((option) => (
          <CommandItem
            key={option.value}
            value={option.value}
            ref={ref}
            {...props}
          >
            {option.label}
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  </Command>
));
