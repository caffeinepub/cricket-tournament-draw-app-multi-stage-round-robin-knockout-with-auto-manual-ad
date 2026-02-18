# Specification

## Summary
**Goal:** Show each qualified team’s originating group serial number alongside the team name in Robin Round 2 and Pre-Quarter Finals, as a display-only UI update.

**Planned changes:**
- Update Robin Round 2 team displays (including match listings) to render teams as "<OriginGroup>-<OriginPosition> <TeamName>" (e.g., "A-2 Team 2") using the team’s originating stage/group position.
- Update Pre-Quarter Final (knockout) displays to render qualified (non-placeholder) teams in the same "<OriginGroup>-<OriginPosition> <TeamName>" format, while leaving placeholders (e.g., "PQ1", "TBD", "Winner of ...") unchanged.
- Add a shared frontend helper to resolve a team’s origin group serial by scanning existing in-memory tournament stages (earliest stageNumber containing the team), with graceful fallback to the current display if origin cannot be determined.

**User-visible outcome:** In Robin Round 2 and Pre-Quarter Final views, real teams are prefixed with their original group letter and position (e.g., "A-2 Team 2"), while placeholder entries remain unchanged.
