---
domain: sharing
actors:
  - collection-owner
  - visitor
experiences:
  - public-collection
  - reading-app
businessRules:
  - only-an-owner-changes-a-collection
  - reading-state-is-private-to-its-reader
  - unlisting-revokes-anonymous-access
---

# Collection sharing

Publishing a collection to a public address, and unlisting it again.

## Intent

Publishing is one deliberate action with one reversal, and both take effect
immediately. Anything more elaborate — per-person access, expiring links,
approval — would make the reader reason about a permission system in a reading
product.

A collection is private until published, and publishing exposes the collection
and nothing else about its owner.
