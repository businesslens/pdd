---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The AI agent requests completion of a new review when a previous completed review exists
    kind: actor
    actor: ai-agent
    entities:
      - { entity: coverage-review, as: new, effect: reads }
      - { entity: coverage-review, as: previous, effect: reads }
    contexts: { terminal: { place: businesslens-cli } }
  - text: The Product validates complete accounting and matching source inputs, binds the final model, and replaces the previous baseline
    kind: product
    entities:
      - { entity: coverage-review, as: new, effect: changes, from: Pending, to: Completed }
      - { entity: coverage-review, as: previous, effect: removes, from: Completed }
      - { entity: product-model, effect: reads }
    contexts: { terminal: { place: businesslens-cli } }
---

# Replace a completed review

## Trigger

A later inspection has accounted for a newly captured repository state.

## Outcome

The newer completed review replaces Coverage’s saved review and becomes the comparison baseline. Partial or
failed work never replaces the previous completed review.
