import { Stage, Match, Team, KnockoutStage, StageAdvancementConfig, RoundRobinRoundConfig, KnockoutPairingMode, KnockoutFixtureAssignment, KnockoutWarnings } from './types';
import { getQualifiedTeamsForKnockout } from './qualification';
import { reseedKnockoutTeams } from './knockoutReseeding';
import { KNOCKOUT_ROUNDS } from './knockoutRounds';

interface KnockoutGenerationResult {
  matches: Match[];
  warnings: KnockoutWarnings;
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
    // Use reseeding algorithm
    const reseedResult = reseedKnockoutTeams(qualifiedTeams, stages);
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
