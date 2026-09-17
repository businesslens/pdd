---
kind: primary
routes:
  terminal: Terminal
steps:
  - text: The AI agent submits conclusions for exact captured paths after inspection
    kind: actor
    actor: ai-agent
    entities: [{ entity: coverage-review, effect: reads }]
    contexts: { terminal: { place: businesslens-cli } }
  - text: The Product checks file versions and model links and records the conclusions in the Coverage review
    kind: product
    entities:
      - { entity: coverage-review, effect: changes, from: Pending, to: Pending }
      - { entity: product-model, effect: reads }
    contexts: { terminal: { place: businesslens-cli } }
---

# Record file conclusions

## Trigger

The agent has inspected a group of captured files and can explain their modeled
behavior, supporting role, approved exclusion, known gaps or uncertainty.

## Outcome

Those exact files have recorded conclusions. Other files remain unchanged and
future descendants of the same directory receive no inherited review.

## Edge cases

- Unknown resources, invented exclusions or gaps, duplicate packet paths, stale review identities and files changed since capture are rejected without updating the record.
- Unreadable inputs require uncertainty. A reviewed file can still contain a known behavioral gap.
- Re-recording replaces only the submitted paths' conclusions.
- Recording is an agent assertion of inspection; the Product cannot establish that the assertion is semantically correct.
