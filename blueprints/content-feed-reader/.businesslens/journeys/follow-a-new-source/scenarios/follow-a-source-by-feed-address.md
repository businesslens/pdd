---
kind: primary
businessRules:
  - items-are-deduplicated-per-source
---

# A reader follows a source by its feed address

## Trigger

A reader submits the address of a feed.

## Steps

1. The product fetches the address and confirms it is a feed it can parse
2. The source is added to the reader's library with the title the feed declares
3. The items currently in the feed are added to the library as unread
4. The source appears in the reader's source list as healthy

## Outcome

The source is followed, its current items are in the unread backlog, and the
reader can open them immediately.

## Edge cases

- The feed declares no title → the product uses the feed's address as the title until a later fetch supplies one
