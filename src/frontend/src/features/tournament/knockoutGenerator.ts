import { Team, Match, Stage, KnockoutStage, RoundRobinRoundConfig, KnockoutPairingMode, KnockoutFixtureAssignment, StageAdvancementConfig } from './types';
import { getQualifiedTeamsForKnockout } from './qualification';

// TBD placeholder team
const TBD_TEAM: Team = { id: 'tbd', name: 'TBD' };

export function generateKnockoutMatches(
  stages: Stage[],
  knockoutStages: KnockoutStage,
  stageAdvancementConfigs: StageAdvancementConfig[],
  roundRobinRounds: RoundRobinRoundConfig[],
  knockoutPairingMode: KnockoutPairingMode,
  knockoutFixtureAssignments: KnockoutFixtureAssignment[]
): Match[] {
  const matches: Match[] = [];
  
  // Get qualified teams using shared qualification utility
  const qualifiedTeams = getQualifiedTeamsForKnockout(stages, stageAdvancementConfigs, knockoutStages, roundRobinRounds);

  let matchIdCounter = 1;

  // Pre Quarter Final (16 teams)
  if (knockoutStages.preQuarterFinal) {
    const preQuarterMatches = generateKnockoutRound(
      qualifiedTeams.slice(0, 16),
      'Pre Quarter Final',
      matchIdCounter,
      knockoutPairingMode,
      knockoutFixtureAssignments,
      true // First enabled round
    );
    matches.push(...preQuarterMatches);
    matchIdCounter += preQuarterMatches.length;
    
    // Generate placeholder matches for Quarter Final
    if (knockoutStages.quarterFinal) {
      const quarterMatches = generatePlaceholderRound(8, 'Quarter Final', matchIdCounter);
      matches.push(...quarterMatches);
      matchIdCounter += quarterMatches.length;
    }
    
    // Generate placeholder matches for Semi Final
    if (knockoutStages.semiFinal) {
      const semiMatches = generatePlaceholderRound(4, 'Semi Final', matchIdCounter);
      matches.push(...semiMatches);
      matchIdCounter += semiMatches.length;
    }
    
    // Generate placeholder matches for Final
    if (knockoutStages.final) {
      const finalMatches = generatePlaceholderRound(2, 'Final', matchIdCounter);
      matches.push(...finalMatches);
    }
  }
  // Quarter Final (8 teams)
  else if (knockoutStages.quarterFinal) {
    const quarterMatches = generateKnockoutRound(
      qualifiedTeams.slice(0, 8),
      'Quarter Final',
      matchIdCounter,
      knockoutPairingMode,
      knockoutFixtureAssignments,
      true // First enabled round
    );
    matches.push(...quarterMatches);
    matchIdCounter += quarterMatches.length;
    
    // Generate placeholder matches for Semi Final
    if (knockoutStages.semiFinal) {
      const semiMatches = generatePlaceholderRound(4, 'Semi Final', matchIdCounter);
      matches.push(...semiMatches);
      matchIdCounter += semiMatches.length;
    }
    
    // Generate placeholder matches for Final
    if (knockoutStages.final) {
      const finalMatches = generatePlaceholderRound(2, 'Final', matchIdCounter);
      matches.push(...finalMatches);
    }
  }
  // Semi Final (4 teams)
  else if (knockoutStages.semiFinal) {
    const semiMatches = generateKnockoutRound(
      qualifiedTeams.slice(0, 4),
      'Semi Final',
      matchIdCounter,
      knockoutPairingMode,
      knockoutFixtureAssignments,
      true // First enabled round
    );
    matches.push(...semiMatches);
    matchIdCounter += semiMatches.length;
    
    // Generate placeholder matches for Final
    if (knockoutStages.final) {
      const finalMatches = generatePlaceholderRound(2, 'Final', matchIdCounter);
      matches.push(...finalMatches);
    }
  }
  // Final (2 teams)
  else if (knockoutStages.final) {
    const finalMatches = generateKnockoutRound(
      qualifiedTeams.slice(0, 2),
      'Final',
      matchIdCounter,
      knockoutPairingMode,
      knockoutFixtureAssignments,
      true // First enabled round
    );
    matches.push(...finalMatches);
  }

  return matches;
}

function generateKnockoutRound(
  teams: Team[],
  roundName: string,
  startId: number,
  pairingMode: KnockoutPairingMode,
  fixtureAssignments: KnockoutFixtureAssignment[],
  isFirstRound: boolean
): Match[] {
  const matches: Match[] = [];
  const numMatches = Math.floor(teams.length / 2);

  for (let i = 0; i < numMatches; i++) {
    const matchId = `knockout-${startId + i}`;
    
    // Check for manual assignment
    const assignment = fixtureAssignments.find(a => a.matchId === matchId);
    
    let team1: Team;
    let team2: Team;
    
    if (pairingMode === 'manual' && assignment && isFirstRound) {
      // Use manual assignment for first round only
      team1 = teams.find(t => t.id === assignment.team1Id) || teams[i * 2] || TBD_TEAM;
      team2 = teams.find(t => t.id === assignment.team2Id) || teams[i * 2 + 1] || TBD_TEAM;
    } else if (isFirstRound) {
      // Auto pairing for first round
      team1 = teams[i * 2] || TBD_TEAM;
      team2 = teams[i * 2 + 1] || TBD_TEAM;
    } else {
      // Placeholder teams for later rounds
      team1 = TBD_TEAM;
      team2 = TBD_TEAM;
    }

    matches.push({
      id: matchId,
      team1,
      team2,
      round: roundName,
    });
  }

  return matches;
}

function generatePlaceholderRound(
  teamCount: number,
  roundName: string,
  startId: number
): Match[] {
  const matches: Match[] = [];
  const numMatches = Math.floor(teamCount / 2);

  for (let i = 0; i < numMatches; i++) {
    const matchId = `knockout-${startId + i}`;
    
    matches.push({
      id: matchId,
      team1: TBD_TEAM,
      team2: TBD_TEAM,
      round: roundName,
    });
  }

  return matches;
}

export function validateKnockoutTeamCount(
  qualifiedTeamCount: number,
  knockoutStages: KnockoutStage
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (knockoutStages.preQuarterFinal && qualifiedTeamCount !== 16) {
    errors.push(`Pre Quarter Final requires exactly 16 teams (currently ${qualifiedTeamCount})`);
  } else if (knockoutStages.quarterFinal && qualifiedTeamCount !== 8) {
    errors.push(`Quarter Final requires exactly 8 teams (currently ${qualifiedTeamCount})`);
  } else if (knockoutStages.semiFinal && qualifiedTeamCount !== 4) {
    errors.push(`Semi Final requires exactly 4 teams (currently ${qualifiedTeamCount})`);
  } else if (knockoutStages.final && qualifiedTeamCount !== 2) {
    errors.push(`Final requires exactly 2 teams (currently ${qualifiedTeamCount})`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
