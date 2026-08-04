---
kind: conflict
---

# Following a source twice does not duplicate it

## Trigger

A reader submits an address that resolves to a feed they already follow, whether
by the same address or by one that redirects to it.

## Steps

1. The product resolves the address to a feed
2. It recognises the feed as one already in the reader's library
3. No second source is created and no items are re-added
4. The reader is shown the existing source, with its unread count

## Outcome

The library still holds one source for that feed, its items and reading state are
untouched, and the reader has been taken to what they were trying to add.
