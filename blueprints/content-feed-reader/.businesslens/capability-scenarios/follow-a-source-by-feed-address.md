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
3. Available items are added to the private library

## Outcome

The source is followed and its items can appear in the Reader's unread backlog.
