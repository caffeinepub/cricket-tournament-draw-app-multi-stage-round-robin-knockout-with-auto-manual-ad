# Specification

## Summary
**Goal:** Fix tournament loading to properly populate data on the setup page instead of navigating to the last tournament state.

**Planned changes:**
- Update the tournament loading mechanism in TournamentListDialog to ensure loaded tournament data (name, teams, groups, stages, advancement configurations) properly populates the tournament setup page
- Verify that the tournament deserialization logic in useTournamentStore correctly updates all state properties when loadTournamentFromView is called
- Ensure all tournament state properties are synchronized with the loaded tournament data before UI rendering occurs
- Eliminate any race conditions between state updates and page rendering

**User-visible outcome:** When users click 'Load' on a saved tournament in the Manage Tournament dialog, the tournament setup page will display all the loaded tournament's data (name, teams, groups, stages, advancement rules) correctly instead of showing the previously created tournament state.
