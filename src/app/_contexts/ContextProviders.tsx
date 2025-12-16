"use client";

import type { ReactNode } from "react";
import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "./AuthProvider";

export function ContextProviders({ children }: { children: ReactNode }) {
  return (
    <TRPCReactProvider>
      <AuthProvider>{children}</AuthProvider>
    </TRPCReactProvider>
  );
}
