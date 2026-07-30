---
kind: validation
---

# Following is refused for an address with no feed

## Trigger

A reader submits an address that is reachable but is neither a feed nor a page
advertising one.

## Steps

1. The product fetches the address successfully
2. It finds no parsable feed and no advertised feed
3. Following is refused with a message distinguishing this from an unreachable address
4. The submitted address is left in place so the reader can correct it

## Outcome

No source is added, the library is unchanged, and the reader can tell that the
address worked but held nothing to follow.
