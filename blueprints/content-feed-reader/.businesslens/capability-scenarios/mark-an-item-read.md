---
kind: primary
capability: reading-state
actors: [reader]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
---

# Mark an item read

## Trigger

The Reader finishes an unread library item.

## Steps

1. The Reader marks the item read
2. The Product updates the item's private reading state
3. The unread count decreases

## Outcome

The item is read for that Reader and no longer contributes to the unread count.
