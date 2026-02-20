"use client";

import { useToastContext } from "@/components/ui/ToastProvider";

export function useToast() {
  const { pushToast } = useToastContext();

  return {
    info: (message: string) => pushToast(message, "info"),
    success: (message: string) => pushToast(message, "success"),
    error: (message: string) => pushToast(message, "error"),
  };
}
