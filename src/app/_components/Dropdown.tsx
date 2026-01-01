// src/components/Dropdown.tsx
import { useState, useRef, useEffect } from "react";
import { IoIosArrowDown } from "react-icons/io";
import type { DropdownOption } from "~/type";

// Define the props for our component
type DropdownProps = {
  options: DropdownOption[];
  value: string;
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

  // Find the label for the currently selected value
  const selectedOption = options.find((option) => option.value === value);

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
    <div ref={dropdownRef} className={`relative w-full`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full cursor-pointer items-center justify-between rounded ${triggerColor ?? "bg-gray-900"} px-3 py-2 text-xs font-semibold`}
      >
        {/* Display the selected option's label, or a default */}
        <span>{selectedOption ? selectedOption.label : "Select..."}</span>
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
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full rounded px-2 ${options.length === 1 ? "py-1.5" : "py-2"} text-left text-xs font-semibold ${menuHighlightColor ?? "hover:bg-gray-900"} hover:text-blue-400 ${
                value === option.value ? "text-blue-400" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
