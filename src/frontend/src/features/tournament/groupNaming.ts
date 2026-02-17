/**
 * Utility function that generates alphabetical group names (A-Z, then AA-AZ, etc.) based on group index.
 * Supports sequential naming across multiple stages by accepting a global offset.
 */
export function generateGroupName(index: number): string {
  let name = '';
  let num = index;
  
  while (num >= 0) {
    name = String.fromCharCode(65 + (num % 26)) + name;
    num = Math.floor(num / 26) - 1;
  }
  
  return name;
}

/**
 * Generate group name with an offset for sequential naming across stages.
 * @param localIndex - The group index within the current stage (0-based)
 * @param offset - The cumulative number of groups from all previous stages
 */
export function generateGroupNameWithOffset(localIndex: number, offset: number): string {
  return generateGroupName(localIndex + offset);
}

// Alias for backward compatibility
export const getGroupName = generateGroupName;
