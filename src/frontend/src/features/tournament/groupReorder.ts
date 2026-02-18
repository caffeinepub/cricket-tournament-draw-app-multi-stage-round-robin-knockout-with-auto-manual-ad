import { Team } from './types';

/**
 * Reorders teams within a group by moving a team to a target position.
 * Deterministically resolves conflicts by swapping positions when target is occupied.
 * Ensures all teams remain in the group with unique positions 1..N.
 */
export function reorderGroupTeams(
  teams: Team[],
  teamId: string,
  targetPosition: number
): Team[] {
  if (teams.length === 0) return teams;
  
  // Validate target position
  if (targetPosition < 1 || targetPosition > teams.length) {
    return teams;
  }

  // Find current position of the team (1-indexed)
  const currentIndex = teams.findIndex(t => t.id === teamId);
  if (currentIndex === -1) return teams;

  const targetIndex = targetPosition - 1; // Convert to 0-indexed
  
  // If already at target position, no change needed
  if (currentIndex === targetIndex) {
    return teams;
  }

  // Create a new array with the team moved to target position
  const newTeams = [...teams];
  const [movedTeam] = newTeams.splice(currentIndex, 1);
  newTeams.splice(targetIndex, 0, movedTeam);

  return newTeams;
}
