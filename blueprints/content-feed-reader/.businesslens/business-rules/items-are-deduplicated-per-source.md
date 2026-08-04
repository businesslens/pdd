---
domains:
  - library
  - sources
capabilities:
  - source-refresh
---

# An item appears once per source

Two fetched entries from the same source that represent the same item resolve to
one item in the library, no matter how many times the source serves them or what
identifier it uses.

## Intent

A reader's unread count must mean something. A source that republishes its whole
history on every fetch, or reissues identifiers when it changes software, must
not be able to refill a backlog the reader already worked through.

## Rationale

Feeds identify items inconsistently. Some provide a stable unique identifier,
some reuse identifiers across genuinely different items, and some change the
identifier of an item whose content never changed. Identity therefore cannot rest
on the source's identifier alone, and the product resolves it from the
identifier together with the item's address and content.

Deduplication is scoped to one source. The same article legitimately syndicated
by two different sources is two items, because the reader chose to follow both
and unfollowing one should not remove the other's copy.
