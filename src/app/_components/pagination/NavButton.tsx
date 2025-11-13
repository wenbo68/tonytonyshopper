'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';

// Define the props for our new component
interface NavButtonProps {
  children: ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
  className?: string;
  // If 'href' is provided, it will render a Link, otherwise a button
  href?: string;
  // Accept standard button/link props like 'onClick', 'aria-label', etc.
  [x: string]: any;
}

export function NavButton({
  children,
  isActive = false,
  isDisabled = false,
  className,
  href,
  ...props
}: NavButtonProps) {
  // Base styles that are always applied
  const baseStyle =
    'text-xs font-semibold rounded cursor-pointer h-8 w-8 lg:h-9 lg:w-9 flex items-center justify-center shrink-0 transition-colors';

  // The component type will be a Next.js Link if href is provided, otherwise a button
  const Component = href ? Link : 'button';

  // We need to handle disabled state differently for links vs buttons
  const disabledProps =
    Component === 'button'
      ? { disabled: isDisabled }
      : {
          'aria-disabled': isDisabled,
          // Prevent navigation on disabled links
          onClick: (e: React.MouseEvent) => {
            if (isDisabled) e.preventDefault();
            // Also call any onClick from props if it exists
            if (props.onClick) props.onClick(e);
          },
        };

  return (
    <Component
      // The 'is-active' class is added for the scrolling useEffect querySelector
      className={clsx(
        baseStyle,
        {
          'bg-gray-800 text-blue-400 is-active': isActive,
          'hover:bg-gray-800': !isActive && !isDisabled,
          'text-gray-600 cursor-not-allowed pointer-events-none': isDisabled,
        },
        className // Allows for additional custom classes
      )}
      href={href!} // The '!' asserts href is defined when Component is Link
      {...disabledProps}
      {...props}
    >
      {children}
    </Component>
  );
}
