---
kind: edge
routes:
  harness: Harness
steps:
  - text: A Product Model already exists and an area of it is absent or deliberately no longer trusted
    kind: condition
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      harness:
        place: agent-skills
  - text: The Developer names the area to map
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The AI agent confirms the boundary, inspects only that area and the relationships it needs, and proposes the delta
    kind: actor
    actor: ai-agent
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      harness:
        place: agent-skills
  - text: The Developer approves the delta
    kind: actor
    actor: developer
    entities: []
    contexts:
      harness:
        place: agent-skills
  - text: The Product writes the approved delta and preserves the valid meaning the rest of the model already carried
    kind: product
    actor: developer
    entities:
      - { entity: product-model, effect: changes }
    contexts:
      harness:
        place: agent-skills
---

# Expand coverage for a named area

## Trigger

The team wants an unmapped or distrusted part of an existing model brought in,
without disturbing the rest of it.

## Outcome

The named area is modeled, the surrounding model still means what it meant, and
coverage reflects the new breadth. A mature model was not silently replaced.
