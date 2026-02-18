import { Match } from './types';
import { KNOCKOUT_ROUNDS, KnockoutRoundName } from './knockoutRounds';

/**
 * Get the fixture code prefix for a knockout round
 */
function getRoundPrefix(roundName: string): string {
  switch (roundName) {
    case KNOCKOUT_ROUNDS.PRE_QUARTERFINAL:
      return 'PQ';
    case KNOCKOUT_ROUNDS.QUARTERFINAL:
      return 'Q';
    case KNOCKOUT_ROUNDS.SEMIFINAL:
      return 'S';
    case KNOCKOUT_ROUNDS.FINAL:
      return 'F';
    default:
      return 'M';
  }
}

/**
 * Generate a knockout fixture code (e.g., "PQ1", "Q2", "S1", "F1")
 * @param roundName - The knockout round name
 * @param indexWithinRound - Zero-based index of the match within its round
 */
export function getKnockoutFixtureCode(roundName: string, indexWithinRound: number): string {
  const prefix = getRoundPrefix(roundName);
  return `${prefix}${indexWithinRound + 1}`;
}

/**
 * Get the index of a match within its round from a list of matches
 * @param match - The match to find
 * @param allMatches - All knockout matches
 */
export function getMatchIndexInRound(match: Match, allMatches: Match[]): number {
  const roundMatches = allMatches.filter(m => m.round === match.round);
  return roundMatches.findIndex(m => m.id === match.id);
}

/**
 * Get the fixture code for a specific match
 * @param match - The match
 * @param allMatches - All knockout matches (to determine index within round)
 */
export function getFixtureCodeForMatch(match: Match, allMatches: Match[]): string {
  if (!match.round) return '';
  const index = getMatchIndexInRound(match, allMatches);
  if (index === -1) return '';
  return getKnockoutFixtureCode(match.round, index);
}
