---
domains: [reading]
capabilities: [reading-state]
journeys: [catch-up-on-unread]
capabilityScenarios: [mark-an-item-read, mark-an-item-unread, mark-a-source-read-in-bulk]
journeyScenarios: [work-through-the-unread-backlog, save-while-catching-up]
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
