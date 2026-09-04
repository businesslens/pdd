---
kind: edge
routes:
  harness: Harness
steps:
  - text: A Business Rule grants an operation on a thing to some Actors, and the code in scope lets anyone perform it
    kind: condition
    entities:
      - { entity: business-rule, effect: reads }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent reports the grant as not established — a gap the code must close — rather than as a passing structural check
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The Developer decides whether the grant stands, so the code moves, or the model was wrong about who may act
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
---

# Report an unenforced grant

## Trigger

Verification reaches a Rule that says who may act, on code that never asks.

## Outcome

Permission stated in the model was checked like any other contract, and a clean
structural result never stood in for it.
