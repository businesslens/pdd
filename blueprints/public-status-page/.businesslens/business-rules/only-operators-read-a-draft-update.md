---
appliesTo:
  - type: entity
    id: incident-update
    effect: reads
permits:
  - actors: [operator]
  - actors: [visitor]
    when: [{ state: Posted }]
---

# Only Operators read a draft update

Operators read every incident update. Visitors read an update only once it is
posted; a draft is never shown on the public page.

## Rationale

A draft may be wrong. Until an Operator posts it, it must not look like
something the team has said.
