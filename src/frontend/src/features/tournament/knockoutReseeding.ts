import { Team, Stage, Match } from './types';

/**
 * Result of reseeding operation
 */
export interface ReseedingResult {
  teams: Team[];
  warnings: string[];
}

/**
 * Build a set of team pairs that have already played each other in the current tournament.
 * History is derived solely from the provided stages (current in-memory state).
 */
function buildMatchHistory(stages: Stage[]): Set<string> {
  const history = new Set<string>();
  
  // Only consider matches from the provided stages (current tournament state)
  for (const stage of stages) {
    for (const match of stage.matches) {
      const pair1 = `${match.team1.id}-${match.team2.id}`;
      const pair2 = `${match.team2.id}-${match.team1.id}`;
      history.add(pair1);
      history.add(pair2);
    }
  }
  
  return history;
}

/**
 * Check if two teams have already played each other
 */
function havePlayedBefore(team1Id: string, team2Id: string, history: Set<string>): boolean {
  return history.has(`${team1Id}-${team2Id}`) || history.has(`${team2Id}-${team1Id}`);
}

/**
 * Calculate a score for a bracket arrangement (lower is better)
 * - First-round rematches: +1000 per violation (highest priority to avoid)
 * - Same-half rematches (can meet before final): +100 per violation
 */
function scoreBracketArrangement(teams: Team[], history: Set<string>): number {
  let score = 0;
  const halfSize = teams.length / 2;
  
  // Check first-round matchups (adjacent pairs) - highest penalty
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      if (havePlayedBefore(teams[i].id, teams[i + 1].id, history)) {
        score += 1000; // Very heavy penalty for first-round rematch
      }
    }
  }
  
  // Check same-half matchups (teams in same half can meet before final)
  // First half
  for (let i = 0; i < halfSize; i++) {
    for (let j = i + 1; j < halfSize; j++) {
      if (havePlayedBefore(teams[i].id, teams[j].id, history)) {
        score += 100; // Moderate penalty for same-half rematch
      }
    }
  }
  
  // Second half
  for (let i = halfSize; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      if (havePlayedBefore(teams[i].id, teams[j].id, history)) {
        score += 100; // Moderate penalty for same-half rematch
      }
    }
  }
  
  return score;
}

/**
 * Generate detailed warnings based on the final arrangement (English-only, no emoji)
 */
function generateWarnings(teams: Team[], history: Set<string>): string[] {
  const warnings: string[] = [];
  const halfSize = teams.length / 2;
  
  // Check for first-round rematches
  const firstRoundRematches: string[] = [];
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      if (havePlayedBefore(teams[i].id, teams[i + 1].id, history)) {
        firstRoundRematches.push(`${teams[i].name} vs ${teams[i + 1].name}`);
      }
    }
  }
  
  if (firstRoundRematches.length > 0) {
    warnings.push(
      `First-round rematches: ${firstRoundRematches.join(', ')}. These teams already played in the group stage.`
    );
  }
  
  // Check for same-half rematches (can meet before final)
  const sameHalfRematches: string[] = [];
  
  // First half
  for (let i = 0; i < halfSize; i++) {
    for (let j = i + 1; j < halfSize; j++) {
      if (havePlayedBefore(teams[i].id, teams[j].id, history)) {
        sameHalfRematches.push(`${teams[i].name} & ${teams[j].name}`);
      }
    }
  }
  
  // Second half
  for (let i = halfSize; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      if (havePlayedBefore(teams[i].id, teams[j].id, history)) {
        sameHalfRematches.push(`${teams[i].name} & ${teams[j].name}`);
      }
    }
  }
  
  if (sameHalfRematches.length > 0) {
    warnings.push(
      `Same bracket half: ${sameHalfRematches.join(', ')}. These teams may meet again before the final.`
    );
  }
  
  return warnings;
}

/**
 * Generate all permutations of an array using Heap's algorithm
 * Limited to reasonable sizes to avoid performance issues
 */
function* generatePermutations<T>(arr: T[]): Generator<T[]> {
  const n = arr.length;
  const c = new Array(n).fill(0);
  
  yield [...arr];
  
  let i = 0;
  while (i < n) {
    if (c[i] < i) {
      const k = i % 2 === 0 ? 0 : c[i];
      [arr[k], arr[i]] = [arr[i], arr[k]];
      yield [...arr];
      c[i]++;
      i = 0;
    } else {
      c[i] = 0;
      i++;
    }
  }
}

/**
 * Attempt to reseed teams to avoid rematches before the final.
 * Uses exhaustive search for small team counts, smart sampling for larger counts.
 * 
 * Strategy:
 * 1. For ≤8 teams: exhaustive search of all permutations
 * 2. For >8 teams: intelligent random sampling with early termination
 * 3. Prioritizes eliminating same-half conflicts (pre-final rematches)
 * 4. Then eliminates first-round rematches
 * 5. Returns best arrangement found with detailed warnings (English-only, no emoji)
 */
export function reseedKnockoutTeams(
  teams: Team[],
  stages: Stage[],
  maxAttempts: number = 10000
): ReseedingResult {
  if (teams.length === 0) {
    return { teams: [], warnings: [] };
  }
  
  // Build match history from current tournament state only
  const history = buildMatchHistory(stages);
  
  // Start with the original arrangement
  let bestTeams = [...teams];
  let bestScore = scoreBracketArrangement(bestTeams, history);
  
  // If already perfect (score = 0), return immediately
  if (bestScore === 0) {
    return { teams: bestTeams, warnings: [] };
  }
  
  // For small team counts (≤8), use exhaustive search
  if (teams.length <= 8) {
    const permGen = generatePermutations([...teams]);
    let count = 0;
    const maxPermutations = 40320; // 8! = 40,320
    
    for (const perm of permGen) {
      count++;
      if (count > maxPermutations) break;
      
      const score = scoreBracketArrangement(perm, history);
      
      if (score < bestScore) {
        bestScore = score;
        bestTeams = [...perm];
        
        // If we found a perfect arrangement, stop immediately
        if (bestScore === 0) {
          break;
        }
      }
    }
  } else {
    // For larger team counts, use intelligent random sampling
    // Try more attempts for better coverage
    const attempts = Math.min(maxAttempts, teams.length * 1000);
    
    for (let attempt = 0; attempt < attempts; attempt++) {
      // Create a random permutation using Fisher-Yates shuffle
      const shuffled = [...teams];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      const score = scoreBracketArrangement(shuffled, history);
      
      if (score < bestScore) {
        bestScore = score;
        bestTeams = [...shuffled];
        
        // If we found a perfect arrangement, stop immediately
        if (bestScore === 0) {
          break;
        }
      }
    }
  }
  
  // Generate warnings for the best arrangement found
  const warnings = generateWarnings(bestTeams, history);
  
  return { teams: bestTeams, warnings };
}
