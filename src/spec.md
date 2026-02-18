# Specification

## Summary
**Goal:** Make round-robin group names unique and sequential across rounds, and allow users to rename groups with duplicate-name blocking while keeping all related UI displays consistent.

**Planned changes:**
- Update round-robin stage generation so group letters/names continue sequentially across rounds (offset by total group count of prior rounds) and never duplicate across generated stages.
- Add inline editing for round-robin group headers, with validation that prevents renaming a group to any name already used anywhere else in the tournament and shows a clear error message when blocked.
- Extend the client state/store with an action to update a group name by `stageId + groupId`, and ensure all views that display group names re-render from state (including tables and schedules).
- Ensure Robin Round 2 (and any stage) uses the same team serial number format `{groupName}-{position}` and includes the same position dropdown to reorder teams within a group; ensure serial numbers update after group rename.

**User-visible outcome:** Group letters no longer restart at A in later round-robin rounds, users can rename groups as long as the name is unique across the whole tournament, and all group-related displays (including serial numbers and schedules) reflect changes immediately.
