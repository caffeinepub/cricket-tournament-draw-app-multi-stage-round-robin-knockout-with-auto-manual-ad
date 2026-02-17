import { Team, Stage, KnockoutStage, RoundRobinRoundConfig, StageAdvancementConfig, KnockoutEntryPoint } from './types';

/**
 * Shared qualification utility that computes qualified teams for knockout stage
 * based on per-stage advancement configurations.
 */
export function getQualifiedTeamsForKnockout(
  stages: Stage[],
  stageAdvancementConfigs: StageAdvancementConfig[],
  knockoutStages: KnockoutStage,
  roundRobinRounds: RoundRobinRoundConfig[]
): Team[] {
  const qualifiedTeams: Team[] = [];
  
  if (stages.length === 0) return qualifiedTeams;
  
  // Determine the first enabled knockout entry point
  const firstKnockoutEntry = getFirstEnabledKnockoutEntry(knockoutStages);
  if (!firstKnockoutEntry) return qualifiedTeams;
  
  // Collect teams from all stages that route to this knockout entry
  for (const stage of stages) {
    const stageConfig = stageAdvancementConfigs.find(c => c.stageNumber === stage.stageNumber);
    if (!stageConfig) continue;
    
    // Check if winners go to knockout
    if (stageConfig.winnerDestination.type === 'KnockoutEntry' &&
        stageConfig.winnerDestination.entryPoint === firstKnockoutEntry) {
      for (const group of stage.groups) {
        if (group.teams.length > 0) {
          qualifiedTeams.push(group.teams[0]);
        }
      }
    }
    
    // Check if runner-ups go to knockout (exclude eliminated)
    if (stageConfig.runnerUpDestination.type === 'KnockoutEntry' &&
        stageConfig.runnerUpDestination.entryPoint === firstKnockoutEntry) {
      for (const group of stage.groups) {
        if (group.teams.length >= 2) {
          qualifiedTeams.push(group.teams[1]);
        }
      }
    }
  }
  
  return qualifiedTeams;
}

/**
 * Calculate the number of qualified teams for knockout stage
 * based on per-stage advancement configurations.
 */
export function getQualifiedTeamCount(
  stageAdvancementConfigs: StageAdvancementConfig[],
  roundRobinRounds: RoundRobinRoundConfig[],
  knockoutStages: KnockoutStage
): number {
  if (roundRobinRounds.length === 0) return 0;
  
  const firstKnockoutEntry = getFirstEnabledKnockoutEntry(knockoutStages);
  if (!firstKnockoutEntry) return 0;
  
  let count = 0;
  
  // Count teams from each stage that route to the first knockout entry
  for (let i = 0; i < roundRobinRounds.length; i++) {
    const round = roundRobinRounds[i];
    const stageConfig = stageAdvancementConfigs.find(c => c.stageNumber === round.roundNumber);
    
    if (!stageConfig) continue;
    
    // Count winners going to knockout
    if (stageConfig.winnerDestination.type === 'KnockoutEntry' &&
        stageConfig.winnerDestination.entryPoint === firstKnockoutEntry) {
      count += round.groupCount;
    }
    
    // Count runner-ups going to knockout (exclude eliminated)
    if (stageConfig.runnerUpDestination.type === 'KnockoutEntry' &&
        stageConfig.runnerUpDestination.entryPoint === firstKnockoutEntry) {
      count += round.groupCount;
    }
  }
  
  return count;
}

function getFirstEnabledKnockoutEntry(knockoutStages: KnockoutStage): KnockoutEntryPoint | null {
  if (knockoutStages.preQuarterFinal) return 'PreQuarterfinals';
  if (knockoutStages.quarterFinal) return 'Quarterfinals';
  if (knockoutStages.semiFinal) return 'Semifinals';
  return null;
}
