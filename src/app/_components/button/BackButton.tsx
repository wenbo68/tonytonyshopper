"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IoMdArrowRoundBack } from "react-icons/io";

export default function BackButton() {
  const [backUrl, setBackUrl] = useState<string>("/");
  const [isMounted, setIsMounted] = useState(false);

  // This effect runs once on the client after the component mounts
  useEffect(() => {
    // 1. Set isMounted to true so the component re-renders with the client-only UI
    setIsMounted(true);

    // 2. Safely access sessionStorage
    const storedUrl = sessionStorage.getItem("previousPageUrl");
    if (storedUrl) {
      setBackUrl(storedUrl);
    }
  }, []); // Empty dependency array ensures it only runs once

  // On the server and during the initial client render, `isMounted` is false,
  // so we render nothing (or a placeholder/skeleton). This ensures no mismatch.
  if (!isMounted) {
    return null; // Or return a skeleton loader
  }

  // After mounting, the component re-renders, and this JSX is returned.
  // This is now happening purely on the client, so there's no hydration mismatch.
  return (
    <Link
      href={backUrl}
      className="inline-flex items-start gap-2 text-sm font-semibold text-gray-400 transition hover:text-blue-400"
    >
      <IoMdArrowRoundBack className="text-[16px] sm:text-[20px]" />
      <span>Back</span>
    </Link>
  );
}
