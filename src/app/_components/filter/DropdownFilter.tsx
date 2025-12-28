"use client";

import { useRef, useState, useEffect } from "react";
import { IoIosArrowDown } from "react-icons/io";
import type { FilterOption, FilterGroupOption } from "~/type";

type DropdownFilterProps = {
  label: string;
  placeholder?: string;
} & (
  | {
      mode: "single";
      value: string;
      onChange: (value: string) => void; // Changed from Dispatch<SetStateAction<...>>
    }
  | {
      mode: "multi";
      value: string[];
      onChange: (value: string[]) => void; // Changed from Dispatch<SetStateAction<...>>
    }
) &
  (
    | { options: FilterGroupOption[]; isGroupOptions: true }
    | { options: FilterOption[]; isGroupOptions: false }
  );

export default function DropdownFilter(props: DropdownFilterProps) {
  const { label, options, isGroupOptions, placeholder, mode, value, onChange } =
    props;

  const [writtenText, setWrittenText] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to handle "clicking away"
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setWrittenText("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Smarter filtering logic
  const searchText = writtenText.toLowerCase();
  const filteredOptions = isGroupOptions
    ? options
        .map((group) => {
          const groupLabelMatches = group.groupLabel
            .toLowerCase()
            .includes(searchText);
          const matchingOptions = group.options.filter((option) =>
            option.label.toLowerCase().includes(searchText),
          );

          if (groupLabelMatches) return group;
          if (matchingOptions.length > 0)
            return { ...group, options: matchingOptions };
          return null;
        })
        .filter((group): group is FilterGroupOption => group !== null)
    : options.filter((option) =>
        option.label.toLowerCase().includes(searchText),
      );

  const handleSelectOption = (option: FilterOption) => {
    if (mode === "single") {
      // 1. Single Mode: Just pass the new value directly
      onChange(option.urlInput);
      setWrittenText("");
      setTimeout(() => {
        setIsDropdownOpen(false);
      }, 50);
    } else {
      // 2. Multi Mode: Calculate the new array here, then pass it up
      // We use 'value' (from props) instead of 'prev' (from state callback)
      const currentSelectionSet = new Set(value);

      if (currentSelectionSet.has(option.urlInput)) {
        currentSelectionSet.delete(option.urlInput);
      } else {
        currentSelectionSet.add(option.urlInput);
      }

      // Send the final array to the parent
      onChange(Array.from(currentSelectionSet));
    }
  };

  return (
    <div className="relative flex w-full flex-col gap-2">
      <div className="flex w-full items-baseline gap-2">
        <label className="font-semibold">{label}</label>
      </div>
      <div ref={containerRef}>
        <div className="flex w-full items-center rounded bg-gray-900">
          <input
            type="text"
            value={writtenText}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              setWrittenText(e.target.value);
              setIsDropdownOpen(true);
            }}
            placeholder={placeholder ?? `Filter ${label.toLowerCase()}...`}
            className="w-full pl-3 outline-none"
          />
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="cursor-pointer p-2"
          >
            <IoIosArrowDown
              className={`h-5 w-5 transform transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
        {isDropdownOpen && (
          <div className="scrollbar-thin absolute top-full z-20 mt-1.5 flex max-h-96 w-full flex-col overflow-y-auto rounded bg-gray-800 p-1 text-xs font-semibold">
            {isGroupOptions
              ? (filteredOptions as FilterGroupOption[]).map((group) => (
                  <div key={group.groupLabel}>
                    <div className="p-1 text-xs text-gray-500 uppercase">
                      {group.groupLabel}
                    </div>
                    {group.options.map((option) => (
                      <button
                        key={option.urlInput}
                        onClick={() => handleSelectOption(option)}
                        className={`w-full cursor-pointer rounded p-2 pl-5 text-left hover:bg-gray-900 hover:text-blue-400 ${
                          String(value) === String(option.urlInput)
                            ? "text-blue-400"
                            : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ))
              : (filteredOptions as FilterOption[]).map((option) => (
                  <button
                    key={option.urlInput}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full cursor-pointer rounded px-2 ${filteredOptions.length === 1 ? "py-1.5" : "py-2"} text-left hover:bg-gray-900 hover:text-blue-400 ${
                      mode === "multi" &&
                      value.some(
                        (item) => String(item) === String(option.urlInput),
                      )
                        ? "text-blue-400"
                        : ""
                    } ${
                      mode === "single" &&
                      String(value) === String(option.urlInput)
                        ? "text-blue-400"
                        : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
