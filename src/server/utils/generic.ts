import type { TRPCClientError } from "@trpc/client";
import { customToast } from "~/app/_components/toast";

export const isValidDate = (dateString: string) => {
  if (!dateString) return true;
  const regex = /^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const toastZodError = (error: any, toastId?: string) => {
  const firstFieldError = (
    Object.values(error.data.zodError.fieldErrors) as string[][]
  )[0]?.[0];

  customToast.error(firstFieldError ?? "Invalid input.", toastId);
};
