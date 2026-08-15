---
kind: primary
actors: [reader]
result: achieved
steps:
  - text: The Reader submits the feed address and follows the validated source
    capability: source-following
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: The Reader refreshes their followed sources
    capability: feed-synchronization
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: The Product reads the followed feed and collects its available new items
  - text: The new items enter the Reader's private library
---

# Receive items from a new source

## Trigger

The Reader chooses a valid feed that they want to follow.

## Outcome

The Journey goal is achieved: the source is followed and its available new
items are present in the Reader's library.
