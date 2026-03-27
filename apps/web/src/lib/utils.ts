import { useAuthStore } from "@/stores";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function logout() {
  useAuthStore.getState().removeToken();
  // redirect to login
  window.location.href = "/app/login";
}
