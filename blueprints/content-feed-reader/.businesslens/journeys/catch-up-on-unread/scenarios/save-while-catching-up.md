---
kind: edge
actors: [reader]
result: achieved
steps:
  - text: The Reader reads the item
    capability: content-reading
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: The Reader saves it
    capability: item-saving
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: The Reader marks it read
    capability: reading-state
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: The Product removes it from the unread backlog without removing the saved copy
---

# Save an item while catching up

## Trigger

The Reader finds a worthwhile item while reducing the unread backlog.

## Outcome

The Journey goal is achieved: the backlog is smaller and the item remains saved.
