---
availability:
  - interface: reader-web
    experiences: [personal-library]
  - interface: reader-mobile
    experiences: [personal-library]
capabilities: [item-saving, collections, collection-sharing]
capabilityScenarios:
  - save-an-accessible-item
  - add-an-item-to-an-owned-collection
  - reject-adding-to-another-owners-collection
journeyScenarios:
  - save-an-item-into-a-new-collection
  - save-an-item-into-an-existing-collection
  - publish-a-collection
  - unlist-a-published-collection
entryPoints:
  - reader-web: /collections
  - reader-mobile: content-reader://library/collections
---

# Collection workspace

Lets a Reader organize saved items and control whether an owned collection is
public.

## Information presented

- Collection name and ordered saved items
- Whether the collection is private or published
- The public link when the collection is published

## Available actions

- Create and edit an owned collection
- Add, remove, and reorder saved items
- Publish or unlist the collection

## Product states

### Private

Only the owner can see the collection.

### Published

The owner sees the public link and can revoke it immediately.

## Capability boundary

Only the owner changes the collection. Collection membership and item saving
remain independent decisions.
