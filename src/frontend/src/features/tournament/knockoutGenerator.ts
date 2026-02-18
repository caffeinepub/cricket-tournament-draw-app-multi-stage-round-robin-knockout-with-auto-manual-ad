import { Stage, Match, Team, KnockoutStage, StageAdvancementConfig, RoundRobinRoundConfig, KnockoutPairingMode, KnockoutFixtureAssignment, KnockoutWarnings } from './types';
import { getQualifiedTeamsForKnockout } from './qualification';
import { reseedKnockoutTeams } from './knockoutReseeding';
import { KNOCKOUT_ROUNDS } from './knockoutRounds';

interface KnockoutGenerationResult {
  matches: Match[];
  warnings: KnockoutWarnings;
}

interface TeamWithMetadata {
  team: Team;
  isWinner: boolean;
  groupName: string;
  stageNumber: number;
}

/**
 * Collect qualified teams with metadata (winner/runner-up status and group origin)
 */
function getQualifiedTeamsWithMetadata(
  stages: Stage[],
  stageAdvancementConfigs: StageAdvancementConfig[],
  knockoutStages: KnockoutStage
): TeamWithMetadata[] {
  const teamsWithMetadata: TeamWithMetadata[] = [];
  
  // Determine the first enabled knockout entry point
  const firstKnockoutEntry = getFirstEnabledKnockoutEntry(knockoutStages);
  if (!firstKnockoutEntry) return teamsWithMetadata;
  
  // Collect teams from all stages that route to this knockout entry
  for (const stage of stages) {
    const stageConfig = stageAdvancementConfigs.find(c => c.stageNumber === stage.stageNumber);
    if (!stageConfig) continue;
    
    // Check if winners go to knockout
    if (stageConfig.winnerDestination.type === 'KnockoutEntry' &&
        stageConfig.winnerDestination.entryPoint === firstKnockoutEntry) {
      for (const group of stage.groups) {
        if (group.teams.length > 0) {
          teamsWithMetadata.push({
            team: group.teams[0],
            isWinner: true,
            groupName: group.name,
            stageNumber: stage.stageNumber,
          });
        }
      }
    }
    
    // Check if runner-ups go to knockout (exclude eliminated)
    if (stageConfig.runnerUpDestination.type === 'KnockoutEntry' &&
        stageConfig.runnerUpDestination.entryPoint === firstKnockoutEntry) {
      for (const group of stage.groups) {
        if (group.teams.length >= 2) {
          teamsWithMetadata.push({
            team: group.teams[1],
            isWinner: false,
            groupName: group.name,
            stageNumber: stage.stageNumber,
          });
        }
      }
    }
  }
  
  return teamsWithMetadata;
}

function getFirstEnabledKnockoutEntry(knockoutStages: KnockoutStage): string | null {
  if (knockoutStages.preQuarterFinal) return 'PreQuarterfinals';
  if (knockoutStages.quarterFinal) return 'Quarterfinals';
  if (knockoutStages.semiFinal) return 'Semifinals';
  return null;
}

/**
 * Attempt to pair winners with runner-ups while avoiding same-group matchups
 */
