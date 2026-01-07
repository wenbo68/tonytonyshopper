"use client";

import { useState, useRef, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
// import Link from 'next/link';
// import { FaHeart } from 'react-icons/fa6';
import { RiLogoutBoxRLine } from "react-icons/ri";
import { usePathname, useSearchParams } from "next/navigation";
import { FaBookmark } from "react-icons/fa6";
import { FaCoins } from "react-icons/fa";
import { IoIosAdd } from "react-icons/io";
import { MdLibraryAddCheck } from "react-icons/md";
import Link from "next/link";
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Shows a placeholder while the session is being fetched
  if (sessionStatus === "loading") {
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
          const callbackUrl = `${pathname}${params ? `?${params}` : ""}`;
          signIn(undefined, { callbackUrl });
        }}
        // className="cursor-pointer rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-indigo-500"
        className="cursor-pointer text-sm font-semibold text-gray-400 transition hover:text-blue-400"
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
            src={session.user.image ?? "/fallback-avatar.png"}
            alt={session.user.name ?? "User avatar"}
            width={40} // Set to the largest size you want to display for quality
            height={40} // Set to the largest size you want to display for quality
            className="h-9 w-9 rounded-full sm:h-10 sm:w-10" // Responsive classes
          />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 z-10 mt-3 flex w-36 origin-top-right flex-col rounded bg-gray-800 p-1 sm:mt-2.5">
          <Link
            href={"/orders"}
            onClick={() => {
              setDropdownOpen(false);
              // signOut();
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs font-semibold hover:cursor-pointer hover:bg-gray-900 hover:text-blue-400"
          >
            <div className="flex h-4 w-4 items-center justify-center">
              <FaBookmark size={12} />
            </div>
            Order History
          </Link>
          <Link
            href={"/orders/admin"}
            onClick={() => {
              setDropdownOpen(false);
              // signOut();
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs font-semibold hover:cursor-pointer hover:bg-gray-900 hover:text-blue-400"
          >
            <div className="flex h-4 w-4 items-center justify-center">
              <FaCoins size={13} />
            </div>
            Sales History
          </Link>
          <Link
            href={"/product/add"}
            onClick={() => {
              setDropdownOpen(false);
              // signOut();
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs font-semibold hover:cursor-pointer hover:bg-gray-900 hover:text-blue-400"
          >
            <div className="flex h-4 w-4 items-center justify-center">
              <MdLibraryAddCheck size={15} />
            </div>
            Add Product
          </Link>
          <button
            onClick={() => {
              setDropdownOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs font-semibold hover:cursor-pointer hover:bg-gray-900 hover:text-blue-400"
          >
            <div className="flex h-4 w-4 items-center justify-center">
              <RiLogoutBoxRLine size={15} />
            </div>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
