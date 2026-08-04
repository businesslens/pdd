---
kind: external-failure
---

# An empty feed is not a deletion

## Trigger

A followed source responds successfully with a well-formed feed containing no
items, or containing far fewer than it did before.

## Steps

1. The fetch succeeds and the feed parses
2. The product adds nothing, because there is nothing new
3. Items already held are left in place, read and unread alike
4. The source stays healthy, because it responded correctly

## Outcome

The library is unchanged and the source is not marked as failing — an empty
window is a normal thing for a feed to serve, and it says nothing about items
served previously.
