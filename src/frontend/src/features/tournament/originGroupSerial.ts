import { Stage, Team } from './types';

/**
 * Resolves the origin group serial for a team by finding the earliest stage
 * (smallest stageNumber) where the team appears.
 * 
 * @param teamId - The team ID to look up
 * @param stages - All tournament stages
 * @returns Origin serial string like "A-2" or undefined if not found
 */
export function getOriginGroupSerial(teamId: string, stages: Stage[]): string | undefined {
  if (!teamId || !stages.length) return undefined;

  // Sort stages by stageNumber to find the earliest appearance
  const sortedStages = [...stages].sort((a, b) => a.stageNumber - b.stageNumber);

  for (const stage of sortedStages) {
    for (const group of stage.groups) {
      const teamIndex = group.teams.findIndex((t) => t.id === teamId);
      if (teamIndex !== -1) {
        const position = teamIndex + 1;
        return `${group.name}-${position}`;
      }
    }
  }

  return undefined;
}

/**
 * Formats a team display with origin group serial prefix.
 * Returns "<OriginGroup>-<Position> <TeamName>" or falls back to team name if origin cannot be resolved.
 * 
 * @param team - The team to format
 * @param stages - All tournament stages
 * @returns Formatted team display string
 */
export function formatTeamWithOriginSerial(team: Team, stages: Stage[]): string {
  const originSerial = getOriginGroupSerial(team.id, stages);
  return originSerial ? `${originSerial} ${team.name}` : team.name;
}
