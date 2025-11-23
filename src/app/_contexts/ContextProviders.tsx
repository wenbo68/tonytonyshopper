// ~/app/providers.tsx

"use client";

import type { ReactNode } from "react";
// import { FilterProvider } from '~/app/_contexts/SearchContext'; // Adjust the import path
import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "./AuthProvider";
import { ReviewFilterProvider } from "./ReviewFilterProvider";
import { ProductFilterProvider } from "./ProductFilterProvider";
// import { AuthProvider } from './AuthContext';
// import { MediaPopupProvider } from './MediaPopupContext';

export function ContextProviders({ children }: { children: ReactNode }) {
  // Since this file starts with "use client",
  // everything in it, including FilterProvider,
  // can safely use client-side hooks.
  return (
    <TRPCReactProvider>
      <AuthProvider>
        <ProductFilterProvider>
          <ReviewFilterProvider>{children}</ReviewFilterProvider>
        </ProductFilterProvider>
      </AuthProvider>
    </TRPCReactProvider>
  );
}
