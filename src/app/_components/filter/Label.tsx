'use client';

const labelClassMap = {
  // format: 'bg-red-500/20 text-red-300 ring-red-500/30',
  rating: 'bg-amber-500/20 text-amber-300 ring-amber-500/30',
  // packageType: 'bg-lime-500/20 text-lime-300 ring-lime-500/30',
  // rating: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
  // avg: 'bg-sky-500/20 text-sky-300 ring-sky-500/30',
  // count: 'bg-blue-500/20 text-blue-300 ring-blue-500/30',
  // avail: 'bg-indigo-500/20 text-indigo-300 ring-indigo-500/30',
  // list: 'bg-violet-500/20 text-violet-300 ring-violet-500/30',
  order: 'bg-gray-500/20 text-gray-300 ring-gray-500/30',
};

const labelColors = {
  // format: labelClassMap['format'],
  // origin: labelClassMap['origin'],
  // genre: labelClassMap['genre'],
  rating: labelClassMap['rating'],
  // avg: labelClassMap['avg'],
  // count: labelClassMap['count'],
  // avail: labelClassMap['avail'],
  // list: labelClassMap['list'],
  order: labelClassMap['order'],
};

// 1. The Shared Container
export function LabelContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs font-semibold items-center">
      {children}
    </div>
  );
}

// 2. The Clickable Filter Pill
type UnclickableLabelProps = {
  label: string;
  colorType: keyof typeof labelColors;
  className?: string;
};
type ClickableLabelProps = UnclickableLabelProps & {
  onRemove: () => void;
};

export function ClickableLabel({
  label,
  colorType,
  onRemove,
  className,
}: ClickableLabelProps) {
  return (
    <button
      onClick={onRemove}
      className={`cursor-pointer rounded px-[9px] py-0.5 ring-1 ring-inset transition hover:opacity-80 ${labelColors[colorType]} ${className}`}
    >
      {label}
    </button>
  );
}

// 3. The Non-Clickable Order Label
export function UnclickableLabel({
  label,
  colorType,
  className,
}: UnclickableLabelProps) {
  return (
    <span
      className={`rounded px-[9px] py-0.5 ring-1 ring-inset ${labelColors[colorType]} ${className}`}
    >
      {label}
    </span>
  );
}

// 4. The Skeleton Pill for the Fallback
export function LabelSkeleton({ width }: { width: string }) {
  return <div className={`h-6 ${width} rounded bg-gray-700 animate-pulse`} />;
}
