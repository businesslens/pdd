---
appliesTo:
  - type: entity
    id: component
    effect: creates
    facts: [Name]
  - type: entity
    id: component
    effect: changes
    facts: [Name]
---

# Component names are unique

No two components on the page share a name. Adding a component, or renaming
one, under a name another component already has is refused.

## Rationale

Visitors find what they depend on by name; two components called the same
would make the page's status ambiguous.
