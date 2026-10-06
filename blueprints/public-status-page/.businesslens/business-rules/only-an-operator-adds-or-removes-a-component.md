---
appliesTo:
  - type: entity
    id: component
    effect: creates
  - type: entity
    id: component
    effect: removes
permits:
  - actors: [operator]
---

# Only an Operator adds or removes a component

Only an Operator decides which components the page lists, adding them and
removing them for good.
