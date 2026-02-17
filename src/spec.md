# Specification

## Summary
**Goal:** Add a preset for a 12-group Round-robin 1 → 4-group Round-robin 2 advancement flow into Pre-Quarterfinals, and ensure group lettering and advancement labels display correctly across stages.

**Planned changes:**
- Add a Tournament Setup preset that configures 2 round-robin stages (Round 1: 12 groups; Round 2: 4 groups) with advancement rules: Round 1 winners go to Knockout (Pre-Quarterfinals), Round 1 runners-up go to Round-robin 2; Round 2 winners go to Knockout (Pre-Quarterfinals), Round 2 runners-up eliminated.
- Update round-robin group naming to be sequential across stages (e.g., Round 1 groups A–L, Round 2 groups M–P for this preset).
- Fix advancement destination labels so NextStage destinations display the correct target robin round number (e.g., “Robin Round 2”) instead of an incorrect derived “Round X”.

**User-visible outcome:** In Tournament Setup, the user can apply the new preset and generate a tournament where Round 1 has groups A–L and Round 2 has groups M–P, with 16 total qualifiers into Pre-Quarterfinals (12 Round 1 winners + 4 Round 2 winners) and correctly labeled advancement destinations.
