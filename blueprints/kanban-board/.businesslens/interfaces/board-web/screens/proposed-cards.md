---
entities:
  - { entity: proposed-card, shows: [Title, Description, Reason, Suggested column] }
  - { entity: column, shows: [Name] }
  - { entity: card, collects: [Title, Column] }
entryPoints:
  - board-web: /boards/:boardId/proposals
---

# Proposed cards

The cards AI agents have proposed for one board that are still waiting for a
decision, each with the goal or stalled card it answers and the column it would
start in. Members accept a proposal, adjusting its title or column first if
they want, or dismiss it.
