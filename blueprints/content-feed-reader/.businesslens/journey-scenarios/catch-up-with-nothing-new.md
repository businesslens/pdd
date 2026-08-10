---
kind: edge
journey: catch-up-on-unread
actors: [reader, feed-provider]
result: not-achieved
flow:
  - capability: feed-synchronization
    operation: Attempt collection from the followed feeds
    availability:
      - interface: syndicated-feed-integration
  - capability: reading-state
    operation: Present the unchanged unread backlog
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
---

# Catch up when nothing new arrived

## Trigger

The Reader opens the unread library expecting new items to work through.

## Steps

1. The Product requests available items from the followed feeds
2. No feed returns an item the library does not already hold
3. The Product preserves the existing library and reading state
4. The unread library presents the caught-up state

## Outcome

The Journey goal is not achieved: there are no new items to work through, so
the Reader makes no progress through the backlog. The followed sources and the
Reader's durable history are unchanged.
