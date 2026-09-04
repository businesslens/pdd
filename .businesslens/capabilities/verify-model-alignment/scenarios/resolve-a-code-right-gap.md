---
kind: primary
routes:
  harness: Harness
steps:
  - text: Inspection finds behavior that is intended and working, while the model still describes something else
    kind: condition
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent presents the exact model claim, the observed behavior, the files it read, and what else the change would affect
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The Developer decides that the current behavior is right and approves the model delta
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The Product writes only the approved meaning
    kind: product
    actor: developer
    entities:
      - { entity: product-model, effect: changes }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent inspects the scope again from the beginning
    kind: actor
    actor: ai-agent
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      harness:
        place: agent-skills
---

# Resolve a code-right gap

## Trigger

The model and the code disagree, and the code is the side that is right.

## Outcome

The model says what the product actually does, and the re-inspection confirms
it. The Developer was asked one authority question, not one question per file.
