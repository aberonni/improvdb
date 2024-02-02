// Inspired by https://www.jussivirtanen.fi/writing/styling-react-select-with-tailwind
// and https://react-select.com/creatable

import { PlusIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import type { KeyboardEventHandler } from "react";
import { useState } from "react";
import Select from "react-select";
import type { Props } from "react-select";
import CreatableSelect from "react-select/creatable";

import { Button } from "@/components/ui/button";

const controlStyles = {
  base: "flex min-h-9 w-full rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  focus: "outline-none ring-1 ring-ring",
};
const placeholderStyles = "px-3 py-1 text-muted-foreground";
const selectInputStyles = "px-3 py-1 cursor-text";
const valueContainerStyles = "p-1 gap-1";
const singleValueStyles = "px-3 py-1";
const multiValueStyles =
  "bg-accent rounded-md items-center py-0 pl-2 pr-1 gap-1.5";
const multiValueLabelStyles = "leading-6 py-0.5";
const multiValueRemoveStyles =
  "border border-accent bg-background  cursor-pointer hover:bg-red-50 hover:text-destructive text-muted-foreground hover:border-red-300 rounded-md";
const indicatorsContainerStyles = "gap-1";
const clearIndicatorStyles =
  "text-muted-foreground p-1 rounded-md hover:bg-red-50 hover:text-destructive cursor-pointer";
const indicatorSeparatorStyles = "bg-accent";
const dropdownIndicatorStyles =
  "p-1 hover:bg-accent text-muted-foreground rounded-md hover:text-primary mr-1 cursor-pointer";
const menuStyles = "p-1 mt-2 border border-accent bg-background rounded-lg";
const groupHeadingStyles = "ml-3 mt-2 mb-1 text-muted-foreground text-sm";
const optionStyles = {
  base: "hover:cursor-pointer px-3 py-2 rounded-md !text-sm",
  focus: "bg-accent",
  selected:
    "after:content-['✔'] after:ml-2 after:text-green-500 text-muted-foreground",
};
const noOptionsMessageStyles =
  "text-muted-foreground text-sm p-2 bg-accent border border-dashed border-accent rounded-sm";

type MultiSelectDropdownProps = Props & {
  isCreatable?: boolean;
};

interface Option {
  readonly label: string;
  readonly value: string;
}

const createOption = (label: string): Option => ({
  label,
  value: label,
});

export function MultiSelectDropown(props: MultiSelectDropdownProps) {
  const [inputValue, setInputValue] = useState("");

  const addNewOption = () => {
    if (!inputValue) return;
    setInputValue("");
    props.onChange?.([...(props.value as Option[]), createOption(inputValue)], {
      option: undefined,
      removedValue: null,
      action: "select-option",
    });
  };

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (!inputValue) return;
    switch (event.key) {
      case "Enter":
      case "Tab":
        event.preventDefault();
        addNewOption();
    }
  };

  const TagType = props.isCreatable ? CreatableSelect : Select;

  let extraProps = {};

  if (props.isCreatable) {
    extraProps = {
      ...extraProps,
      components: {
        DropdownIndicator: () => (
          <Button
            variant="ghost"
            type="button"
            className="mr-1 h-auto p-0.5"
            aria-hidden="true"
            onClick={addNewOption}
          >
            <PlusIcon className="h-6 w-6 stroke-2" />
          </Button>
        ),
      },
      inputValue: inputValue,
      isClearable: true,
      menuIsOpen: false,
      onInputChange: (newValue: string) => setInputValue(newValue),
      onKeyDown: handleKeyDown,
    };
  }

  return (
    <TagType
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      unstyled
      styles={{
        input: (base) => ({
          ...base,
          "input:focus": {
            boxShadow: "none",
          },
        }),
        // On mobile, the label will truncate automatically, so we want to
        // override that behaviour.
        multiValueLabel: (base) => ({
          ...base,
          whiteSpace: "normal",
          overflow: "visible",
        }),
        control: (base) => ({
          ...base,
          transition: "none",
        }),
      }}
      classNames={{
        control: ({ isFocused }) =>
          clsx(isFocused && controlStyles.focus, controlStyles.base),
        placeholder: () => placeholderStyles,
        input: () => selectInputStyles,
        valueContainer: () => valueContainerStyles,
        singleValue: () => singleValueStyles,
        multiValue: () => multiValueStyles,
        multiValueLabel: () => multiValueLabelStyles,
        multiValueRemove: () => multiValueRemoveStyles,
        indicatorsContainer: () => indicatorsContainerStyles,
        clearIndicator: () => clearIndicatorStyles,
        indicatorSeparator: () => indicatorSeparatorStyles,
        dropdownIndicator: () => dropdownIndicatorStyles,
        menu: () => menuStyles,
        groupHeading: () => groupHeadingStyles,
        option: ({ isFocused, isSelected }) =>
          clsx(
            isFocused && optionStyles.focus,
            isSelected && optionStyles.selected,
            optionStyles.base,
          ),
        noOptionsMessage: () => noOptionsMessageStyles,
      }}
      {...props}
      {...extraProps}
    />
  );
}
