---
availability:
  - interface: reader-web
    experiences: [public-collection]
  - interface: reader-mobile
    experiences: [public-collection]
capabilities:
  - collection-sharing
  - collection-subscription
scenarios:
  - a-visitor-opens-an-unlisted-collection
  - a-visitor-reads-a-published-collection
  - return-to-a-shared-collection-after-signing-in
  - subscribe-to-a-published-collection
entryPoints:
  - reader-web: /c/:collectionSlug
  - reader-mobile: content-reader://collections/:collectionSlug
---

# Public collection

Presents one published collection to anyone holding its address, with a clear
path for a reader who wants to keep following it.

## Intent

Make a curator's work useful before account creation while exposing nothing
beyond the collection they deliberately published.

## Information presented

- Collection name and description
- Owner display name
- Ordered items the owner placed in the collection
- Whether subscribing requires account access

## Available actions

- Read an item in the published collection
- Continue to account access and return to subscribe
- Subscribe immediately when already signed in
- Leave without creating an account

## Product states

### Published

The complete published collection is readable without an account.

### Account required to subscribe

The collection remains visible while the visitor is told why account access is
needed and where they will return afterward.

### Unlisted

The collection contents are no longer served anonymously and the unavailable
state does not reveal private owner information.

## Capability boundary

The Screen is read-only and exposes only this collection and the owner's display
name. It records no visitor reading state, reveals no other library content, and
never grants collection write access through subscription.
