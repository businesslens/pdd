---
kind: edge
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
  - capability: item-saving
    operation: Save an unread item before leaving it
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
  - capability: reading-state
    operation: Mark the saved item read and continue
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
---

# Save an item while catching up

## Trigger

The Reader finds a worthwhile item while reducing the unread backlog.

## Steps

1. The Reader reads the item
2. The Reader saves it
3. The Reader marks it read
4. The Product removes it from the unread backlog without removing the saved copy

## Outcome

The Journey goal is achieved: the backlog is smaller and the item remains saved.
