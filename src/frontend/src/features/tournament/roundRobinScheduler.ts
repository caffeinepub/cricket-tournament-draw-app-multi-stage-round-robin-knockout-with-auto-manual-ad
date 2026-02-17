import { Group, Match, Team } from './types';

export function generateRoundRobinMatches(group: Group, stageId: string): Match[] {
  const matches: Match[] = [];
  const teams = group.teams;

  // Generate all unique pairings
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const matchId = `${group.id}-match-${i}-${j}`;
      matches.push({
        id: matchId,
        team1: teams[i],
        team2: teams[j],
        groupId: group.id,
        stageId,
      });
    }
  }

  return matches;
}
