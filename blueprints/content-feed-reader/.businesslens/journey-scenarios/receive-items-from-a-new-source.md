---
kind: primary
journey: follow-and-receive-from-a-source
actors: [reader, feed-provider]
result: achieved
flow:
  - capability: source-following
    operation: Follow a valid source
    availability:
      - interface: reader-web
        experiences: [personal-library]
      - interface: reader-mobile
        experiences: [personal-library]
  - capability: feed-synchronization
    operation: Collect available new items from the followed feed
    availability:
      - interface: syndicated-feed-integration
---

# Receive items from a new source

## Trigger

The Reader chooses a valid feed that they want to follow.

## Steps

1. The Reader submits the feed address and follows the validated source
2. The Product requests available items through the feed integration
3. The Feed provider returns new items for the followed source
4. The Product adds those items to the Reader's private library

## Outcome

The Journey goal is achieved: the source is followed and its available new
items are present in the Reader's library.
