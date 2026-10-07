---
appliesTo:
  - type: entity
    id: maintenance
    effect: removes
permits: []
---

# A maintenance window is never deleted

Every maintenance window ever announced stays in the page's history, including
one that was cancelled. A changed plan is a cancelled window and a new one.

## Rationale

Visitors who planned around an announced window can still see what became of
it.
