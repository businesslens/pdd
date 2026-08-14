---
kind: primary
actors: [reader]
availability: [reader-web::personal-library, reader-mobile::personal-library]
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
