---
entities:
  - collection
  - item
capabilities:
  - create-collection
  - rename-collection
  - organize-collection
  - publish-collection
entryPoints:
  - reader-web: /collections
---

# Collection workspace

Lets a Reader organize saved items and control whether an owned collection is
public.

## Information presented

- Collection name and ordered saved items
- Whether the collection is private, published, or unlisted
- The public link when the collection is published

## Available actions

- Create and rename an owned collection
- Add, remove, and reorder saved items
- Publish, unlist, or republish the collection

## View states

### Private

Only the owner can see the collection.

### Published

The owner sees the public link and can revoke it immediately.

### Unlisted

The owner sees that the former public link serves nothing and can publish the
collection again.

## Capability boundary

Only the owner changes the collection. Creation, naming, organization,
publication, and item saving remain separate Product decisions.
