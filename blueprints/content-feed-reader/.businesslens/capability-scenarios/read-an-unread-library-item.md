---
kind: primary
capability: content-reading
actors: [reader]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
---

# Read an unread library item

## Trigger

The Reader opens an unread item from the private library.

## Steps

1. The Product presents the readable item with its source and publication context
2. The Reader consumes the item
3. The item remains available for an explicit reading-state or saving decision

## Outcome

The Reader can consume the item without the act of opening it silently changing durable state.
