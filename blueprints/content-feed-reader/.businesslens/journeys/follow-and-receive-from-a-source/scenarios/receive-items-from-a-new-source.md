---
kind: primary
actors: [reader]
result: achieved
flow:
  - id: follow-source
    capability: source-following
    operation: Follow a valid source
  - id: collect-items
    capability: feed-synchronization
    operation: Collect available new items from the followed feed
routes:
  - id: web
    contexts:
      - stage: follow-source
        context: reader-web::personal-library
      - stage: collect-items
        context: reader-web::personal-library
  - id: mobile
    contexts:
      - stage: follow-source
        context: reader-mobile::personal-library
      - stage: collect-items
        context: reader-mobile::personal-library
---

# Receive items from a new source

## Trigger

The Reader chooses a valid feed that they want to follow.

## Steps

1. The Reader submits the feed address and follows the validated source
2. The Reader refreshes their followed sources
3. The Product reads the followed feed and collects its available new items
4. The new items enter the Reader's private library

## Outcome

The Journey goal is achieved: the source is followed and its available new
items are present in the Reader's library.
