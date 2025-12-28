import toast from "react-hot-toast";
import { colorClassMap } from "~/const";

function CustomToast({
  className,
  message,
}: {
  className: string;
  message: string;
}) {
  return (
    <div className={`rounded px-4 py-2 text-sm ring-1 ring-inset ${className}`}>
      {message}
    </div>
  );
}

export const customToast = {
  loading(message: string) {
    return toast.custom(
      () => (
        <CustomToast
          message={message}
          className={`animate-pulse ${colorClassMap[2]}`}
        />
      ),
      { duration: Infinity },
    );
  },

  success(message: string, id?: string, duration?: number) {
    return toast.custom(
      () => <CustomToast message={message} className={`${colorClassMap[3]}`} />,
      { id, duration: duration ?? 2000 },
    );
  },

  error(message: string, id?: string, duration?: number) {
    return toast.custom(
      () => <CustomToast message={message} className={`${colorClassMap[1]}`} />,
      { id, duration: duration ?? 4000 },
    );
  },
};
