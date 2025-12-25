import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

// import { TRPCReactProvider } from '~/trpc/react';
import { ContextProviders } from "./_contexts/ContextProviders";
import { TopNav } from "./_components/nav/TopNav";
import { Toaster } from "react-hot-toast";
import { ProductVariantModal } from "./_components/modal/ProductVariantModal";
import { CartMergeHandler } from "./_components/CartMergeHandler";

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
          {/* we don't use zustand for order modal bc its only used directly in the orders & orders/admin page */}
          <ProductVariantModal />
          <TopNav />
          <main className="mx-auto w-full max-w-7xl grow px-2 pt-4 pb-10 sm:pt-5 sm:pb-11 md:pt-6 md:pb-12 lg:pt-7 lg:pb-13 xl:pt-8 xl:pb-14">
            {children}
          </main>
          <Toaster
            position="bottom-center"
            // toastOptions={{
            //   style: {
            //     // background: "#111827", // gray-900
            //     background: "#1e2939", // gray-800
            //     // color: "#f9fafb", // gray-50
            //     color: "#99a1af", // gray-400
            //   },
            // }}
          />
          {/* <BotNav /> */}
        </ContextProviders>
        {/* </Suspense> */}
      </body>
    </html>
  );
}

// home page is the last things to worry abt

// might want optimistic update for adding items to cart

// enable users to add images/videos to reviews
// add review filter for reviews with images/videos
// in review, add rating distribution under star rating. put this on the left side, then add list of images/videos on the right side
// in review, wait for invalidate. Also check flags (isloading vs isfetching, etc.)

// add item option filter to orders
// enable entering multiple item names and option pairs

// why we can input -1 in filter inputs when min is 0?

// how to handle discounts, subscriptions?

// implement return

// just get rid of guest purchase (they have to provide name and email at checkout anyway)
// reasoning: hard to handle pending orders in db from guests