function pairWinnersWithRunnerUps(
  teamsWithMetadata: TeamWithMetadata[],
  stages: Stage[]
): { teams: Team[]; warnings: string[] } {
  const warnings: string[] = [];
  
  // Separate winners and runner-ups
  const winners = teamsWithMetadata.filter(t => t.isWinner);
  const runnerUps = teamsWithMetadata.filter(t => !t.isWinner);
  
  // If no runner-ups available, fall back to original order
  if (runnerUps.length === 0) {
    warnings.push('No runner-ups available for Winner-vs-Runner-up pairing. Using all winners.');
    return { teams: teamsWithMetadata.map(t => t.team), warnings };
  }
  
  // If counts don't match, we can't do perfect Winner-vs-Runner-up pairing
  if (winners.length !== runnerUps.length) {
    warnings.push(`Winner count (${winners.length}) does not match runner-up count (${runnerUps.length}). Perfect Winner-vs-Runner-up pairing not possible.`);
    return { teams: teamsWithMetadata.map(t => t.team), warnings };
  }
  
  // Try to find a pairing that avoids same-group matchups
  const pairedTeams: Team[] = [];
  const usedRunnerUps = new Set<number>();
  const sameGroupViolations: string[] = [];
  
  for (const winner of winners) {
    let bestRunnerUpIndex = -1;
    let foundNonSameGroup = false;
    
    // Try to find a runner-up from a different group
    for (let i = 0; i < runnerUps.length; i++) {
      if (usedRunnerUps.has(i)) continue;
      
      const runnerUp = runnerUps[i];
      
      // Check if they're from the same group
      if (winner.groupName !== runnerUp.groupName || winner.stageNumber !== runnerUp.stageNumber) {
        bestRunnerUpIndex = i;
        foundNonSameGroup = true;
        break;
      }
    }
    
    // If no non-same-group runner-up found, take the first available
    if (!foundNonSameGroup) {
      for (let i = 0; i < runnerUps.length; i++) {
        if (usedRunnerUps.has(i)) continue;
        bestRunnerUpIndex = i;
        
        const runnerUp = runnerUps[i];
        if (winner.groupName === runnerUp.groupName && winner.stageNumber === runnerUp.stageNumber) {
          sameGroupViolations.push(`${winner.team.name} (Winner, Group ${winner.groupName}) vs ${runnerUp.team.name} (Runner-up, Group ${runnerUp.groupName})`);
        }
        break;
      }
    }
    
    if (bestRunnerUpIndex >= 0) {
      pairedTeams.push(winner.team);
      pairedTeams.push(runnerUps[bestRunnerUpIndex].team);
      usedRunnerUps.add(bestRunnerUpIndex);
    }
  }
  
  if (sameGroupViolations.length > 0) {
    warnings.push(`Same-group matchups unavoidable: ${sameGroupViolations.join('; ')}. Configuration constraints prevent full separation.`);
  }
  
  return { teams: pairedTeams, warnings };
}

/**
 * Generate knockout matches based on qualified teams and knockout configuration
 */
