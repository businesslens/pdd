---
availability:
  - interface: reader-web
    experiences: [reading-app]
  - interface: reader-mobile
    experiences: [reading-app]
capabilities:
  - collection-sharing
  - collection-subscription
  - collections
  - item-saving
scenarios:
  - a-subscriber-tries-to-change-a-collection
  - an-owner-unlists-a-subscribed-collection
  - gather-saved-items-into-a-collection
  - publish-a-collection
  - subscribe-to-a-published-collection
  - the-owner-adds-an-item-to-a-subscribed-collection
  - unlist-a-published-collection
  - unsave-an-item-that-is-in-a-collection
entryPoints:
  - reader-web: /collections
  - reader-web: /collections/:collectionId
  - reader-mobile: content-reader://library/collections/:collectionId
---

# Collection workspace

Lets a reader curate saved items into owned collections and read collections to
which they subscribe.

## Intent

Keep private curation, deliberate publishing, and read-only subscription
distinct so readers always understand what they own and what others can see.

## Information presented

- Collection name, description, owner, and ordered saved items
- Whether the collection is private, published, unlisted, or subscribed
- Which collection actions belong to the signed-in reader
- Whether an item remains saved independently of collection membership

## Available actions

- Create and edit an owned collection
- Add, remove, and reorder saved items in an owned collection
- Publish or unlist an owned collection
- Subscribe or unsubscribe from someone else's published collection
- Save an item from a subscribed collection into the reader's own library

## Product states

### Private owned collection

Only the owner can see and change the collection, and no public address serves
its contents.

### Published owned collection

The owner can see that anonymous readers may open the public collection and can
unlist it immediately.

### Subscribed collection

The collection updates as its owner changes it but remains read-only to the
subscriber.

### Subscription no longer public

An unlisted collection no longer serves anonymous access; the subscriber is
told that availability changed without receiving write access.

## Capability boundary

Only an owner changes a collection. Subscription never grants edit rights, and
removing an item from a collection does not unsave it. The Screen does not
expose the owner's private library or other unpublished collections.
