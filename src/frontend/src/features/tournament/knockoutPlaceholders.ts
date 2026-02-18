import { getKnockoutFixtureCode } from './knockoutFixtureCode';

/**
 * Check if a team name is a placeholder (TBD or references an upstream fixture)
 */
export function isPlaceholderTeam(teamName: string): boolean {
  if (!teamName) return true;
  const normalized = teamName.trim().toUpperCase();
  
  // Check for TBD
  if (normalized === 'TBD') return true;
  
  // Check for fixture code patterns (PQ1, Q2, S1, F1, etc.)
  if (/^(PQ|Q|S|F)\d+$/.test(normalized)) return true;
  
  // Check for legacy "Winner of X" patterns
  if (normalized.startsWith('WINNER OF')) return true;
  
  return false;
}

/**
 * Normalize a placeholder team name to canonical fixture code format
 * Examples:
 *   "Winner of PQ1" -> "PQ1"
 *   "pq1" -> "PQ1"
 *   "TBD" -> "TBD"
 */
export function normalizePlaceholder(teamName: string): string {
  if (!teamName) return 'TBD';
  
  const trimmed = teamName.trim();
  if (!trimmed) return 'TBD';
  
  const upper = trimmed.toUpperCase();
  
  // Already in canonical format
  if (/^(PQ|Q|S|F)\d+$/.test(upper)) {
    return upper;
  }
  
  // Legacy "Winner of X" format
  const winnerMatch = upper.match(/WINNER\s+OF\s+(PQ|Q|S|F)(\d+)/);
  if (winnerMatch) {
    return `${winnerMatch[1]}${winnerMatch[2]}`;
  }
  
  // Plain TBD
  if (upper === 'TBD') {
    return 'TBD';
  }
  
  // Not a placeholder, return as-is
  return teamName;
}

/**
 * Get a display-friendly label for a placeholder team
 * If it's a real team, return the team name
 * If it's a placeholder, return the normalized fixture code or "TBD"
 */
export function getPlaceholderDisplayLabel(teamName: string): string {
  if (!isPlaceholderTeam(teamName)) {
    return teamName;
  }
  return normalizePlaceholder(teamName);
}
