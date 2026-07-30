---
kind: conflict
businessRules:
  - items-are-deduplicated-per-source
---

# Republished items do not refill a cleared backlog

## Trigger

A followed source changes software or regenerates its feed, and serves items the
reader has already read under new identifiers.

## Steps

1. The refresh fetches the feed and finds entries whose identifiers are unknown
2. Each entry is reconciled against the library by its address and content as well as its identifier
3. Entries matching items already held are recognised as the same item
4. Reading state on those items is left alone, and only genuinely new entries are added as unread

## Decision points

### Entry identity

Does an incoming entry correspond to an item already in the library for this source?

- the identifier matches → the same item; update its content and leave reading state alone
- the identifier is new but the address or content matches → the same item; adopt the new identifier and leave reading state alone
- neither matches → a new item; add it as unread

## Outcome

The reader's backlog reflects what is actually new. A source reissuing
identifiers cannot mark work the reader already did as undone.
