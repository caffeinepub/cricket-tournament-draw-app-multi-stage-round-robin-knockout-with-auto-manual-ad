# Specification

## Summary
**Goal:** Correct knockout bracket generation so match counts halve each round after the Pre-Quarterfinal, following standard single-elimination structure.

**Planned changes:**
- Update knockout match generation logic so that after 8 Pre-Quarterfinal matches, subsequent rounds generate 4 Quarterfinal, 2 Semifinal, and 1 Final match (instead of repeating 8).
- Ensure teams carried forward between rounds are winners/placeholders only, so each next round starts with half as many teams as the previous round.
- Update the KnockoutPage round match badges/labels to display the corrected per-round match counts for the same stage configuration.

**User-visible outcome:** When Pre-Quarterfinal through Final are enabled with 16 teams entering Pre-Quarterfinal, the bracket displays 8/4/2/1 matches across rounds and the UI match count badges reflect those values.
