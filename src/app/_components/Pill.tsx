"use client";

import { colorClassMap } from "~/const";

// 1. The Shared Container
export function PillContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      {children}
    </div>
  );
}

// 2. The Skeleton Pill for the Fallback
export function PillSkeleton({ width }: { width: string }) {
  return <div className={`h-6 ${width} animate-pulse rounded bg-gray-700`} />;
}

// 3. The Base Props
type UnclickablePillProps = {
  label: string;
  color: keyof typeof colorClassMap;
  className?: string;
};

// 4. The Non-Clickable Pill (Label)
export function UnclickablePill({
  label,
  color,
  className,
}: UnclickablePillProps) {
  return (
    <span
      className={`rounded px-[9px] py-0.5 ring-1 ring-inset ${colorClassMap[color]} ${className}`}
    >
      {label}
    </span>
  );
}

// 5. The Clickable Pill (Action/Remove)
type ClickablePillProps = UnclickablePillProps & {
  onRemove: () => void;
};

export function ClickablePill({
  label,
  color,
  onRemove,
  className,
}: ClickablePillProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className={`cursor-pointer rounded px-[9px] py-0.5 ring-1 transition ring-inset hover:opacity-80 ${colorClassMap[color]} ${className}`}
    >
      {label}
    </button>
  );
}
