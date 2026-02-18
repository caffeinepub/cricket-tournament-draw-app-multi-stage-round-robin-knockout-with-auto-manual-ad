import { Team, Stage, Group, Match, RoundRobinRoundConfig, AdvancementConfig, StageAdvancementConfig } from './types';
import { generateRoundRobinMatches } from './roundRobinScheduler';
import { generateGroupName } from './groupNaming';

/**
 * Generate tournament stages based on multi-round configuration and per-stage advancement configs
 */
export function generateTournament(
  teams: Team[],
  roundRobinRounds: RoundRobinRoundConfig[],
  stageAdvancementConfigs: StageAdvancementConfig[],
  advancementConfigs: Record<string, AdvancementConfig>
): Stage[] {
  const stages: Stage[] = [];
  
  // Track teams available for each stage
  let currentTeams = [...teams];
  
  for (let i = 0; i < roundRobinRounds.length; i++) {
    const roundConfig = roundRobinRounds[i];
    const stageNumber = roundConfig.roundNumber;
    
    // Create groups for this stage
    const groups: Group[] = [];
    const teamsPerGroup = Math.floor(currentTeams.length / roundConfig.groupCount);
    const extraTeams = currentTeams.length % roundConfig.groupCount;
    
    let teamIndex = 0;
    for (let g = 0; g < roundConfig.groupCount; g++) {
      const groupSize = teamsPerGroup + (g < extraTeams ? 1 : 0);
      const groupTeams = currentTeams.slice(teamIndex, teamIndex + groupSize);
      teamIndex += groupSize;
      
      groups.push({
        id: `stage-${stageNumber}-group-${g}`,
        name: generateGroupName(g),
        teams: groupTeams,
      });
    }
    
    // Generate matches for all groups
    const matches: Match[] = [];
    for (const group of groups) {
      const groupMatches = generateRoundRobinMatches(group, `stage-${stageNumber}`);
      matches.push(...groupMatches);
    }
    
    stages.push({
      id: `stage-${stageNumber}`,
      name: `Robin Round ${stageNumber}`,
      stageNumber,
      groups,
      matches,
    });
    
    // Determine teams for next stage based on advancement config
    if (i < roundRobinRounds.length - 1) {
      const nextStageTeams: Team[] = [];
      const stageConfig = stageAdvancementConfigs.find(c => c.stageNumber === stageNumber);
      
      if (stageConfig) {
        const nextStageNumber = roundRobinRounds[i + 1].roundNumber;
        
        for (const group of groups) {
          // Add winners if they advance to next stage
          if (stageConfig.winnerDestination.type === 'NextStage' &&
              stageConfig.winnerDestination.stageIndex === nextStageNumber) {
            if (group.teams.length > 0) {
              nextStageTeams.push(group.teams[0]);
            }
          }
          
          // Add runner-ups if they advance to next stage (exclude eliminated)
          if (stageConfig.runnerUpDestination.type === 'NextStage' &&
              stageConfig.runnerUpDestination.stageIndex === nextStageNumber) {
            if (group.teams.length >= 2) {
              nextStageTeams.push(group.teams[1]);
            }
          }
        }
      }
      
      currentTeams = nextStageTeams;
    }
  }
  
  return stages;
}
