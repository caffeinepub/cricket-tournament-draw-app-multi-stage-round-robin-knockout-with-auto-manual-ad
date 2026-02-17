import { Team, Group, Stage, Match, AdvancementConfig, RoundRobinRoundConfig, StageAdvancementConfig, AdvancementDestination } from './types';
import { getGroupName } from './groupNaming';
import { generateRoundRobinMatches } from './roundRobinScheduler';

export function generateTournament(
  teams: Team[],
  roundRobinRounds: RoundRobinRoundConfig[],
  stageAdvancementConfigs: StageAdvancementConfig[],
  advancementConfigs: Record<string, AdvancementConfig>
): Stage[] {
  const stages: Stage[] = [];
  let currentTeams = [...teams];

  for (let i = 0; i < roundRobinRounds.length; i++) {
    const roundConfig = roundRobinRounds[i];
    const stageNum = roundConfig.roundNumber;
    const stageId = `stage-${stageNum}`;
    
    if (i === 0) {
      // First round: distribute all teams
      const groups = distributeTeamsIntoGroups(currentTeams, roundConfig.groupCount, stageNum);
      const matches = generateMatchesForStage(groups, stageId);
      
      stages.push({
        id: stageId,
        name: `Robin Round ${stageNum}`,
        stageNumber: stageNum,
        groups,
        matches,
      });
    } else {
      // Subsequent rounds: advance teams based on per-stage routing
      const prevStage = stages[i - 1];
      const prevStageConfig = stageAdvancementConfigs.find(c => c.stageNumber === prevStage.stageNumber);
      
      // Get teams routed to next stage (not to knockout)
      const qualifiedTeams = getTeamsForNextStage(prevStage, prevStageConfig, i);
      
      const groups = distributeTeamsIntoGroups(qualifiedTeams, roundConfig.groupCount, stageNum);
      const matches = generateMatchesForStage(groups, stageId);
      
      stages.push({
        id: stageId,
        name: `Robin Round ${stageNum}`,
        stageNumber: stageNum,
        groups,
        matches,
      });
      
      currentTeams = qualifiedTeams;
    }
  }

  return stages;
}

function getTeamsForNextStage(
  stage: Stage,
  stageConfig: StageAdvancementConfig | undefined,
  nextStageIndex: number
): Team[] {
  const qualifiedTeams: Team[] = [];
  
  if (!stageConfig) {
    // Fallback: winners only
    for (const group of stage.groups) {
      if (group.teams.length > 0) {
        qualifiedTeams.push(group.teams[0]);
      }
    }
    return qualifiedTeams;
  }
  
  // Check if winners go to next stage
  if (stageConfig.winnerDestination.type === 'NextStage' && 
      stageConfig.winnerDestination.stageIndex === nextStageIndex) {
    for (const group of stage.groups) {
      if (group.teams.length > 0) {
        qualifiedTeams.push(group.teams[0]);
      }
    }
  }
  
  // Check if runner-ups go to next stage
  if (stageConfig.runnerUpDestination.type === 'NextStage' && 
      stageConfig.runnerUpDestination.stageIndex === nextStageIndex) {
    for (const group of stage.groups) {
      if (group.teams.length >= 2) {
        qualifiedTeams.push(group.teams[1]);
      }
    }
  }
  
  return qualifiedTeams;
}

function distributeTeamsIntoGroups(teams: Team[], groupCount: number, stageNumber: number): Group[] {
  const groups: Group[] = [];
  const teamsPerGroup = Math.floor(teams.length / groupCount);
  const extraTeams = teams.length % groupCount;

  let teamIndex = 0;
  for (let i = 0; i < groupCount; i++) {
    const groupSize = teamsPerGroup + (i < extraTeams ? 1 : 0);
    const groupTeams = teams.slice(teamIndex, teamIndex + groupSize);
    teamIndex += groupSize;

    groups.push({
      id: `stage-${stageNumber}-group-${i + 1}`,
      name: getGroupName(i),
      teams: groupTeams,
    });
  }

  return groups;
}

function generateMatchesForStage(groups: Group[], stageId: string): Match[] {
  const matches: Match[] = [];

  for (const group of groups) {
    const groupMatches = generateRoundRobinMatches(group, stageId);
    matches.push(...groupMatches);
  }

  return matches;
}
