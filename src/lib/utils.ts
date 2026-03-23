import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Combine firstName + lastName into a display name. Falls back to deprecated `name` field. */
export function getFullName(contact: { firstName?: string; lastName?: string; name?: string }): string {
  const full = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  return full || contact.name || "";
}
