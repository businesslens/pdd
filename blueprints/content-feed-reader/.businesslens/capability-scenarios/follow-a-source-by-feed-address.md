---
kind: primary
capability: source-following
actors: [reader]
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
---

# Follow a source by feed address

## Trigger

The Reader submits the address of a readable syndicated feed.

## Steps

1. The Product validates that the address returns a supported feed
2. The source is added to the Reader's followed sources

## Outcome

The source is followed and future synchronization may add its items to the Reader's library.
