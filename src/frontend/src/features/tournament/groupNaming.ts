export function generateGroupName(index: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  if (index < 26) {
    return alphabet[index];
  }
  
  // For more than 26 groups, use AA, AB, AC, etc.
  const firstLetter = alphabet[Math.floor(index / 26) - 1];
  const secondLetter = alphabet[index % 26];
  return `${firstLetter}${secondLetter}`;
}

// Alias for backward compatibility
export const getGroupName = generateGroupName;