export function generateKnockoutMatches(
  stages: Stage[],
  knockoutStages: KnockoutStage,
  stageAdvancementConfigs: StageAdvancementConfig[],
  roundRobinRounds: RoundRobinRoundConfig[],
  pairingMode: KnockoutPairingMode,
  fixtureAssignments: KnockoutFixtureAssignment[]
): KnockoutGenerationResult {
  const warnings: KnockoutWarnings = {
    reseedingWarnings: [],
    manualPairingWarnings: [],
    seedingRuleWarnings: [],
  };

  // Get qualified teams
  const qualifiedTeams = getQualifiedTeamsForKnockout(stages, stageAdvancementConfigs, knockoutStages, roundRobinRounds);

  // Determine starting round
  let startingRound: string;
  let teamCount: number;

  if (knockoutStages.preQuarterFinal) {
    startingRound = KNOCKOUT_ROUNDS.PRE_QUARTERFINAL;
    teamCount = 16;
  } else if (knockoutStages.quarterFinal) {
    startingRound = KNOCKOUT_ROUNDS.QUARTERFINAL;
    teamCount = 8;
  } else if (knockoutStages.semiFinal) {
    startingRound = KNOCKOUT_ROUNDS.SEMIFINAL;
    teamCount = 4;
  } else if (knockoutStages.final) {
    startingRound = KNOCKOUT_ROUNDS.FINAL;
    teamCount = 2;
  } else {
    return { matches: [], warnings };
  }

  // Validate team count
  if (qualifiedTeams.length !== teamCount) {
    return { matches: [], warnings };
  }

  let orderedTeams: Team[];

  if (pairingMode === 'auto') {
    // Get teams with metadata
    const teamsWithMetadata = getQualifiedTeamsWithMetadata(stages, stageAdvancementConfigs, knockoutStages);
    
    // Apply Winner-vs-Runner-up pairing with same-group avoidance
    const pairingResult = pairWinnersWithRunnerUps(teamsWithMetadata, stages);
    orderedTeams = pairingResult.teams;
    warnings.seedingRuleWarnings = pairingResult.warnings;
    
    // Apply rematch avoidance reseeding on top of the Winner-vs-Runner-up pairing
    const reseedResult = reseedKnockoutTeams(orderedTeams, stages, teamsWithMetadata);
    orderedTeams = reseedResult.teams;
    warnings.reseedingWarnings = reseedResult.warnings;
  } else {
    // Manual mode: use fixture assignments
    orderedTeams = qualifiedTeams;
  }

  // Generate matches for all rounds
  const matches: Match[] = [];
  const roundsToGenerate: string[] = [];

  if (knockoutStages.preQuarterFinal) roundsToGenerate.push(KNOCKOUT_ROUNDS.PRE_QUARTERFINAL);
  if (knockoutStages.quarterFinal) roundsToGenerate.push(KNOCKOUT_ROUNDS.QUARTERFINAL);
  if (knockoutStages.semiFinal) roundsToGenerate.push(KNOCKOUT_ROUNDS.SEMIFINAL);
  if (knockoutStages.final) roundsToGenerate.push(KNOCKOUT_ROUNDS.FINAL);

  // Generate first round with actual teams
  const firstRoundMatchCount = teamCount / 2;
  for (let i = 0; i < firstRoundMatchCount; i++) {
    let team1: Team;
    let team2: Team;

    if (pairingMode === 'manual') {
      // Find assignment for this match
      const matchId = `knockout-${startingRound.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`;
      const assignment = fixtureAssignments.find(a => a.matchId === matchId);
      
      if (assignment?.team1Id && assignment?.team2Id) {
        team1 = orderedTeams.find(t => t.id === assignment.team1Id) || orderedTeams[i * 2];
        team2 = orderedTeams.find(t => t.id === assignment.team2Id) || orderedTeams[i * 2 + 1];
      } else {
        team1 = orderedTeams[i * 2];
        team2 = orderedTeams[i * 2 + 1];
      }
    } else {
      team1 = orderedTeams[i * 2];
      team2 = orderedTeams[i * 2 + 1];
    }

    matches.push({
      id: `knockout-${startingRound.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
      team1,
      team2,
      round: startingRound,
    });
  }

  // Generate subsequent rounds with placeholders and source references
  let currentRoundIndex = roundsToGenerate.indexOf(startingRound);
  let previousRoundMatchCount = firstRoundMatchCount;

  for (let r = currentRoundIndex + 1; r < roundsToGenerate.length; r++) {
    const round = roundsToGenerate[r];
    const matchCount = previousRoundMatchCount / 2;
    const previousRound = roundsToGenerate[r - 1];

    for (let i = 0; i < matchCount; i++) {
      const prevMatch1Index = i * 2;
      const prevMatch2Index = i * 2 + 1;

      // Get fixture codes from previous round
      const team1SourceCode = getFixtureCodeForRound(previousRound, prevMatch1Index);
      const team2SourceCode = getFixtureCodeForRound(previousRound, prevMatch2Index);

      matches.push({
        id: `knockout-${round.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`,
        team1: { id: `placeholder-${team1SourceCode}`, name: team1SourceCode },
        team2: { id: `placeholder-${team2SourceCode}`, name: team2SourceCode },
        round,
        team1Source: team1SourceCode,
        team2Source: team2SourceCode,
      });
    }

    previousRoundMatchCount = matchCount;
  }

  return { matches, warnings };
}

/**
 * Get fixture code for a specific round and match index
 */
function getFixtureCodeForRound(round: string, matchIndex: number): string {
  const codes: Record<string, string> = {
    [KNOCKOUT_ROUNDS.PRE_QUARTERFINAL]: 'PQ',
    [KNOCKOUT_ROUNDS.QUARTERFINAL]: 'Q',
    [KNOCKOUT_ROUNDS.SEMIFINAL]: 'S',
    [KNOCKOUT_ROUNDS.FINAL]: 'F',
  };

  const prefix = codes[round] || 'M';
  return `${prefix}${matchIndex + 1}`;
}
