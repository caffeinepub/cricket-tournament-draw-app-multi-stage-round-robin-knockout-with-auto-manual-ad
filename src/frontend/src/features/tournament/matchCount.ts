import { KnockoutStage, AdvancementConfig, RoundRobinRoundConfig, StageAdvancementConfig } from './types';

export interface MatchCountBreakdown {
  roundRobinMatches: number;
  knockoutMatches: number;
  totalMatches: number;
  stageBreakdown: Array<{
    stageName: string;
    groupCount: number;
    matchCount: number;
  }>;
  knockoutBreakdown: Array<{
    roundName: string;
    matchCount: number;
  }>;
}

export function calculateMatchCount(
  teamCount: number,
  roundRobinRounds: RoundRobinRoundConfig[],
  knockoutStages: KnockoutStage,
  advancementConfigs: Record<string, AdvancementConfig>,
  stageAdvancementConfigs: StageAdvancementConfig[]
): MatchCountBreakdown {
  let roundRobinMatches = 0;
  const stageBreakdown: Array<{ stageName: string; groupCount: number; matchCount: number }> = [];

  // Calculate round-robin matches
  let currentTeams = teamCount;
  for (let i = 0; i < roundRobinRounds.length; i++) {
    const round = roundRobinRounds[i];
    const teamsPerGroup = Math.floor(currentTeams / round.groupCount);
    const matchesPerGroup = (teamsPerGroup * (teamsPerGroup - 1)) / 2;
    const stageMatches = matchesPerGroup * round.groupCount;
    
    roundRobinMatches += stageMatches;
    stageBreakdown.push({
      stageName: `Robin Round ${round.roundNumber}`,
      groupCount: round.groupCount,
      matchCount: stageMatches,
    });

    // Calculate teams for next round based on stage advancement config
    if (i < roundRobinRounds.length - 1) {
      const stageConfig = stageAdvancementConfigs.find(c => c.stageNumber === round.roundNumber);
      if (stageConfig) {
        let nextStageTeams = 0;
        
        // Count winners going to next stage
        if (stageConfig.winnerDestination.type === 'NextStage' && 
            stageConfig.winnerDestination.stageIndex === i + 1) {
          nextStageTeams += round.groupCount;
        }
        
        // Count runner-ups going to next stage
        if (stageConfig.runnerUpDestination.type === 'NextStage' && 
            stageConfig.runnerUpDestination.stageIndex === i + 1) {
          nextStageTeams += round.groupCount;
        }
        
        currentTeams = nextStageTeams;
      } else {
        // Fallback: assume winners only
        currentTeams = round.groupCount;
      }
    }
  }

  // Calculate knockout matches
  let knockoutMatches = 0;
  const knockoutBreakdown: Array<{ roundName: string; matchCount: number }> = [];

  if (knockoutStages.preQuarterFinal) {
    knockoutMatches += 8;
    knockoutBreakdown.push({ roundName: 'Pre Quarter Final', matchCount: 8 });
  }
  if (knockoutStages.quarterFinal) {
    knockoutMatches += 4;
    knockoutBreakdown.push({ roundName: 'Quarter Final', matchCount: 4 });
  }
  if (knockoutStages.semiFinal) {
    knockoutMatches += 2;
    knockoutBreakdown.push({ roundName: 'Semi Final', matchCount: 2 });
  }
  if (knockoutStages.final) {
    knockoutMatches += 1;
    knockoutBreakdown.push({ roundName: 'Final', matchCount: 1 });
  }

  return {
    roundRobinMatches,
    knockoutMatches,
    totalMatches: roundRobinMatches + knockoutMatches,
    stageBreakdown,
    knockoutBreakdown,
  };
}
