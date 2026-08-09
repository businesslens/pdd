---
kind: primary
capability: item-saving
actors: [reader]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
---

# Remove a saved item

## Trigger

The Reader chooses to stop keeping a saved library item.

## Steps

1. The Reader removes the item's saved state
2. The Product preserves the item's reading state
3. Collection membership is left for the Reader to change separately

## Outcome

The item is no longer saved and no unrelated reading or collection state changes.
