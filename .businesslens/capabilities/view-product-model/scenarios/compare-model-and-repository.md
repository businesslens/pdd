---
kind: primary
routes:
  local: Local
steps:
  - text: The Developer opens Review and selects two Git states, which may include the working state
    kind: actor
    actor: developer
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::review
  - text: The Product resolves saved states to exact commits and presents model changes alongside repository file changes
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::review
  - text: The Developer opens a changed file and reads its before and after contents and recorded model connections
    kind: actor
    actor: developer
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::review
  - text: The Product preserves the selected comparison and location while a resource reading is opened and closed
    kind: product
    entities:
      - { entity: product-model, effect: reads }
    contexts:
      local:
        place: local-report-web::review
---

# Compare model and repository

## Trigger

The Developer wants to understand a change to product meaning and its repository.

## Outcome

Both sets of changes are readable against the same states. No repository data,
inspection record, approval, checkpoint or commit has been written by the report.

## Edge cases

- Changed model resources remain visible even when they have no file References.
- Changed repository files remain visible even when no model resource names them.
- A revision with no readable model retains its repository comparison.
- Added, deleted, binary, oversized and unreadable files are distinguished explicitly.
- Scope and gap changes appear in the model comparison; saved inspection accounting does not count as a model meaning change.
- A moved branch does not change a historical reading already opened at its resolved commit.
- Comparing or refreshing never establishes semantic agreement or completes an inspection.
