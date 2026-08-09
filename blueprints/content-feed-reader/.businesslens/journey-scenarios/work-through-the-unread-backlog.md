---
kind: primary
journey: catch-up-on-unread
actors: [reader]
result: achieved
flow:
  - capability: content-reading
    operation: Read an unread library item
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
  - capability: reading-state
    operation: Mark the consumed item read and continue
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
---

# Work through the unread backlog

## Trigger

The Reader opens a library containing unread items.

## Steps

1. Unread items are shown in newest-first order
2. The Reader opens and reads an item
3. The item is marked read

## Outcome

The Journey goal is achieved: the Reader consumed an item and the unread count is smaller.
