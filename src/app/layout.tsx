import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

// import { TRPCReactProvider } from '~/trpc/react';
import { ContextProviders } from "./_contexts/ContextProviders";
import { CartMergeHandler } from "./_components/cart/CartMergeHandler";
import { TopNav } from "./_components/nav/TopNav";
import { Toaster } from "react-hot-toast";
import { ProductVariantModal } from "./_components/product/ProductVariantModal";

export const metadata: Metadata = {
  title: "TonyTonyShopper",
  description: "E-commerce website",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="flex flex-col bg-gray-950 text-gray-400">
        {/* <Suspense fallback={null}> */}
        <ContextProviders>
          <CartMergeHandler />
          <ProductVariantModal />
          <TopNav />
          <main className="mx-auto w-full max-w-7xl grow px-2 pt-4 pb-10 sm:pt-5 sm:pb-11 md:pt-6 md:pb-12 lg:pt-7 lg:pb-13 xl:pt-8 xl:pb-14">
            {children}
          </main>
          <Toaster position="bottom-center" />
          {/* <BotNav /> */}
        </ContextProviders>
        {/* </Suspense> */}
      </body>
    </html>
  );
}

// home page is the last things to worry abt

// add filters to sell/order history

// might want optimistic update for adding items to cart

// what happens to order/sell history when a guest user pays?
