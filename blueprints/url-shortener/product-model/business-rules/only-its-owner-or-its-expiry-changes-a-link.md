---
appliesTo:
  - type: entity
    id: link
    effect: changes
permits:
  - related: [{ verb: owns, entity: owner }]
  - unattended: true
---

# Only its Owner or its expiry changes a link

Only the Owner of a link changes where it leads, when it expires, or whether
it is disabled. The one other change is the Product's own: expiring an active
link once the expiry its Owner set has passed.

## Rationale

A short address is trusted by everyone who receives it, so where it leads is
decided by the person accountable for it and by nobody else. API clients
create links and never change them.
