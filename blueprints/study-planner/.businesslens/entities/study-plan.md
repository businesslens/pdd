---
domain: plans
---

# Study plan

A proposed schedule for one goal, built by the planner when the Student asks
for one or left by the Student's AI agent as a revision: the sessions it would
put in the schedule, the upcoming sessions those would replace, and an
explanation the Student reads before deciding.

## Information kept

- **Proposed sessions** — the sessions the plan would schedule, each with its topic, start and length
- **Replaced sessions** — the goal's upcoming planned sessions that accepting the plan would remove
- **Explanation** — a plain account of how the remaining study was divided and what changed
- **Shortfall** — the estimated hours that do not fit in the available time before the target date, if any
- **Prepared by** — the planner, or the Student's AI agent
- **Prepared at** — when the plan was built or left

## States

### Proposed

Waiting for the Student to review it. Nothing in the schedule has changed.

### Accepted

The Student accepted it, and its sessions replaced the goal's upcoming planned
sessions.

### Dismissed

The Student dismissed it. The schedule is as it was.

### Outdated

The goal's schedule changed after the plan was prepared, so the planner closed
it instead of accepting it as shown. The schedule is as it was.
