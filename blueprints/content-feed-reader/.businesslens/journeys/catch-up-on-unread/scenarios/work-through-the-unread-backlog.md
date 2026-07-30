---
kind: primary
businessRules:
  - reading-state-is-private-to-its-reader
---

# A reader works through the unread backlog

## Trigger

A reader opens the reading application with unread items waiting.

## Steps

1. The unread backlog is shown newest first, with each item's source and the total remaining
2. The reader opens an item and reads it
3. The item becomes read and the remaining count drops
4. The reader moves to the next item without returning to the list
5. Items read in this pass stay visible until the reader leaves the backlog

## Decision points

### Backlog state

Are there unread items?

- some → show them newest first with the remaining count
- none → show an empty state confirming the reader is caught up, with the last refresh time

## Outcome

The items the reader opened are read, the count reflects what is left, and
nothing the reader did not open was marked read.

## Edge cases

- An item's source is unfollowed mid-pass → the item disappears from the backlog unless the reader saved it
