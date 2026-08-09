---
kind: primary
journey: catch-up-on-unread
actors: [reader]
result: achieved
flow:
  - capability: reading-state
    operation: Read and clear an unread item
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
  - capability: item-saving
    operation: Keep a worthwhile item independently of reading state
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
4. The Reader saves it when it is worth keeping

## Outcome

The Journey goal is achieved: the unread count is smaller and the worthwhile item remains saved.
