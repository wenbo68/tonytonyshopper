import '~/styles/globals.css';

import { type Metadata } from 'next';
import { Geist } from 'next/font/google';

import { TRPCReactProvider } from '~/trpc/react';

export const metadata: Metadata = {
  title: 'TonyTonyShopper',
  description: 'E-commerce website',
};

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-gray-950 text-gray-400">
        {/* <Suspense fallback={null}> */}
        {/* <ContextProviders> */}
        {/* <TopNav /> */}
        <main className="max-w-2xl mx-auto pt-8 sm:pt-12 md:pt-14 lg:pt-16 xl:pt-18 pb-12 sm:pb-16 md:pb-18 lg:pb-20 xl:pb-22 px-3">
          {children}
        </main>
        {/* <Toaster position="bottom-center" /> */}
        {/* <BotNav /> */}
        {/* </ContextProviders> */}
        {/* </Suspense> */}
      </body>
    </html>
  );
}
