import { Stage, Match, Team } from './types';
import { getOriginGroupSerial } from './originGroupSerial';

/**
 * Computes the display code for a team in a round-robin match.
 * Returns a code like "A1" (group name + 1-based position) or undefined if context is missing.
 * 
 * @param match - The match containing the team
 * @param team - The team to compute the code for
 * @param stages - All tournament stages
 * @returns Display code string (e.g., "A1") or undefined
 */
export function getRoundRobinDisplayCode(
  match: Match,
  team: Team,
  stages: Stage[]
): string | undefined {
  // Find the stage containing this match
  const stage = stages.find((s) => s.id === match.stageId);
  if (!stage) return undefined;

  // Find the group containing this match
  const group = stage.groups.find((g) => g.id === match.groupId);
  if (!group) return undefined;

  // Find the team's position within the group (1-based)
  const teamIndex = group.teams.findIndex((t) => t.id === team.id);
  if (teamIndex === -1) return undefined;

  const position = teamIndex + 1;
  return `${group.name}${position}`;
}

/**
 * Formats a team display with its code prefix for round-robin matches.
 * For Stage 2 (Robin Round 2), uses origin group serial with hyphen (e.g., "A-2 Team Name").
 * For other stages, returns "{code} {teamName}" or just "{teamName}" if code cannot be computed.
 * 
 * @param match - The match containing the team
 * @param team - The team to format
 * @param stages - All tournament stages
 * @returns Formatted team display string
 */
export function formatRoundRobinTeamDisplay(
  match: Match,
  team: Team,
  stages: Stage[]
): string {
  // Find the stage containing this match
  const stage = stages.find((s) => s.id === match.stageId);
  
  // For Stage 2 (Robin Round 2), use origin group serial
  if (stage && stage.stageNumber === 2) {
    const originSerial = getOriginGroupSerial(team.id, stages);
    return originSerial ? `${originSerial} ${team.name}` : team.name;
  }
  
  // For other stages, use current group position
  const code = getRoundRobinDisplayCode(match, team, stages);
  return code ? `${code} ${team.name}` : team.name;
}
