---
kind: primary
capability: collections
actors: [reader]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
---

# Reorder an owned collection

## Trigger

The Reader moves an item to a different position in an owned collection.

## Steps

1. The Product confirms collection ownership
2. The item is moved to the chosen position
3. Every other item keeps its relative order

## Outcome

The owned collection exposes the Reader's intended item order.
