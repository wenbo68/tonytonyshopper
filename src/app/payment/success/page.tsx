"use client";

import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useEffect } from "react";
import Link from "next/link";
import { useGuestCartStore } from "~/app/_hooks/useGuestCart";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const utils = api.useUtils(); // <-- ADD THIS

  // Get guest cart clear function
  const clearGuestCart = useGuestCartStore((state) => state.clearCart);

  const fulfillOrder = api.order.fulfillOrder.useMutation({
    onSuccess: (data) => {
      // Order is fulfilled, now clear carts

      // 1. Clear guest cart (from localStorage)
      clearGuestCart(); //

      // 2. Clear logged-in cart (from tRPC cache)
      utils.cart.get.invalidate(); // <-- ADD THIS
    },
    onError: (error) => {
      console.error("Failed to fulfill order:", error);
    },
  });

  useEffect(() => {
    if (sessionId) {
      // Only run once
      fulfillOrder.mutate({ sessionId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (fulfillOrder.isError) {
    return (
      <>
        <p className="text-xl font-bold text-red-400">
          There was an error confirming your payment.
        </p>
        <p className="">{fulfillOrder.error.message}</p>
        <p className="">
          Please contact support with your session ID: {sessionId}
        </p>
      </>
    );
  }

  if (fulfillOrder.isPending) {
    return (
      <>
        <p className="text-xl font-bold text-gray-300">
          Confirming your payment...
        </p>
        <p className="">Please wait, do not close this page.</p>
      </>
    );
  }

  if (fulfillOrder.isSuccess) {
    return (
      <>
        <p className="text-xl font-bold text-gray-300">
          Thank You For Your Order!
        </p>
        <p className="">
          Your payment was received and your order is being processed.
        </p>
        <Link href="/payment/history" className="text-blue-400 hover:underline">
          View Your Order History
        </Link>
      </>
    );
  }

  // Default state (if no session_id)
  return (
    <>
      <p className="text-xl font-bold text-gray-300">Payment Processed</p>
      <p className="">
        If you're not redirected, please check your order history.
      </p>
      <Link href="/payment/history" className="text-blue-400 hover:underline">
        View Your Order History
      </Link>
    </>
  );
}

// We wrap the component in <Suspense> in layout.tsx or page.tsx,
// but since this is the page itself, we can just export it.
// Next.js 14 handles searchParams this way.
export default function Page() {
  return <SuccessContent />;
}
