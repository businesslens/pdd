---
kind: primary
---

# A reader saves an item while reading it

## Trigger

A reader reading an item decides to keep it and saves it.

## Steps

1. The item is marked saved and appears in the reader's saved items
2. The product retains enough of the item's content to render it later without fetching anything
3. The reader continues reading without leaving the item

## Outcome

The item is permanently in the reader's library and will remain readable if its
source later disappears or is unfollowed.

## Edge cases

- Saving an unread item does not mark it read; the two are independent
- Unsaving returns the item to ordinary library content, which the product may later prune
