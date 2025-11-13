'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
// import Link from 'next/link';
// import { FaHeart } from 'react-icons/fa6';
import { RiLogoutBoxRLine } from 'react-icons/ri';
import { usePathname, useSearchParams } from 'next/navigation';
// import { MdAddBox } from 'react-icons/md';

export function AuthShowcase() {
  const { data: session, status: sessionStatus } = useSession();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Effect to close the dropdown if a click occurs outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // Shows a placeholder while the session is being fetched
  if (sessionStatus === 'loading') {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-gray-300/10" />
    );
  }

  // User is not logged in
  if (!session) {
    return (
      <button
        onClick={() => {
          const params = searchParams.toString();
          const callbackUrl = `${pathname}${params ? `?${params}` : ''}`;
          signIn(undefined, { callbackUrl });
        }}
        className="rounded bg-blue-600/50 hover:bg-blue-500/50 text-gray-300 px-4 py-2 text-sm font-semibold transition cursor-pointer"
      >
        Login
      </button>
    );
  }

  // User is logged in
  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <div className="flex items-center">
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="cursor-pointer"
        >
          <Image
            src={session.user.image ?? '/fallback-avatar.png'}
            alt={session.user.name ?? 'User avatar'}
            width={40} // Set to the largest size you want to display for quality
            height={40} // Set to the largest size you want to display for quality
            className="rounded-full w-9 h-9 sm:w-10 sm:h-10" // Responsive classes
          />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="z-10 absolute right-0 mt-3 w-36 origin-top-right rounded bg-gray-800 p-2 flex flex-col">
          <button
            onClick={() => {
              setDropdownOpen(false);
              signOut();
            }}
            className="flex items-center gap-2 rounded w-full p-2 text-left text-sm hover:bg-gray-900 hover:text-blue-400"
          >
            <div className="flex items-center justify-center h-4 w-4">
              <RiLogoutBoxRLine size={15} />
            </div>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
