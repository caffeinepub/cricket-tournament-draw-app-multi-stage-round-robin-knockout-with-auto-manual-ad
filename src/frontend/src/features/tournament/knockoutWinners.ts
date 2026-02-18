import { Match, Team, KnockoutWinnerMap } from './types';
import { getFixtureCodeForMatch } from './knockoutFixtureCode';
import { normalizePlaceholder, isPlaceholderTeam } from './knockoutPlaceholders';

/**
 * Apply winner selections to knockout matches, propagating winners forward through the bracket
 * Uses stable upstream fixture references (team1Source/team2Source) to always recompute
 * downstream participants, even after placeholders have been replaced with real team names.
 */
export function applyKnockoutWinners(
  matches: Match[],
  winnerMap: KnockoutWinnerMap
): Match[] {
  // Build a map of fixture codes to match IDs for quick lookup
  const fixtureToMatchId = new Map<string, string>();
  matches.forEach(match => {
    const code = getFixtureCodeForMatch(match, matches);
    if (code) {
      fixtureToMatchId.set(code, match.id);
    }
  });

  // Build a map of match IDs to their winners
  const matchIdToWinner = new Map<string, Team>();
  matches.forEach(match => {
    const winnerId = winnerMap[match.id];
    if (winnerId) {
      // Find the winning team
      if (match.team1?.id === winnerId) {
        matchIdToWinner.set(match.id, match.team1);
      } else if (match.team2?.id === winnerId) {
        matchIdToWinner.set(match.id, match.team2);
      }
    }
  });

  // Apply winners to downstream matches using stable source references
  return matches.map(match => {
    let team1 = match.team1;
    let team2 = match.team2;

    // Use team1Source if available (stable upstream reference)
    if (match.team1Source) {
      const upstreamMatchId = fixtureToMatchId.get(match.team1Source);
      if (upstreamMatchId) {
        const winner = matchIdToWinner.get(upstreamMatchId);
        if (winner) {
          team1 = winner;
        } else {
          // No winner yet, show normalized placeholder
          team1 = { id: `placeholder-${match.team1Source}`, name: match.team1Source };
        }
      }
    } else if (team1 && isPlaceholderTeam(team1.name)) {
      // Fallback: legacy placeholder detection for matches without source references
      const normalized = normalizePlaceholder(team1.name);
      const upstreamMatchId = fixtureToMatchId.get(normalized);
      if (upstreamMatchId) {
        const winner = matchIdToWinner.get(upstreamMatchId);
        if (winner) {
          team1 = winner;
        } else {
          team1 = { ...team1, name: normalized };
        }
      } else {
        team1 = { ...team1, name: normalized };
      }
    }

    // Use team2Source if available (stable upstream reference)
    if (match.team2Source) {
      const upstreamMatchId = fixtureToMatchId.get(match.team2Source);
      if (upstreamMatchId) {
        const winner = matchIdToWinner.get(upstreamMatchId);
        if (winner) {
          team2 = winner;
        } else {
          // No winner yet, show normalized placeholder
          team2 = { id: `placeholder-${match.team2Source}`, name: match.team2Source };
        }
      }
    } else if (team2 && isPlaceholderTeam(team2.name)) {
      // Fallback: legacy placeholder detection for matches without source references
      const normalized = normalizePlaceholder(team2.name);
      const upstreamMatchId = fixtureToMatchId.get(normalized);
      if (upstreamMatchId) {
        const winner = matchIdToWinner.get(upstreamMatchId);
        if (winner) {
          team2 = winner;
        } else {
          team2 = { ...team2, name: normalized };
        }
      } else {
        team2 = { ...team2, name: normalized };
      }
    }

    return {
      ...match,
      team1,
      team2,
      winnerId: winnerMap[match.id],
    };
  });
}

/**
 * Clear downstream winners when an upstream match winner changes
 * Uses stable source references to find all affected downstream matches transitively
 */
export function clearDownstreamWinners(
  matches: Match[],
  changedMatchId: string,
  winnerMap: KnockoutWinnerMap
): KnockoutWinnerMap {
  const changedMatch = matches.find(m => m.id === changedMatchId);
  if (!changedMatch || !changedMatch.round) {
    return winnerMap;
  }

  const fixtureCode = getFixtureCodeForMatch(changedMatch, matches);
  if (!fixtureCode) {
    return winnerMap;
  }

  // Find all downstream matches that reference this fixture code
  const newWinnerMap = { ...winnerMap };
  const affectedMatches = new Set<string>();

  function findAffectedMatches(code: string) {
    matches.forEach(match => {
      if (affectedMatches.has(match.id)) return;
      
      // Check stable source references first
      const referencesCode = match.team1Source === code || match.team2Source === code;
      
      // Fallback: check placeholder names for legacy matches
      const team1Placeholder = match.team1 && isPlaceholderTeam(match.team1.name);
      const team2Placeholder = match.team2 && isPlaceholderTeam(match.team2.name);
      const team1ReferencesCode = team1Placeholder && normalizePlaceholder(match.team1.name) === code;
      const team2ReferencesCode = team2Placeholder && normalizePlaceholder(match.team2.name) === code;
      
      if (referencesCode || team1ReferencesCode || team2ReferencesCode) {
        affectedMatches.add(match.id);
        delete newWinnerMap[match.id];
        
        // Recursively clear downstream
        const downstreamCode = getFixtureCodeForMatch(match, matches);
        if (downstreamCode) {
          findAffectedMatches(downstreamCode);
        }
      }
    });
  }

  findAffectedMatches(fixtureCode);
  
  return newWinnerMap;
}
