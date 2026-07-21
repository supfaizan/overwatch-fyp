"use client";

import { Toaster } from "@/components/ui/sonner";

/** Sonner toasts, themed to the OVERWATCH console surfaces. */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface-2 !border-line-2 !text-text-hi !rounded-md font-mono !text-[12px]",
          description: "!text-text-mid",
        },
      }}
    />
  );
}
