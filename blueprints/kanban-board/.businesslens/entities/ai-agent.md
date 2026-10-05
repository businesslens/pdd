---
kind: system
acts: external
relations:
  - entity: proposed-card
    verb: proposes
    cardinality: one-to-many
  - entity: stall-flag
    verb: raises
    cardinality: one-to-many
---

# AI agent

An AI agent harness a member connects to their boards. It reads a board on that
member's behalf, turns a goal the member states into proposed cards, and flags
cards that have stopped moving. It chooses what to read, what to propose and
when to look; everything it produces waits for a member to act on it.
