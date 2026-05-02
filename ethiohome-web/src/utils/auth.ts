/**
 * Utilities for authentication
 */

/**
 * Normalizes an identifier (email or phone)
 * - Trims whitespace
 * - Converts email to lowercase
 * - Leaves phone numbers as is (after trim)
 */
export const normalizeIdentifier = (identifier: string): string => {
  if (!identifier) return '';
  const trimmed = identifier.trim();
  
  // Basic email detection
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  
  return trimmed;
};
