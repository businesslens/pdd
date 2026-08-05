---
domains: [library]
capabilities: [reading-state]
journeys: [catch-up-on-unread]
scenarios: [work-through-the-unread-backlog, mark-a-source-read-in-bulk]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
---

# Reading state is private to its Reader

Only the Reader who owns a library can see or change its read and unread state.

## Rationale

Reading progress is personal working state, not information exposed through
shared collections.
