import { clsx } from "clsx";

/**
 * "TT" lettermark for tonytonyshopper: two T's sharing one bar on an indigo tile.
 * Drawn with plain rectangles so it looks the same everywhere, fonts or not.
 * Keep in sync with src/app/icon.svg (the browser-tab icon).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="tonytonyshopper"
      className={clsx("shrink-0", className)}
    >
      <rect width="64" height="64" rx="14" fill="#4f39f6" />
      <rect x="12" y="16" width="40" height="8" rx="2" fill="#ffffff" />
      <rect x="18" y="16" width="8" height="34" rx="2" fill="#ffffff" />
      <rect x="38" y="16" width="8" height="34" rx="2" fill="#c6d2ff" />
    </svg>
  );
}
