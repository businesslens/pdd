---
actors:
  - collection-subscriber
  - visitor
access: public
entryPoints:
  - web: /c/:collectionSlug
  - ios: content-reader://collections/:collectionSlug
  - android: content-reader://collections/:collectionSlug
exit: Visitor leaves, or follows the call to action to establish an account and subscribe
---

# Public collection page

The address a published collection lives at. Anyone holding the link can read
the collection's name, description, and the saved items in it, without an
account.

## Capability boundary

Read-only and anonymous. A visitor sees only the items the owner saved into this
one collection, plus the owner's display name. Nothing else about the owner is
reachable: not their other collections, their sources, their library, or their
reading state.

No reading state is recorded for a visitor, because a visitor has no library to
record it in. Subscribing requires an account and moves the reader to the
reading application. When a collection is unlisted or deleted, this surface stops
serving it.
