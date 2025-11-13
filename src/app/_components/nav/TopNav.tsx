"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { AuthShowcaseFallback } from "../auth/AuthShowcaseFallback";
import { AuthShowcase } from "../auth/AuthShowcase";

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
      <div className="flex w-full max-w-7xl items-center justify-end gap-4 px-3 sm:gap-5 sm:px-3 md:gap-6 md:px-4 lg:gap-7 lg:px-5 xl:gap-8 xl:px-6">
        <div className="flex h-full items-center gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8">
          <Link
            href="/cart"
            onClick={() => sessionStorage.setItem("previousPageUrl", "/cart")}
            className="flex items-center text-center text-sm font-semibold hover:text-blue-400"
          >
            Cart
          </Link>
          {/* <Link
            href="/services"
            onClick={() =>
              sessionStorage.setItem('previousPageUrl', '/services')
            }
            className="flex items-center text-center text-sm font-semibold hover:text-blue-400"
          >
            Services
          </Link> */}
        </div>
        <Suspense fallback={<AuthShowcaseFallback />}>
          <AuthShowcase />
        </Suspense>
      </div>
    </nav>
  );
}
