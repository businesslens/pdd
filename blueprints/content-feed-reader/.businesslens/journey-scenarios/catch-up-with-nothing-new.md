---
kind: edge
journey: catch-up-on-unread
actors: [reader]
result: not-achieved
flow:
  - id: open-backlog
    capability: reading-state
    operation: Open a backlog with nothing left to read
  - id: refresh-sources
    capability: feed-synchronization
    operation: Refresh the followed sources for new items
  - id: show-caught-up
    capability: reading-state
    operation: Present the unchanged caught-up backlog
routes:
  - id: web
    contexts:
      - stage: open-backlog
        interface: reader-web
        experience: personal-library
      - stage: refresh-sources
        interface: reader-web
        experience: personal-library
      - stage: show-caught-up
        interface: reader-web
        experience: personal-library
  - id: mobile
    contexts:
      - stage: open-backlog
        interface: reader-mobile
        experience: personal-library
      - stage: refresh-sources
        interface: reader-mobile
        experience: personal-library
      - stage: show-caught-up
        interface: reader-mobile
        experience: personal-library
---

# Catch up when nothing new arrived

## Trigger

The Reader opens the unread library expecting new items to work through.

## Steps

1. The Reader opens an unread library with nothing left to read
2. The Reader refreshes their followed sources
3. No feed returns an item the library does not already hold
4. The unread library still presents the caught-up state

## Outcome

The Journey goal is not achieved: there is nothing new to work through, so the
Reader makes no progress through the backlog. The followed sources and the
Reader's durable history are unchanged.
