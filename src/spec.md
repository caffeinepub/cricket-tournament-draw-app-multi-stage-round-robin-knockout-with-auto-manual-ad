# Specification

## Summary
**Goal:** Fix multi-stage round-robin advancement and knockout qualification so routing, counts, validation, and knockout bracket generation behave correctly and consistently.

**Planned changes:**
- Add per-round-robin-stage advancement configuration in the setup UI (Winner destination and Runner-up destination), allowing each stage to route teams either to a specific knockout entry point (Pre-Quarterfinal/Quarterfinal/Semifinal/Final) or to the next round-robin stage.
- Correct and centralize the “Qualified for Knockout” counting logic to support multi-stage routing (e.g., Round 1 winners to knockout + Round 1 runner-ups form Round 2 + Round 2 winners to knockout) and ensure the same shared logic is used in setup summary and the knockout page.
- Validate configurations so the knockout-qualified team count must exactly match the first enabled knockout round size (16/8/4/2); show an error and block generation when invalid (no auto-byes).
- Update knockout bracket generation to only pre-populate the first enabled knockout round from the qualified pool; generate later rounds as placeholders (e.g., “TBD”) and do not simulate winners to fill subsequent rounds.
- Replace previously empty/placeholder advancement-related UI components with working UI (or remove them from usage if not needed), ensuring all setup/advancement UI text is in English.

**User-visible outcome:** Users can configure advancement rules per round-robin stage, see an accurate and consistent knockout-qualified team count across the app, are prevented from generating invalid knockout brackets, and can manually adjust knockout match participants without later rounds being auto-filled.
