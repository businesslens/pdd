---
kind: edge
routes:
  harness: Harness
steps:
  - text: The Developer asks for verification with writing and delegation forbidden
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent inspects the requested scope and classifies every finding
    kind: actor
    actor: ai-agent
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent reports the findings and the decisions they imply, and changes nothing
    kind: actor
    actor: ai-agent
    entities: []
    contexts:
      harness:
        place: agent-skills
---

# Inspect in report-only mode

## Trigger

Someone wants to know where the product stands without anything being changed —
a review, an audit, or a repository they may not write to.

## Outcome

The Developer holds the complete finding list. No model file changed, no builder
was invoked, and no receipt was left behind.
