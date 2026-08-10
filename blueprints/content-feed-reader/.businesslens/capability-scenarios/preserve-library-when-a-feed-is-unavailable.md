---
kind: edge
capability: feed-synchronization
actors: [feed-provider]
availability:
  - interface: syndicated-feed-integration
---

# Preserve the library when a feed is unavailable

## Trigger

The Product cannot read a followed feed during synchronization.

## Steps

1. The Product records that the synchronization attempt could not collect new items
2. Existing items, reading state, saved state, and collections remain unchanged
3. The source remains followed for a later synchronization attempt

## Outcome

A temporary feed failure does not erase library history or silently unfollow the source.
