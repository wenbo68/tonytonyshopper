// src/components/Dropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { IoIosArrowDown } from 'react-icons/io';

// Define the shape of a single dropdown option
type DropdownOption = {
  value: string;
  label: string;
};

// Define the props for our component
type DropdownProps = {
  options: DropdownOption[];
  value: string;
  onChange: (newValue: string) => void;
  className?: string; // Allow passing custom wrapper styles
};

export const Dropdown = ({
  options,
  value,
  onChange,
  className = '',
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Cleanup the event listener on component unmount
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex cursor-pointer items-center justify-between rounded bg-gray-800 px-3 py-2 text-xs font-semibold"
      >
        {/* Display the selected option's label, or a default */}
        <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
        <IoIosArrowDown
          className={`w-5 h-5 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full z-10 mt-2 w-full rounded bg-gray-800 p-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full rounded p-2 text-left text-xs font-semibold hover:bg-gray-900 hover:text-blue-400 ${
                value === option.value ? 'text-blue-400' : ''
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
