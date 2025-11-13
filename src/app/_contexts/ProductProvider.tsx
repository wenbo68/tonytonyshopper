'use client';

import { createContext, useContext, useMemo } from 'react';

// 1. Define the shape of the context data
interface ProductContextState {
  productId: string;
}

// 2. Create the context with a default value of 'undefined'
const ProductContext = createContext<ProductContextState | undefined>(
  undefined
);

// 3. Create a custom hook for consuming the context
export function useProductContext() {
  const context = useContext(ProductContext);

  // 4. Add a safety check
  if (context === undefined) {
    throw new Error(
      'useProductContext must be used within a ProductContextProvider'
    );
  }

  return context;
}

// 5. (Optional but recommended)
// Create a Provider component to make ReviewSection cleaner
export function ProductProvider({
  productId,
  children,
}: {
  productId: string;
  children: React.ReactNode;
}) {
  // Use useMemo to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({ productId }), [productId]);

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}
