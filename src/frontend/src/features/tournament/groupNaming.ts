/**
 * Generate Excel-like alphabetical group names (A, B, ..., Z, AA, AB, ..., AZ, BA, ...)
 * Supports unlimited group counts across all robin rounds by recursively building multi-letter labels.
 * 
 * Examples:
 * - index 0 → A
 * - index 25 → Z
 * - index 26 → AA
 * - index 51 → AZ
 * - index 52 → BA
 */
export function generateGroupName(index: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  if (index < 26) {
    return alphabet[index];
  }
  
  // For index >= 26, use Excel-like column naming (AA, AB, ..., AZ, BA, ...)
  // This is a base-26 system where A=0, B=1, ..., Z=25
  let result = '';
  let num = index;
  
  while (num >= 26) {
    const remainder = num % 26;
    result = alphabet[remainder] + result;
    num = Math.floor(num / 26) - 1;
  }
  
  result = alphabet[num] + result;
  
  return result;
}

// Alias for backward compatibility
export const getGroupName = generateGroupName;
