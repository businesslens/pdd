---
kind: edge
---

# A refresh that finds nothing changes nothing

## Trigger

A refresh runs — on schedule or because the reader asked — and every source
returns only items already in the library.

## Steps

1. Each source is fetched successfully
2. Every returned item resolves to an item already held
3. No item is added, removed, or altered, and no reading state changes
4. Each source's last-checked time is updated and its health stays healthy

## Outcome

The library is byte-for-byte what it was, the reader's unread count has not
moved, and the reader can see that the check happened and found nothing.
