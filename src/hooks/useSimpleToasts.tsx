import { toast, Toaster } from "sonner";
import type React from "react";
import { useTheme } from "@/contexts/ThemeContext";

export type ToastOpts = {
  description?: React.ReactNode;
  duration?: number; // ms
};

export function AppToaster() {
  const { dark } = useTheme(); 
  return <Toaster theme={dark ? "dark" : "light"} position="top-right" richColors closeButton />;
}

export function useSimpleToasts() {
  const show = (message: React.ReactNode, opts?: ToastOpts) =>
    toast(message, opts);

  const success = (message: React.ReactNode, opts?: ToastOpts) =>
    toast.success(message, opts);

  const error = (message: React.ReactNode, opts?: ToastOpts) =>
    toast.error(message, opts);

  const info = (message: React.ReactNode, opts?: ToastOpts) =>
    toast.info(message, opts);

  const warning = (message: React.ReactNode, opts?: ToastOpts) =>
    toast.warning(message, opts);

  return {
    show,
    success,
    error,
    info,
    warning,
  };
}
