---
entities:
  - entity
  - capability
  - business-rule
capabilities: [view-product-model]
---

# Lifecycle

An Entity's composed state machine: its states, the arcs every Step that
creates, moves or removes it draws, the Capability on each arc, the Rules that
restrict or forbid it, and what leaves a thing in each state. Rows and Graph
draw the same machine. Selecting an arc reads its Rules and supporting
Scenarios; selecting a state reads its definition and the Scenarios that leave
it there.
