---
kind: validation
routes:
  harness: Harness
steps:
  - text: The repository has established implementation and no Product Model
    kind: condition
    contexts:
      harness:
        place: agent-skills
  - text: The Developer asks to plan a change
    kind: actor
    actor: developer
    contexts:
      harness:
        place: agent-skills
  - text: The Product stops without writing and names mapping as the workflow that must come first
    kind: product
    contexts:
      harness:
        place: agent-skills
---

# Decline to plan against unmapped code

## Trigger

A change is proposed for a product whose established behavior has never been
written down.

## Outcome

Nothing was written. The Developer is told that planning against unmapped
product truth would invent a baseline, and which workflow establishes one.
