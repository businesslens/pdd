---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: A BusinessLens skill needs to know whether the model is structurally sound before it continues
    kind: condition
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
  - text: The AI agent asks for the check in machine-readable form, from outside the repository it is inspecting
    kind: actor
    actor: ai-agent
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      terminal:
        place: businesslens-cli
  - text: The Product returns whether the model passed, every error, every warning, and a count of each resource type
    kind: product
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
  - text: The findings carry no judgement about which side of a disagreement is right
    kind: condition
    entities: []
    contexts:
      terminal:
        place: businesslens-cli
---

# Report lint findings to an agent

## Trigger

A skill reaches the point in its own workflow where structural soundness has to
be established before it can proceed.

## Outcome

The agent holds the structural findings and the resource counts as data. It has
gained no authority to decide whether the model or the code is correct.
