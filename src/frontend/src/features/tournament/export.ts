/**
 * Frontend-only export utility for downloading tournament group data as JSON.
 * No backend calls or authentication required.
 */

import { Stage } from './types';

export interface ExportData {
  exportDate: string;
  stage: Stage;
  groups: Array<{
    groupName: string;
    teams: string[];
  }>;
}

/**
 * Exports the current Robin Round 1 groups to a downloadable JSON file.
 * @param stage - The Robin Round 1 stage data to export
 */
export function exportGroupsToFile(stage: Stage): void {
  const exportData: ExportData = {
    exportDate: new Date().toISOString(),
    stage: {
      id: stage.id,
      name: stage.name,
      stageNumber: stage.stageNumber,
      groups: stage.groups,
      matches: stage.matches,
    },
    groups: stage.groups.map(group => ({
      groupName: group.name,
      teams: group.teams.map(team => team.name),
    })),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `tournament-groups-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
