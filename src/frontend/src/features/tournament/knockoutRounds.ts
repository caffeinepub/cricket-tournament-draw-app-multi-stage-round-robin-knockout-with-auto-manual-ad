/**
 * Shared knockout round constants and utilities for consistent round naming and ordering
 */

export const KNOCKOUT_ROUNDS = {
  PRE_QUARTERFINAL: 'Pre-Quarterfinal',
  QUARTERFINAL: 'Quarterfinal',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
} as const;

export type KnockoutRoundName = typeof KNOCKOUT_ROUNDS[keyof typeof KNOCKOUT_ROUNDS];

/**
 * Canonical ordering of knockout rounds from earliest to latest
 */
export const KNOCKOUT_ROUND_ORDER: KnockoutRoundName[] = [
  KNOCKOUT_ROUNDS.PRE_QUARTERFINAL,
  KNOCKOUT_ROUNDS.QUARTERFINAL,
  KNOCKOUT_ROUNDS.SEMIFINAL,
  KNOCKOUT_ROUNDS.FINAL,
];

/**
 * Get the first enabled knockout round based on knockout stage configuration
 */
export function getFirstEnabledRound(knockoutStages: {
  preQuarterFinal: boolean;
  quarterFinal: boolean;
  semiFinal: boolean;
  final: boolean;
}): KnockoutRoundName | null {
  if (knockoutStages.preQuarterFinal) return KNOCKOUT_ROUNDS.PRE_QUARTERFINAL;
  if (knockoutStages.quarterFinal) return KNOCKOUT_ROUNDS.QUARTERFINAL;
  if (knockoutStages.semiFinal) return KNOCKOUT_ROUNDS.SEMIFINAL;
  if (knockoutStages.final) return KNOCKOUT_ROUNDS.FINAL;
  return null;
}

/**
 * Check if a round name matches any of the canonical round names
 */
export function isKnockoutRound(roundName: string): roundName is KnockoutRoundName {
  return Object.values(KNOCKOUT_ROUNDS).includes(roundName as KnockoutRoundName);
}

/**
 * Get the index of a round in the canonical ordering
 */
export function getRoundIndex(roundName: string): number {
  return KNOCKOUT_ROUND_ORDER.indexOf(roundName as KnockoutRoundName);
}
