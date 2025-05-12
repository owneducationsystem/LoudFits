import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values into a single className string
 * Uses clsx for conditional classes and tailwind-merge to handle Tailwind CSS class conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a price value to a currency string
 */
export function formatPrice(price: number | string): string {
  const amount = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Creates a delay for the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncates a string to the specified length and adds ellipsis if truncated
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Returns a random element from an array
 */
export function getRandomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Debounces a function to limit how often it's called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Gets URL query parameter value
 */
export function getQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

/**
 * Sets URL query parameters
 */
export function setQueryParams(params: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });
  
  window.history.pushState({}, '', url);
}

/**
 * Creates a range of numbers from start to end
 */
export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Scrolls to a specific element on the page
 */
export function scrollToElement(
  elementId: string,
  options: ScrollIntoViewOptions = { behavior: 'smooth' }
): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView(options);
  }
}
