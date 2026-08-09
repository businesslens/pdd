---
kind: edge
capability: reading-state
actors: [reader]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
---

# Mark an item unread

## Trigger

The Reader wants a read library item to return to the unread backlog.

## Steps

1. The Reader marks the item unread
2. The Product updates the item's private reading state
3. The unread count increases

## Outcome

The item is unread for that Reader without changing its saved or collection state.
