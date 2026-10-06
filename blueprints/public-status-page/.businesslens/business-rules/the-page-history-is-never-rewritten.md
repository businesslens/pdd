---
appliesTo:
  - type: entity
    id: incident-update
    effect: changes
  - type: entity
    id: incident-update
    effect: removes
  - type: entity
    id: incident
    effect: removes
  - type: entity
    id: maintenance
    effect: removes
permits: []
---

# The page's history is never rewritten

Once posted, an incident update is never edited or deleted, and no incident or
maintenance window is ever deleted. A correction is a later update; a changed
plan is a cancelled window and a new one.

## Rationale

Visitors judge how reliable the service is from what the page has said before.
That record is only worth reading if nothing in it was quietly taken back.
