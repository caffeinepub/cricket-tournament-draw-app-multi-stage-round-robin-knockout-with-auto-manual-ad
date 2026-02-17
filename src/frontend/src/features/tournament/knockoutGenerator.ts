import { Match, Team, Stage, KnockoutStage, StageAdvancementConfig, RoundRobinRoundConfig, KnockoutPairingMode, KnockoutFixtureAssignment } from './types';
import { getQualifiedTeamsForKnockout } from './qualification';
import { KNOCKOUT_ROUNDS } from './knockoutRounds';

/**
 * Generate knockout bracket matches based on qualified teams from round-robin stages
 */
export function generateKnockoutMatches(
  stages: Stage[],
  knockoutStages: KnockoutStage,
  stageAdvancementConfigs: StageAdvancementConfig[],
  roundRobinRounds: RoundRobinRoundConfig[],
  pairingMode: KnockoutPairingMode = 'auto',
  fixtureAssignments: KnockoutFixtureAssignment[] = []
): Match[] {
  const matches: Match[] = [];
  
  // Get qualified teams for the first enabled knockout stage
  const qualifiedTeams = getQualifiedTeamsForKnockout(
    stages,
    stageAdvancementConfigs,
    knockoutStages,
    roundRobinRounds
  );
  
  // Filter out any TBD placeholder teams
  const realTeams = qualifiedTeams.filter(team => !team.id.startsWith('tbd-'));
  
  let currentRoundTeams = realTeams;
  let matchIdCounter = 1;
  
  // Pre-Quarterfinals (16 teams → 8 matches)
  if (knockoutStages.preQuarterFinal) {
    const preQuarterMatches = generateRoundMatches(
      currentRoundTeams,
      KNOCKOUT_ROUNDS.PRE_QUARTERFINAL,
      matchIdCounter,
      pairingMode,
      fixtureAssignments
    );
    matches.push(...preQuarterMatches);
    matchIdCounter += preQuarterMatches.length;
    // Next round gets winner placeholders (one per match)
    currentRoundTeams = createWinnerPlaceholders(preQuarterMatches.length);
  }
  
  // Quarterfinals (8 teams → 4 matches)
  if (knockoutStages.quarterFinal) {
    const quarterMatches = generateRoundMatches(
      currentRoundTeams,
      KNOCKOUT_ROUNDS.QUARTERFINAL,
      matchIdCounter,
      currentRoundTeams.some(t => t.id.startsWith('tbd-')) ? 'auto' : pairingMode,
      currentRoundTeams.some(t => t.id.startsWith('tbd-')) ? [] : fixtureAssignments
    );
    matches.push(...quarterMatches);
    matchIdCounter += quarterMatches.length;
    // Next round gets winner placeholders (one per match)
    currentRoundTeams = createWinnerPlaceholders(quarterMatches.length);
  }
  
  // Semifinals (4 teams → 2 matches)
  if (knockoutStages.semiFinal) {
    const semiMatches = generateRoundMatches(
      currentRoundTeams,
      KNOCKOUT_ROUNDS.SEMIFINAL,
      matchIdCounter,
      'auto',
      []
    );
    matches.push(...semiMatches);
    matchIdCounter += semiMatches.length;
    // Next round gets winner placeholders (one per match)
    currentRoundTeams = createWinnerPlaceholders(semiMatches.length);
  }
  
  // Final (2 teams → 1 match)
  if (knockoutStages.final) {
    const finalMatches = generateRoundMatches(
      currentRoundTeams,
      KNOCKOUT_ROUNDS.FINAL,
      matchIdCounter,
      'auto',
      []
    );
    matches.push(...finalMatches);
  }
  
  return matches;
}

function generateRoundMatches(
  teams: Team[],
  round: string,
  startId: number,
  pairingMode: KnockoutPairingMode,
  fixtureAssignments: KnockoutFixtureAssignment[]
): Match[] {
  const matches: Match[] = [];
  const matchCount = teams.length / 2;
  
  for (let i = 0; i < matchCount; i++) {
    const matchId = `knockout-${round.toLowerCase()}-${startId + i}`;
    
    let team1: Team;
    let team2: Team;
    
    if (pairingMode === 'manual' && !teams.some(t => t.id.startsWith('tbd-'))) {
      // Manual mode: use fixture assignments if available
      const assignment = fixtureAssignments.find(a => a.matchId === matchId);
      
      if (assignment && assignment.team1Id && assignment.team2Id) {
        team1 = teams.find(t => t.id === assignment.team1Id) || teams[i * 2] || createTBDTeam(i * 2);
        team2 = teams.find(t => t.id === assignment.team2Id) || teams[i * 2 + 1] || createTBDTeam(i * 2 + 1);
      } else {
        // No assignment yet, use TBD
        team1 = createTBDTeam(i * 2);
        team2 = createTBDTeam(i * 2 + 1);
      }
    } else {
      // Auto mode: sequential pairing
      team1 = teams[i * 2] || createTBDTeam(i * 2);
      team2 = teams[i * 2 + 1] || createTBDTeam(i * 2 + 1);
    }
    
    matches.push({
      id: matchId,
      team1,
      team2,
      round,
    });
  }
  
  return matches;
}

/**
 * Create winner placeholder teams for the next round.
 * Each match produces one winner, so we need 'matchCount' teams for the next round.
 */
function createWinnerPlaceholders(matchCount: number): Team[] {
  return Array.from({ length: matchCount }, (_, i) => createTBDTeam(i));
}

function createTBDTeam(index: number): Team {
  return {
    id: `tbd-${index}`,
    name: 'TBD',
  };
}
