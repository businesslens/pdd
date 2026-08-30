---
kind: validation
routes:
  harness: Harness
steps:
  - text: The Developer asks whether an already-mapped area is still current
    kind: actor
    actor: developer
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent recognizes that the question is about agreement with code rather than about absent meaning
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
  - text: The Product stops without writing and names verification as the workflow that answers it
    kind: actor
    actor: ai-agent
    contexts:
      harness:
        place: agent-skills
---

# Decline to remap a current area

## Trigger

Mapping is invoked as a freshness check on meaning that is already recorded.

## Outcome

Nothing was written, and the Developer is pointed at the workflow whose job is
comparing the model against current code.
