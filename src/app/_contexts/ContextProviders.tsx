// ~/app/providers.tsx

"use client";

import type { ReactNode } from "react";
// import { FilterProvider } from '~/app/_contexts/SearchContext'; // Adjust the import path
import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "./AuthProvider";
import { ReviewFilterProvider } from "./filter/ReviewFilterProvider";
import { ProductFilterProvider } from "./filter/ProductFilterProvider";
import { OrderFilterProvider } from "./filter/OrderFilterProvider";
import { AdminOrderFilterProvider } from "./filter/AdminOrderFilterProvider";
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
          <AdminOrderFilterProvider>
            <OrderFilterProvider>
              <ReviewFilterProvider>{children}</ReviewFilterProvider>
            </OrderFilterProvider>
          </AdminOrderFilterProvider>
        </ProductFilterProvider>
      </AuthProvider>
    </TRPCReactProvider>
  );
}
