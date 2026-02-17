import { Team, Stage, Group, Match, RoundRobinRoundConfig, StageAdvancementConfig, KnockoutStage } from './types';
import { generateRoundRobinMatches } from './roundRobinScheduler';
import { generateKnockoutMatches } from './knockoutGenerator';
import { generateGroupNameWithOffset } from './groupNaming';

export function generateTournament(
  teams: Team[],
  roundRobinRounds: RoundRobinRoundConfig[],
  stageAdvancementConfigs: StageAdvancementConfig[],
  knockoutStages: KnockoutStage
): { stages: Stage[]; knockoutMatches: Match[] } {
  const stages: Stage[] = [];
  let currentTeams = [...teams];
  let cumulativeGroupOffset = 0;

  // Generate each round-robin stage
  for (let i = 0; i < roundRobinRounds.length; i++) {
    const roundConfig = roundRobinRounds[i];
    const stageNumber = roundConfig.roundNumber;
    const groupCount = roundConfig.groupCount;
    const stageConfig = stageAdvancementConfigs.find(c => c.stageNumber === stageNumber);

    // Distribute teams into groups
    const groups: Group[] = [];
    const teamsPerGroup = Math.floor(currentTeams.length / groupCount);
    const extraTeams = currentTeams.length % groupCount;

    let teamIndex = 0;
    for (let g = 0; g < groupCount; g++) {
      const groupSize = teamsPerGroup + (g < extraTeams ? 1 : 0);
      const groupTeams = currentTeams.slice(teamIndex, teamIndex + groupSize);
      teamIndex += groupSize;

      const groupName = generateGroupNameWithOffset(g, cumulativeGroupOffset);
      const group: Group = {
        id: `stage-${stageNumber}-group-${g}`,
        name: `Group ${groupName}`,
        teams: groupTeams,
      };
      groups.push(group);
    }

    // Update cumulative offset for next stage
    cumulativeGroupOffset += groupCount;

    // Generate matches for this stage
    const stageMatches: Match[] = [];
    const stageId = `stage-${stageNumber}`;
    for (const group of groups) {
      const groupMatches = generateRoundRobinMatches(group, stageId);
      stageMatches.push(...groupMatches);
    }

    const stage: Stage = {
      id: stageId,
      name: `Robin Round ${stageNumber}`,
      stageNumber,
      groups,
      matches: stageMatches,
    };
    stages.push(stage);

    // Prepare teams for next stage based on advancement config
    if (stageConfig && i < roundRobinRounds.length - 1) {
      const nextStageTeams: Team[] = [];

      for (const group of groups) {
        // Add winners if they go to next stage
        if (stageConfig.winnerDestination.type === 'NextStage' && group.teams.length > 0) {
          nextStageTeams.push(group.teams[0]);
        }

        // Add runner-ups if they go to next stage (exclude eliminated)
        if (stageConfig.runnerUpDestination.type === 'NextStage' && group.teams.length >= 2) {
          nextStageTeams.push(group.teams[1]);
        }
      }

      currentTeams = nextStageTeams;
    }
  }

  // Generate knockout matches
  const knockoutMatches = generateKnockoutMatches(
    stages,
    knockoutStages,
    stageAdvancementConfigs,
    roundRobinRounds
  );

  return { stages, knockoutMatches };
}
