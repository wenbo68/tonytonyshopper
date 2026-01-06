"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { customToast } from "./toast";
import { useSessionStorageState } from "../_hooks/useSessionStorage";

export function CheckoutListener() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Get the ID from the URL (if present)
  const urlSessionId = searchParams.get("session_id");
  const isCanceled = searchParams.get("canceled");

  // 2. Create a persistent state backed by sessionStorage
  // This ensures 'sessionId' survives even if the user navigates to a URL without params
  const [sessionId, setSessionId] = useSessionStorageState<string | null>(
    "checkout_session_id",
    null,
  );

  // 3. Sync: If URL has an ID, save it to browser storage
  useEffect(() => {
    if (urlSessionId) {
      setSessionId(urlSessionId);
    }
  }, [urlSessionId, setSessionId]);

  // 4. if sessionId exists in browser storage, check order status in db every 1s (until status is not pending)
  const { data } = api.order.checkOrderStatusByStripeSession.useQuery(
    { sessionId: sessionId ?? "" },
    {
      enabled: !!sessionId,
      refetchInterval: (query) =>
        query?.state?.data?.status === "pending" ? 1000 : false,
    },
  );

  // handle stripe success url
  useEffect(() => {
    if (isCanceled) {
      customToast.success("Payment cancelled.");
      router.replace("/cart"); // replace with clean URL
    }
  }, [isCanceled, router]);

  // handle stripe success url
  const toastIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!sessionId) return;

    if (!toastIdRef.current) {
      toastIdRef.current = customToast.loading("Processing payment...");
    }

    if (data?.status === "paid") {
      customToast.success("Payment succeeded!", toastIdRef.current);
      toastIdRef.current = null;
      setSessionId(null); // <--- STOP LISTENING: Clear storage
      router.replace("/search");
    } else if (data?.status === "abandoned") {
      const message =
        data.reason === "abandoned_payment_failed"
          ? "Payment failed. Try a different card. You've not been charged."
          : data.reason === "abandoned_out_of_stock"
            ? "Item went out of stock. Out-of-stock item set to 0 in cart. You've been refunded."
            : data.reason === "abandoned_code_error"
              ? "System Error. Please try again later. You've been refunded."
              : "Something went wrong. Please try again.";
      customToast.error(message, toastIdRef.current, 5000);
      toastIdRef.current = null;
      setSessionId(null); // <--- STOP LISTENING: Clear storage
      router.replace("/search");
    }
  }, [data, sessionId, router, setSessionId]);

  return null;
}
