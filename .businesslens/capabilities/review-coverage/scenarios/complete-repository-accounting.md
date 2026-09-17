---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The AI agent requests completion of the Coverage review
    kind: actor
    actor: ai-agent
    entities: [{ entity: coverage-review, effect: reads }]
    contexts: { terminal: { place: businesslens-cli } }
  - text: The Product confirms every captured file has a conclusion, the source inputs still match and the Product Model is structurally valid, then binds the review to that model
    kind: product
    entities:
      - { entity: coverage-review, effect: changes, from: Pending, to: Completed }
      - { entity: product-model, effect: reads }
    contexts: { terminal: { place: businesslens-cli } }
---

# Complete repository accounting

## Trigger

Every input in a pending review has been accounted for and model authoring
has reached a structurally valid state.

## Outcome

The completed review is saved in Coverage, preserving authored scope and gaps.
It identifies its source and model state. It can contain
known gaps or uncertainty without claiming those behaviors are modeled.

## Edge cases

- Missing conclusions, stale model links, invalid model structure or source changes during inspection prevent completion and preserve the previous baseline.
- Model authoring during inspection is expected; the final model identity is bound at completion.
- Source changes require a newly captured worklist. No previous conclusions are automatically treated as current.
- Retrying completion after the shared review was saved retains its original timestamp and conclusions and clears only matching unfinished work.
