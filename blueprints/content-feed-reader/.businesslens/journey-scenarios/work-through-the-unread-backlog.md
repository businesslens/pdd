---
kind: primary
journey: catch-up-on-unread
actors: [reader]
result: achieved
flow:
  - id: read-item
    capability: content-reading
    operation: Read an unread library item
  - id: mark-read
    capability: reading-state
    operation: Mark the consumed item read and continue
routes:
  - id: web
    contexts:
      - stage: read-item
        interface: reader-web
        experience: personal-library
      - stage: mark-read
        interface: reader-web
        experience: personal-library
  - id: mobile
    contexts:
      - stage: read-item
        interface: reader-mobile
        experience: personal-library
      - stage: mark-read
        interface: reader-mobile
        experience: personal-library
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
