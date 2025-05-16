/**
 * Generate a random alphanumeric string
 * @param length Length of the string (default: 16)
 * @returns Random string
 */
export function generateRandomString(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format a price with currency symbol
 * @param price Price value
 * @param currency Currency code (default: INR)
 * @returns Formatted price string
 */
export function formatPrice(price: number | string, currency: string = 'INR'): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  switch (currency) {
    case 'INR':
      return `₹${numPrice.toFixed(2)}`;
    case 'USD':
      return `$${numPrice.toFixed(2)}`;
    case 'EUR':
      return `€${numPrice.toFixed(2)}`;
    default:
      return `${numPrice.toFixed(2)} ${currency}`;
  }
}

/**
 * Format a date to a readable string
 * @param date Date object or string
 * @param format Format type ('short', 'long', 'time')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-IN');
    case 'long':
      return dateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return dateObj.toLocaleTimeString('en-IN');
    default:
      return dateObj.toLocaleDateString('en-IN');
  }
}