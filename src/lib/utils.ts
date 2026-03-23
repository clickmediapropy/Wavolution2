import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Combine firstName + lastName into a display name. */
export function getFullName(contact: { firstName?: string; lastName?: string }): string {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
}
