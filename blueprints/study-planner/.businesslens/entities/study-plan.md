---
domain: plans
---

# Study plan

A schedule the Student's AI agent proposes for one goal: the sessions it would
put in the Student's schedule, the upcoming sessions those would replace, and
an explanation the Student reads before deciding.

## Information kept

- **Proposed sessions** — the sessions the plan would schedule, each with its topic, start and length
- **Replaced sessions** — the goal's upcoming planned sessions that accepting the plan would remove
- **Explanation** — the agent's plain account of how it divided the remaining study and what it changed
- **Shortfall** — the estimated hours that do not fit in the available time before the target date, if any
- **Prepared at** — when the agent left the plan

## States

### Proposed

Waiting for the Student to review it. Nothing in the schedule has changed.

### Accepted

The Student accepted it, and its sessions replaced the goal's upcoming planned
sessions.

### Declined

The Student declined it. The schedule is as it was.

### Outdated

The goal's schedule changed after the plan was prepared, so it can no longer
be accepted as shown. The schedule is as it was.
