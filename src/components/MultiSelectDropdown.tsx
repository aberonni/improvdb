// Inspired by https://www.jussivirtanen.fi/writing/styling-react-select-with-tailwind
// and https://react-select.com/creatable

import clsx from "clsx";
import type { KeyboardEventHandler } from "react";
import { useState } from "react";
import Select from "react-select";
import type { Props } from "react-select";
import CreatableSelect from "react-select/creatable";

const controlStyles = {
  base: "block rounded-md border-0 text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6 border rounded-lg bg-white hover:cursor-pointer !min-h-0",
  focus: "ring-2 ring-inset ring-indigo-600",
};
const placeholderStyles = "text-gray-400 pl-2 py-0.5";
const selectInputStyles = "pl-2 py-0.5";
const valueContainerStyles = "p-1 gap-1";
const singleValueStyles = "leading-7 ml-1 text-red-500";
const multiValueStyles =
  "bg-gray-100 rounded items-center py-0 pl-2 pr-1 gap-1.5";
const multiValueLabelStyles = "leading-6 py-0.5";
const multiValueRemoveStyles =
  "border border-gray-200 bg-white hover:bg-red-50 hover:text-red-800 text-gray-500 hover:border-red-300 rounded-md";
const indicatorsContainerStyles = "p-1 gap-1";
const clearIndicatorStyles =
  "text-gray-500 p-1 rounded-md hover:bg-red-50 hover:text-red-800";
const indicatorSeparatorStyles = "bg-gray-300";
const dropdownIndicatorStyles =
  "p-1 hover:bg-gray-100 text-gray-500 rounded-md hover:text-black";
const menuStyles = "p-1 mt-2 border border-gray-200 bg-white rounded-lg";
const groupHeadingStyles = "ml-3 mt-2 mb-1 text-gray-500 text-sm";
const optionStyles = {
  base: "hover:cursor-pointer px-3 py-2 rounded !text-sm",
  focus: "bg-gray-100 active:bg-gray-200",
  selected:
    "after:content-['✔'] after:ml-2 after:text-green-500 text-gray-500",
};
const noOptionsMessageStyles =
  "text-gray-500 p-2 bg-gray-50 border border-dashed border-gray-200 rounded-sm";

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

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (!inputValue) return;
    switch (event.key) {
      case "Enter":
      case "Tab":
        props.onChange?.(
          [...(props.value as Option[]), createOption(inputValue)],
          {
            option: undefined,
            removedValue: null,
            action: "select-option",
          },
        );
        setInputValue("");
        event.preventDefault();
    }
  };

  const TagType = props.isCreatable ? CreatableSelect : Select;

  let extraProps = {};

  if (props.isCreatable) {
    extraProps = {
      ...extraProps,
      components: {
        DropdownIndicator: null,
      },
      inputValue: inputValue,
      isClearable: true,
      menuIsOpen: false,
      onInputChange: (newValue: string) => setInputValue(newValue),
      onKeyDown: handleKeyDown,
      placeholder: "Type something and press enter...",
    };
  }

  return (
    <div className="w-full rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
      <TagType
        isMulti
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
    </div>
  );
}
