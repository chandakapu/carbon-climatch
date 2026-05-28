import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indonesian Rupiah (IDR) */
export function formatIdr(v: number): string {
  return `IDR ${v.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}

/** Format a number as US Dollar (USD) */
export function formatUsd(v: number): string {
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/** Format a number with locale-appropriate separators */
export function formatNumber(v: number, locale: string = "en-US", maxDecimals: number = 0): string {
  return v.toLocaleString(locale, { maximumFractionDigits: maxDecimals });
}
