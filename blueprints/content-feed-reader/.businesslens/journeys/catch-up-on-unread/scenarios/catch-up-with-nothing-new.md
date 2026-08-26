---
kind: edge
result: not-achieved
steps:
  - text: The Reader opens an unread library with nothing left to read
    kind: actor
    actor: reader
    capability: track-reading-state
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
  - text: The Reader refreshes their followed sources
    kind: actor
    actor: reader
    capability: synchronize-feeds
    contexts:
      web:
        place: reader-web::personal-library::source-list
      mobile:
        place: reader-mobile::personal-library::source-list
  - text: No feed returns an item the library does not already hold
    kind: condition
  - text: The unread library still presents the caught-up state
    kind: condition
    capability: track-reading-state
    contexts:
      web:
        place: reader-web::personal-library::unread-library
      mobile:
        place: reader-mobile::personal-library::unread-library
routes:
  web: Web
  mobile: Mobile
---

# Catch up when nothing new arrived

## Trigger

The Reader opens the unread library expecting new items to work through.

## Outcome

The Journey goal is not achieved: there is nothing new to work through, so the
Reader makes no progress through the backlog. The followed sources and the
Reader's durable history are unchanged.
