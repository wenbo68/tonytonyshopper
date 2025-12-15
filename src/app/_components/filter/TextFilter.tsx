import type { ReactNode } from "react";

type InputConfig = {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  min?: string | number;
  max?: string | number;
};

type TextFilterProps = {
  label: string;
  inputs: InputConfig[];
  /**
   * Optional element to render next to the inputs.
   * Useful for the mobile toggle button on the first filter.
   */
  action?: ReactNode;
};

export default function TextFilter({ label, inputs, action }: TextFilterProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="font-semibold">{label}</span>
      <div className="flex w-full items-center gap-2">
        {inputs.map((input, idx) => (
          <input
            key={idx}
            type={input.type ?? "text"}
            value={input.value}
            onChange={(e) => input.onChange(e.target.value)}
            placeholder={input.placeholder}
            min={input.min}
            max={input.max}
            className="w-full rounded bg-gray-900 px-3 py-2 outline-none placeholder:text-gray-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        ))}
        {action && <>{action}</>}
      </div>
    </div>
  );
}
