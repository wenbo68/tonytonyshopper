// src/app/_components/Dropdown.tsx
import { useState, useRef, useEffect } from "react";
import { IoIosArrowDown } from "react-icons/io";
import type { DropdownOption } from "~/type";
import { ClickablePill, PillContainer } from "./Pill";

// Define the props for our component
type DropdownProps = {
  options: DropdownOption[];
  value: string | string[];
  onChange: (newValue: string) => void;
  triggerColor?: string;
  menuColor?: string;
  // menuRingColor?: string;
  menuHighlightColor?: string;
};

export const Dropdown = ({
  options,
  value,
  onChange,
  triggerColor,
  menuColor,
  // menuRingColor,
  menuHighlightColor,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMultiSelect = Array.isArray(value);

  // Find the label for the currently selected value (only for single select)
  const selectedOption = isMultiSelect
    ? undefined
    : options.find((option) => option.value === value);

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Cleanup the event listener on component unmount
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div ref={dropdownRef} className={`relative w-full`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex w-full cursor-pointer items-center justify-between rounded ${triggerColor ?? "bg-gray-900"} px-3 py-2 text-xs font-semibold`}
        >
          {/* Display the selected option's label, or "Select..." for multi-select/empty */}
          <span>{selectedOption ? selectedOption.label : ""}</span>
          <IoIosArrowDown
            className={`h-5 w-5 transform transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div
            className={`absolute top-full z-10 mt-1.5 w-full rounded ${menuColor ?? "bg-gray-800"} flex flex-col p-1`}
          >
            {options.map((option) => {
              const isSelected = isMultiSelect
                ? value.includes(option.value)
                : value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    // Only close dropdown on selection if it is NOT multi-select
                    if (!isMultiSelect) setIsOpen(false);
                  }}
                  className={`w-full rounded px-2 ${options.length === 1 ? "py-1.5" : "py-2"} text-left text-xs font-semibold ${menuHighlightColor ?? "hover:bg-gray-900"} hover:text-blue-400 ${
                    isSelected ? "text-blue-400" : ""
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {isMultiSelect && value.length > 0 && (
        <PillContainer>
          {value.map((v) => (
            <ClickablePill
              key={v}
              label={options.find((option) => option.value === v)?.label ?? v}
              color={6}
              onRemove={() => onChange(v)}
            />
          ))}
        </PillContainer>
      )}
    </>
  );
};
