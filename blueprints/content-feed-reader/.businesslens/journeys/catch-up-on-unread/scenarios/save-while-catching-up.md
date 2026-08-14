---
kind: edge
actors: [reader]
result: achieved
flow:
  - id: read-item
    capability: content-reading
    operation: Read an unread library item
  - id: save-item
    capability: item-saving
    operation: Save an unread item before leaving it
  - id: mark-read
    capability: reading-state
    operation: Mark the saved item read and continue
routes:
  - id: web
    contexts:
      - stage: read-item
        context: reader-web::personal-library
      - stage: save-item
        context: reader-web::personal-library
      - stage: mark-read
        context: reader-web::personal-library
  - id: mobile
    contexts:
      - stage: read-item
        context: reader-mobile::personal-library
      - stage: save-item
        context: reader-mobile::personal-library
      - stage: mark-read
        context: reader-mobile::personal-library
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
