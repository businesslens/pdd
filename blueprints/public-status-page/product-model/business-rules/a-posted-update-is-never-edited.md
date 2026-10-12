---
appliesTo:
  - type: entity
    id: incident-update
    effect: changes
permits: []
---

# A posted update is never edited

Once posted, an incident update reads as it was posted. A correction is a later
update.

## Rationale

Visitors judge how reliable the service is from what the page has said before.
That record is only worth reading if nothing in it was quietly taken back.
