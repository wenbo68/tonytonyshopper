"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { AuthShowcaseFallback } from "../auth/AuthShowcaseFallback";
import { AuthShowcase } from "../auth/AuthShowcase";
import { FaBookmark, FaShop } from "react-icons/fa6";
import { IoSearch } from "react-icons/io5";
import { FaCartPlus } from "react-icons/fa";

export function TopNav() {
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navPosition, setNavPosition] = useState(0);

  const NAVBAR_HEIGHT = 56;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Don't do anything if the user is at the very top of the page
      if (currentScrollY <= 0) {
        setNavPosition(0);
        setLastScrollY(currentScrollY);
        return;
      }

      // Calculate the difference in scroll position
      const scrollDelta = currentScrollY - lastScrollY;

      // Calculate the new position for the navbar
      const newNavPosition = navPosition - scrollDelta;

      // Clamp the position so it doesn't go off-screen
      const clampedNavPosition = Math.max(
        -NAVBAR_HEIGHT,
        Math.min(0, newNavPosition),
      );

      setNavPosition(clampedNavPosition);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, navPosition]);

  return (
    <nav
      className="sticky top-0 z-50 flex h-12 w-full justify-center bg-gray-900 transition-transform duration-0"
      style={{ transform: `translateY(${navPosition}px)` }}
    >
      <div className="flex w-full max-w-[1400px] items-center justify-between px-2">
        <Link
          href="/search"
          className="flex items-center text-center text-sm font-semibold"
        >
          <div className="flex h-8 w-8 items-center justify-center">
            <FaShop size={32} />
          </div>
        </Link>
        <div className="flex h-full items-center gap-6 sm:gap-7 md:gap-8 lg:gap-9 xl:gap-10">
          <Link
            href="/search"
            className="flex items-center text-center text-sm font-semibold hover:text-blue-400"
          >
            {/* <div className="flex h-5 w-5 items-center justify-center">
              <IoSearch size={20} />
            </div> */}
            Search
          </Link>
          <Link
            href="/cart"
            className="flex items-center text-center text-sm font-semibold hover:text-blue-400"
          >
            {/* <div className="flex h-5 w-5 items-center justify-center">
              <FaCartPlus size={20} />
            </div> */}
            Cart
          </Link>
          <Suspense fallback={<AuthShowcaseFallback />}>
            <AuthShowcase />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
