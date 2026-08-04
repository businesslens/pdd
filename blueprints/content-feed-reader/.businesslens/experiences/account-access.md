---
actors:
  - reader
  - visitor
interfaces:
  - reader-web
  - reader-mobile
access: public
entryPoints:
  - reader-web: /signin
  - reader-web: /register
  - reader-mobile: content-reader://account
---

# Account access

Where a visitor becomes a reader and a returning reader resumes their library.

## Capability boundary

Establishing, resuming, and ending a session, and nothing else. No library
content is reachable from this surface — it neither reads nor changes sources,
items, reading state, saved items, or collections.

A reader who arrives here from a public collection returns to that collection
once they hold a session, so the thing that brought them does not get lost in
the detour.
