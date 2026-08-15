---
kind: edge
actors: [reader]
result: not-achieved
steps:
  - text: The Reader opens an unread library with nothing left to read
    capability: reading-state
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: The Reader refreshes their followed sources
    capability: feed-synchronization
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: No feed returns an item the library does not already hold
  - text: The unread library still presents the caught-up state
    capability: reading-state
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
---

# Catch up when nothing new arrived

## Trigger

The Reader opens the unread library expecting new items to work through.

## Outcome

The Journey goal is not achieved: there is nothing new to work through, so the
Reader makes no progress through the backlog. The followed sources and the
Reader's durable history are unchanged.
