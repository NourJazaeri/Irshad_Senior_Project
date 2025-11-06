/**
 * Utility function to merge CSS classes
 * Simple className concatenation utility
 */
export function cn(...inputs) {
  return inputs
    .flat()
    .filter((x) => typeof x === "string" || typeof x === "number")
    .join(" ")
    .trim();
}
