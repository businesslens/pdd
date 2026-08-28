---
domain: model-authoring
relations:
  - entity: journey-scenario
    verb: holds
    cardinality: many
---

# Journey

One coherent Actor goal that requires deliberately composing several
Capabilities. It owns the goal, never the route.

## Information kept

- The stable Actor intent it pursues
- How an achieved attempt is recognized
- Which Actors pursue it
